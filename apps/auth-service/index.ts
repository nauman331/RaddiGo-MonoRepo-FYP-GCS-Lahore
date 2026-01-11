import { AuthRoutes } from './auth.route';
import { PORTS } from '@raddi/config';
import { connectDB } from './sqldb';
import { connectRedis } from './redis';

await connectDB();
await connectRedis();
const server = Bun.serve({
    port: PORTS.AUTH,
    routes: {
        ...AuthRoutes
    }
})
console.log(`Auth service running on port ${server.url}`);