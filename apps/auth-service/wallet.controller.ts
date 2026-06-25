import pool from '../../packages/db';
import type { RowDataPacket } from "mysql2";

const safeParseJSON = async <T>(req: Request): Promise<T | null> => {
    try { return await req.json() as T; } catch { return null; }
};

const getUserId = (req: Request): number => (req as any).user.userId;

export const requestDeposit = async (req: Request): Promise<Response> => {
    const userId = getUserId(req);
    const body = await safeParseJSON<{
        amount: number;
        senderAccount: string;
        tid: string;
        note?: string;
    }>(req);

    if (!body?.amount || body.amount <= 0 || !body.senderAccount || !body.tid) {
        return Response.json({ message: 'Missing or invalid fields' }, { status: 400 });
    }

    await pool.execute(
        `INSERT INTO wallet_transactions (user_id, type, amount, status, sender_account, transaction_id, note)
         VALUES (?, 'deposit', ?, 'pending', ?, ?, ?)`,
        [userId, body.amount, body.senderAccount, body.tid, body.note || null]
    );
    return Response.json({ message: 'Deposit request submitted for approval' }, { status: 200 });
};

export const requestWithdrawal = async (req: Request): Promise<Response> => {
    const userId = getUserId(req);
    const body = await safeParseJSON<{
        amount: number;
        withdrawBank: string;
        withdrawAccountNo: string;
        withdrawAccountTitle: string;
        note?: string;
    }>(req);

    if (!body?.amount || body.amount <= 0 || !body.withdrawBank || !body.withdrawAccountNo || !body.withdrawAccountTitle) {
        return Response.json({ message: 'Missing or invalid fields' }, { status: 400 });
    }

    const [wallet] = await pool.query<RowDataPacket[]>("SELECT balance FROM wallets WHERE user_id = ?", [userId]);
    const balance = (wallet as any)[0]?.balance || 0;
    if (balance < body.amount) {
        return Response.json({ message: 'Insufficient balance' }, { status: 400 });
    }

    await pool.execute(
        `INSERT INTO wallet_transactions (user_id, type, amount, status, bank_name, account_no, account_title, note)
         VALUES (?, 'withdrawal', ?, 'pending', ?, ?, ?, ?)`,
        [userId, body.amount, body.withdrawBank, body.withdrawAccountNo, body.withdrawAccountTitle, body.note || null]
    );
    return Response.json({ message: 'Withdrawal request submitted for approval' }, { status: 200 });
};

export const getMyWallet = async (req: Request): Promise<Response> => {
    const userId = getUserId(req);

    const [wallet] = await pool.query<RowDataPacket[]>("SELECT balance FROM wallets WHERE user_id = ?", [userId]);
    const balance = (wallet as any)[0]?.balance || 0;

    const [transactions] = await pool.query<RowDataPacket[]>(
        `SELECT id, type, amount, status, sender_account, transaction_id, bank_name, account_no, account_title, note, created_at
         FROM wallet_transactions WHERE user_id = ? ORDER BY created_at DESC`,
        [userId]
    );

    return Response.json({ balance, transactions }, { status: 200 });
};