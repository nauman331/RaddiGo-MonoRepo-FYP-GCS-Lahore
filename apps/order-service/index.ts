import { PORTS, connectDB, connectRedis } from '@raddi/config';
import { getWebSocketConfig } from "./socket";
import { setupAllSocketControllers } from "./socketControllers";

await connectDB();
await connectRedis();

const server = Bun.serve({
    port: PORTS.ORDER,
    fetch(req, server) { 
        const url = new URL(req.url);

        if (url.pathname === '/order/ws' || url.pathname === '/ws') {
            const success = server.upgrade(req);
            if (success) {
                return undefined;
            }
            return new Response("WebSocket upgrade failed", { status: 400 });
        }

        if (url.pathname === '/' || url.pathname === '/health' || url.pathname === '/order/health') {
            return new Response(JSON.stringify({ status: 'ok' }), { 
                status: 200, 
                headers: { 'content-type': 'application/json' } 
            });
        }
        
        return new Response('Not Found', { status: 404 });
    },
    websocket: getWebSocketConfig(),
});

setupAllSocketControllers();

console.log(`Order service running on ${server.hostname}:${server.port}`);
