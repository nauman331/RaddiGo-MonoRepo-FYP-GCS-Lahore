import * as AdminUserController from './user.controller';
import { authMiddleware } from '@raddi/middleware';

export const AdminUserRoutes = {
    '/api/v1/users': {
        GET: async (req: Request) => {
            const authResult = await authMiddleware(req);
            if (!authResult.authorized) {
                return new Response(authResult.error || 'Unauthorized', { status: 401 });
            }
            (req as any).user = authResult.user;
            return await AdminUserController.adminGetAllUsers(req);
        },
    },
    '/api/v1/users/edit': {
        PUT: async (req: Request) => {
            const authResult = await authMiddleware(req);
            if (!authResult.authorized) {
                return new Response(authResult.error || 'Unauthorized', { status: 401 });
            }
            (req as any).user = authResult.user;
            return await AdminUserController.adminUpdateUser(req);
        },
    },
    '/api/v1/users/status': {
        PATCH: async (req: Request) => {
            const authResult = await authMiddleware(req);
            if (!authResult.authorized) {
                return new Response(authResult.error || 'Unauthorized', { status: 401 });
            }
            (req as any).user = authResult.user;
            return await AdminUserController.adminToggleUserStatus(req);
        },
    },
    '/api/v1/users/delete': {
        DELETE: async (req: Request) => {
            const authResult = await authMiddleware(req);
            if (!authResult.authorized) {
                return new Response(authResult.error || 'Unauthorized', { status: 401 });
            }
            (req as any).user = authResult.user;
            return await AdminUserController.adminDeleteUser(req);
        },
    },
};
