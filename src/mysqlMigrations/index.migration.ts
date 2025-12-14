import { userMigration } from "./user.migration";
import { ordersMigration } from "./orders.migration";
import { categoriesMigration } from "./categories.migration";
import { chatsMigration } from "./chats.migration";

export async function runMigrations() {
  await userMigration();
  await categoriesMigration();
  await ordersMigration();
  await chatsMigration();
}