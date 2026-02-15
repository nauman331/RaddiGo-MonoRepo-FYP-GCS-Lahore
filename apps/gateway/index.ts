import { PORTS } from '@raddi/config';

type Service = { prefix: string; port?: number; host?: string };

const services: Service[] = [
    { prefix: '/auth', port: PORTS.AUTH, host: process.env.AUTH_HOST || 'localhost' },
    { prefix: '/category', port: PORTS.CATEGORY, host: process.env.CATEGORY_HOST || 'localhost' },
    { prefix: '/order', port: PORTS.ORDER, host: process.env.ORDER_HOST || 'localhost' },
];

function findService(pathname: string): Service | undefined {
    return services.find(s => pathname === s.prefix || pathname.startsWith(s.prefix + '/'));
}

async function proxyRequest(svc: Service, req: Request) {
    const url = new URL(req.url);
    const host = svc.host || 'localhost';
    const port = svc.port;
    const target = new URL(url.pathname + url.search, `http://${host}:${port}`);

    const headers = new Headers(req.headers);
    headers.delete('host');
    headers.set('x-forwarded-by', 'raddi-gateway');

    const init: RequestInit = {
        method: req.method,
        headers,
        redirect: 'manual',
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
        init.body = await req.arrayBuffer();
    }

    const res = await fetch(target.href, init);
    return new Response(res.body, {
        status: res.status,
        headers: res.headers,
    });
}

const server = Bun.serve({
    port: PORTS.GATEWAY,
    fetch: async (req: Request) => {
        const url = new URL(req.url);

        if (url.pathname === '/' || url.pathname === '/health') {
            return new Response(JSON.stringify({ status: 'ok' }), { status: 200, headers: { 'content-type': 'application/json' } });
        }

        const svc = findService(url.pathname);
        if (!svc?.port) return new Response('Not Found', { status: 404 });

        try {
            return await proxyRequest(svc, req);
        } catch (err) {
            return new Response(String(err), { status: 502 });
        }
    }
});

console.log(`Gateway running on ${server.hostname}:${server.port}`);
