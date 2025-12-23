import { getIO } from "../config/socket";
import redis from "../config/redis";
import type { DriverLocation } from "../types/index";
import mysql from "../config/sqldb";
import { NearbyDrivers } from "../utils/findNearbyDrivers";

const parseData = (data: any) => typeof data === 'string' ? JSON.parse(data) : data;

export const setupRidesController = () => {
    const io = getIO();

    io.on("connection", (socket) => {
        console.log(`Client connected: ${socket.id}`);

        socket.on("driverLocationUpdate", async (rawData: any) => {
            try {
                const data: DriverLocation = parseData(rawData);
                if (!data?.driverId || data.latitude === undefined || data.longitude === undefined) {
                    return socket.emit("error", { message: "Invalid location data" });
                }

                await redis.setex(`driver:${data.driverId}:location`, 300, JSON.stringify({
                    longitude: data.longitude,
                    latitude: data.latitude,
                    timestamp: Date.now()
                }));

                console.log(`Driver ${data.driverId} location updated: (${data.latitude}, ${data.longitude})`);
                socket.emit("locationUpdated", { success: true, driverId: data.driverId });
            } catch (error) {
                socket.emit("error", { message: `Error: ${error}` });
            }
        });

        socket.on("makeRaddiOrder", async (rawData: any) => {
            try {
                const data = parseData(rawData);
                if (!data?.pickupLatitude || !data.pickupLongitude) {
                    return socket.emit("error", { message: "Invalid order data" });
                }

                const nearbyDrivers = await NearbyDrivers(
                    data.pickupLatitude,
                    data.pickupLongitude,
                    parseInt(process.env.RADIUS_KM || "5")
                );

                if (nearbyDrivers?.length) {
                    console.log(`Found ${nearbyDrivers.length} nearby drivers for new order.`);
                    nearbyDrivers.forEach((driver: any) => io.to(driver.driverId).emit("newRideOrder", data));
                    socket.emit("orderCreated", { success: true, driverCount: nearbyDrivers.length });
                } else {
                    console.log("No nearby drivers found for new order.");
                    socket.emit("orderCreated", { success: false, message: "No nearby drivers" });
                }
            } catch (error) {
                socket.emit("error", { message: `Error: ${error}` });
            }
        });

        socket.on("acceptRaddiOrder", async (rawData: any) => {
            try {
                console.log("Received acceptRaddiOrder event with data:", rawData);
                const data = parseData(rawData);

                if (!data?.customerId || !data.collectorId) {
                    console.log("Missing customer or collector id. Data:", JSON.stringify(data, null, 2));
                    return socket.emit("error", { message: "Invalid data: Missing customerId or collectorId" });
                }

                // Validate that IDs are numbers
                const customerIdNum = parseInt(data.customerId);
                const collectorIdNum = parseInt(data.collectorId);

                if (isNaN(customerIdNum) || isNaN(collectorIdNum)) {
                    console.log(`Invalid ID types - customerId: ${data.customerId} (${typeof data.customerId}), collectorId: ${data.collectorId} (${typeof data.collectorId})`);
                    return socket.emit("error", { message: "Invalid data: customerId and collectorId must be numeric" });
                }

                await mysql`
                    INSERT INTO orders (customerId, collectorId, pickupLatitude, pickupLongitude, 
                    status, pickupAddress, scheduleTime, approximateRaddiInKg)
                    VALUES (${customerIdNum}, ${collectorIdNum}, ${data.pickupLatitude}, 
                    ${data.pickupLongitude}, 'accepted', ${data.pickupAddress}, ${data.scheduleTime}, 
                    ${data.approximateRaddiInKg})
                `;

                console.log(`Order accepted - CollectorID: ${collectorIdNum}, CustomerID: ${customerIdNum}`);
                console.log("Order details:", JSON.stringify(data, null, 2));

                io.to(String(customerIdNum)).emit("rideOrderAccepted", { collectorId: collectorIdNum, orderDetails: data });
                socket.emit("orderAccepted", { success: true });
            } catch (error) {
                console.error("Error accepting order:", error);
                socket.emit("error", { message: `Error: ${error}` });
            }
        });

        socket.on("disconnect", () => console.log(`Client disconnected: ${socket.id}`));
    });
};