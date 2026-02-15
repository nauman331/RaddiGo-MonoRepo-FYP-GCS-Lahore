import pool from '../db';
import { verifyToken } from '../../apps/utils/jwttoken';

export interface AuthRequest extends Request {
    user?: any;
}

export const authMiddleware = (req: Request): { authorized: boolean; user?: any; error?: string } => {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
        return { authorized: false, error: 'No token provided' };
    }

    try {
        const decoded = verifyToken(token);
        if (!decoded) return { authorized: false, error: 'Invalid token' };
        return { authorized: true, user: decoded };
    } catch (err) {
        return { authorized: false, error: 'Invalid token' };
    }
};

export const rolesMiddleware = async (req: AuthRequest, allowedRoles: string[]): Promise<boolean> => {
    try {
        const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [(req as any).user.userId]);
        const user = (rows as any)[0];
        if (!user || !allowedRoles.includes(user.role)) {
            return false;
        }
        return true;
    } catch (error) {
        return false;
    }
};

export default authMiddleware;
