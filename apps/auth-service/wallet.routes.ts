import * as WalletController from './wallet.controller';
import { authMiddleware } from '../../packages/middleware';

export const WalletRoutes = {
    '/wallet/api/v1/deposit': {
        POST: async (req: Request) => {
            const authResult = await authMiddleware(req);
            if (!authResult.authorized) {
                return new Response(authResult.error || 'Unauthorized', { status: 401 });
            }
            (req as any).user = authResult.user;
            return await WalletController.requestDeposit(req);
        },
    },
    '/wallet/api/v1/withdraw': {
        POST: async (req: Request) => {
            const authResult = await authMiddleware(req);
            if (!authResult.authorized) {
                return new Response(authResult.error || 'Unauthorized', { status: 401 });
            }
            (req as any).user = authResult.user;
            return await WalletController.requestWithdrawal(req);
        },
    },
    '/wallet/api/v1': {
        GET: async (req: Request) => {
            const authResult = await authMiddleware(req);
            if (!authResult.authorized) {
                return new Response(authResult.error || 'Unauthorized', { status: 401 });
            }
            (req as any).user = authResult.user;
            return await WalletController.getMyWallet(req);
        },
    },
};