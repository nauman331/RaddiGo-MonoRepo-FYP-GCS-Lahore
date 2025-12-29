import { AuthRoutes } from "./src/routes/auth.route";
import { CategoryRoutes } from "./src/routes/category.route";
import { adminServiceRoutes } from "./src/routes/adminservice.route"
import { connectDB } from "./src/config/sqldb";
import { connectRedis } from "./src/config/redis";
import { initializeSocket } from "./src/config/socket";
import { setupAllSocketControllers } from "./src/socketControllers/index";


await connectDB();
await connectRedis();
console.log("Database migrations completed");
const server = Bun.serve({
  port: Number(process.env.PORT),
  routes: {
    ...AuthRoutes,
    ...CategoryRoutes,
    ...adminServiceRoutes,
  },
});

initializeSocket(Number(process.env.SOCKET_PORT));

setupAllSocketControllers();

console.log(`Server running on port ${server.port}`);