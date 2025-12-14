import { AuthRoutes } from "./src/routes/auth.route";
import { CategoryRoutes } from "./src/routes/category.route";
import { connectDB } from "./src/config/sqldb";
import { connectRedis } from "./src/config/redis";
import { initializeSocket } from "./src/config/socket";
import { setupAllSocketControllers } from "./src/socketControllers/index";
await connectDB();
await connectRedis();
const server = Bun.serve({
  port: Number(process.env.PORT),
  routes: {
    ...AuthRoutes,
    ...CategoryRoutes,
  },
});

initializeSocket(Number(process.env.SOCKET_PORT));

// Setup socket controllers after Socket.IO initialization
setupAllSocketControllers();

console.log(`Server running on port ${server.port}`);