import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// 開発中はファイルを保存するたびにモジュールが読み直されるので、接続を使い回して増えすぎないようにする
const globalForDb = globalThis as unknown as { pool?: Pool };

const pool = globalForDb.pool ?? new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
if (process.env.NODE_ENV !== 'production') globalForDb.pool = pool;

export const db = drizzle({ client: pool, schema });
export { pool };
