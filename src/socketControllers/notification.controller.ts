import type { ServerWebSocket } from "bun";
import type { WebSocketData } from "../../index";
import redis from "../config/redis";

interface Notification {
    type: "subscribe" | "unsubscribe" | "notification";
    userId: string;
    title?: string;
    message?: string;
    data?: any;
    timestamp: string;
}

class NotificationControllerClass {
    private subscribers: Map<string, Set<ServerWebSocket<WebSocketData>>> = new Map();

    onConnect(ws: ServerWebSocket<WebSocketData>) {
        console.log(`Notification WebSocket connected`);
    }

    onMessage(ws: ServerWebSocket<WebSocketData>, message: string | Buffer) {
        try {
            const data: Notification = JSON.parse(message.toString());

            switch (data.type) {
                case "subscribe":
                    this.handleSubscribe(ws, data);
                    break;
                case "unsubscribe":
                    this.handleUnsubscribe(ws, data);
                    break;
            }
        } catch (error) {
            console.error("Error parsing notification message:", error);
        }
    }

    onDisconnect(ws: ServerWebSocket<WebSocketData>) {
        // Remove from all subscriptions
        for (const [userId, sockets] of this.subscribers.entries()) {
            if (sockets.has(ws)) {
                sockets.delete(ws);
                if (sockets.size === 0) {
                    this.subscribers.delete(userId);
                }
            }
        }
        console.log(`Notification WebSocket disconnected`);
    }

    private handleSubscribe(ws: ServerWebSocket<WebSocketData>, data: Notification) {
        ws.data.userId = data.userId;

        if (!this.subscribers.has(data.userId)) {
            this.subscribers.set(data.userId, new Set());
        }
        this.subscribers.get(data.userId)!.add(ws);

        ws.send(JSON.stringify({
            type: "subscribed",
            userId: data.userId,
            timestamp: new Date().toISOString(),
        }));

        console.log(`User ${data.userId} subscribed to notifications`);
    }

    private handleUnsubscribe(ws: ServerWebSocket<WebSocketData>, data: Notification) {
        const sockets = this.subscribers.get(data.userId);
        if (sockets) {
            sockets.delete(ws);
            if (sockets.size === 0) {
                this.subscribers.delete(data.userId);
            }
        }
    }

    // Send notification to specific user
    async sendToUser(userId: string, notification: { title: string; message: string; data?: any }) {
        const sockets = this.subscribers.get(userId);
        const notificationData = {
            type: "notification",
            title: notification.title,
            message: notification.message,
            data: notification.data,
            timestamp: new Date().toISOString(),
        };

        if (sockets && sockets.size > 0) {
            const messageStr = JSON.stringify(notificationData);
            for (const socket of sockets) {
                socket.send(messageStr);
            }
        }

        await redis.lpush(`notifications:${userId}`, JSON.stringify(notificationData));
        await redis.ltrim(`notifications:${userId}`, 0, 49); // Keep last 50 notifications
    }

    // Broadcast to multiple users
    async sendToMultipleUsers(userIds: string[], notification: { title: string; message: string; data?: any }) {
        for (const userId of userIds) {
            await this.sendToUser(userId, notification);
        }
    }

    // Get unread notifications
    async getUnreadNotifications(userId: string): Promise<Notification[]> {
        const notifications = await redis.lrange(`notifications:${userId}`, 0, 49);
        return notifications.map((notif) => JSON.parse(notif));
    }
}

export const NotificationController = new NotificationControllerClass();
