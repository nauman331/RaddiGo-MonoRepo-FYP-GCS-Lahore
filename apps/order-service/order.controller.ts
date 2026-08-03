import pool from '../../packages/db';
import { authMiddleware } from '../../packages/middleware';
import type { RowDataPacket } from 'mysql2';
import type { IOrder, IOrderBid, IChat } from '../../packages/types';

const safeParseInt = (v: string | null): number | null => {
    if (!v) return null;
    const n = parseInt(v, 10);
    return isNaN(n) ? null : n;
};

/** GET /order/api/v1/my-orders — Customer's own orders */
export const getMyOrders = async (req: Request): Promise<Response> => {
    const authResult = await authMiddleware(req);
    if (!authResult.authorized) return Response.json({ message: authResult.error || 'Unauthorized' }, { status: 401 });
    (req as any).user = authResult.user;

    try {
        const url = new URL(req.url);
        const status = url.searchParams.get('status');
        const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
        const limit = Math.min(50, parseInt(url.searchParams.get('limit') || '10'));
        const offset = (page - 1) * limit;

        const customerId = authResult.user.userId;

        let whereClause = 'WHERE o.customerId = ?';
        const params: any[] = [customerId];

        if (status && status !== 'all') {
            if (status === 'active') {
                whereClause += ` AND o.status IN ('accepted', 'in_progress', 'completed')`;
            } else {
                const statuses = status.split(',').map((s) => s.trim()).filter(Boolean);
                if (statuses.length > 0) {
                    whereClause += ` AND o.status IN (${statuses.map(() => '?').join(',')})`;
                    params.push(...statuses);
                }
            }
        }

        const [countRows] = await pool.query<RowDataPacket[]>(
            `SELECT COUNT(*) as total FROM orders o ${whereClause}`,
            params
        );
        const total = (countRows as any)[0]?.total || 0;

        const [orders] = await pool.query<RowDataPacket[]>(
            `SELECT o.*, 
                    c.nameEng as categoryName, c.nameUrdu as categoryNameUrdu, c.todayPrice as categoryTodayPrice,
                    u.username as collectorName, u.phone as collectorPhone
             FROM orders o
             LEFT JOIN categories c ON o.categoryId = c.id
             LEFT JOIN users u ON o.collectorId = u.id
             ${whereClause}
             ORDER BY o.createdAt DESC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        // For each order, attach its bids
        const orderIds = (orders as any[]).map((o) => o.id);
        let bidsMap: Record<number, IOrderBid[]> = {};

        if (orderIds.length > 0) {
            const [bids] = await pool.query<RowDataPacket[]>(
                `SELECT ob.*, u.username as collectorName, u.phone as collectorPhone
                 FROM order_bids ob
                 JOIN users u ON ob.collector_id = u.id
                 WHERE ob.order_id IN (${orderIds.map(() => '?').join(',')})
                 ORDER BY ob.order_id, ob.created_at DESC`,
                orderIds
            );
            (bids as any[]).forEach((bid) => {
                if (!bidsMap[bid.order_id]) bidsMap[bid.order_id] = [];
                bidsMap[bid.order_id].push(bid as IOrderBid);
            });
        }

        const result = (orders as any[]).map((o) => ({
            ...o,
            bids: bidsMap[o.id] || []
        }));

        return Response.json({
            orders: result,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
        }, { status: 200 });
    } catch (err: any) {
        console.error('getMyOrders error:', err);
        return Response.json({ message: 'Failed to fetch orders' }, { status: 500 });
    }
};

/** GET /order/api/v1/my-pickups — Collector's assigned/completed pickups */
export const getMyPickups = async (req: Request): Promise<Response> => {
    const authResult = await authMiddleware(req);
    if (!authResult.authorized) return Response.json({ message: authResult.error || 'Unauthorized' }, { status: 401 });

    try {
        const url = new URL(req.url);
        const status = url.searchParams.get('status');
        const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
        const limit = Math.min(50, parseInt(url.searchParams.get('limit') || '10'));
        const offset = (page - 1) * limit;

        const collectorId = authResult.user.userId;

        let whereClause = 'WHERE o.collectorId = ?';
        const params: any[] = [collectorId];

        if (status && status !== 'all') {
            if (status === 'active') {
                whereClause += ` AND o.status IN ('accepted', 'in_progress', 'completed')`;
            } else {
                const statuses = status.split(',').map((s) => s.trim()).filter(Boolean);
                if (statuses.length > 0) {
                    whereClause += ` AND o.status IN (${statuses.map(() => '?').join(',')})`;
                    params.push(...statuses);
                }
            }
        }


        const [countRows] = await pool.query<RowDataPacket[]>(
            `SELECT COUNT(*) as total FROM orders o ${whereClause}`,
            params
        );
        const total = (countRows as any)[0]?.total || 0;

        const [orders] = await pool.query<RowDataPacket[]>(
            `SELECT o.*,
                    c.nameEng as categoryName,
                    u.username as customerName, u.phone as customerPhone
             FROM orders o
             LEFT JOIN categories c ON o.categoryId = c.id
             LEFT JOIN users u ON o.customerId = u.id
             ${whereClause}
             ORDER BY o.updatedAt DESC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        return Response.json({
            orders,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
        }, { status: 200 });
    } catch (err: any) {
        console.error('getMyPickups error:', err);
        return Response.json({ message: 'Failed to fetch pickups' }, { status: 500 });
    }
};

/** GET /order/api/v1/available — Collectors browse open orders near them */
export const getAvailableOrders = async (req: Request): Promise<Response> => {
    const authResult = await authMiddleware(req);
    if (!authResult.authorized) return Response.json({ message: authResult.error || 'Unauthorized' }, { status: 401 });

    try {
        const url = new URL(req.url);
        const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
        const limit = Math.min(50, parseInt(url.searchParams.get('limit') || '20'));
        const offset = (page - 1) * limit;
        const categoryId = url.searchParams.get('categoryId');

        let whereClause = `WHERE o.status IN ('pending', 'bidding')`;
        const params: any[] = [];

        if (categoryId) {
            whereClause += ' AND o.categoryId = ?';
            params.push(categoryId);
        }

        const [countRows] = await pool.query<RowDataPacket[]>(
            `SELECT COUNT(*) as total FROM orders o ${whereClause}`,
            params
        );
        const total = (countRows as any)[0]?.total || 0;

        const [orders] = await pool.query<RowDataPacket[]>(
            `SELECT o.id, o.pickupLatitude, o.pickupLongitude, o.pickupAddress,
                    o.approximateRaddiInKg, o.expectedPrice, o.status, o.createdAt,
                    c.nameEng as categoryName, c.todayPrice,
                    u.username as customerName
             FROM orders o
             LEFT JOIN categories c ON o.categoryId = c.id
             LEFT JOIN users u ON o.customerId = u.id
             ${whereClause}
             ORDER BY o.createdAt DESC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        return Response.json({
            orders,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
        }, { status: 200 });
    } catch (err: any) {
        console.error('getAvailableOrders error:', err);
        return Response.json({ message: 'Failed to fetch available orders' }, { status: 500 });
    }
};

/** GET /order/api/v1/:id — Single order with bids + chat */
export const getOrderById = async (req: Request, orderId: number): Promise<Response> => {
    const authResult = await authMiddleware(req);
    if (!authResult.authorized) return Response.json({ message: authResult.error || 'Unauthorized' }, { status: 401 });

    try {
        const [orderRows] = await pool.query<RowDataPacket[]>(
            `SELECT o.*,
                    c.nameEng as categoryName, c.nameUrdu as categoryNameUrdu, c.todayPrice,
                    cu.username as customerName, cu.phone as customerPhone,
                    col.username as collectorName, col.phone as collectorPhone
             FROM orders o
             LEFT JOIN categories c ON o.categoryId = c.id
             LEFT JOIN users cu ON o.customerId = cu.id
             LEFT JOIN users col ON o.collectorId = col.id
             WHERE o.id = ?`,
            [orderId]
        );
        const order = (orderRows as any)[0];
        if (!order) return Response.json({ message: 'Order not found' }, { status: 404 });

        // Verify requester is customer, collector, or admin
        const userId = authResult.user.userId;
        const [userRows] = await pool.query<RowDataPacket[]>(`SELECT role FROM users WHERE id = ?`, [userId]);
        const userRole = (userRows as any)[0]?.role;
        if (
            order.customerId !== userId &&
            order.collectorId !== userId &&
            userRole !== 'admin'
        ) {
            return Response.json({ message: 'Forbidden' }, { status: 403 });
        }

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
        console.error('getOrderById error:', err);
        return Response.json({ message: 'Failed to fetch order' }, { status: 500 });
    }
};

/** POST /order/api/v1/:id/cancel — Customer cancels order */
export const cancelOrder = async (req: Request, orderId: number): Promise<Response> => {
    const authResult = await authMiddleware(req);
    if (!authResult.authorized) return Response.json({ message: authResult.error || 'Unauthorized' }, { status: 401 });

    try {
        const customerId = authResult.user.userId;
        const body = await req.json().catch(() => ({})) as { reason?: string };

        const [orderRows] = await pool.query<RowDataPacket[]>(
            `SELECT id, customerId, status FROM orders WHERE id = ?`,
            [orderId]
        );
        const order = (orderRows as any)[0];
        if (!order) return Response.json({ message: 'Order not found' }, { status: 404 });
        if (order.customerId !== customerId) return Response.json({ message: 'Forbidden' }, { status: 403 });
        if (['completed', 'cancelled'].includes(order.status)) {
            return Response.json({ message: `Cannot cancel an order with status: ${order.status}` }, { status: 400 });
        }

        // Cancel order and reject all pending bids
        await pool.execute(
            `UPDATE orders SET status = 'cancelled', cancelReason = ? WHERE id = ?`,
            [body.reason || 'Cancelled by customer', orderId]
        );
        await pool.execute(
            `UPDATE order_bids SET status = 'rejected' WHERE order_id = ? AND status = 'pending'`,
            [orderId]
        );

        return Response.json({ message: 'Order cancelled successfully' }, { status: 200 });
    } catch (err: any) {
        console.error('cancelOrder error:', err);
        return Response.json({ message: 'Failed to cancel order' }, { status: 500 });
    }
};

/** GET /order/api/v1/:id/messages — Fetch chat history for an order */
export const getOrderMessages = async (req: Request, orderId: number): Promise<Response> => {
    const authResult = await authMiddleware(req);
    if (!authResult.authorized) return Response.json({ message: authResult.error || 'Unauthorized' }, { status: 401 });

    try {
        const userId = authResult.user.userId;
        const [orderRows] = await pool.query<RowDataPacket[]>(
            `SELECT customerId, collectorId, status FROM orders WHERE id = ?`,
            [orderId]
        );
        const order = (orderRows as any)[0];
        if (!order) return Response.json({ message: 'Order not found' }, { status: 404 });

        // Authorization check
        const [userRows] = await pool.query<RowDataPacket[]>(`SELECT role FROM users WHERE id = ?`, [userId]);
        const userRole = (userRows as any)[0]?.role;
        if (order.customerId !== userId && order.collectorId !== userId && userRole !== 'admin') {
            return Response.json({ message: 'Forbidden' }, { status: 403 });
        }

        const [chats] = await pool.query<RowDataPacket[]>(
            `SELECT ch.*, u.username as senderName
             FROM chats ch
             JOIN users u ON ch.sender_id = u.id
             WHERE ch.order_id = ?
             ORDER BY ch.created_at ASC`,
            [orderId]
        );

        return Response.json({ orderId, messages: chats }, { status: 200 });
    } catch (err: any) {
        console.error('getOrderMessages error:', err);
        return Response.json({ message: 'Failed to fetch messages' }, { status: 500 });
    }
};

/** POST /order/api/v1/create & POST /order/api/v1/orders — Create order via HTTP REST */
export const createOrderHTTP = async (req: Request): Promise<Response> => {
    const authResult = await authMiddleware(req);
    if (!authResult.authorized) return Response.json({ message: authResult.error || 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json().catch(() => ({})) as any;
        const customerId = Number(body.customerId || body.userId || body.customer_id || body.user_id || authResult.user.userId);
        const categoryId = body.categoryId || body.category_id || body.category ? Number(body.categoryId || body.category_id || body.category) : null;
        const lat = Number(body.pickupLatitude ?? body.latitude ?? body.lat ?? body.pickup_latitude);
        const lng = Number(body.pickupLongitude ?? body.longitude ?? body.lng ?? body.long ?? body.pickup_longitude);
        const address = String(body.pickupAddress || body.address || body.pickup_address || "Pickup Address");
        const weight = Number(body.approximateRaddiInKg ?? body.raddiInKg ?? body.approximateRaddi ?? body.weight ?? body.weightInKg ?? 1);
        const expectedPrice = (body.expectedPrice ?? body.price ?? body.expected_price) ? Number(body.expectedPrice ?? body.price ?? body.expected_price) : null;
        const scheduleTime = body.scheduleTime || body.schedule_time ? new Date(body.scheduleTime || body.schedule_time) : new Date();

        if (!customerId || isNaN(lat) || isNaN(lng)) {
            return Response.json({ message: "Missing required fields: pickupLatitude and pickupLongitude required" }, { status: 400 });
        }

        const [insertResult] = await pool.execute<any>(
            `INSERT INTO orders 
             (customerId, categoryId, pickupLatitude, pickupLongitude, 
              pickupAddress, scheduleTime, approximateRaddiInKg, expectedPrice, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [customerId, categoryId, lat, lng, address, scheduleTime, weight, expectedPrice]
        );

        const orderId = insertResult.insertId;

        console.log(`[HTTP REST] Order #${orderId} created successfully by Customer #${customerId}`);

        return Response.json({
            success: true,
            message: "Order created successfully",
            orderId,
            order: {
                id: orderId,
                customerId,
                categoryId,
                pickupLatitude: lat,
                pickupLongitude: lng,
                pickupAddress: address,
                scheduleTime: scheduleTime.toISOString(),
                approximateRaddiInKg: weight,
                expectedPrice,
                status: 'pending'
            }
        }, { status: 201 });
    } catch (err: any) {
        console.error('createOrderHTTP error:', err);
        return Response.json({ message: 'Failed to create order', error: err.message }, { status: 500 });
    }
};


