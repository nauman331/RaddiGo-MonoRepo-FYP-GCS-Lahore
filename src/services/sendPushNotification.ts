import admin from 'firebase-admin';
import serviceAccount from "./serviceAccountKey.json";

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
});

const sendPushNotificationToAllUsers = async (req: Request): Promise<Response> => {
    try {
        const { title, body } = await req.json() as { title: string; body: string };
        if (!title || !body) {
            return Response.json({ message: 'Missing required fields' }, { status: 400 });
        }

        const message = {
            notification: {
                title,
                body,
            },
            // The topic name must match what you used in the frontend
            topic: 'all_users',
        };

        const response = await admin.messaging().send(message);
        return Response.json({ message: 'Notification sent successfully', response }, { status: 200 });
    } catch (error) {
        console.error('Notification error:', error);
        return Response.json({ message: 'Failed to send notification', error }, { status: 500 });
    }
};

export { sendPushNotificationToAllUsers };