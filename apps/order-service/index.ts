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
        
        // Tracking Log 1: See every request that hits the server
        console.log(`[NETWORK] Incoming request: ${req.method} ${url.pathname}`);

        if (url.pathname === '/order/ws' || url.pathname === '/ws') {
            
            // Tracking Log 2: Check if Nginx is passing the upgrade headers correctly
            console.log(`[SOCKET] Upgrade attempt... Header: ${req.headers.get('upgrade')}`);
            
            const success = server.upgrade(req, {
                data: {
                    id: Math.random().toString(36).substring(2, 15)
                }
            });
            
            // Tracking Log 3: Did Bun successfully convert the request?
            console.log(`[SOCKET] Upgrade successful? ${success}`);
            
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

// Initialize all socket controllers before starting the server
setupAllSocketControllers();

console.log(`Order service running on ${server.hostname}:${server.port}`);
