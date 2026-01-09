// import { userMigration } from "./user.migration";
// import { ordersMigration } from "./orders.migration";
import { categoriesMigration } from "../../../apps/category-service/categories.migration";
import { chatsMigration } from "./chats.migration";

export async function runMigrations() {
  // await userMigration();
  // await ordersMigration();
  await categoriesMigration();
  await chatsMigration();
}