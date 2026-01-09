import { PORTS } from '@raddi/config';

type Service = { prefix: string; port?: number };

const services: Service[] = [
    { prefix: '/auth', port: PORTS.AUTH },
    { prefix: '/category', port: PORTS.CATEGORY },
    { prefix: '/order', port: PORTS.ORDER },
];

function findService(pathname: string): Service | undefined {
    return services.find(s => pathname === s.prefix || pathname.startsWith(s.prefix + '/'));
}

async function proxyRequest(port: number, req: Request) {
    const url = new URL(req.url);
    const target = new URL(url.pathname + url.search, `http://127.0.0.1:${port}`);

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
    port: PORTS.GATEWAY ?? 8080,
    fetch: async (req: Request) => {
        const url = new URL(req.url);

        if (url.pathname === '/' || url.pathname === '/health') {
            return new Response(JSON.stringify({ status: 'ok' }), { status: 200, headers: { 'content-type': 'application/json' } });
        }

        const svc = findService(url.pathname);
        if (!svc || !svc.port) return new Response('Not Found', { status: 404 });

        try {
            return await proxyRequest(svc.port, req);
        } catch (err) {
            return new Response(String(err), { status: 502 });
        }
    }
});

console.log(`Gateway running on ${server.hostname}:${server.port}`);
