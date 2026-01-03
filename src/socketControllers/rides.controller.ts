import { on, sendToSocket, sendToRoom } from "../config/socket";
import redis from "../config/redis";
import type { DriverLocation } from "../types/index";
import mysql from "../config/sqldb";
import { NearbyDrivers } from "../utils/findNearbyDrivers";

export const setupRidesController = () => {
    on("connection", (data) => {
        console.log(`Rides controller ready for: ${data.socketId}`);
    });

    on("driverLocationUpdate", async (message: any) => {
        try {
            const data: DriverLocation = message.data;
            const socketId = message._socketId;

            if (!data?.driverId || data.latitude === undefined || data.longitude === undefined) {
                return sendToSocket(socketId, "error", { message: "Invalid location data" });
            }

            await redis.setex(`driver:${data.driverId}:location`, 300, JSON.stringify({
                longitude: data.longitude,
                latitude: data.latitude,
                timestamp: Date.now()
            }));

            console.log(`Driver ${data.driverId} location updated: (${data.latitude}, ${data.longitude})`);
            sendToSocket(socketId, "locationUpdated", { success: true, driverId: data.driverId });
        } catch (error) {
            sendToSocket(message._socketId, "error", { message: `Error: ${error}` });
        }
    });

    on("makeRaddiOrder", async (message: any) => {
        try {
            const data = message.data;
            const socketId = message._socketId;
            const scheduleTime = new Date();
            if (data.pickupLatitude === undefined || data.pickupLongitude === undefined) {
                return sendToSocket(socketId, "error", { message: "Invalid order data" });
            }

            const nearbyDrivers = await NearbyDrivers(
                data.pickupLatitude,
                data.pickupLongitude,
                parseInt(process.env.RADIUS_KM || "5")
            );
            if (nearbyDrivers?.length > 0) {
                await mysql`
                INSERT INTO orders (customerId, pickupLatitude, pickupLongitude,
                status, pickupAddress, scheduleTime, approximateRaddiInKg)
                VALUES (${data.customerId}, 'null', ${data.pickupLatitude}, 
                ${data.pickupLongitude}, 'pending', ${data.pickupAddress}, 
                ${scheduleTime}, ${data.approximateRaddiInKg}   )
            `;
                nearbyDrivers.forEach((driver: any) => sendToRoom(driver.driverId, "newRideOrder", data));
                sendToSocket(socketId, "orderCreated", { success: true, driverCount: nearbyDrivers.length });
            } else {
                console.log("No nearby drivers found for new order.");
                sendToSocket(socketId, "orderCreated", { success: false, message: "No nearby drivers" });
            }
        } catch (error) {
            sendToSocket(message._socketId, "error", { message: `Error: ${error}` });
        }
    });

    on("acceptRaddiOrder", async (message: any) => {
        try {
            const data = message.data;
            const socketId = message._socketId;

            if (!data?.customerId || !data.collectorId) {
                console.log("Missing customer or collector id. Data:", JSON.stringify(data, null, 2));
                return sendToSocket(socketId, "error", { message: "Invalid data: Missing customerId or collectorId" });
            }

            // Validate that IDs are numbers
            const customerIdNum = parseInt(data.customerId);
            const collectorIdNum = parseInt(data.collectorId);

            if (isNaN(customerIdNum) || isNaN(collectorIdNum)) {
                console.log(`Invalid ID types - customerId: ${data.customerId} (${typeof data.customerId}), collectorId: ${data.collectorId} (${typeof data.collectorId})`);
                return sendToSocket(socketId, "error", { message: "Invalid data: customerId and collectorId must be numeric" });
            }

            await mysql`
                INSERT INTO orders (customerId, collectorId, pickupLatitude, pickupLongitude, 
                status, pickupAddress, scheduleTime, approximateRaddiInKg)
                VALUES (${customerIdNum}, ${collectorIdNum}, ${data.pickupLatitude}, 
                ${data.pickupLongitude}, 'accepted', ${data.pickupAddress}, ${data.scheduleTime}, 
                ${data.approximateRaddiInKg})
            `;

            sendToRoom(String(customerIdNum), "rideOrderAccepted", { collectorId: collectorIdNum, orderDetails: data });
            sendToSocket(socketId, "orderAccepted", { success: true });
        } catch (error) {
            console.error("Error accepting order:", error);
            sendToSocket(message._socketId, "error", { message: `Error: ${error}` });
        }
    });

    on("disconnect", (data) => {
        console.log(`Client disconnected from rides: ${data.socketId}`);
    });
};