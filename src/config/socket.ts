import { Server } from "socket.io";

let io: Server | null = null;

export const initializeSocket = (server: any) => {
    io = new Server(server, {
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

    console.log(`Socket.IO initialized on same server`);
    return io;
};

export const getIO = (): Server => {
    if (!io) {
        throw new Error("Socket.IO not initialized. Call initializeSocket first.");
    }
    return io;
};
