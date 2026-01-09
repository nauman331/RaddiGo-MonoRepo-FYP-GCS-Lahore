import { PORTS } from "../../packages/config";
import { getWebSocketConfig } from "./socket";
import { setupRidesController } from "./rides.controller";

const server = Bun.serve({
    port: PORTS.ORDER,
    fetch: (req: Request) => {
        const url = new URL(req.url);
        if (url.pathname === '/' || url.pathname === '/health') {
            return new Response(JSON.stringify({ status: 'ok' }), { status: 200, headers: { 'content-type': 'application/json' } });
        }
        return new Response('Not Found', { status: 404 });
    },
    websocket: getWebSocketConfig(),
} as any);

setupRidesController();

console.log(`Order service running on ${server.url}`);