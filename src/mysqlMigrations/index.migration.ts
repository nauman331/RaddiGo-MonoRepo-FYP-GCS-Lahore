import { userMigration } from "./user.migration";
import { adsMigration } from "./ads.migration";
import { categoriesMigration } from "./categories.migration";
import { chatsMigration } from "./chats.migration";

export async function runMigrations() {
  await userMigration();
  await categoriesMigration();
  await adsMigration();
  await chatsMigration();
}