export const PORTS = {
    GATEWAY: Number(process.env.GATEWAY_PORT) || 3000,
    AUTH: Number(process.env.AUTH_PORT) || 3001,
    CATEGORY: Number(process.env.CATEGORY_PORT) || 3002,
    ORDER: Number(process.env.ORDER_PORT) || 5000
};

export const API_URL = `http://localhost:${PORTS.GATEWAY}`;