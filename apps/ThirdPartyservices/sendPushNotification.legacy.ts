import admin from 'firebase-admin';

// Legacy export — kept for backward compatibility
const sendPushNotificationToAllUsers = async (req: Request): Promise<Response> => {
    try {
        const { title, body } = await req.json() as { title: string; body: string };
        if (!title || !body) {
            return Response.json({ message: 'Missing required fields' }, { status: 400 });
        }
        const response = await admin.messaging().send({
            notification: { title, body },
            topic: 'all_users',
        });
        return Response.json({ message: 'Notification sent successfully', response }, { status: 200 });
    } catch (error: any) {
        console.error('Notification error:', error);
        return Response.json({ message: 'Failed to send notification', error: error.message }, { status: 500 });
    }
};

export { sendPushNotificationToAllUsers };
