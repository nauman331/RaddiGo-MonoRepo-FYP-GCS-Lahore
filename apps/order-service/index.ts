import { PORTS, connectDB, connectRedis } from '@raddi/config';
import { getWebSocketConfig } from "./socket";
import { setupAllSocketControllers } from "./socketControllers";
import { OrderRoutes, matchDynamicOrderRoute } from "./order.routes";

await connectDB();
await connectRedis();

const server = Bun.serve({
    port: PORTS.ORDER,
    hostname: "0.0.0.0",

    async fetch(req, server) {
        const url = new URL(req.url);
        const pathname = url.pathname;

        // ── Health checks ──────────────────────────────────────
        if (pathname === '/' || pathname === '/health' || pathname === '/order/health') {
            return new Response(JSON.stringify({
                status: 'ok',
                service: 'order-service',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
            }), {
                status: 200,
                headers: { 'content-type': 'application/json' },
            });
        }

        // ── WebSocket upgrade ──────────────────────────────────
        if (pathname === '/order/ws' || pathname === '/ws') {
            const success = server.upgrade(req, {
                data: {
                    id: crypto.randomUUID(),
                    rooms: new Set<string>(),
                }
            });
            if (success) return undefined;
            return new Response('WebSocket upgrade failed', { status: 400 });
        }

        // ── CORS preflight ─────────────────────────────────────
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

        // ── Static HTTP routes ─────────────────────────────────
        const staticRoute = OrderRoutes[pathname];
        if (staticRoute) {
            const handler = staticRoute[req.method as keyof typeof staticRoute];
            if (!handler) {
                return new Response('Method Not Allowed', { status: 405 });
            }
            try {
                const res = await handler(req);
                return addCorsHeaders(res);
            } catch (err) {
                console.error(`[HTTP] ${req.method} ${pathname} error:`, err);
                return new Response('Internal Server Error', { status: 500 });
            }
        }

        // ── Dynamic HTTP routes (/order/api/v1/:id, etc.) ──────
        const dynamicResponse = await matchDynamicOrderRoute(req);
        if (dynamicResponse) {
            return addCorsHeaders(dynamicResponse);
        }

        return new Response('Not Found', { status: 404 });
    },

    websocket: getWebSocketConfig(),
});

setupAllSocketControllers();

console.log(`✓ Order service running on ${server.hostname}:${server.port}`);
console.log(`  HTTP: /order/api/v1/*`);
console.log(`  WebSocket: ws://${server.hostname}:${server.port}/order/ws`);

function addCorsHeaders(res: Response): Response {
    const newHeaders = new Headers(res.headers);
    newHeaders.set('Access-Control-Allow-Origin', '*');
    newHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return new Response(res.body, {
        status: res.status,
        headers: newHeaders,
    });
}
