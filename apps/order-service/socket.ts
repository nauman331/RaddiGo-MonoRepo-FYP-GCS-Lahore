import type { ServerWebSocket } from "bun";

export interface WebSocketData {
    id: string;
    userId?: string;
    rooms: Set<string>;
}

const connections = new Map<string, ServerWebSocket<WebSocketData>>();
const rooms = new Map<string, Set<string>>();

export const getWebSocketConfig = () => ({
    open(ws: ServerWebSocket<WebSocketData>) {
        const data = ws.data as WebSocketData;
        connections.set(data.id, ws);
        broadcast("connection", { socketId: data.id });
    },
    message(ws: ServerWebSocket<WebSocketData>, message: string | Buffer) {
        try {
            const data = typeof message === 'string' ? JSON.parse(message) : message;
            const wsData = ws.data as WebSocketData;

            // Add socket metadata
            const enrichedData = {
                ...data,
                _socketId: wsData.id,
                _ws: ws
            };

            // Broadcast message to handlers
            broadcast(data.event, enrichedData);
        } catch (error) {
            console.error("Error parsing WebSocket message:", error);
            ws.send(JSON.stringify({ event: "error", data: { message: "Invalid message format" } }));
        }
    },
    close(ws: ServerWebSocket<WebSocketData>) {
        const data = ws.data as WebSocketData;
        console.log(`Client disconnected: ${data.id}`);

        // Remove from all rooms
        data.rooms.forEach(room => {
            const roomSet = rooms.get(room);
            if (roomSet) {
                roomSet.delete(data.id);
                if (roomSet.size === 0) {
                    rooms.delete(room);
                }
            }
        });

        connections.delete(data.id);
        broadcast("disconnect", { socketId: data.id });
    }
});

// Event handlers registry
const eventHandlers = new Map<string, Set<(data: any) => void>>();

export const on = (event: string, handler: (data: any) => void) => {
    if (!eventHandlers.has(event)) {
        eventHandlers.set(event, new Set());
    }
    eventHandlers.get(event)!.add(handler);
};

const broadcast = (event: string, data: any) => {
    const handlers = eventHandlers.get(event);
    if (handlers) {
        handlers.forEach(handler => handler(data));
    }
};

// Join a room
export const joinRoom = (socketId: string, room: string) => {
    const ws = connections.get(socketId);
    if (ws) {
        const data = ws.data as WebSocketData;
        data.rooms.add(room);

        if (!rooms.has(room)) {
            rooms.set(room, new Set());
        }
        rooms.get(room)!.add(socketId);
    }
};

// Leave a room
export const leaveRoom = (socketId: string, room: string) => {
    const ws = connections.get(socketId);
    if (ws) {
        const data = ws.data as WebSocketData;
        data.rooms.delete(room);

        const roomSet = rooms.get(room);
        if (roomSet) {
            roomSet.delete(socketId);
            if (roomSet.size === 0) {
                rooms.delete(room);
            }
        }
    }
};

// Send to specific socket
export const sendToSocket = (socketId: string, event: string, data: any) => {
    const ws = connections.get(socketId);
    if (ws) {
        ws.send(JSON.stringify({ event, data }));
    }
};

// Send to room
export const sendToRoom = (room: string, event: string, data: any) => {
    const roomSet = rooms.get(room);
    if (roomSet) {
        const message = JSON.stringify({ event, data });
        roomSet.forEach(socketId => {
            const ws = connections.get(socketId);
            if (ws) {
                ws.send(message);
            }
        });
    }
};

// Send to all connections
export const sendToAll = (event: string, data: any) => {
    const message = JSON.stringify({ event, data });
    connections.forEach(ws => {
        ws.send(message);
    });
};

export const getConnections = () => connections;
export const getRooms = () => rooms;
