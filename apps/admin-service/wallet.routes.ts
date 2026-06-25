import * as AdminWalletController from './wallet.controller';
import { authMiddleware } from '@raddi/middleware';

export const AdminWalletRoutes = {
    '/api/v1/wallets': {
        GET: async (req: Request) => {
            const authResult = authMiddleware(req);
            if (!authResult.authorized) {
                return new Response(authResult.error || 'Unauthorized', { status: 401 });
            }
            (req as any).user = authResult.user;
            return await AdminWalletController.adminGetAllWallets(req);
        },
    },
    '/api/v1/wallet/user': {
        GET: async (req: Request) => {
            const authResult = authMiddleware(req);
            if (!authResult.authorized) {
                return new Response(authResult.error || 'Unauthorized', { status: 401 });
            }
            (req as any).user = authResult.user;
            return await AdminWalletController.adminGetUserWallet(req);
        },
    },
    '/api/v1/wallet/pending': {
        GET: async (req: Request) => {
            const authResult = authMiddleware(req);
            if (!authResult.authorized) {
                return new Response(authResult.error || 'Unauthorized', { status: 401 });
            }
            (req as any).user = authResult.user;
            return await AdminWalletController.adminGetPending(req);
        },
    },
    '/api/v1/wallet/approve': {
        POST: async (req: Request) => {
            const authResult = authMiddleware(req);
            if (!authResult.authorized) {
                return new Response(authResult.error || 'Unauthorized', { status: 401 });
            }
            (req as any).user = authResult.user;
            return await AdminWalletController.adminApprove(req);
        },
    },
    '/api/v1/wallet/reject': {
        POST: async (req: Request) => {
            const authResult = authMiddleware(req);
            if (!authResult.authorized) {
                return new Response(authResult.error || 'Unauthorized', { status: 401 });
            }
            (req as any).user = authResult.user;
            return await AdminWalletController.adminReject(req);
        },
    },
};