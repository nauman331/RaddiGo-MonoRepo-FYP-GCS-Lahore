import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redis = new Redis(redisUrl);

export const connectRedis = async () => {
  try {
    await redis.ping();
    console.log('Redis connected successfully');
    console.log('Connected to:', redisUrl);
  } catch (error) {
    console.error('Redis connection failed:', error);
    throw error;
  }
}

export default redis;