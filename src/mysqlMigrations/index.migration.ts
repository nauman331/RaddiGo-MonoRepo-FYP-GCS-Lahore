import { userMigration } from "./user.migration";

export async function runMigrations() {
  await userMigration();
}