import pool, { connectDB as connectSharedDB } from '../../packages/db/index';
import { userMigration } from './user.migration';

export async function connectDB(retries = 10, delay = 3000) {
  await connectSharedDB(retries, delay);
  await userMigration();
}

import type { Pool } from 'mysql2/promise';
export default pool as Pool;