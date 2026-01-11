import { SQL } from "bun";
import { runMigrations } from "../../packages/config/mysqlMigrations/index.migration";
import { DB_CONFIG } from "@raddi/config";
// Create a connection without database to create the database first
const mysqlWithoutDB = new SQL({
  adapter: "mysql",
  hostname: DB_CONFIG.HOST,
  port: DB_CONFIG.PORT,
  username: DB_CONFIG.USER,
  password: DB_CONFIG.USER,
  ssl: DB_CONFIG.SSL_MODE === "REQUIRED" ? { rejectUnauthorized: true } : undefined,
});

const mysql = new SQL({
  adapter: "mysql",
  hostname: DB_CONFIG.HOST,
  port: DB_CONFIG.PORT,
  database: DB_CONFIG.NAME,
  username: DB_CONFIG.USER,
  password: DB_CONFIG.PASSWORD,
  ssl: DB_CONFIG.SSL_MODE === "REQUIRED" ? { rejectUnauthorized: true } : undefined,
});

export async function connectDB() {
  try {
    // First connect without database and create it
    await mysqlWithoutDB.connect();
    await mysqlWithoutDB`CREATE DATABASE IF NOT EXISTS ${mysqlWithoutDB.unsafe(DB_CONFIG.NAME)}`;
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