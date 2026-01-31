import { PORTS } from "../../packages/config";
import { getWebSocketConfig } from "./socket";
import { setupAllSocketControllers } from "./socketControllers";

const server = Bun.serve({
    port: PORTS.ORDER,
    fetch: (req: Request) => {
        const upgradeHeader = req.headers.get('upgrade');
        if (upgradeHeader && upgradeHeader.toLowerCase() === 'websocket') {
            return;
        }

        const url = new URL(req.url);
        if (url.pathname === '/' || url.pathname === '/health') {
            return new Response(JSON.stringify({ status: 'ok' }), { status: 200, headers: { 'content-type': 'application/json' } });
        }
        return new Response('Not Found', { status: 404 });
    },
    websocket: getWebSocketConfig(),
} as any);

// Initialize all socket controllers before starting the server
setupAllSocketControllers();

console.log(`Order service running on ${server.hostname}:${server.port}`);