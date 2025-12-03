import type { ServerWebSocket } from "bun";

export const chatController = () => ({
    open() {
        console.log("WebSocket connection opened");
    },
    message(ws: ServerWebSocket<undefined>, message: string | Buffer<ArrayBuffer>) {
        ws.publish("chat", message);
        ws.publish("notifications", `New message: ${message}`);
    },
    close(ws: ServerWebSocket<undefined>, code: number, reason: string) {
        console.log(`WebSocket connection closed: ${code} - ${reason}`);
    },
});