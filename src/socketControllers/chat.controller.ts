import { getIO } from "../config/socket";

export const setupChatController = () => {
    const io = getIO();

    io.on("connection", (socket) => {
        console.log(`Chat client connected: ${socket.id}`);

        socket.on("joinChat", (data) => {
            console.log(`Client ${socket.id} joining chat:`, data);
            socket.join(data.chatId);
            socket.emit("chatJoined", { chatId: data.chatId });
        });

        socket.on("sendMessage", (data) => {
            console.log(`Message from ${socket.id}:`, data);
            io.to(data.chatId).emit("newMessage", {
                chatId: data.chatId,
                message: data.message,
                senderId: data.senderId,
                timestamp: new Date().toISOString()
            });
        });

        socket.on("leaveChat", (data) => {
            console.log(`Client ${socket.id} leaving chat:`, data);
            socket.leave(data.chatId);
        });
    });
};
