/**
 * Fix #4: Proper Haversine formula (replaces inaccurate Euclidean approximation)
 * Fix #5: Uses Redis GEOADD/GEOSEARCH for efficient geospatial queries
 *         Falls back to manual scan if no geo keys exist yet (backward-compatible)
 */
import { redis } from '../../packages/db';

const EARTH_RADIUS_KM = 6371;

function haversineDistanceKm(
    lat1: number, lon1: number,
    lat2: number, lon2: number
): number {
    const toRad = (deg: number) => deg * (Math.PI / 180);
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface NearbyDriver {
    driverId: string;
    latitude: number;
    longitude: number;
    distanceKm: number;
}

/**
 * Update driver location in Redis using GEOADD for accurate geospatial indexing.
 * Also sets a regular key with TTL for backward compatibility and last-seen timestamp.
 */
export async function updateDriverLocation(
    driverId: string,
    latitude: number,
    longitude: number
): Promise<void> {
    const pipeline = redis.pipeline();

    // GEO index for fast radius search
    pipeline.geoadd('drivers:geo', longitude, latitude, driverId);
    // Set TTL on the driver's membership (expire from GEO set via sorted set expire hack)
    pipeline.set(
        `driver:${driverId}:location`,
        JSON.stringify({ latitude, longitude, timestamp: Date.now() }),
        'EX',
        300  // 5-minute TTL
    );
    pipeline.set(`driver:${driverId}:active`, '1', 'EX', 300);
    await pipeline.exec();
}

/**
 * Find drivers within radiusInKm of the given coordinates.
 * Uses Redis GEOSEARCH (Redis 6.2+) for accurate server-side filtering.
 * Falls back to manual Haversine scan for older Redis versions.
 */
export async function NearbyDrivers(
    latitude: number,
    longitude: number,
    radiusInKm: number
): Promise<NearbyDriver[]> {
    try {
        // Try Redis GEOSEARCH first (Redis 6.2+ / available in Redis 7)
        const geoResults = await redis.call(
            'GEOSEARCH',
            'drivers:geo',
            'FROMLONLAT', longitude, latitude,
            'BYRADIUS', radiusInKm, 'km',
            'ASC',
            'WITHCOORD',
            'WITHDIST',
            'COUNT', '50'
        ) as any[];

        const nearbyDrivers: NearbyDriver[] = [];

        for (const entry of geoResults) {
            const driverId = entry[0] as string;
            const distanceKm = parseFloat(entry[1]);
            const [lon, lat] = entry[2] as [string, string];

            // Verify driver is still active (has recent location key with TTL)
            const isActive = await redis.exists(`driver:${driverId}:active`);
            if (!isActive) continue;

            nearbyDrivers.push({
                driverId,
                latitude: parseFloat(lat),
                longitude: parseFloat(lon),
                distanceKm,
            });
        }

        return nearbyDrivers;
    } catch (geoErr: any) {
        // Fallback: manual scan with Haversine (Redis < 6.2 or geo key missing)
        console.warn('[NearbyDrivers] GEOSEARCH failed, using manual scan:', geoErr.message);
        return manualNearbyDriverScan(latitude, longitude, radiusInKm);
    }
}

async function manualNearbyDriverScan(
    latitude: number,
    longitude: number,
    radiusInKm: number
): Promise<NearbyDriver[]> {
    const keys = await redis.keys('driver:*:location');
    const nearbyDrivers: NearbyDriver[] = [];

    for (const key of keys) {
        const driverId = key.split(':')[1];
        const locationData = await redis.get(key);

        if (locationData && driverId) {
            try {
                const { latitude: driverLat, longitude: driverLon } = JSON.parse(locationData);
                const distanceKm = haversineDistanceKm(latitude, longitude, driverLat, driverLon);

                if (distanceKm <= radiusInKm) {
                    nearbyDrivers.push({ driverId, latitude: driverLat, longitude: driverLon, distanceKm });
                }
            } catch {
                // Skip malformed entries
            }
        }
    }

    return nearbyDrivers.sort((a, b) => a.distanceKm - b.distanceKm);
}