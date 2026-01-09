import { RedisClient } from 'bun';

const redisUrl = process.env.REDIS_URL;

const redis = new RedisClient(redisUrl);

export const connectRedis = async () => {
  try {
    await redis.connect();
    console.log('Redis connected:', redis.connected);
    console.log('Connected to:', redisUrl);
  } catch (error) {
    console.error('Redis connection failed:', error);
    throw error;
  }
}

export default redis;