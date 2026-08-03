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
     * Data: { orderId, userId / senderId }
     *
     * Joins order chat room.
     * Validates user participant and automatically returns chat history so UI loads instantly.
     */
    on("joinChat", async (message: any) => {
        const data = message.data || {};
        const socketId = message._socketId;

        const orderId = Number(data.orderId || data.order_id);
        const userId = Number(data.userId || data.senderId || data.customerId || data.collectorId || data.user_id);

        if (!orderId) {
            return sendToSocket(socketId, "error", { message: "orderId required for chat" });
        }

        try {
            const [orderRows] = await pool.query<RowDataPacket[]>(
                `SELECT customerId, collectorId, status FROM orders WHERE id = ?`,
                [orderId]
            );
            const order = (orderRows as any)[0];

            if (!order) {
                return sendToSocket(socketId, "error", { message: "Order not found" });
            }

            const roomId = `chat:${orderId}`;
            joinRoom(socketId, roomId);

            // Fetch chat history immediately
            const [chats] = await pool.query<RowDataPacket[]>(
                `SELECT ch.*, u.username as senderName
                 FROM chats ch
                 JOIN users u ON ch.sender_id = u.id
                 WHERE ch.order_id = ?
                 ORDER BY ch.created_at ASC`,
                [orderId]
            );

            const isChatActive = ['accepted', 'in_progress'].includes(order.status);

            // Emit chatJoined with initial messages
            sendToSocket(socketId, "chatJoined", {
                orderId,
                roomId,
                orderStatus: order.status,
                isChatActive,
                messages: chats
            });

            // Also emit chatHistory for components expecting that event name
            sendToSocket(socketId, "chatHistory", {
                orderId,
                messages: chats
            });
        } catch (err: any) {
            console.error("[joinChat] Error:", err);
            sendToSocket(socketId, "error", { message: "Failed to join chat" });
        }
    });

    /**
     * Event: getChatHistory / getMessages
     * Data: { orderId, userId? }
     *
     * Fetches past chat messages for the order.
     */
    const handleGetChatHistory = async (message: any) => {
        const data = message.data || {};
        const socketId = message._socketId;
        const orderId = Number(data.orderId || data.order_id);

        if (!orderId) {
            return sendToSocket(socketId, "error", { message: "orderId required for chat history" });
        }

        try {
            const [chats] = await pool.query<RowDataPacket[]>(
                `SELECT ch.*, u.username as senderName
                 FROM chats ch
                 JOIN users u ON ch.sender_id = u.id
                 WHERE ch.order_id = ?
                 ORDER BY ch.created_at ASC`,
                [orderId]
            );

            sendToSocket(socketId, "chatHistory", {
                orderId,
                messages: chats
            });
            sendToSocket(socketId, "orderMessages", {
                orderId,
                messages: chats
            });
        } catch (err: any) {
            console.error("[getChatHistory] Error:", err);
            sendToSocket(socketId, "error", { message: "Failed to fetch chat history" });
        }
    };

    on("getChatHistory", handleGetChatHistory);
    on("getMessages", handleGetChatHistory);
    on("fetchMessages", handleGetChatHistory);

    /**
     * Event: sendMessage
     * Data: { orderId, senderId, receiverId, message }
     *
     * Foodpanda style chat rules:
     * - Order must be 'accepted' or 'in_progress'
     * - Message is saved to DB, broadcasted to room, and pushed to recipient
     */
    on("sendMessage", async (message: any) => {
        const data = message.data || {};
        const socketId = message._socketId;

        const orderId = Number(data.orderId || data.order_id);
        const senderId = Number(data.senderId || data.userId || data.sender_id || data.user_id);
        let receiverId = Number(data.receiverId || data.receiver_id || data.recipientId);
        const text = String(data.message || data.text || data.content || "").trim();

        if (!orderId || !senderId || !text) {
            return sendToSocket(socketId, "error", { message: "Missing required chat fields: orderId, senderId, and message" });
        }

        try {
            const [orderRows] = await pool.query<RowDataPacket[]>(
                `SELECT customerId, collectorId, status FROM orders WHERE id = ?`,
                [orderId]
            );
            const order = (orderRows as any)[0];

            if (!order) {
                return sendToSocket(socketId, "error", { message: "Order not found" });
            }

            // Foodpanda rule: Chat enabled when order is accepted / in_progress
            if (!['accepted', 'in_progress'].includes(order.status)) {
                return sendToSocket(socketId, "error", {
                    message: `Chat is disabled for order with status '${order.status}'. Chat is only active after order is accepted.`
                });
            }

            // Infer receiverId if not explicitly passed
            if (!receiverId || isNaN(receiverId)) {
                receiverId = (senderId === Number(order.customerId))
                    ? Number(order.collectorId)
                    : Number(order.customerId);
            }

            // Persist to DB
            const [insertResult] = await pool.execute<ResultSetHeader>(
                `INSERT INTO chats (order_id, sender_id, receiver_id, message) VALUES (?, ?, ?, ?)`,
                [orderId, senderId, receiverId, text]
            );
            const chatId = (insertResult as ResultSetHeader).insertId;

            // Fetch sender info
            const [senderRows] = await pool.query<RowDataPacket[]>(
                `SELECT username FROM users WHERE id = ?`,
                [senderId]
            );
            const senderName = (senderRows as any)[0]?.username || 'User';

            const payload = {
                id: chatId,
                orderId,
                senderId,
                senderName,
                receiverId,
                message: text,
                is_read: false,
                created_at: new Date().toISOString(),
            };

            // Broadcast to order chat room
            sendToRoom(`chat:${orderId}`, "newMessage", payload);
            sendToRoom(`chat:${orderId}`, "receiveMessage", payload);

            // Send notification to recipient's personal room
            if (receiverId) {
                sendToRoom(String(receiverId), "newMessageNotification", {
                    orderId,
                    senderId,
                    senderName,
                    preview: text.substring(0, 100),
                });

                // Send FCM Push Notification
                sendPushToUser(receiverId, {
                    title: `💬 New message from ${senderName}`,
                    body: text.substring(0, 120),
                    data: { type: 'chat_message', orderId: String(orderId) }
                }).catch(() => {});
            }

            sendToSocket(socketId, "messageSent", { success: true, messageId: chatId });
        } catch (error: any) {
            console.error("[sendMessage] DB error:", error);
            sendToSocket(socketId, "error", { message: "Failed to send message", error: error.message });
        }
    });

    /**
     * Event: typing / stopTyping
     * Data: { orderId, userId }
     */
    on("typing", (message: any) => {
        const data = message.data || {};
        const orderId = Number(data.orderId || data.order_id);
        const userId = Number(data.userId || data.senderId);
        if (orderId) {
            sendToRoom(`chat:${orderId}`, "userTyping", { orderId, userId });
        }
    });

    on("stopTyping", (message: any) => {
        const data = message.data || {};
        const orderId = Number(data.orderId || data.order_id);
        const userId = Number(data.userId || data.senderId);
        if (orderId) {
            sendToRoom(`chat:${orderId}`, "userStoppedTyping", { orderId, userId });
        }
    });

    /**
     * Event: markRead
     * Data: { orderId, readerId / userId }
     */
    on("markRead", async (message: any) => {
        const data = message.data || {};
        const orderId = Number(data.orderId || data.order_id);
        const readerId = Number(data.readerId || data.userId || data.reader_id);

        if (!orderId || !readerId) return;

        try {
            await pool.execute(
                `UPDATE chats SET is_read = TRUE WHERE order_id = ? AND receiver_id = ? AND is_read = FALSE`,
                [orderId, readerId]
            );

            sendToRoom(`chat:${orderId}`, "messagesMarkedRead", { orderId, readerId });
        } catch (error) {
            console.error("[markRead] error:", error);
        }
    });

    /**
     * Event: leaveChat
     */
    on("leaveChat", (message: any) => {
        const data = message.data || {};
        const orderId = Number(data.orderId || data.order_id);
        const socketId = message._socketId;
        if (orderId) {
            leaveRoom(socketId, `chat:${orderId}`);
        }
    });
};
