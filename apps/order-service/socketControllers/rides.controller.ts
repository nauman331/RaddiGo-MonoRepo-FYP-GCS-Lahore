import { on, sendToSocket, sendToRoom, joinRoom } from "../socket";
import pool, { redis } from '../../../packages/db';
import { internalWalletTransfer } from '../../../packages/db/walletTransfer';
import type { DriverLocation } from "../../../packages/types/index";
import { NearbyDrivers, updateDriverLocation } from "../findNearbyDrivers";
import { sendPushToUser, sendPushToUsers, PushNotifications } from '../../ThirdPartyservices/pushNotifications';
import type { RowDataPacket, ResultSetHeader } from "mysql2";


// ─────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────

/** Notify all active bidders on an order that it has been resolved */
const notifyOrderResolved = async (orderId: number, event: string, data: any) => {
    const [bids] = await pool.query<RowDataPacket[]>(
        `SELECT DISTINCT collector_id FROM order_bids WHERE order_id = ?`,
        [orderId]
    );
    (bids as any[]).forEach((bid) => {
        sendToRoom(String(bid.collector_id), event, data);
    });
};

/** Fetch order with basic validation */
const getOrder = async (orderId: number) => {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM orders WHERE id = ?`,
        [orderId]
    );
    return (rows as any)[0] || null;
};

// ─────────────────────────────────────────────────────────────
//  Main Setup
// ─────────────────────────────────────────────────────────────

export const setupRidesController = () => {

    // ── Connection ────────────────────────────────────────────
    on("connection", (data) => {
        console.log(`[Rides] Client connected: ${data.socketId}`);
    });

    // ── Driver Location Update ────────────────────────────────
    /**
     * Event: driverLocationUpdate
     * From: Collector
     * Data: { driverId, latitude, longitude }
     *
     * Stores driver GPS in Redis with 5-minute TTL.
     * Also joins the driver into their personal room (driverId) for targeted messages.
     */
    on("driverLocationUpdate", async (message: any) => {
        try {
            const data: DriverLocation = message.data;
            const socketId = message._socketId;
            const ws = message._ws;

            if (!data?.driverId || data.latitude === undefined || data.longitude === undefined) {
                return sendToSocket(socketId, "error", { message: "Invalid location data" });
            }

            // Join driver's personal notification room
            if (ws) {
                joinRoom(socketId, String(data.driverId));
            }

            // Fix #5: Use GEOADD for accurate geospatial indexing
            await updateDriverLocation(String(data.driverId), data.latitude, data.longitude);

            sendToSocket(socketId, "locationUpdated", { success: true, driverId: data.driverId });

            // Live location broadcast: if driver has an active in_progress order,
            // push location update to the customer in real-time
            const [activeOrder] = await pool.query<RowDataPacket[]>(
                `SELECT id, customerId FROM orders
                 WHERE collectorId = ? AND status = 'in_progress'
                 LIMIT 1`,
                [data.driverId]
            );
            const order = (activeOrder as any)[0];
            if (order) {
                sendToRoom(String(order.customerId), "liveLocationUpdate", {
                    orderId: order.id,
                    collectorId: data.driverId,
                    latitude: data.latitude,
                    longitude: data.longitude,
                    timestamp: Date.now(),
                });
            }
        } catch (error) {
            sendToSocket(message._socketId, "error", { message: `Location update error: ${error}` });
        }
    });

    // ── Create Order ──────────────────────────────────────────
    /**
     * Event: createOrder
     * From: Customer
     * Data: {
     *   customerId, pickupLatitude, pickupLongitude, pickupAddress,
     *   approximateRaddiInKg, categoryId?, expectedPrice?, scheduleTime?
     * }
     *
     * Creates order in DB, finds nearby drivers, broadcasts newOrderAvailable to each.
     * Customer joins their personal room (customerId) for receiving bid notifications.
     */
    // ── Create Order Handler (Shared for createOrder, makeRaddiOrder, create_order) ──
    const handleOrderCreation = async (message: any) => {
        try {
            const data = message.data || {};
            const socketId = message._socketId;
            const ws = message._ws;

            const customerId = Number(data.customerId || data.userId || data.customer_id || data.user_id);
            const categoryId = data.categoryId || data.category_id || data.category ? Number(data.categoryId || data.category_id || data.category) : null;
            const lat = Number(data.pickupLatitude ?? data.latitude ?? data.lat ?? data.pickup_latitude);
            const lng = Number(data.pickupLongitude ?? data.longitude ?? data.lng ?? data.long ?? data.pickup_longitude);
            const address = String(data.pickupAddress || data.address || data.pickup_address || "Pickup Address");
            const weight = Number(data.approximateRaddiInKg ?? data.raddiInKg ?? data.approximateRaddi ?? data.weight ?? data.weightInKg ?? 1);
            const expectedPrice = (data.expectedPrice ?? data.price ?? data.expected_price) ? Number(data.expectedPrice ?? data.price ?? data.expected_price) : null;
            const scheduleTime = data.scheduleTime || data.schedule_time ? new Date(data.scheduleTime || data.schedule_time) : new Date();

            if (!customerId || isNaN(lat) || isNaN(lng)) {
                return sendToSocket(socketId, "error", { message: "Missing required order fields: customerId, pickupLatitude, pickupLongitude" });
            }

            // Join customer's room for bid notifications
            if (ws) {
                joinRoom(socketId, String(customerId));
            }

            const [insertResult] = await pool.execute<ResultSetHeader>(
                `INSERT INTO orders 
                 (customerId, categoryId, pickupLatitude, pickupLongitude, 
                  pickupAddress, scheduleTime, approximateRaddiInKg, expectedPrice, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
                [
                    customerId,
                    categoryId,
                    lat,
                    lng,
                    address,
                    scheduleTime,
                    weight,
                    expectedPrice
                ]
            );
            const orderId = (insertResult as ResultSetHeader).insertId;

            // Find nearby collectors
            const radiusKm = parseInt(process.env.RADIUS_KM || '10');
            const nearbyDrivers = await NearbyDrivers(lat, lng, radiusKm);

            const orderBroadcast = {
                orderId,
                customerId,
                pickupLatitude: lat,
                pickupLongitude: lng,
                pickupAddress: address,
                approximateRaddiInKg: weight,
                expectedPrice,
                categoryId,
                scheduleTime: scheduleTime.toISOString(),
                status: 'pending'
            };

            if (nearbyDrivers.length > 0) {
                const driverIds = nearbyDrivers.map((d) => parseInt(d.driverId)).filter(Boolean);

                // WebSocket notification (online drivers)
                nearbyDrivers.forEach((driver) => {
                    sendToRoom(driver.driverId, "newOrderAvailable", orderBroadcast);
                });

                // Push notification (offline/background drivers)
                const pushPayload = PushNotifications.newOrderAvailable(orderId, address, weight);
                sendPushToUsers(driverIds, pushPayload).catch((e) =>
                    console.error('[Push] newOrder batch error:', e)
                );
            }

            console.log(`[Order #${orderId}] Created by Customer #${customerId} — ${nearbyDrivers.length} nearby drivers notified`);

            const responsePayload = {
                success: true,
                orderId,
                nearbyDriverCount: nearbyDrivers.length,
                order: orderBroadcast,
                message: nearbyDrivers.length > 0
                    ? `Order created. ${nearbyDrivers.length} collectors notified.`
                    : 'Order created. Searching for nearby collectors.'
            };

            sendToSocket(socketId, "orderCreated", responsePayload);
            sendToSocket(socketId, "makeRaddiOrderConfirmed", responsePayload);
        } catch (error) {
            console.error("[createOrder] Error:", error);
            sendToSocket(message._socketId, "error", { message: `Order creation failed: ${error}` });
        }
    };

    on("createOrder", handleOrderCreation);
    on("makeRaddiOrder", handleOrderCreation);
    on("create_order", handleOrderCreation);


    // ── Place Bid ─────────────────────────────────────────────
    /**
     * Event: placeBid
     * From: Collector
     * Data: { orderId, collectorId, bidAmount, note? }
     *
     * Collector bids a price on a pending/bidding order.
     * Notifies the customer in their room.
     * Order status moves to 'bidding' if it was 'pending'.
     */
    on("placeBid", async (message: any) => {
        try {
            const data = message.data || {};
            const socketId = message._socketId;
            const ws = message._ws;

            const orderId = Number(data.orderId || data.order_id);
            const collectorId = Number(data.collectorId || data.userId || data.collector_id || data.user_id);
            const bidAmount = Number(data.bidAmount || data.amount || data.bid_amount || data.price);
            const note = data.note ? String(data.note) : null;

            if (!orderId || !collectorId || !bidAmount || isNaN(bidAmount) || bidAmount <= 0) {
                return sendToSocket(socketId, "error", { message: "Missing or invalid bid fields: orderId, collectorId, and bidAmount required" });
            }

            const order = await getOrder(orderId);
            if (!order) {
                return sendToSocket(socketId, "error", { message: "Order not found" });
            }
            if (!['pending', 'bidding'].includes(order.status)) {
                return sendToSocket(socketId, "error", {
                    message: `Cannot bid on order with status: ${order.status}`
                });
            }


            // Join collector's room for counter-bid notifications
            if (ws) {
                joinRoom(socketId, String(data.collectorId));
            }

            // Get previous bid count from this collector to determine round
            const [prevBids] = await pool.query<RowDataPacket[]>(
                `SELECT COUNT(*) as count FROM order_bids WHERE order_id = ? AND collector_id = ?`,
                [data.orderId, data.collectorId]
            );
            const round = ((prevBids as any)[0]?.count || 0) + 1;

            // Reject any previous active bids from this collector on this order
            await pool.execute(
                `UPDATE order_bids SET status = 'rejected' 
                 WHERE order_id = ? AND collector_id = ? AND status IN ('pending', 'countered')`,
                [data.orderId, data.collectorId]
            );

            const [insertResult] = await pool.execute<ResultSetHeader>(
                `INSERT INTO order_bids (order_id, collector_id, bid_amount, status, round, note)
                 VALUES (?, ?, ?, 'pending', ?, ?)`,
                [data.orderId, data.collectorId, data.bidAmount, round, data.note || null]
            );
            const bidId = (insertResult as ResultSetHeader).insertId;

            // Move order to 'bidding' status
            if (order.status === 'pending') {
                await pool.execute(`UPDATE orders SET status = 'bidding' WHERE id = ?`, [data.orderId]);
            }

            // Notify customer
            const [collectorRows] = await pool.query<RowDataPacket[]>(
                `SELECT username, phone FROM users WHERE id = ?`,
                [data.collectorId]
            );
            const collector = (collectorRows as any)[0];

            const bidNotification = {
                orderId: data.orderId,
                bidId,
                collectorId: data.collectorId,
                collectorName: collector?.username,
                collectorPhone: collector?.phone,
                bidAmount: data.bidAmount,
                round,
                note: data.note || null,
            };

            // WS + Push notification to customer
            sendToRoom(String(order.customerId), "newBidReceived", bidNotification);
            sendPushToUser(
                order.customerId,
                PushNotifications.bidReceived(collector?.username || 'A collector', data.bidAmount, data.orderId)
            ).catch(() => {});

            sendToSocket(socketId, "bidPlaced", {
                success: true,
                bidId,
                orderId: data.orderId,
                bidAmount: data.bidAmount,
            });

            console.log(`[Bid #${bidId}] Collector ${data.collectorId} bid PKR ${data.bidAmount} on Order #${data.orderId}`);
        } catch (error) {
            console.error("[placeBid] Error:", error);
            sendToSocket(message._socketId, "error", { message: `Bid failed: ${error}` });
        }
    });

    // ── Accept Bid ────────────────────────────────────────────
    /**
     * Event: acceptBid
     * From: Customer
     * Data: { orderId, bidId }
     *
     * Customer accepts a collector's bid. Order becomes 'accepted'.
     * All other bids are rejected.
     * finalPrice is set to the accepted bid amount.
     */
    on("acceptBid", async (message: any) => {
        try {
            const data = message.data || {};
            const socketId = message._socketId;

            const orderId = Number(data.orderId || data.order_id);
            const bidId = Number(data.bidId || data.bid_id);

            if (!orderId || !bidId) {
                return sendToSocket(socketId, "error", { message: "orderId and bidId required" });
            }

            const order = await getOrder(orderId);
            if (!order) return sendToSocket(socketId, "error", { message: "Order not found" });
            if (!['pending', 'bidding'].includes(order.status)) {
                return sendToSocket(socketId, "error", {
                    message: `Cannot accept bid on order with status: ${order.status}`
                });
            }

            // Fetch the target bid
            const [bidRows] = await pool.query<RowDataPacket[]>(
                `SELECT * FROM order_bids WHERE id = ? AND order_id = ?`,
                [bidId, orderId]
            );
            const bid = (bidRows as any)[0];
            if (!bid) return sendToSocket(socketId, "error", { message: "Bid not found" });
            if (!['pending', 'countered'].includes(bid.status)) {
                return sendToSocket(socketId, "error", { message: `Bid is no longer active (status: ${bid.status})` });
            }

            const finalPrice = Number(bid.bid_amount);
            const collectorId = bid.collector_id;

            // Accept this bid, reject all others on this order
            await pool.execute(
                `UPDATE order_bids SET status = 'accepted' WHERE id = ?`,
                [bidId]
            );
            await pool.execute(
                `UPDATE order_bids SET status = 'rejected' 
                 WHERE order_id = ? AND id != ? AND status IN ('pending', 'countered')`,
                [orderId, bidId]
            );

            // Update order
            await pool.execute(
                `UPDATE orders SET status = 'accepted', collectorId = ?, finalPrice = ? WHERE id = ?`,
                [collectorId, finalPrice, orderId]
            );

            // WS + Push to accepted collector
            const acceptedPayload = {
                orderId,
                bidId,
                finalPrice,
                message: 'Your bid was accepted! Head to the pickup location.',
                order: {
                    pickupLatitude: order.pickupLatitude,
                    pickupLongitude: order.pickupLongitude,
                    pickupAddress: order.pickupAddress,
                    approximateRaddiInKg: order.approximateRaddiInKg,
                }
            };
            sendToRoom(String(collectorId), "bidAccepted", acceptedPayload);
            sendPushToUser(collectorId, PushNotifications.bidAccepted(orderId, finalPrice)).catch(() => {});

            // Notify other collectors their bids were rejected
            await notifyOrderResolved(orderId, "bidRejected", {
                orderId,
                message: 'Another bid was accepted for this order.',
                except: collectorId,
            });

            sendToSocket(socketId, "bidAcceptConfirmed", {
                success: true,
                orderId,
                collectorId,
                finalPrice,
            });

            console.log(`[Order #${orderId}] Bid #${bidId} accepted — PKR ${finalPrice} — Collector #${collectorId}`);
        } catch (error) {
            console.error("[acceptBid] Error:", error);
            sendToSocket(message._socketId, "error", { message: `Accept bid failed: ${error}` });
        }
    });

    // ── Direct Accept Order (Collector accepts without bidding) ─
    /**
     * Event: acceptRaddiOrder / acceptOrder
     * From: Collector
     * Data: { orderId?, customerId, collectorId, price? }
     *
     * Directly assigns the collector to a pending order and updates status to 'accepted'.
     */
    const handleDirectAcceptOrder = async (message: any) => {
        try {
            const data = message.data || {};
            const socketId = message._socketId;

            let orderId = Number(data.orderId || data.order_id);
            const collectorId = Number(data.collectorId || data.userId || data.collector_id || data.user_id);
            const customerId = Number(data.customerId || data.customer_id);

            if (!collectorId) {
                return sendToSocket(socketId, "error", { message: "collectorId required to accept order" });
            }

            // If orderId was not passed, find latest pending order for this customer
            if (!orderId && customerId) {
                const [rows] = await pool.query<RowDataPacket[]>(
                    `SELECT id FROM orders WHERE customerId = ? AND status = 'pending' ORDER BY createdAt DESC LIMIT 1`,
                    [customerId]
                );
                orderId = (rows as any)[0]?.id;
            }

            if (!orderId) {
                return sendToSocket(socketId, "error", { message: "orderId required or no pending order found for customer" });
            }

            const order = await getOrder(orderId);
            if (!order) return sendToSocket(socketId, "error", { message: "Order not found" });
            if (!['pending', 'bidding'].includes(order.status)) {
                return sendToSocket(socketId, "error", { message: `Cannot accept order with status: ${order.status}` });
            }

            const finalPrice = Number(data.price || data.expectedPrice || order.expectedPrice || 0);

            // Update order in MySQL DB
            await pool.execute(
                `UPDATE orders SET status = 'accepted', collectorId = ?, finalPrice = ? WHERE id = ?`,
                [collectorId, finalPrice, orderId]
            );

            const acceptedPayload = {
                orderId,
                collectorId,
                customerId: order.customerId,
                finalPrice,
                status: 'accepted',
                message: 'Order accepted directly by collector.',
            };

            // Notify Customer
            sendToRoom(String(order.customerId), "bidAccepted", acceptedPayload);
            sendToRoom(String(order.customerId), "orderAccepted", acceptedPayload);

            // Notify Collector socket
            sendToSocket(socketId, "acceptOrderConfirmed", acceptedPayload);
            sendToSocket(socketId, "bidAcceptConfirmed", acceptedPayload);

            console.log(`[Order #${orderId}] Directly accepted by Collector #${collectorId} — Status: accepted`);
        } catch (error) {
            console.error("[handleDirectAcceptOrder] Error:", error);
            sendToSocket(message._socketId, "error", { message: `Direct accept failed: ${error}` });
        }
    };

    on("acceptRaddiOrder", handleDirectAcceptOrder);
    on("acceptOrder", handleDirectAcceptOrder);


    // ── Reject Bid ────────────────────────────────────────────
    /**
     * Event: rejectBid
     * From: Customer
     * Data: { orderId, bidId }
     */
    on("rejectBid", async (message: any) => {
        try {
            const data = message.data;
            const socketId = message._socketId;

            if (!data?.orderId || !data.bidId) {
                return sendToSocket(socketId, "error", { message: "orderId and bidId required" });
            }

            const [bidRows] = await pool.query<RowDataPacket[]>(
                `SELECT * FROM order_bids WHERE id = ? AND order_id = ?`,
                [data.bidId, data.orderId]
            );
            const bid = (bidRows as any)[0];
            if (!bid) return sendToSocket(socketId, "error", { message: "Bid not found" });

            await pool.execute(
                `UPDATE order_bids SET status = 'rejected' WHERE id = ?`,
                [data.bidId]
            );

            // Notify the collector their bid was rejected
            sendToRoom(String(bid.collector_id), "yourBidRejected", {
                orderId: data.orderId,
                bidId: data.bidId,
                message: 'Your bid was rejected by the customer.',
            });

            sendToSocket(socketId, "bidRejected", { success: true, bidId: data.bidId });
        } catch (error) {
            sendToSocket(message._socketId, "error", { message: `Reject bid failed: ${error}` });
        }
    });

    // ── Counter Bid ───────────────────────────────────────────
    /**
     * Event: counterBid
     * From: Customer
     * Data: { orderId, bidId, counterAmount }
     *
     * Customer proposes a different price. Bid status becomes 'countered'.
     * Collector is notified and can acceptCounter or rejectCounter.
     */
    on("counterBid", async (message: any) => {
        try {
            const data = message.data;
            const socketId = message._socketId;

            if (!data?.orderId || !data.bidId || !data.counterAmount || data.counterAmount <= 0) {
                return sendToSocket(socketId, "error", { message: "orderId, bidId, and counterAmount required" });
            }

            const [bidRows] = await pool.query<RowDataPacket[]>(
                `SELECT * FROM order_bids WHERE id = ? AND order_id = ?`,
                [data.bidId, data.orderId]
            );
            const bid = (bidRows as any)[0];
            if (!bid) return sendToSocket(socketId, "error", { message: "Bid not found" });
            if (!['pending', 'countered'].includes(bid.status)) {
                return sendToSocket(socketId, "error", { message: `Cannot counter a bid with status: ${bid.status}` });
            }

            const order = await getOrder(data.orderId);
            if (!order || !['pending', 'bidding'].includes(order.status)) {
                return sendToSocket(socketId, "error", { message: "Order is not in a biddable state" });
            }

            await pool.execute(
                `UPDATE order_bids SET status = 'countered', counter_amount = ? WHERE id = ?`,
                [data.counterAmount, data.bidId]
            );

            // Notify collector
            const [custRows] = await pool.query<RowDataPacket[]>(
                `SELECT username FROM users WHERE id = ?`,
                [order.customerId]
            );

            sendToRoom(String(bid.collector_id), "bidCountered", {
                orderId: data.orderId,
                bidId: data.bidId,
                originalBid: bid.bid_amount,
                counterAmount: data.counterAmount,
                customerName: (custRows as any)[0]?.username,
                message: `Customer countered your bid of PKR ${bid.bid_amount} with PKR ${data.counterAmount}`,
            });
            sendPushToUser(
                bid.collector_id,
                PushNotifications.counterBidReceived(data.counterAmount, data.orderId)
            ).catch(() => {});

            sendToSocket(socketId, "counterSent", {
                success: true,
                bidId: data.bidId,
                counterAmount: data.counterAmount
            });

            console.log(`[Order #${data.orderId}] Customer countered bid #${data.bidId}: PKR ${bid.bid_amount} → PKR ${data.counterAmount}`);
        } catch (error) {
            console.error("[counterBid] Error:", error);
            sendToSocket(message._socketId, "error", { message: `Counter bid failed: ${error}` });
        }
    });

    // ── Accept Counter ────────────────────────────────────────
    /**
     * Event: acceptCounter
     * From: Collector
     * Data: { orderId, bidId }
     *
     * Collector accepts the customer's counter price.
     * finalPrice is set to counter_amount. Order → 'accepted'.
     */
    on("acceptCounter", async (message: any) => {
        try {
            const data = message.data;
            const socketId = message._socketId;

            if (!data?.orderId || !data.bidId) {
                return sendToSocket(socketId, "error", { message: "orderId and bidId required" });
            }

            const [bidRows] = await pool.query<RowDataPacket[]>(
                `SELECT * FROM order_bids WHERE id = ? AND order_id = ?`,
                [data.bidId, data.orderId]
            );
            const bid = (bidRows as any)[0];
            if (!bid || bid.status !== 'countered') {
                return sendToSocket(socketId, "error", { message: "Bid not found or not in countered state" });
            }

            const order = await getOrder(data.orderId);
            if (!order) return sendToSocket(socketId, "error", { message: "Order not found" });

            const finalPrice = Number(bid.counter_amount);
            const collectorId = bid.collector_id;

            // Accept this bid (use counter price as final)
            await pool.execute(
                `UPDATE order_bids SET status = 'accepted', bid_amount = ? WHERE id = ?`,
                [finalPrice, data.bidId]
            );

            // Reject all other bids
            await pool.execute(
                `UPDATE order_bids SET status = 'rejected'
                 WHERE order_id = ? AND id != ? AND status IN ('pending', 'countered')`,
                [data.orderId, data.bidId]
            );

            // Update order
            await pool.execute(
                `UPDATE orders SET status = 'accepted', collectorId = ?, finalPrice = ? WHERE id = ?`,
                [collectorId, finalPrice, data.orderId]
            );

            // Notify customer
            const [collRows] = await pool.query<RowDataPacket[]>(
                `SELECT username, phone FROM users WHERE id = ?`,
                [collectorId]
            );
            sendToRoom(String(order.customerId), "counterAccepted", {
                orderId: data.orderId,
                bidId: data.bidId,
                finalPrice,
                collectorName: (collRows as any)[0]?.username,
                collectorPhone: (collRows as any)[0]?.phone,
                message: `Collector accepted your counter offer of PKR ${finalPrice}!`,
            });
            sendPushToUser(order.customerId, PushNotifications.bidAccepted(data.orderId, finalPrice)).catch(() => {});

            sendToSocket(socketId, "counterAcceptConfirmed", {
                success: true,
                orderId: data.orderId,
                finalPrice,
            });

            console.log(`[Order #${data.orderId}] Counter accepted by collector #${collectorId} — PKR ${finalPrice}`);
        } catch (error) {
            console.error("[acceptCounter] Error:", error);
            sendToSocket(message._socketId, "error", { message: `Accept counter failed: ${error}` });
        }
    });

    // ── Reject Counter ────────────────────────────────────────
    /**
     * Event: rejectCounter
     * From: Collector
     * Data: { orderId, bidId }
     *
     * Collector rejects the customer's counter. Bid returns to 'pending'
     * so the customer can counter again or the collector can re-bid.
     */
    on("rejectCounter", async (message: any) => {
        try {
            const data = message.data;
            const socketId = message._socketId;

            if (!data?.orderId || !data.bidId) {
                return sendToSocket(socketId, "error", { message: "orderId and bidId required" });
            }

            const [bidRows] = await pool.query<RowDataPacket[]>(
                `SELECT * FROM order_bids WHERE id = ? AND order_id = ?`,
                [data.bidId, data.orderId]
            );
            const bid = (bidRows as any)[0];
            if (!bid || bid.status !== 'countered') {
                return sendToSocket(socketId, "error", { message: "Bid not in countered state" });
            }

            // Reset bid to pending (keep counter_amount as reference)
            await pool.execute(
                `UPDATE order_bids SET status = 'pending' WHERE id = ?`,
                [data.bidId]
            );

            const order = await getOrder(data.orderId);
            if (order) {
                sendToRoom(String(order.customerId), "counterRejected", {
                    orderId: data.orderId,
                    bidId: data.bidId,
                    message: 'Collector rejected your counter offer. You can place another counter or accept their original bid.',
                    originalBid: bid.bid_amount,
                });
            }

            sendToSocket(socketId, "counterRejected", { success: true, bidId: data.bidId });
        } catch (error) {
            sendToSocket(message._socketId, "error", { message: `Reject counter failed: ${error}` });
        }
    });

    // ── Start Pickup ──────────────────────────────────────────
    /**
     * Event: startPickup
     * From: Collector
     * Data: { orderId, collectorId }
     *
     * Collector is en route to pickup location. Order → 'in_progress'.
     */
    on("startPickup", async (message: any) => {
        try {
            const data = message.data;
            const socketId = message._socketId;

            if (!data?.orderId || !data.collectorId) {
                return sendToSocket(socketId, "error", { message: "orderId and collectorId required" });
            }

            const order = await getOrder(data.orderId);
            if (!order) return sendToSocket(socketId, "error", { message: "Order not found" });
            if (order.status !== 'accepted') {
                return sendToSocket(socketId, "error", {
                    message: `Cannot start pickup for order with status: ${order.status}`
                });
            }
            if (order.collectorId !== data.collectorId) {
                return sendToSocket(socketId, "error", { message: "You are not the assigned collector" });
            }

            await pool.execute(
                `UPDATE orders SET status = 'in_progress' WHERE id = ?`,
                [data.orderId]
            );

            // WS + Push to customer
            sendToRoom(String(order.customerId), "collectorEnRoute", {
                orderId: data.orderId,
                collectorId: data.collectorId,
                message: 'Your collector is on the way! Be ready with your scrap.',
            });
            sendPushToUser(order.customerId, PushNotifications.collectorEnRoute(data.orderId)).catch(() => {});

            sendToSocket(socketId, "pickupStarted", { success: true, orderId: data.orderId });

            console.log(`[Order #${data.orderId}] Collector #${data.collectorId} started pickup — in_progress`);
        } catch (error) {
            console.error("[startPickup] Error:", error);
            sendToSocket(message._socketId, "error", { message: `Start pickup failed: ${error}` });
        }
    });

    // ── Complete Order ────────────────────────────────────────
    /**
     * Event: completeOrder
     * From: Collector
     * Data: { orderId, collectorId, actualRaddiInKg? }
     *
     * Collector marks order as complete.
     * Triggers ATOMIC wallet transfer: collector → customer for finalPrice.
     * Order → 'completed'.
     */
    on("completeOrder", async (message: any) => {
        try {
            const data = message.data || {};
            const socketId = message._socketId;

            const orderId = Number(data.orderId || data.order_id);
            const collectorId = Number(data.collectorId || data.userId || data.collector_id || data.user_id);
            const actualRaddiInKg = data.actualRaddiInKg || data.weight || data.raddiInKg ? Number(data.actualRaddiInKg || data.weight || data.raddiInKg) : null;

            if (!orderId) {
                return sendToSocket(socketId, "error", { message: "orderId required for completeOrder" });
            }

            const order = await getOrder(orderId);
            if (!order) return sendToSocket(socketId, "error", { message: "Order not found" });

            if (order.status === 'completed') {
                return sendToSocket(socketId, "orderCompletedConfirmed", {
                    success: true,
                    orderId,
                    finalPrice: order.finalPrice || 0,
                    message: `Order #${orderId} is already completed.`
                });
            }

            // Auto-assign collectorId if missing
            const activeCollectorId = collectorId || Number(order.collectorId);
            if (activeCollectorId && !order.collectorId) {
                await pool.execute(`UPDATE orders SET collectorId = ? WHERE id = ?`, [activeCollectorId, orderId]);
            }

            // Auto-infer finalPrice if missing
            let finalPrice = Number(order.finalPrice || 0);
            if (!finalPrice || finalPrice <= 0) {
                // Try fetching latest bid from order_bids
                const [bids] = await pool.query<RowDataPacket[]>(
                    `SELECT bid_amount FROM order_bids WHERE order_id = ? ORDER BY id DESC LIMIT 1`,
                    [orderId]
                );
                if ((bids as any[])[0]?.bid_amount) {
                    finalPrice = Number((bids as any)[0].bid_amount);
                } else if (order.expectedPrice) {
                    finalPrice = Number(order.expectedPrice);
                }
            }

            // ── Wallet Transfer (if finalPrice > 0 and activeCollectorId exists) ──
            let walletTransferred = false;
            let walletNote = "";

            if (finalPrice > 0 && activeCollectorId && Number(order.customerId)) {
                const transferResult = await internalWalletTransfer(
                    activeCollectorId,
                    Number(order.customerId),
                    finalPrice,
                    orderId,
                    `Scrap payment for Order #${orderId}`
                );

                if (transferResult.success) {
                    walletTransferred = true;
                    walletNote = `PKR ${finalPrice} scrap payment processed.`;
                } else {
                    console.warn(`[Order #${orderId}] Wallet transfer note: ${transferResult.error}`);
                    walletNote = `Order completed. Wallet transfer notice: ${transferResult.error}`;
                }
            } else {
                walletNote = `Order completed successfully.`;
            }

            // Update order status in DB
            const updateData: any[] = ['completed', finalPrice];
            let updateSql = `UPDATE orders SET status = ?, finalPrice = ?`;
            if (activeCollectorId) {
                updateSql += `, collectorId = ?`;
                updateData.push(activeCollectorId);
            }
            if (actualRaddiInKg && !isNaN(actualRaddiInKg)) {
                updateSql += `, approximateRaddiInKg = ?`;
                updateData.push(actualRaddiInKg);
            }
            updateSql += ` WHERE id = ?`;
            updateData.push(orderId);
            await pool.execute(updateSql, updateData);

            const completionPayload = {
                success: true,
                orderId,
                finalPrice,
                walletTransferred,
                message: `Order #${orderId} completed! ${walletNote}`,
            };

            // Broadcast to Customer (WS + Push)
            if (order.customerId) {
                sendToRoom(String(order.customerId), "orderCompleted", completionPayload);
                sendToRoom(String(order.customerId), "order_completed", completionPayload);
                sendPushToUser(
                    Number(order.customerId),
                    PushNotifications.orderCompleted(finalPrice, orderId)
                ).catch(() => {});
            }

            // Broadcast to Collector (WS + Push)
            if (activeCollectorId) {
                sendToRoom(String(activeCollectorId), "orderCompleted", completionPayload);
                sendToRoom(String(activeCollectorId), "order_completed", completionPayload);
                sendToRoom(String(activeCollectorId), "orderCompletedConfirmed", completionPayload);
            }

            sendToSocket(socketId, "orderCompletedConfirmed", completionPayload);
            sendToSocket(socketId, "completeOrderConfirmed", completionPayload);

            console.log(`[Order #${orderId}] Completed successfully — status set to completed in DB!`);
        } catch (error: any) {
            console.error("[completeOrder] Error:", error);
            sendToSocket(message._socketId, "error", { message: `Complete order failed: ${error.message}` });
        }
    });



    // ── Cancel Order ──────────────────────────────────────────
    /**
     * Event: cancelOrder  
     * From: Customer
     * Data: { orderId, customerId, reason? }
     *
     * Customer cancels order. Rejects all pending bids.
     * Not allowed once order is in_progress or completed.
     */
    on("cancelOrder", async (message: any) => {
        try {
            const data = message.data;
            const socketId = message._socketId;

            if (!data?.orderId || !data.customerId) {
                return sendToSocket(socketId, "error", { message: "orderId and customerId required" });
            }

            const order = await getOrder(data.orderId);
            if (!order) return sendToSocket(socketId, "error", { message: "Order not found" });
            if (order.customerId !== data.customerId) {
                return sendToSocket(socketId, "error", { message: "You can only cancel your own orders" });
            }
            if (['in_progress', 'completed', 'cancelled'].includes(order.status)) {
                return sendToSocket(socketId, "error", {
                    message: `Cannot cancel order with status: ${order.status}`
                });
            }

            await pool.execute(
                `UPDATE orders SET status = 'cancelled', cancelReason = ? WHERE id = ?`,
                [data.reason || 'Cancelled by customer', data.orderId]
            );

            // Reject all active bids
            await pool.execute(
                `UPDATE order_bids SET status = 'rejected' 
                 WHERE order_id = ? AND status IN ('pending', 'countered')`,
                [data.orderId]
            );

            // WS + Push to all bidding collectors
            await notifyOrderResolved(data.orderId, "orderCancelled", {
                orderId: data.orderId,
                message: 'This order has been cancelled by the customer.',
            });

            // Push to all collectors who bid (they may be offline)
            const [bidCollectors] = await pool.query<RowDataPacket[]>(
                `SELECT DISTINCT collector_id FROM order_bids WHERE order_id = ?`,
                [data.orderId]
            );
            const collectorIds = (bidCollectors as any[]).map((r) => r.collector_id);
            if (collectorIds.length > 0) {
                sendPushToUsers(collectorIds, PushNotifications.orderCancelled(data.orderId)).catch(() => {});
            }

            sendToSocket(socketId, "orderCancelledConfirmed", { success: true, orderId: data.orderId });

            console.log(`[Order #${data.orderId}] Cancelled by customer #${data.customerId}`);
        } catch (error) {
            console.error("[cancelOrder] Error:", error);
            sendToSocket(message._socketId, "error", { message: `Cancel order failed: ${error}` });
        }
    });

    // ── Disconnect ────────────────────────────────────────────
    on("disconnect", (data) => {
        console.log(`[Rides] Client disconnected: ${data.socketId}`);
    });
};