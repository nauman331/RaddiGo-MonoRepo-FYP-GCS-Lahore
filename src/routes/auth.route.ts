import * as AuthController from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

export const AuthRoutes = {
    '/api/v1/login': {
        POST: async (req: Request) => await AuthController.login(req),
    },
    '/api/v1/register': {
        POST: async (req: Request) => await AuthController.register(req),
    },
    '/api/v1/verify-email': {
        POST: async (req: Request) => await AuthController.verifyEmail(req),
    },
    '/api/v1/resend-verification-email': {
        POST: async (req: Request) => await AuthController.resendVerificationEmail(req),
    },
    '/api/v1/me': {
        GET: async (req: Request) => {
            const authResult = authMiddleware(req);
            if (!authResult.authorized) {
                return new Response(authResult.error || 'Unauthorized', { status: 401 });
            }
            (req as any).user = authResult.user;
            return await AuthController.getMe(req);
        },
    },
    '/api/v1/me/delete': {
        DELETE: async (req: Request) => {
            const authResult = authMiddleware(req);
            if (!authResult.authorized) {
                return new Response(authResult.error || 'Unauthorized', { status: 401 });
            }
            (req as any).user = authResult.user;
            return await AuthController.deleteMe(req);
        },
    },
    '/api/v1/reset-password': {
        POST: async (req: Request) => await AuthController.resetPassword(req),
    }
}