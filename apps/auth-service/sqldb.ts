import mysql from 'mysql2/promise';
import { userMigration } from "./user.migration";
import { DB_CONFIG } from "@raddi/config";
// Create a connection without database to create the database first
const dbConfigWithoutDB = {
  host: DB_CONFIG.HOST,
  port: DB_CONFIG.PORT,
  user: DB_CONFIG.USER,
  password: DB_CONFIG.PASSWORD,
  ssl: DB_CONFIG.SSL_MODE === "REQUIRED" ? { rejectUnauthorized: true } : undefined,
};

const dbConfig = {
  host: DB_CONFIG.HOST,
  port: DB_CONFIG.PORT,
  database: DB_CONFIG.NAME,
  user: DB_CONFIG.USER,
  password: DB_CONFIG.PASSWORD,
  ssl: DB_CONFIG.SSL_MODE === "REQUIRED" ? { rejectUnauthorized: true } : undefined,
};

const pool = mysql.createPool(dbConfig);

export async function connectDB() {
  try {
    // First connect without database and create it
    const tempConnection = await mysql.createConnection(dbConfigWithoutDB);
    await tempConnection.execute(`CREATE DATABASE IF NOT EXISTS \`${DB_CONFIG.NAME}\``);
    await tempConnection.end();

    // Test connection to the database
    const connection = await pool.getConnection();
    console.log("MySQL database connected successfully");
    connection.release();
    await userMigration();
  } catch (error) {
    console.error("Database connection failed:", error);
    throw error;
  }
}

import type { Pool } from 'mysql2/promise';
export default pool as Pool;