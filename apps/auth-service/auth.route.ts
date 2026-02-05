import * as AuthController from './auth.controller';
import { authMiddleware } from './auth.middleware';

export const AuthRoutes = {
    '/health': {
        GET: async (req: Request) => {
            return new Response(JSON.stringify({
                status: 'ok',
                service: 'auth-service',
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            }), {
                status: 200,
                headers: { 'content-type': 'application/json' }
            });
        },
    },
    '/auth/api/v1/login': {
        POST: async (req: Request) => await AuthController.login(req),
    },
    '/auth/api/v1/register': {
        POST: async (req: Request) => await AuthController.register(req),
    },
    '/auth/api/v1/verify-email': {
        POST: async (req: Request) => await AuthController.verifyEmail(req),
    },
    '/auth/api/v1/resend-verification-email': {
        POST: async (req: Request) => await AuthController.resendVerificationEmail(req),
    },
    '/auth/api/v1/me': {
        GET: async (req: Request) => {
            const authResult = authMiddleware(req);
            if (!authResult.authorized) {
                return new Response(authResult.error || 'Unauthorized', { status: 401 });
            }
            (req as any).user = authResult.user;
            return await AuthController.getMe(req);
        },
    },
    '/auth/api/v1/me/delete': {
        DELETE: async (req: Request) => {
            const authResult = authMiddleware(req);
            if (!authResult.authorized) {
                return new Response(authResult.error || 'Unauthorized', { status: 401 });
            }
            (req as any).user = authResult.user;
            return await AuthController.deleteMe(req);
        },
    },
    '/auth/api/v1/reset-password': {
        POST: async (req: Request) => await AuthController.resetPassword(req),
    }
}