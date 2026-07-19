import { CategoryRoutes } from './category.route';
import { PORTS, connectDB, connectRedis } from '@raddi/config';

await connectDB();
await connectRedis();

const server = Bun.serve({
    port: PORTS.CATEGORY,
    hostname: "0.0.0.0",
    fetch: async (req: Request) => {
        try {
            const url = new URL(req.url);
            const route = (CategoryRoutes as any)[url.pathname];
            if (!route) {
                if (url.pathname === '/' || url.pathname === '/health') {
                    return new Response(JSON.stringify({ status: 'ok' }), { status: 200, headers: { 'content-type': 'application/json' } });
                }
                return new Response('Not Found', { status: 404 });
            }
            const handler = route[req.method as keyof typeof route];
            if (!handler) return new Response('Method Not Allowed', { status: 405 });
            return await handler(req);
        } catch (err) {
            return new Response(String(err), { status: 500 });
        }
    }
})
console.log(`Category service running on ${server.hostname}:${server.port}`);