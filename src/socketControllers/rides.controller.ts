import { getIO } from "../config/socket";
import redis from "../config/redis";
import type { DriverLocation } from "../types/index";
import mysql from "../config/sqldb";
import { NearbyDrivers } from "../utils/findNearbyDrivers";

export const setupRidesController = () => {
    const io = getIO();

    io.on("connection", (socket) => {
        console.log(`Client connected: ${socket.id}`);

        //driver ki live location update krne keliye
        socket.on("driverLocationUpdate", async (data: DriverLocation) => {
            try {
                await redis.setex(
                    `driver:${data.driverId}:location`,
                    300,
                    JSON.stringify({
                        longitude: data.longitude,
                        latitude: data.latitude,
                        timestamp: Date.now()
                    })
                );
                return new Response(`Updated location for driver ${data.driverId}`, { status: 200 });
            } catch (error) {
                return new Response(`Error updating location: ${error}`, { status: 500 });
            }
        });



        //raddi ka order lagane keliye
        socket.on("makeRaddiOrder", async (data) => {
            try {
                const nearbyDrivers = await NearbyDrivers(data.pickupLatitude, data.pickupLongitude, process.env.RADIUS_KM ? parseInt(process.env.RADIUS_KM) : 5);
                if (Array.isArray(nearbyDrivers)) {
                    nearbyDrivers.forEach((driver: { driverId: string; latitude: number; longitude: number; distance: number }) => {
                        io.to(driver.driverId).emit("newRideOrder", data);
                    });
                }
                return new Response("Ride order sent to nearby drivers", { status: 200 });
            } catch (error) {
                return new Response(`Error sending ride order: ${error}`, { status: 500 });
            }
        });

        //driver order accept krne keliye
        socket.on("acceptRaddiOrder", async (data) => {
            try {
                await mysql`
                INSERT INRO orders WHERE
                  customerId = ${data.customerId},
                  collectorId = ${data.collectorId},
                  pickupLatitude = ${data.pickupLatitude},
                  pickupLongitude = ${data.pickupLongitude},
                  status = 'accepted',
                  pickupAddress = ${data.pickupAddress},
                  scheduleTime = ${data.scheduleTime},
                  approximateRaddiInKg = ${data.approximateRaddiInKg}
                `;
                io.to(data.customerId).emit("rideOrderAccepted", { collectorId: data.collectorId, orderDetails: data });
                return new Response("Ride order accepted", { status: 200 });
            } catch (error) {
                return new Response(`Error accepting ride order: ${error}`, { status: 500 });
            }
        })

        socket.on("disconnect", () => {
            console.log(`Client disconnected: ${socket.id}`);
        });
    });
};