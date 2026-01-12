import { CategoryRoutes } from './category.route';
import { PORTS } from '@raddi/config';
import { connectDB } from './sqldb';
import { connectRedis } from './redis';

await connectDB();
await connectRedis();

const server = Bun.serve({
    port: PORTS.CATEGORY,
    routes: {
        ...CategoryRoutes
    }
})
console.log(`Category service running on port ${server.url}`);