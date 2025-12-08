import { SQL } from "bun";
import { runMigrations } from "../mysqlMigrations/index.migration";
const mysql = new SQL({
  adapter: "mysql",
  hostname: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

export async function connectDB() {
  try {
    await mysql.connect();
    console.log("MySQL database connected successfully");
    await runMigrations();
  } catch (error) {
    console.error("Database connection failed:", error);
    throw error;
  }
}

export default mysql;