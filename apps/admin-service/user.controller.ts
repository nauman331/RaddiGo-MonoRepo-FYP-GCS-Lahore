import pool, { redis } from '@raddi/db';
import type { RowDataPacket } from 'mysql2';
import { rolesMiddleware } from '@raddi/middleware';

const safeParseJSON = async <T>(req: Request): Promise<T | null> => {
    try { return await req.json() as T; } catch { return null; }
};

const requireAdmin = async (req: Request): Promise<Response | null> => {
    const isAllowed = await rolesMiddleware(req as any, ['admin']);
    if (!isAllowed) {
        return Response.json({ message: 'Forbidden: admin only' }, { status: 403 });
    }
    return null;
};

export const adminGetAllUsers = async (req: Request): Promise<Response> => {
    const res = await requireAdmin(req); if (res) return res;
    try {
        const [users] = await pool.query<RowDataPacket[]>(
            `SELECT id, username, email, phone, address, role, isActive, isVerified, createdAt, updatedAt 
             FROM users 
             ORDER BY createdAt DESC`
        );
        return Response.json({ users }, { status: 200 });
    } catch (err) {
        console.error('Error fetching users:', err);
        return Response.json({ message: 'Failed to fetch users' }, { status: 500 });
    }
};

export const adminUpdateUser = async (req: Request): Promise<Response> => {
    const res = await requireAdmin(req); if (res) return res;
    
    const url = new URL(req.url);
    const userId = url.searchParams.get('id');
    if (!userId) return Response.json({ message: 'User ID required' }, { status: 400 });

    const body = await safeParseJSON<{ username?: string; phone?: string; role?: string }>(req);
    if (!body) return Response.json({ message: 'Invalid payload' }, { status: 400 });

    try {
        const updates: string[] = [];
        const values: any[] = [];
        
        if (body.username) { updates.push('username = ?'); values.push(body.username); }
        if (body.phone) { updates.push('phone = ?'); values.push(body.phone); }
        if (body.role) { updates.push('role = ?'); values.push(body.role); }
        
        if (updates.length === 0) {
            return Response.json({ message: 'No fields to update' }, { status: 400 });
        }
        
        values.push(userId);
        await pool.execute(
            `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
            values
        );
        
        await redis.del(`user:${userId}`);
        return Response.json({ message: 'User updated successfully' }, { status: 200 });
    } catch (err) {
        console.error('Error updating user:', err);
        return Response.json({ message: 'Failed to update user' }, { status: 500 });
    }
};

export const adminToggleUserStatus = async (req: Request): Promise<Response> => {
    const res = await requireAdmin(req); if (res) return res;
    
    const url = new URL(req.url);
    const userId = url.searchParams.get('id');
    if (!userId) return Response.json({ message: 'User ID required' }, { status: 400 });

    const body = await safeParseJSON<{ isActive: boolean }>(req);
    if (!body || body.isActive === undefined) {
        return Response.json({ message: 'isActive status required' }, { status: 400 });
    }

    try {
        await pool.execute(
            `UPDATE users SET isActive = ? WHERE id = ?`,
            [body.isActive, userId]
        );
        await redis.del(`user:${userId}`);
        return Response.json({ message: `User ${body.isActive ? 'activated' : 'deactivated'} successfully` }, { status: 200 });
    } catch (err) {
        console.error('Error toggling status:', err);
        return Response.json({ message: 'Failed to toggle status' }, { status: 500 });
    }
};

export const adminDeleteUser = async (req: Request): Promise<Response> => {
    const res = await requireAdmin(req); if (res) return res;
    
    const url = new URL(req.url);
    const userIdStr = url.searchParams.get('id');
    if (!userIdStr) return Response.json({ message: 'User ID required' }, { status: 400 });

    const userId = Number(userIdStr);

    try {
        const connection = await pool.getConnection();
        try {
            await connection.query('SET FOREIGN_KEY_CHECKS = 0');
            await connection.query('DELETE FROM chats WHERE sender_id = ? OR receiver_id = ?', [userId, userId]);
            await connection.query('DELETE FROM order_bids WHERE collector_id = ?', [userId]);
            await connection.query('DELETE FROM wallet_transactions WHERE user_id = ?', [userId]);
            await connection.query('DELETE FROM wallets WHERE user_id = ?', [userId]);
            await connection.query('DELETE FROM orders WHERE customerId = ? OR collectorId = ?', [userId, userId]);
            await connection.query('DELETE FROM users WHERE id = ?', [userId]);
            await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        } finally {
            connection.release();
        }

        await redis.del(`user:${userId}`);
        console.log(`✓ Admin deleted user #${userId} and associated records.`);
        return Response.json({ message: 'User deleted successfully' }, { status: 200 });
    } catch (err: any) {
        console.error('Error deleting user:', err);
        return Response.json({ message: 'Failed to delete user', error: err.message }, { status: 500 });
    }
};

