import pool, { connectDB as connectSharedDB } from '../../packages/db/index';
import { categoriesMigration } from './categories.migration';

export async function connectDB(retries = 10, delay = 3000) {
  await connectSharedDB(retries, delay);
  await categoriesMigration();
}

export default pool;