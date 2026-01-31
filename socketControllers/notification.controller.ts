import { on, joinRoom, leaveRoom, sendToSocket, sendToRoom } from "../apps/order-service/socket";

export const setupNotificationController = () => {
    on("connection", (data) => {
        console.log(`Notification client connected: ${data.socketId}`);
    });

    on("subscribeNotifications", (message: any) => {
        const data = message.data;
        const socketId = message._socketId;
        console.log(`Client ${socketId} subscribing to notifications:`, data);
        joinRoom(socketId, `user:${data.userId}`);
        sendToSocket(socketId, "notificationsSubscribed", { userId: data.userId });
    });

    on("unsubscribeNotifications", (message: any) => {
        const data = message.data;
        const socketId = message._socketId;
        console.log(`Client ${socketId} unsubscribing from notifications:`, data);
        leaveRoom(socketId, `user:${data.userId}`);
    });
};

// Helper function to send notifications to specific users
export const sendNotificationToUser = (userId: string, notification: any) => {
    sendToRoom(`user:${userId}`, "notification", notification);
};
