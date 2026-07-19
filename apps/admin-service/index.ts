import { PORTS, connectDB, connectRedis } from '@raddi/config';
import { AdminWalletRoutes } from './wallet.routes';

await connectDB();
await connectRedis();

const server = Bun.serve({
    port: PORTS.ADMIN || 3001,
    hostname: "0.0.0.0",
    fetch: async (req: Request) => {
        try {
            const url = new URL(req.url);

            // Health check
            if (url.pathname === '/' || url.pathname === '/health') {
                return new Response(JSON.stringify({ status: 'ok', service: 'admin-service' }), {
                    status: 200,
                    headers: { 'content-type': 'application/json' },
                });
            }

            const route = (AdminWalletRoutes as any)[url.pathname];
            if (!route) {
                return new Response('Not Found', { status: 404 });
            }

            const handler = route[req.method as keyof typeof route];
            if (!handler) {
                return new Response('Method Not Allowed', { status: 405 });
            }

            return await handler(req);
        } catch (err) {
            console.error(err);
            return new Response(String(err), { status: 500 });
        }
    },
});

console.log(`Admin service running on ${server.hostname}:${server.port}`);