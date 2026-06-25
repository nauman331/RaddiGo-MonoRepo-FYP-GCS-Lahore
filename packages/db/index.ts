import mysql from 'mysql2/promise';
import '../config/loadEnv';
import { userMigration } from './migrations/user.migration';
import { categoriesMigration } from './migrations/categories.migration';
import { ordersMigration } from './migrations/orders.migration';
import { walletMigration } from './migrations/wallet.migration';

const parseBool = (v?: string) => (v === 'true' ? true : v === 'false' ? false : undefined);

const buildSslConfig = () => {
    if (process.env.DB_SSL_MODE !== 'REQUIRED') return undefined;
    const rejectUnauthorized = parseBool(process.env.DB_SSL_REJECT_UNAUTHORIZED);
    return { rejectUnauthorized: rejectUnauthorized ?? false } as any;
};

const dbConfigWithoutDB = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    ssl: buildSslConfig(),
};

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    database: process.env.DB_NAME || 'raddigo',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    ssl: buildSslConfig(),
};

const pool = mysql.createPool(dbConfig as any);

async function runMigrations(poolInstance: any) {
    // run in dependency order: users -> categories -> orders
    await userMigration(poolInstance);
    await categoriesMigration(poolInstance);
    await ordersMigration(poolInstance);
    await walletMigration(poolInstance)
}

export async function connectDB(retries = 10, delay = 3000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const tempConnection = await mysql.createConnection(dbConfigWithoutDB as any);
            await tempConnection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
            await tempConnection.end();

            // verify pool can get a connection
            const conn = await pool.getConnection();
            conn.release();

            // run migrations once DB is available
            await runMigrations(pool);

            console.log('MySQL database connected and migrations applied');
            return pool;
        } catch (err: any) {
            console.error(`DB connect attempt ${attempt}/${retries} failed:`, err.message || err);
            if (attempt < retries) await new Promise((r) => setTimeout(r, delay));
            else throw err;
        }
    }
}

export default pool;

export { default as redis, connectRedis } from './redis';
