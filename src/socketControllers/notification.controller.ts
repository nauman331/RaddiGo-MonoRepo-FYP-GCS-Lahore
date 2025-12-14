import { getIO } from "../config/socket";

export const setupNotificationController = () => {
    const io = getIO();

    io.on("connection", (socket) => {
        console.log(`Notification client connected: ${socket.id}`);

        socket.on("subscribeNotifications", (data) => {
            console.log(`Client ${socket.id} subscribing to notifications:`, data);
            socket.join(`user:${data.userId}`);
            socket.emit("notificationsSubscribed", { userId: data.userId });
        });

        socket.on("unsubscribeNotifications", (data) => {
            console.log(`Client ${socket.id} unsubscribing from notifications:`, data);
            socket.leave(`user:${data.userId}`);
        });
    });
};

// Helper function to send notifications to specific users
export const sendNotificationToUser = (userId: string, notification: any) => {
    const io = getIO();
    io.to(`user:${userId}`).emit("notification", notification);
};
