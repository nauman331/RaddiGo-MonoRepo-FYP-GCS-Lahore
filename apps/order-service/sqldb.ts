import mysql from 'mysql2/promise';
import { runMigrations } from "../../packages/config/mysqlMigrations/index.migration";

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

export async function connectDB() {
  try {
    // First connect without database and create it
    const tempConnection = await mysql.createConnection(dbConfigWithoutDB);
    await tempConnection.execute(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'raddigo'}\``);
    await tempConnection.end();

    // Test connection to the database
    const connection = await pool.getConnection();
    console.log("MySQL database connected successfully");
    connection.release();
    await runMigrations();
  } catch (error) {
    console.error("Database connection failed:", error);
    throw error;
  }
}

export default pool;