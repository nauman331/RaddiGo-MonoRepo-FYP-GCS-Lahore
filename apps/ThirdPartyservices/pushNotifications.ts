import admin from 'firebase-admin';
import pool from '../../packages/db';
import type { RowDataPacket } from 'mysql2';

// Initialize Firebase Admin once (shared across services)
if (!admin.apps.length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && privateKey) {
        try {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey,
                } as admin.ServiceAccount)
            });
            console.log('✓ Firebase Admin initialized');
        } catch (err: any) {
            console.warn('[Firebase] Init failed (push notifications disabled):', err.message);
        }
    } else {
        console.warn('[Firebase] Missing env vars — push notifications disabled');
    }
}

const isFirebaseReady = () => admin.apps.length > 0;

// ── Types ──────────────────────────────────────────────────

interface PushPayload {
    title: string;
    body: string;
    data?: Record<string, string>;
}

// ── Topic Broadcast (all users) ─────────────────────────────

export const sendPushToAllUsers = async (req: Request): Promise<Response> => {
    if (!isFirebaseReady()) {
        return Response.json({ message: 'Push notifications not configured' }, { status: 503 });
    }
    try {
        const { title, body } = await req.json() as { title: string; body: string };
        if (!title || !body) {
            return Response.json({ message: 'Missing required fields: title, body' }, { status: 400 });
        }
        const response = await admin.messaging().send({
            notification: { title, body },
            topic: 'all_users',
        });
        return Response.json({ message: 'Notification sent successfully', response }, { status: 200 });
    } catch (error: any) {
        console.error('[Push] sendToAllUsers error:', error);
        return Response.json({ message: 'Failed to send notification', error: error.message }, { status: 500 });
    }
};

// ── Send to specific FCM token ───────────────────────────────

export const sendPushToToken = async (
    fcmToken: string,
    payload: PushPayload
): Promise<boolean> => {
    if (!isFirebaseReady() || !fcmToken) return false;
    try {
        await admin.messaging().send({
            token: fcmToken,
            notification: {
                title: payload.title,
                body: payload.body,
            },
            data: payload.data || {},
            android: {
                priority: 'high',
                notification: { sound: 'default', channelId: 'raddigo_orders' },
            },
            apns: {
                payload: { aps: { sound: 'default', badge: 1 } },
            },
        });
        return true;
    } catch (err: any) {
        // Remove stale/invalid tokens
        if (err.code === 'messaging/registration-token-not-registered' ||
            err.code === 'messaging/invalid-registration-token') {
            await clearStaleFcmToken(fcmToken);
        }
        console.error('[Push] sendToToken error:', err.message);
        return false;
    }
};

// ── Send to a user by userId (looks up their FCM token) ─────

export const sendPushToUser = async (
    userId: number,
    payload: PushPayload
): Promise<boolean> => {
    if (!isFirebaseReady()) return false;
    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT fcmToken FROM users WHERE id = ? AND fcmToken IS NOT NULL`,
            [userId]
        );
        const token = (rows as any)[0]?.fcmToken;
        if (!token) return false;
        return sendPushToToken(token, payload);
    } catch (err: any) {
        console.error('[Push] sendToUser lookup error:', err.message);
        return false;
    }
};

// ── Send to multiple users (batched) ─────────────────────────

export const sendPushToUsers = async (
    userIds: number[],
    payload: PushPayload
): Promise<void> => {
    if (!isFirebaseReady() || userIds.length === 0) return;
    try {
        const placeholders = userIds.map(() => '?').join(',');
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT id, fcmToken FROM users WHERE id IN (${placeholders}) AND fcmToken IS NOT NULL`,
            userIds
        );
        const tokens = (rows as any[]).map((r) => r.fcmToken).filter(Boolean);
        if (tokens.length === 0) return;

        // Send in batches of 500 (FCM multicast limit)
        for (let i = 0; i < tokens.length; i += 500) {
            const batch = tokens.slice(i, i + 500);
            await admin.messaging().sendEachForMulticast({
                tokens: batch,
                notification: { title: payload.title, body: payload.body },
                data: payload.data || {},
                android: {
                    priority: 'high',
                    notification: { sound: 'default', channelId: 'raddigo_orders' },
                },
                apns: {
                    payload: { aps: { sound: 'default', badge: 1 } },
                },
            });
        }
    } catch (err: any) {
        console.error('[Push] sendToUsers error:', err.message);
    }
};

// ── Clear stale FCM token from DB ───────────────────────────

async function clearStaleFcmToken(fcmToken: string): Promise<void> {
    try {
        await pool.execute(`UPDATE users SET fcmToken = NULL WHERE fcmToken = ?`, [fcmToken]);
        console.log('[Push] Cleared stale FCM token');
    } catch { }
}

// ── Predefined notification templates ───────────────────────

export const PushNotifications = {
    newOrderAvailable: (orderId: number, address: string, weightKg: number) => ({
        title: '🚛 New Raddi Order Nearby!',
        body: `Pickup at ${address} — approx. ${weightKg}kg`,
        data: { type: 'new_order', orderId: String(orderId) },
    }),

    bidReceived: (collectorName: string, amount: number, orderId: number) => ({
        title: '💰 New Bid Received',
        body: `${collectorName} bid PKR ${amount} for your raddi`,
        data: { type: 'bid_received', orderId: String(orderId) },
    }),

    bidAccepted: (orderId: number, finalPrice: number) => ({
        title: '✅ Your Bid Was Accepted!',
        body: `Head to the pickup. Final price: PKR ${finalPrice}`,
        data: { type: 'bid_accepted', orderId: String(orderId) },
    }),

    counterBidReceived: (amount: number, orderId: number) => ({
        title: '🔄 Counter Offer Received',
        body: `Customer countered with PKR ${amount}`,
        data: { type: 'counter_bid', orderId: String(orderId) },
    }),

    collectorEnRoute: (orderId: number) => ({
        title: '🚗 Collector On The Way!',
        body: 'Your collector is heading to your location. Be ready!',
        data: { type: 'collector_en_route', orderId: String(orderId) },
    }),

    orderCompleted: (finalPrice: number, orderId: number) => ({
        title: '🎉 Order Completed!',
        body: `PKR ${finalPrice} has been added to your wallet`,
        data: { type: 'order_completed', orderId: String(orderId) },
    }),

    orderCancelled: (orderId: number) => ({
        title: '❌ Order Cancelled',
        body: 'The order has been cancelled by the customer',
        data: { type: 'order_cancelled', orderId: String(orderId) },
    }),
};

export { sendPushNotificationToAllUsers } from './sendPushNotification.legacy';
