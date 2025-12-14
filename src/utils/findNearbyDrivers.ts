import redis from "../config/redis";

export async function NearbyDrivers(latitude: number, longitude: number, radiusInKm: number) {
    const earthRadiusInKm = 6371;
    const radiusInDegrees = radiusInKm / earthRadiusInKm * (180 / Math.PI);

    const minLat = latitude - radiusInDegrees;
    const maxLat = latitude + radiusInDegrees;
    const minLon = longitude - radiusInDegrees / Math.cos(latitude * (Math.PI / 180));
    const maxLon = longitude + radiusInDegrees / Math.cos(latitude * (Math.PI / 180));

    // Add return statement here
    return await redis.keys("driver:*:location").then(async (keys) => {
        const nearbyDrivers: Array<{ driverId: string; latitude: number; longitude: number; distance: number }> = [];
        for (const key of keys) {
            const driverId = key.split(":")[1];
            const locationData = await redis.get(key);
            if (locationData && driverId) {
                const { latitude: driverLat, longitude: driverLon } = JSON.parse(locationData);
                if (driverLat >= minLat && driverLat <= maxLat && driverLon >= minLon && driverLon <= maxLon) {
                    const distance = Math.sqrt(Math.pow(driverLat - latitude, 2) + Math.pow(driverLon - longitude, 2)) * earthRadiusInKm * (Math.PI / 180);
                    nearbyDrivers.push({ driverId, latitude: driverLat, longitude: driverLon, distance });
                }
            }
        }
        return nearbyDrivers.sort((a, b) => a.distance - b.distance);
    });
}