import * as CategoryController from './category.controller';
import { authMiddleware, rolesMiddleware } from '../auth-service/auth.middleware';

export const CategoryRoutes = {
    '/api/v1/category': {
        POST: async (req: Request) => {
            const authResult = authMiddleware(req);
            if (!authResult.authorized) {
                return new Response(authResult.error || 'Unauthorized', { status: 401 });
            }
            (req as any).user = authResult.user;
            const roleResult = await rolesMiddleware(req as any, ['admin']);
            if (!roleResult) {
                return new Response('Forbidden', { status: 403 });
            }
            return await CategoryController.createCategory(req);
        },
        DELETE: async (req: Request) => {
            const authResult = authMiddleware(req);
            if (!authResult.authorized) {
                return new Response(authResult.error || 'Unauthorized', { status: 401 });
            }
            (req as any).user = authResult.user;
            const roleResult = await rolesMiddleware(req as any, ['admin']);
            if (!roleResult) {
                return new Response('Forbidden', { status: 403 });
            }
            return await CategoryController.deleteCategory(req);
        },
        GET: async (req: Request) => await CategoryController.getCategories(req),
    },
}