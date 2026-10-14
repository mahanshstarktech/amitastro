import path from 'path';
import fs from 'fs';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { initDatabase, closeDatabase, setTestDatabase, runQuery } from '../../src/db/database';

export interface TestDbContext {
  dbPath: string;
  isPostgres: boolean;
  cleanup: () => Promise<void>;
}

/**
 * Creates an isolated ephemeral database for a test suite or test case.
 * Defaults to a temporary SQLite database file in os.tmpdir().
 * If TEST_PG_URL is set, can create an isolated PostgreSQL database schema.
 */
export async function createTestDatabase(options?: { usePostgres?: boolean }): Promise<TestDbContext> {
  const usePg = options?.usePostgres ?? Boolean(process.env.TEST_USE_POSTGRES === 'true');

  if (usePg) {
    const pgUrl = process.env.DATABASE_URL || 'postgres://localhost:5432/amitastro_test';
    await setTestDatabase({ url: pgUrl });
    await initDatabase();

    return {
      dbPath: pgUrl,
      isPostgres: true,
      cleanup: async () => {
        // Truncate/clean tables for next run
        const tables = [
          'analytics_events', 'followup_messages', 'audit_logs', 'otps', 'broadcasts',
          'customer_crm_meta', 'blackout_dates', 'availability_rules', 'chat_messages',
          'chat_conversations', 'blog_posts', 'categories', 'subscriptions', 'payments',
          'appointments', 'packages', 'birth_profiles', 'users'
        ];
        for (const t of tables) {
          try {
            await runQuery(`TRUNCATE TABLE ${t} CASCADE`);
          } catch (_) {}
        }
        await closeDatabase();
      }
    };
  }

  // SQLite temporary file
  const tempDir = path.join(os.tmpdir(), 'amitastro-tests');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  const dbPath = path.join(tempDir, `test-${uuidv4()}.db`);

  await setTestDatabase({ path: dbPath });
  await initDatabase();

  return {
    dbPath,
    isPostgres: false,
    cleanup: async () => {
      await closeDatabase();
      try {
        if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
        if (fs.existsSync(`${dbPath}-wal`)) fs.unlinkSync(`${dbPath}-wal`);
        if (fs.existsSync(`${dbPath}-shm`)) fs.unlinkSync(`${dbPath}-shm`);
      } catch (_) {}
    }
  };
}
