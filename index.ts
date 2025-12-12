import { AuthRoutes } from "./src/routes/auth.route";
import { CategoryRoutes } from "./src/routes/category.route";
import { connectDB } from "./src/config/sqldb";
import { connectRedis } from "./src/config/redis";
import { ChatController } from "./src/socketControllers/chat.controller";
import { NotificationController } from "./src/socketControllers/notification.controller";

await connectDB();
await connectRedis();

export interface WebSocketData {
  userId?: string;
  username?: string;
  roomId?: string;
  type: "chat" | "notification";
}

const server = Bun.serve<WebSocketData>({
  port: Number(process.env.PORT),
  routes: {
    ...AuthRoutes,
    ...CategoryRoutes,
  },
  fetch(req, server) {
    const url = new URL(req.url);

    if (url.pathname === "/ws/chat") {
      const upgraded = server.upgrade(req, {
        data: { type: "chat" as const },
      });
      if (upgraded) return undefined;
    }

    if (url.pathname === "/ws/notifications") {
      const upgraded = server.upgrade(req, {
        data: { type: "notification" as const },
      });
      if (upgraded) return undefined;
    }

    return new Response("Not found", { status: 404 });
  },
  websocket: {
    open(ws) {
      if (ws.data.type === "chat") {
        ChatController.onConnect(ws);
      } else if (ws.data.type === "notification") {
        NotificationController.onConnect(ws);
      }
    },
    message(ws, message) {
      if (ws.data.type === "chat") {
        ChatController.onMessage(ws, message);
      } else if (ws.data.type === "notification") {
        NotificationController.onMessage(ws, message);
      }
    },
    close(ws) {
      if (ws.data.type === "chat") {
        ChatController.onDisconnect(ws);
      } else if (ws.data.type === "notification") {
        NotificationController.onDisconnect(ws);
      }
    },
  },
});

console.log(`Server running on port ${server.port}`);