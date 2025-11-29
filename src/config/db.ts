import mysql from "mysql2/promise";

let pool: mysql.Pool | null = null;

export const connectDB = () => {
    try {
        if (!pool) {
            pool = mysql.createPool({
                host: process.env.DB_HOST,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME,
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0,
                enableKeepAlive: true,
                keepAliveInitialDelay: 0
            });
        }
        return pool;
    } catch (error) {
        console.error("Database connection error:", error);
        process.exit(1);
    }
};

export const closeDB = async () => {
    if (pool) {
        await pool.end();
        pool = null;
    }
};