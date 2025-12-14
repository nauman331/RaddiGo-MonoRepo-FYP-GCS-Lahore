import { Server } from "socket.io";

let io: Server | null = null;

export const initializeSocket = (port: number) => {
    io = new Server(port, {
        cors: {
            origin: process.env.CORS_ORIGIN || "*",
            methods: ["GET", "POST"]
        },
        transports: ["websocket", "polling"],
        allowUpgrades: true,
        upgradeTimeout: 10000,
        pingTimeout: 5000,
        pingInterval: 10000,
        maxHttpBufferSize: 1e6,
        perMessageDeflate: false,
        httpCompression: false,
        connectTimeout: 45000,
    });

    console.log(`Socket.IO running on port ${port}`);
    return io;
};

export const getIO = (): Server => {
    if (!io) {
        throw new Error("Socket.IO not initialized. Call initializeSocket first.");
    }
    return io;
};
