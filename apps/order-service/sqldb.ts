import pool, { connectDB as connectSharedDB } from '../../packages/db/index';
import { runMigrations } from '../../packages/config/mysqlMigrations/index.migration';

export async function connectDB(retries = 10, delay = 3000) {
  await connectSharedDB(retries, delay);
  await runMigrations();
}

export default pool;