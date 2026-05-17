import "./loadEnv"

export const PORTS = {
    GATEWAY: Number(process.env.GATEWAY_PORT),
    AUTH: Number(process.env.AUTH_PORT),
    CATEGORY: Number(process.env.CATEGORY_PORT),
    ORDER: Number(process.env.ORDER_PORT)
};

export const DB_CONFIG = {
    HOST: String(process.env.DB_HOST),
    PORT: Number(process.env.DB_PORT),
    USER: String(process.env.DB_USER),
    PASSWORD: String(process.env.DB_PASSWORD),
    NAME: String(process.env.DB_NAME),
    SSL_MODE: String(process.env.DB_SSL_MODE),
    REDIS_URL: String(process.env.REDIS_URL)
};

export const API_URL = `http://localhost`;

import { connectDB as connectSharedDB } from '../db/index';
import { connectRedis as connectSharedRedis } from '../db/redis';

export async function connectDB(retries = 10, delay = 3000) {
    await connectSharedDB(retries, delay);
}

export async function connectRedis(retries = 10, delay = 3000) {
    return connectSharedRedis(retries, delay);
}

export { default as pool } from '../db/index';
export { default as redis } from '../db/redis';