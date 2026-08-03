import pool from './index';
import type { PoolConnection } from 'mysql2/promise';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface TransferResult {
    success: boolean;
    error?: string;
    transactionId?: number;
}

/**
 * Atomically transfers PKR from one user's wallet to another.
 * Used by order-service when an order is completed:
 *   - Collector (fromUserId) pays the Customer (toUserId) for the scrap.
 *
 * Guarantees:
 *   - Both wallet rows are locked with FOR UPDATE (prevents race conditions)
 *   - Balance check before debit
 *   - Both wallets and two transaction records updated in a single DB transaction
 *   - Full rollback on any error
 */
export async function internalWalletTransfer(
    fromUserId: number,   // Collector — pays for scrap
    toUserId: number,     // Customer — receives payment
    amount: number,
    orderId: number,
    note?: string
): Promise<TransferResult> {
    if (!fromUserId || !toUserId || !amount || amount <= 0) {
        return { success: false, error: 'Invalid transfer parameters' };
    }

    if (fromUserId === toUserId) {
        return { success: false, error: 'Cannot transfer to self' };
    }

    let conn: PoolConnection | null = null;
    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        // Lock both wallets in consistent ID order to prevent deadlocks
        const lockOrder = fromUserId < toUserId
            ? [fromUserId, toUserId]
            : [toUserId, fromUserId];

        const [walletRows] = await conn.query<RowDataPacket[]>(
            `SELECT user_id, balance FROM wallets WHERE user_id IN (?, ?) ORDER BY user_id FOR UPDATE`,
            lockOrder
        );

        const fromWallet = (walletRows as any[]).find((w) => w.user_id === fromUserId);
        const toWallet = (walletRows as any[]).find((w) => w.user_id === toUserId);

        if (!fromWallet) {
            await conn.rollback();
            return { success: false, error: 'Collector wallet not found' };
        }
        if (!toWallet) {
            await conn.rollback();
            return { success: false, error: 'Customer wallet not found' };
        }

        const fromBalance = Number(fromWallet.balance);
        if (fromBalance < amount) {
            await conn.rollback();
            return {
                success: false,
                error: `Insufficient balance. Available: PKR ${fromBalance.toFixed(2)}, Required: PKR ${amount.toFixed(2)}`
            };
        }

        // Debit collector
        await conn.execute(
            `UPDATE wallets SET balance = balance - ? WHERE user_id = ?`,
            [amount, fromUserId]
        );

        // Credit customer
        await conn.execute(
            `UPDATE wallets SET balance = balance + ? WHERE user_id = ?`,
            [amount, toUserId]
        );

        const transferNote = note || `Order #${orderId} — scrap payment`;

        // Record debit transaction (collector side)
        await conn.execute(
            `INSERT INTO wallet_transactions 
             (user_id, type, amount, status, note, transaction_id) 
             VALUES (?, 'withdrawal', ?, 'approved', ?, ?)`,
            [fromUserId, amount, transferNote, `ORDER-${orderId}-DEBIT`]
        );

        // Record credit transaction (customer side)
        const [insertResult] = await conn.execute<ResultSetHeader>(
            `INSERT INTO wallet_transactions 
             (user_id, type, amount, status, note, transaction_id) 
             VALUES (?, 'deposit', ?, 'approved', ?, ?)`,
            [toUserId, amount, transferNote, `ORDER-${orderId}-CREDIT`]
        );

        await conn.commit();

        console.log(
            `✓ Wallet transfer: PKR ${amount} from user#${fromUserId} → user#${toUserId} for order#${orderId}`
        );

        return {
            success: true,
            transactionId: (insertResult as ResultSetHeader).insertId
        };
    } catch (err: any) {
        if (conn) await conn.rollback();
        console.error('Wallet transfer error:', err);
        return { success: false, error: err.message || 'Transfer failed' };
    } finally {
        if (conn) conn.release();
    }
}
