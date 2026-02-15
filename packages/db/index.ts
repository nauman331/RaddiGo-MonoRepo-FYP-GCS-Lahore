import mysql from 'mysql2/promise';
import { DB_CONFIG } from '../config/index';

const dbConfigWithoutDB = {
    host: DB_CONFIG.HOST,
    port: DB_CONFIG.PORT,
    user: DB_CONFIG.USER,
    password: DB_CONFIG.PASSWORD,
    ssl: DB_CONFIG.SSL_MODE === 'REQUIRED' ? { rejectUnauthorized: true } : undefined,
};

const dbConfig = {
    host: DB_CONFIG.HOST,
    port: DB_CONFIG.PORT,
    database: DB_CONFIG.NAME,
    user: DB_CONFIG.USER,
    password: DB_CONFIG.PASSWORD,
    ssl: DB_CONFIG.SSL_MODE === 'REQUIRED' ? { rejectUnauthorized: true } : undefined,
};

const pool = mysql.createPool(dbConfig as any);

export async function connectDB(retries = 10, delay = 3000) {
    for (let i = 0; i < retries; i++) {
        try {
            const tempConnection = await mysql.createConnection(dbConfigWithoutDB as any);
            await tempConnection.execute(`CREATE DATABASE IF NOT EXISTS \`${DB_CONFIG.NAME}\``);
            await tempConnection.end();

            const connection = await pool.getConnection();
            console.log('MySQL database connected successfully (shared)');
            connection.release();
            return pool;
        } catch (error: any) {
            console.error(`Shared DB connection failed (attempt ${i + 1}/${retries}):`, error.message || error);
            if (i < retries - 1) {
                await new Promise(res => setTimeout(res, delay));
            } else {
                throw error;
            }
        }
    }
}

export default pool;
