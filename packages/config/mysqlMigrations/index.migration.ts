import { userMigration } from "../../../apps/auth-service/user.migration";
import { ordersMigration } from "../../../apps/order-service/orders.migration";
import { categoriesMigration } from "../../../apps/category-service/categories.migration";
import { chatsMigration } from "./chats.migration";

export async function runMigrations() {
  await userMigration();
  await categoriesMigration();
  await ordersMigration();
  await chatsMigration();
}