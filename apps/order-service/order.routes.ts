import * as OrderController from './order.controller';

/**
 * HTTP routes for order-service.
 * These are processed BEFORE WebSocket upgrades in index.ts.
 * Pattern: { [path]: { [METHOD]: handler } }
 *
 * Dynamic routes (e.g. /order/api/v1/:id) are matched manually in index.ts.
 */
export const OrderRoutes: Record<string, Record<string, (req: Request) => Promise<Response>>> = {
    '/order/api/v1/my-orders': {
        GET: (req) => OrderController.getMyOrders(req),
    },
    '/order/api/v1/my-pickups': {
        GET: (req) => OrderController.getMyPickups(req),
    },
    '/order/api/v1/available': {
        GET: (req) => OrderController.getAvailableOrders(req),
    },
};

/**
 * Handles dynamic routes like /order/api/v1/:id and /order/api/v1/:id/cancel
 * Returns null if the path doesn't match.
 */
export const matchDynamicOrderRoute = async (req: Request): Promise<Response | null> => {
    const url = new URL(req.url);
    const path = url.pathname;

    // /order/api/v1/:id/cancel
    const cancelMatch = path.match(/^\/order\/api\/v1\/(\d+)\/cancel$/);
    if (cancelMatch && req.method === 'POST') {
        const orderId = parseInt(cancelMatch[1]);
        return OrderController.cancelOrder(req, orderId);
    }

    // /order/api/v1/:id/messages (GET)
    const messagesMatch = path.match(/^\/order\/api\/v1\/(\d+)\/messages$/);
    if (messagesMatch && req.method === 'GET') {
        const orderId = parseInt(messagesMatch[1]);
        return OrderController.getOrderMessages(req, orderId);
    }

    // /order/api/v1/:id  (GET)
    const idMatch = path.match(/^\/order\/api\/v1\/(\d+)$/);
    if (idMatch && req.method === 'GET') {
        const orderId = parseInt(idMatch[1]);
        return OrderController.getOrderById(req, orderId);
    }

    return null;
};

