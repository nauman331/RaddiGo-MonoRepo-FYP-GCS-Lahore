import Redis from 'ioredis';
import '../config/loadEnv';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redis = new Redis(redisUrl);

export async function connectRedis(retries = 10, delay = 3000) {
    for (let i = 0; i < retries; i++) {
        try {
            await redis.ping();
            console.log('Redis connected successfully (shared)');
            console.log('Connected to:', redisUrl);
            return redis;
        } catch (error: any) {
            console.error(`Shared Redis connection failed (attempt ${i + 1}/${retries}):`, error.message || error);
            if (i < retries - 1) {
                await new Promise(res => setTimeout(res, delay));
            } else {
                throw error;
            }
        }
    }
}

export default redis;
