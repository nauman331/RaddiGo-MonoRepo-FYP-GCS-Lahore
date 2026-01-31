import { on, joinRoom, leaveRoom, sendToSocket, sendToRoom } from "../socket";

export const setupChatController = () => {
    on("connection", (data) => {
        console.log(`Chat client connected: ${data.socketId}`);
    });

    on("joinChat", (message: any) => {
        const data = message.data;
        const socketId = message._socketId;
        console.log(`Client ${socketId} joining chat:`, data);
        joinRoom(socketId, data.chatId);
        sendToSocket(socketId, "chatJoined", { chatId: data.chatId });
    });

    on("sendMessage", (message: any) => {
        const data = message.data;
        const socketId = message._socketId;
        console.log(`Message from ${socketId}:`, data);
        sendToRoom(data.chatId, "newMessage", {
            chatId: data.chatId,
            message: data.message,
            senderId: data.senderId,
            timestamp: new Date().toISOString()
        });
    });

    on("leaveChat", (message: any) => {
        const data = message.data;
        const socketId = message._socketId;
        console.log(`Client ${socketId} leaving chat:`, data);
        leaveRoom(socketId, data.chatId);
    });
};
