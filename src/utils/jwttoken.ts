import jwt from 'jsonwebtoken';

interface JwtPayload {
  userId: string;
}

export const signToken = (userId: string): string => {
  return jwt.sign({userId}, process.env.JWT_SECRET_KEY || "default_secret", { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any });
}

export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET_KEY || "default_secret") as JwtPayload;
  } catch (error) {
    return null;
  }
}