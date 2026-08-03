import { PORTS, connectDB, connectRedis } from '@raddi/config';
import { AdminWalletRoutes } from './wallet.routes';
import { AdminUserRoutes } from './user.routes';
import { AdminOrderRoutes, matchAdminOrderDynamicRoute } from './orders.routes';

await connectDB();
await connectRedis();

const allStaticRoutes = {
    ...AdminWalletRoutes,
    ...AdminUserRoutes,
    ...AdminOrderRoutes,
};

const server = Bun.serve({
    port: PORTS.ADMIN || 8000,
    hostname: "0.0.0.0",
    fetch: async (req: Request) => {
        try {
            const url = new URL(req.url);
            const pathname = url.pathname;

            // Health check
            if (pathname === '/' || pathname === '/health') {
                return new Response(JSON.stringify({
                    status: 'ok',
                    service: 'admin-service',
                    timestamp: new Date().toISOString(),
                    uptime: process.uptime(),
                }), {
                    status: 200,
                    headers: { 'content-type': 'application/json' },
                });
            }

            // CORS preflight
            if (req.method === 'OPTIONS') {
                return new Response(null, {
                    status: 204,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                    },
                });
            }

            // Static routes
            const route = (allStaticRoutes as any)[pathname];
            if (route) {
                const handler = route[req.method as keyof typeof route];
                if (!handler) return new Response('Method Not Allowed', { status: 405 });
                const res = await handler(req);
                return addCorsHeaders(res);
            }

            // Dynamic routes (e.g. /api/v1/orders/:id)
            const dynamicRes = await matchAdminOrderDynamicRoute(req, pathname);
            if (dynamicRes) return addCorsHeaders(dynamicRes);

            return new Response('Not Found', { status: 404 });
        } catch (err) {
            console.error('[admin-service] Unhandled error:', err);
            return new Response(String(err), { status: 500 });
        }
    },
});

console.log(`✓ Admin service running on ${server.hostname}:${server.port}`);

function addCorsHeaders(res: Response): Response {
    const newHeaders = new Headers(res.headers);
    newHeaders.set('Access-Control-Allow-Origin', '*');
    newHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return new Response(res.body, { status: res.status, headers: newHeaders });
}