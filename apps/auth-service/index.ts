import { AuthRoutes } from './auth.route';
import { WalletRoutes } from './wallet.routes';
import { PORTS, connectDB, connectRedis } from '@raddi/config';

await connectDB();
await connectRedis();

const allRoutes = {
    ...AuthRoutes,
    ...WalletRoutes,
};

const server = Bun.serve({
    port: PORTS.AUTH,
    hostname: "0.0.0.0",
    fetch: async (req: Request) => {
        try {
            const url = new URL(req.url);
            const route = (allRoutes as any)[url.pathname];

            if (!route) {
                if (url.pathname === '/' || url.pathname === '/health') {
                    return new Response(JSON.stringify({ status: 'ok' }), {
                        status: 200,
                        headers: { 'content-type': 'application/json' },
                    });
                }
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

console.log(`Auth service running on ${server.hostname}:${server.port}`);