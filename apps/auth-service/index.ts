import { AuthRoutes } from './auth.route';
import { PORTS } from '@raddi/config';
import { connectDB } from './sqldb';

await connectDB();

const server = Bun.serve({
    port: PORTS.AUTH,
    routes: {
        ...AuthRoutes
    }
})
console.log(`Auth service running on port ${server.url}`);