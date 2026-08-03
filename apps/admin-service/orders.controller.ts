import pool from '@raddi/db';
import type { RowDataPacket } from 'mysql2';
import { rolesMiddleware } from '@raddi/middleware';

const requireAdmin = async (req: Request): Promise<Response | null> => {
    const isAllowed = await rolesMiddleware(req as any, ['admin']);
    if (!isAllowed) {
        return Response.json({ message: 'Forbidden: admin only' }, { status: 403 });
    }
    return null;
};

/** GET /api/v1/orders — All orders with filters */
export const adminGetAllOrders = async (req: Request): Promise<Response> => {
    const res = await requireAdmin(req);
    if (res) return res;

    try {
        const url = new URL(req.url);
        const status = url.searchParams.get('status');
        const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
        const limit = Math.min(100, parseInt(url.searchParams.get('limit') || '20'));
        const offset = (page - 1) * limit;

        let where = '';
        const params: any[] = [];

        if (status) {
            where = 'WHERE o.status = ?';
            params.push(status);
        }

        const [countRows] = await pool.query<RowDataPacket[]>(
            `SELECT COUNT(*) as total FROM orders o ${where}`,
            params
        );
        const total = (countRows as any)[0]?.total || 0;

        const [orders] = await pool.query<RowDataPacket[]>(
            `SELECT o.*,
                    cu.username as customerName, cu.email as customerEmail, cu.phone as customerPhone,
                    col.username as collectorName, col.phone as collectorPhone,
                    cat.nameEng as categoryName
             FROM orders o
             LEFT JOIN users cu ON o.customerId = cu.id
             LEFT JOIN users col ON o.collectorId = col.id
             LEFT JOIN categories cat ON o.categoryId = cat.id
             ${where}
             ORDER BY o.createdAt DESC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        return Response.json({
            orders,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
        }, { status: 200 });
    } catch (err: any) {
        console.error('adminGetAllOrders error:', err);
        return Response.json({ message: 'Failed to fetch orders' }, { status: 500 });
    }
};

/** GET /api/v1/orders/:id — Order detail with bids and chat */
export const adminGetOrderDetail = async (req: Request, orderId: number): Promise<Response> => {
    const res = await requireAdmin(req);
    if (res) return res;

    try {
        const [orderRows] = await pool.query<RowDataPacket[]>(
            `SELECT o.*,
                    cu.username as customerName, cu.email as customerEmail, cu.phone as customerPhone,
                    col.username as collectorName, col.phone as collectorPhone,
                    cat.nameEng as categoryName
             FROM orders o
             LEFT JOIN users cu ON o.customerId = cu.id
             LEFT JOIN users col ON o.collectorId = col.id
             LEFT JOIN categories cat ON o.categoryId = cat.id
             WHERE o.id = ?`,
            [orderId]
        );
        const order = (orderRows as any)[0];
        if (!order) return Response.json({ message: 'Order not found' }, { status: 404 });

        const [bids] = await pool.query<RowDataPacket[]>(
            `SELECT ob.*, u.username as collectorName, u.phone as collectorPhone
             FROM order_bids ob
             JOIN users u ON ob.collector_id = u.id
             WHERE ob.order_id = ?
             ORDER BY ob.created_at DESC`,
            [orderId]
        );

        const [chats] = await pool.query<RowDataPacket[]>(
            `SELECT ch.*, u.username as senderName
             FROM chats ch
             JOIN users u ON ch.sender_id = u.id
             WHERE ch.order_id = ?
             ORDER BY ch.created_at ASC`,
            [orderId]
        );

        return Response.json({ order: { ...order, bids, chats } }, { status: 200 });
    } catch (err: any) {
        console.error('adminGetOrderDetail error:', err);
        return Response.json({ message: 'Failed to fetch order detail' }, { status: 500 });
    }
};

/** GET /api/v1/orders/stats — Dashboard stats */
export const adminGetOrderStats = async (req: Request): Promise<Response> => {
    const res = await requireAdmin(req);
    if (res) return res;

    try {
        const [stats] = await pool.query<RowDataPacket[]>(
            `SELECT
                COUNT(*) as total,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'bidding' THEN 1 ELSE 0 END) as bidding,
                SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted,
                SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
                SUM(CASE WHEN status = 'completed' THEN finalPrice ELSE 0 END) as totalRevenue
             FROM orders`
        );

        return Response.json({ stats: (stats as any)[0] }, { status: 200 });
    } catch (err: any) {
        console.error('adminGetOrderStats error:', err);
        return Response.json({ message: 'Failed to fetch stats' }, { status: 500 });
    }
};
