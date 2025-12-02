import { verifyToken } from '../utils/jwttoken';

export interface AuthRequest extends Request {
  user?: any;
}

const authMiddleware = (req: Request): { authorized: boolean; user?: any; error?: string } => {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return { authorized: false, error: 'No token provided' };
  }

  try {
    const decoded = verifyToken(token);
    return { authorized: true, user: decoded };
  } catch (err) {
    return { authorized: false, error: 'Invalid token' };
  }
};

const rolesMiddleware = (req: AuthRequest, allowedRoles: string[]): boolean => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return false;
  }
  return true;
};

export { authMiddleware, rolesMiddleware };