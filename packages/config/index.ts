import "./loadEnv"

export const PORTS = {
    GATEWAY: Number(process.env.GATEWAY_PORT),
    AUTH: Number(process.env.AUTH_PORT),
    CATEGORY: Number(process.env.CATEGORY_PORT),
    ORDER: Number(process.env.ORDER_PORT)
};

export const DB_CONFIG = {
    HOST: process.env.DB_HOST,
    PORT: Number(process.env.DB_PORT),
    USER: process.env.DB_USER,
    PASSWORD: process.env.DB_PASSWORD,
    NAME: process.env.DB_NAME,
    SSL_MODE: process.env.DB_SSL_MODE
};

export const API_URL = `http://localhost:${PORTS.GATEWAY}`;