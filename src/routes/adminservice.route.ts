import { sendPushNotificationToAllUsers } from "../services/sendPushNotification";
import { authMiddleware, rolesMiddleware } from "../middlewares/auth.middleware";

export const adminServiceRoutes = {
    '/api/v1/admin/send-notification': {
        POST: async (req: Request) => {
            const authResult = authMiddleware(req);
            if (!authResult.authorized) {
                return new Response(authResult.error || 'Unauthorized', { status: 401 });
            }
            (req as any).user = authResult.user;
            // const roleResult = await rolesMiddleware(req as any, ['admin']);
            // if (!roleResult) {
            //     return new Response('Forbidden', { status: 403 });
            // }
            return await sendPushNotificationToAllUsers(req);
        },
    }
}