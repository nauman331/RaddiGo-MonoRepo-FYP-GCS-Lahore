import * as AdminOrdersController from './orders.controller';
import { authMiddleware } from '@raddi/middleware';

const withAuth = async (req: Request): Promise<Response | null> => {
    const authResult = await authMiddleware(req);
    if (!authResult.authorized) {
        return new Response(authResult.error || 'Unauthorized', { status: 401 });
    }
    (req as any).user = authResult.user;
    return null;
};

export const AdminOrderRoutes = {
    '/api/v1/orders': {
        GET: async (req: Request) => {
            const authErr = await withAuth(req);
            if (authErr) return authErr;
            return AdminOrdersController.adminGetAllOrders(req);
        },
    },
    '/api/v1/orders/stats': {
        GET: async (req: Request) => {
            const authErr = await withAuth(req);
            if (authErr) return authErr;
            return AdminOrdersController.adminGetOrderStats(req);
        },
    },
};

/** Dynamic route handler for /api/v1/orders/:id */
export const matchAdminOrderDynamicRoute = async (
    req: Request,
    pathname: string
): Promise<Response | null> => {
    const idMatch = pathname.match(/^\/api\/v1\/orders\/(\d+)$/);
    if (idMatch && req.method === 'GET') {
        const authErr = await (async () => {
            const authResult = await authMiddleware(req);
            if (!authResult.authorized) {
                return new Response(authResult.error || 'Unauthorized', { status: 401 });
            }
            (req as any).user = authResult.user;
            return null;
        })();
        if (authErr) return authErr;
        return AdminOrdersController.adminGetOrderDetail(req, parseInt(idMatch[1]));
    }
    return null;
};
