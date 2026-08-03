import pool from '../db';
import { verifyToken } from '../../apps/utils/jwttoken';
import type { RowDataPacket } from 'mysql2';

export interface AuthRequest extends Request {
    user?: any;
}

/**
 * Fix #6: authMiddleware now fetches role from DB in one query,
 * so rolesMiddleware can use the cached user object without a second DB round-trip.
 */
export const authMiddleware = async (
    req: Request
): Promise<{ authorized: boolean; user?: any; error?: string }> => {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
        return { authorized: false, error: 'No token provided' };
    }

    try {
        const decoded = verifyToken(token) as any;
        if (!decoded) return { authorized: false, error: 'Invalid token' };

        // Single DB query: verify active + fetch role in one round-trip
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT id, role, isActive FROM users WHERE id = ?`,
            [decoded.userId]
        );
        const userRow = (rows as any)[0];

        if (!userRow) {
            return { authorized: false, error: 'User not found' };
        }
        if (!userRow.isActive) {
            return { authorized: false, error: 'Account has been deactivated. Please contact support.' };
        }

        // Attach role to the decoded payload — eliminates second DB query in rolesMiddleware
        return {
            authorized: true,
            user: { ...decoded, role: userRow.role }
        };
    } catch (err) {
        return { authorized: false, error: 'Invalid token' };
    }
};

/**
 * Fix #6: rolesMiddleware no longer hits the DB — role is already on req.user
 * (set by authMiddleware above).
 */
export const rolesMiddleware = async (
    req: AuthRequest,
    allowedRoles: string[]
): Promise<boolean> => {
    const role = (req as any).user?.role;
    if (!role) return false;
    return allowedRoles.includes(role);
};

export default authMiddleware;
