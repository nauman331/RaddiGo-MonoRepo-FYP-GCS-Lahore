import { AuthRoutes } from "./src/routes/auth.route";
import { connectDB } from "./src/config/sqldb";
import { chatController } from "./src/socketControllers/chat.controller";
import { connectRedis } from "./src/config/redis";

await connectDB();
await connectRedis();
const chat = chatController()
const server = Bun.serve({
  port: Number(process.env.PORT),
  routes: {
    ...AuthRoutes,
  },
  fetch(req) {
    if (server.upgrade(req)) {
      return;
    }
    return new Response("Unmatched route", { status: 404 });
  },
  websocket: {
    open: chat.open,
    message: chat.message,
    close: chat.close,
  },
});

console.log(`Listening on ${server.url}`);