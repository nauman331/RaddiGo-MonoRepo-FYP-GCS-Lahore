import { PORTS, connectDB, connectRedis } from '@raddi/config';
import { getWebSocketConfig } from "./socket";
import { setupAllSocketControllers } from "./socketControllers";

await connectDB();
await connectRedis();

const server = Bun.serve({
    port: PORTS.ORDER,
    hostname: "0.0.0.0",
    fetch(req, server) {
        const url = new URL(req.url);

        // 1. Explicitly handle the WebSocket upgrade path FIRST
        if (url.pathname === '/order/ws' || url.pathname === '/ws') {
            const success = server.upgrade(req);
            
            // If the upgrade is successful, we MUST return undefined immediately 
            // so Bun takes over the socket connection.
            if (success) {
                return undefined;
            }
            
            // If the upgrade fails for some reason, return a 400 Bad Request
            return new Response("WebSocket upgrade failed", { status: 400 });
        }

        // 2. Handle standard HTTP health checks and routes
        if (url.pathname === '/' || url.pathname === '/health' || url.pathname === '/order/health') {
            return new Response(JSON.stringify({ status: 'ok' }), { 
                status: 200, 
                headers: { 'content-type': 'application/json' } 
            });
        }
        
        // 3. Fallback for any unmatched routes
        return new Response('Not Found', { status: 404 });
    },
    websocket: getWebSocketConfig(),
});

// Initialize all socket controllers before starting the server
setupAllSocketControllers();

console.log(`Order service running on ${server.hostname}:${server.port}`);
