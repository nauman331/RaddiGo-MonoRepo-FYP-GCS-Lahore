import { SQL } from "bun";
import { runMigrations } from "../../packages/config/mysqlMigrations/index.migration";

// Create a connection without database to create the database first
const mysqlWithoutDB = new SQL({
  adapter: "mysql",
  hostname: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL_MODE === "REQUIRED" ? { rejectUnauthorized: true } : undefined,
});

const mysql = new SQL({
  adapter: "mysql",
  hostname: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL_MODE === "REQUIRED" ? { rejectUnauthorized: true } : undefined,
});

export async function connectDB() {
  try {
    // First connect without database and create it
    await mysqlWithoutDB.connect();
    await mysqlWithoutDB`CREATE DATABASE IF NOT EXISTS ${mysqlWithoutDB.unsafe(process.env.DB_NAME || 'raddigo')}`;
    await mysqlWithoutDB.close();

    // Now connect to the database
    await mysql.connect();
    console.log("MySQL database connected successfully");
    await runMigrations();
  } catch (error) {
    console.error("Database connection failed:", error);
    throw error;
  }
}

export default mysql;