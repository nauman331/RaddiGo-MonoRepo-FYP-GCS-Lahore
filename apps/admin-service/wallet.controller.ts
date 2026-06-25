import pool, { redis } from '@raddi/db';  // adjust import based on your actual db package
import type { RowDataPacket } from 'mysql2';

const safeParseJSON = async <T>(req: Request): Promise<T | null> => {
    try { return await req.json() as T; } catch { return null; }
};

const requireAdmin = (req: Request): Response | null => {
    const user = (req as any).user;
    if (!user || user.role !== 'admin') {
        return Response.json({ message: 'Forbidden: admin only' }, { status: 403 });
    }
    return null;
};

export const adminGetAllWallets = async (req: Request): Promise<Response> => {
    const res = requireAdmin(req); if (res) return res;
    const [wallets] = await pool.query<RowDataPacket[]>(
        `SELECT w.user_id, u.username, u.email, u.phone, w.balance, w.updated_at
         FROM wallets w JOIN users u ON w.user_id = u.id
         ORDER BY w.updated_at DESC`
    );
    return Response.json({ wallets }, { status: 200 });
};

export const adminGetUserWallet = async (req: Request): Promise<Response> => {
    const res = requireAdmin(req); if (res) return res;
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    if (!userId) return Response.json({ message: 'User ID required' }, { status: 400 });

    const [wallet] = await pool.query<RowDataPacket[]>("SELECT * FROM wallets WHERE user_id = ?", [userId]);
    if (!wallet.length) return Response.json({ message: 'Wallet not found' }, { status: 404 });

    const [transactions] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM wallet_transactions WHERE user_id = ? ORDER BY created_at DESC`,
        [userId]
    );
    return Response.json({ wallet: wallet[0], transactions }, { status: 200 });
};

export const adminGetPending = async (req: Request): Promise<Response> => {
    const res = requireAdmin(req); if (res) return res;
    const [pending] = await pool.query<RowDataPacket[]>(
        `SELECT wt.*, u.username, u.email
         FROM wallet_transactions wt JOIN users u ON wt.user_id = u.id
         WHERE wt.status = 'pending' ORDER BY wt.created_at ASC`
    );
    return Response.json({ transactions: pending }, { status: 200 });
};

export const adminApprove = async (req: Request): Promise<Response> => {
    const res = requireAdmin(req); if (res) return res;
    const admin = (req as any).user;
    const url = new URL(req.url);
    const txnId = url.searchParams.get('id');
    if (!txnId) return Response.json({ message: 'Transaction ID required' }, { status: 400 });

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const [txRows] = await conn.query<RowDataPacket[]>(
            "SELECT * FROM wallet_transactions WHERE id = ? AND status = 'pending' FOR UPDATE", [txnId]
        );
        const tx = (txRows as any)[0];
        if (!tx) {
            await conn.rollback();
            return Response.json({ message: 'Transaction not found or already processed' }, { status: 404 });
        }

        await conn.execute(
            "UPDATE wallet_transactions SET status = 'approved', admin_id = ?, updated_at = NOW() WHERE id = ?",
            [admin.userId, txnId]
        );

        if (tx.type === 'deposit') {
            await conn.execute("UPDATE wallets SET balance = balance + ? WHERE user_id = ?", [tx.amount, tx.user_id]);
        } else {
            await conn.execute("UPDATE wallets SET balance = balance - ? WHERE user_id = ?", [tx.amount, tx.user_id]);
        }

        await conn.commit();
        await redis.del(`user:${tx.user_id}`);
        return Response.json({ message: 'Transaction approved' }, { status: 200 });
    } catch (err) {
        await conn.rollback();
        console.error(err);
        return Response.json({ message: 'Approval failed' }, { status: 500 });
    } finally {
        conn.release();
    }
};

export const adminReject = async (req: Request): Promise<Response> => {
    const res = requireAdmin(req); if (res) return res;
    const admin = (req as any).user;
    const url = new URL(req.url);
    const txnId = url.searchParams.get('id');
    if (!txnId) return Response.json({ message: 'Transaction ID required' }, { status: 400 });

    const body = await safeParseJSON<{ note?: string }>(req);
    const [result] = await pool.execute(
        `UPDATE wallet_transactions SET status = 'rejected', admin_id = ?, note = ?, updated_at = NOW()
         WHERE id = ? AND status = 'pending'`,
        [admin.userId, body?.note || 'Rejected by admin', txnId]
    );
    if ((result as any).affectedRows === 0) {
        return Response.json({ message: 'Transaction not found or already processed' }, { status: 404 });
    }
    return Response.json({ message: 'Transaction rejected' }, { status: 200 });
};