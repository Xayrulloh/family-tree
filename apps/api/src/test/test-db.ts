import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '~/database/schema';

let _db: NodePgDatabase<typeof schema> | undefined;
let _pool: Pool | undefined;

export function getTestDb(): NodePgDatabase<typeof schema> {
  if (!_db) {
    _pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });

    _pool.on('error', (err: Error & { code?: string }) => {
      // Suppress expected connection errors when the test container stops during teardown
      if (err.code !== 'ECONNRESET' && !/terminated/i.test(err.message)) {
        console.error('[test-db] unexpected pool error:', err);
      }
    });

    _db = drizzle(_pool, { schema });
  }

  return _db;
}

export async function closeTestDb(): Promise<void> {
  if (_pool) {
    await _pool.end();

    _pool = undefined;
    _db = undefined;
  }
}

export async function truncateTables(): Promise<void> {
  getTestDb();

  const pool = _pool;

  if (!pool) throw new Error('Test DB not initialized');

  await pool.query(`
    TRUNCATE TABLE
      notification_reads,
      notifications,
      fcm_tokens,
      family_tree_member_connections,
      family_tree_members,
      shared_family_trees,
      family_trees,
      users
    CASCADE
  `);
}
