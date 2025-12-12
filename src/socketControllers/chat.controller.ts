import type { ServerWebSocket } from "bun";
import type { WebSocketData } from "../../index";
import redis from "../config/redis";

interface ChatMessage {
    type: "message" | "join_room" | "leave_room" | "typing" | "stop_typing";
    userId: string;
    username: string;
    roomId: string;
    message?: string;
    timestamp: string;
}

class ChatControllerClass {
    private rooms: Map<string, Set<ServerWebSocket<WebSocketData>>> = new Map();

    onConnect(ws: ServerWebSocket<WebSocketData>) {
        console.log(`Chat WebSocket connected`);
    }

    onMessage(ws: ServerWebSocket<WebSocketData>, message: string | Buffer) {
        try {
            const data: ChatMessage = JSON.parse(message.toString());

            switch (data.type) {
                case "join_room":
                    this.handleJoinRoom(ws, data);
                    break;
                case "leave_room":
                    this.handleLeaveRoom(ws, data);
                    break;
                case "message":
                    this.handleMessage(ws, data);
                    break;
                case "typing":
                    this.handleTyping(ws, data);
                    break;
                case "stop_typing":
                    this.handleStopTyping(ws, data);
                    break;
            }
        } catch (error) {
            console.error("Error parsing message:", error);
        }
    }

    onDisconnect(ws: ServerWebSocket<WebSocketData>) {
        // Remove from all rooms
        for (const [roomId, members] of this.rooms.entries()) {
            if (members.has(ws)) {
                members.delete(ws);
                if (members.size === 0) {
                    this.rooms.delete(roomId);
                } else {
                    // Notify others
                    this.broadcast(roomId, {
                        type: "user_left",
                        username: ws.data.username || "Unknown",
                        timestamp: new Date().toISOString(),
                    }, ws);
                }
            }
        }
        console.log(`Chat WebSocket disconnected`);
    }

    private handleJoinRoom(ws: ServerWebSocket<WebSocketData>, data: ChatMessage) {
        ws.data.userId = data.userId;
        ws.data.username = data.username;
        ws.data.roomId = data.roomId;

        if (!this.rooms.has(data.roomId)) {
            this.rooms.set(data.roomId, new Set());
        }
        this.rooms.get(data.roomId)!.add(ws);

        // Notify others in room
        this.broadcast(data.roomId, {
            type: "user_joined",
            username: data.username,
            timestamp: new Date().toISOString(),
        }, ws);

        // Send confirmation to user
        ws.send(JSON.stringify({
            type: "joined",
            roomId: data.roomId,
            timestamp: new Date().toISOString(),
        }));

        console.log(`${data.username} joined room: ${data.roomId}`);
    }

    private handleLeaveRoom(ws: ServerWebSocket<WebSocketData>, data: ChatMessage) {
        const room = this.rooms.get(data.roomId);
        if (room) {
            room.delete(ws);
            if (room.size === 0) {
                this.rooms.delete(data.roomId);
            } else {
                this.broadcast(data.roomId, {
                    type: "user_left",
                    username: data.username,
                    timestamp: new Date().toISOString(),
                });
            }
        }
    }

    private async handleMessage(ws: ServerWebSocket<WebSocketData>, data: ChatMessage) {
        const messageData = {
            type: "message",
            userId: data.userId,
            username: data.username,
            message: data.message,
            timestamp: new Date().toISOString(),
        };

        // Broadcast to room
        this.broadcast(data.roomId, messageData);

        await redis.lpush(`chat:${data.roomId}:messages`, JSON.stringify(messageData));
        await redis.ltrim(`chat:${data.roomId}:messages`, 0, 99); // Keep last 100 messages
    }

    private handleTyping(ws: ServerWebSocket<WebSocketData>, data: ChatMessage) {
        this.broadcast(data.roomId, {
            type: "typing",
            username: data.username,
        }, ws);
    }

    private handleStopTyping(ws: ServerWebSocket<WebSocketData>, data: ChatMessage) {
        this.broadcast(data.roomId, {
            type: "stop_typing",
            username: data.username,
        }, ws);
    }

    private broadcast(roomId: string, message: any, exclude?: ServerWebSocket<WebSocketData>) {
        const room = this.rooms.get(roomId);
        if (!room) return;

        const messageStr = JSON.stringify(message);
        for (const client of room) {
            if (client !== exclude) {
                client.send(messageStr);
            }
        }
    }

    // Get chat history
    async getChatHistory(roomId: string): Promise<ChatMessage[]> {
        const messages = await redis.lrange(`chat:${roomId}:messages`, 0, 99);
        return messages.map((msg: string) => JSON.parse(msg));
    }
}

export const ChatController = new ChatControllerClass();