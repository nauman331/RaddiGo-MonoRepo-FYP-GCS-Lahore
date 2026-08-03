import { on, joinRoom, leaveRoom, sendToSocket, sendToRoom } from "../socket";
import pool from '../../../packages/db';
import { sendPushToUser } from '../../ThirdPartyservices/pushNotifications';
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export const setupChatController = () => {
    on("connection", (data) => {
        console.log(`[Chat] Client connected: ${data.socketId}`);
    });

    /**
     * Event: joinChat
     * Data: { orderId, userId }
     *
     * Joins Foodpanda-style order chat room.
     * Validates that the user is part of the order.
     */
    on("joinChat", async (message: any) => {
        const data = message.data;
        const socketId = message._socketId;

        if (!data?.orderId || !data.userId) {
            return sendToSocket(socketId, "error", { message: "orderId and userId required for chat" });
        }

        try {
            const [orderRows] = await pool.query<RowDataPacket[]>(
                `SELECT customerId, collectorId, status FROM orders WHERE id = ?`,
                [data.orderId]
            );
            const order = (orderRows as any)[0];

            if (!order) {
                return sendToSocket(socketId, "error", { message: "Order not found" });
            }

            // Participant check: User must be customer or assigned collector
            if (order.customerId !== data.userId && order.collectorId !== data.userId) {
                return sendToSocket(socketId, "error", { message: "Unauthorized to join this order's chat" });
            }

            const roomId = `chat:${data.orderId}`;
            joinRoom(socketId, roomId);

            sendToSocket(socketId, "chatJoined", {
                orderId: data.orderId,
                roomId,
                orderStatus: order.status,
                isChatActive: ['accepted', 'in_progress'].includes(order.status)
            });
        } catch (err: any) {
            console.error("[joinChat] Error:", err);
            sendToSocket(socketId, "error", { message: "Failed to join chat" });
        }
    });

    /**
     * Event: getChatHistory
     * Data: { orderId, userId }
     *
     * Fetches past chat messages for the order.
     */
    on("getChatHistory", async (message: any) => {
        const data = message.data;
        const socketId = message._socketId;

        if (!data?.orderId || !data.userId) {
            return sendToSocket(socketId, "error", { message: "orderId and userId required" });
        }

        try {
            const [chats] = await pool.query<RowDataPacket[]>(
                `SELECT ch.*, u.username as senderName
                 FROM chats ch
                 JOIN users u ON ch.sender_id = u.id
                 WHERE ch.order_id = ?
                 ORDER BY ch.created_at ASC`,
                [data.orderId]
            );

            sendToSocket(socketId, "chatHistory", {
                orderId: data.orderId,
                messages: chats
            });
        } catch (err: any) {
            console.error("[getChatHistory] Error:", err);
            sendToSocket(socketId, "error", { message: "Failed to fetch chat history" });
        }
    });

    /**
     * Event: sendMessage
     * Data: { orderId, senderId, receiverId, message }
     *
     * Foodpanda style chat rules:
     * - Order must be 'accepted' or 'in_progress'
     * - Sender must be customer/collector
     * - Message is saved to DB, broadcasted to room, and pushed to recipient
     */
    on("sendMessage", async (message: any) => {
        const data = message.data;
        const socketId = message._socketId;

        if (!data?.orderId || !data.senderId || !data.receiverId || !data.message?.trim()) {
            return sendToSocket(socketId, "error", { message: "Missing chat message fields" });
        }

        try {
            const [orderRows] = await pool.query<RowDataPacket[]>(
                `SELECT customerId, collectorId, status FROM orders WHERE id = ?`,
                [data.orderId]
            );
            const order = (orderRows as any)[0];

            if (!order) {
                return sendToSocket(socketId, "error", { message: "Order not found" });
            }

            // Foodpanda rule: Chat only enabled after order acceptance
            if (!['accepted', 'in_progress'].includes(order.status)) {
                return sendToSocket(socketId, "error", {
                    message: `Chat is disabled for order with status '${order.status}'. Chat is only available after order is accepted.`
                });
            }

            // Security check
            if (order.customerId !== data.senderId && order.collectorId !== data.senderId) {
                return sendToSocket(socketId, "error", { message: "Unauthorized sender for this order chat" });
            }

            // Persist to DB
            const [insertResult] = await pool.execute<ResultSetHeader>(
                `INSERT INTO chats (order_id, sender_id, receiver_id, message) VALUES (?, ?, ?, ?)`,
                [data.orderId, data.senderId, data.receiverId, data.message.trim()]
            );
            const chatId = (insertResult as ResultSetHeader).insertId;

            // Fetch sender info
            const [senderRows] = await pool.query<RowDataPacket[]>(
                `SELECT username FROM users WHERE id = ?`,
                [data.senderId]
            );
            const senderName = (senderRows as any)[0]?.username || 'User';

            const payload = {
                id: chatId,
                orderId: data.orderId,
                senderId: data.senderId,
                senderName,
                receiverId: data.receiverId,
                message: data.message.trim(),
                is_read: false,
                created_at: new Date().toISOString(),
            };

            // Broadcast to order chat room (Foodpanda live update)
            sendToRoom(`chat:${data.orderId}`, "newMessage", payload);

            // Send notification to recipient's personal room
            sendToRoom(String(data.receiverId), "newMessageNotification", {
                orderId: data.orderId,
                senderId: data.senderId,
                senderName,
                preview: data.message.substring(0, 100),
            });

            // Send Push Notification in case recipient is offline/app in background
            sendPushToUser(data.receiverId, {
                title: `💬 New message from ${senderName}`,
                body: data.message.substring(0, 120),
                data: { type: 'chat_message', orderId: String(data.orderId) }
            }).catch(() => {});

        } catch (error) {
            console.error("[sendMessage] DB error:", error);
            sendToSocket(socketId, "error", { message: "Failed to send message" });
        }
    });

    /**
     * Event: typing / stopTyping
     * Data: { orderId, userId }
     *
     * Real-time typing indicators for Foodpanda-like experience.
     */
    on("typing", (message: any) => {
        const data = message.data;
        if (data?.orderId && data?.userId) {
            sendToRoom(`chat:${data.orderId}`, "userTyping", {
                orderId: data.orderId,
                userId: data.userId
            });
        }
    });

    on("stopTyping", (message: any) => {
        const data = message.data;
        if (data?.orderId && data?.userId) {
            sendToRoom(`chat:${data.orderId}`, "userStoppedTyping", {
                orderId: data.orderId,
                userId: data.userId
            });
        }
    });

    /**
     * Event: markRead
     * Data: { orderId, readerId }
     *
     * Marks all messages sent TO readerId in this order as read.
     */
    on("markRead", async (message: any) => {
        const data = message.data;
        const socketId = message._socketId;
        if (!data?.orderId || !data.readerId) return;

        try {
            await pool.execute(
                `UPDATE chats SET is_read = TRUE WHERE order_id = ? AND receiver_id = ? AND is_read = FALSE`,
                [data.orderId, data.readerId]
            );

            sendToRoom(`chat:${data.orderId}`, "messagesMarkedRead", {
                orderId: data.orderId,
                readerId: data.readerId
            });
        } catch (error) {
            console.error("[markRead] error:", error);
        }
    });

    /**
     * Event: leaveChat
     * Data: { orderId }
     */
    on("leaveChat", (message: any) => {
        const data = message.data;
        const socketId = message._socketId;
        if (data?.orderId) {
            leaveRoom(socketId, `chat:${data.orderId}`);
        }
    });
};
