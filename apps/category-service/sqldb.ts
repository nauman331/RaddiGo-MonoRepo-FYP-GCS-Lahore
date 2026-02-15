import mysql from 'mysql2/promise';
import { categoriesMigration } from './categories.migration';

// Create a connection without database to create the database first
const dbConfigWithoutDB = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL_MODE === "REQUIRED" ? { rejectUnauthorized: true } : undefined,
};

const dbConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL_MODE === "REQUIRED" ? { rejectUnauthorized: true } : undefined,
};

const pool = mysql.createPool(dbConfig);

export async function connectDB(retries = 10, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      // First connect without database and create it
      const tempConnection = await mysql.createConnection(dbConfigWithoutDB);
      await tempConnection.execute(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'raddigo'}\``);
      await tempConnection.end();

      // Test connection to the database
      const connection = await pool.getConnection();
      console.log("MySQL database connected successfully");
      connection.release();
      await categoriesMigration();
      return;
    } catch (error: any) {
      console.error(`Database connection failed (attempt ${i + 1}/${retries}):`, error.message || error);
      if (i < retries - 1) {
        await new Promise(res => setTimeout(res, delay));
      } else {
        throw error;
      }
    }
  }
}

export default pool;