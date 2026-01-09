import { CategoryRoutes } from './category.route';
import { PORTS } from '@raddi/config';

const server = Bun.serve({
    port: PORTS.CATEGORY,
    routes: {
        ...CategoryRoutes
    }
})
console.log(`Category service running on port ${server.url}`);