import pool from "../../db";
import { userMigration } from "../../db/migrations/user.migration";
import { ordersMigration } from "../../db/migrations/orders.migration";
import { categoriesMigration } from "../../db/migrations/categories.migration";
import { chatsMigration } from "./chats.migration";

export async function runMigrations() {
  await userMigration(pool);
  await categoriesMigration(pool);
  await ordersMigration(pool);
  await chatsMigration();
}