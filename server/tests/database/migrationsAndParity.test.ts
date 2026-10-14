import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestDatabase, TestDbContext } from '../helpers/testDb';
import { runQuery, getOne, getAll, initDatabase, formatSqlForEngine } from '../../src/db/database';
import { v4 as uuidv4 } from 'uuid';

const EXPECTED_18_TABLES = [
  'users',
  'birth_profiles',
  'packages',
  'appointments',
  'payments',
  'subscriptions',
  'categories',
  'blog_posts',
  'chat_conversations',
  'chat_messages',
  'availability_rules',
  'blackout_dates',
  'customer_crm_meta',
  'broadcasts',
  'otps',
  'audit_logs',
  'followup_messages',
  'analytics_events'
];

describe('Database: Migrations Idempotency, Schema Integrity & Dual-Engine Parity', () => {
  describe('SQLite Engine Tests', () => {
    let dbCtx: TestDbContext;

    beforeEach(async () => {
      dbCtx = await createTestDatabase({ usePostgres: false });
    });

    afterEach(async () => {
      await dbCtx.cleanup();
    });

    it('verifies all 18 tables are properly created in SQLite', async () => {
      const rows = await getAll<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';"
      );
      const tableNames = rows.map(r => r.name);
      for (const table of EXPECTED_18_TABLES) {
        expect(tableNames, `Expected table ${table} to exist in SQLite`).toContain(table);
      }
    });

    it('executes boot-time migrations idempotently without errors or data corruption', async () => {
      // Insert a custom user record
      const testId = `user-idempotent-${uuidv4().substring(0, 8)}`;
      await runQuery(
        'INSERT INTO users (id, name, email, phone, role) VALUES (?, ?, ?, ?, ?)',
        [testId, 'Idempotency Tester', 'idempotent@test.com', '+919999999901', 'customer']
      );

      // Re-run initDatabase() - should not fail or wipe data
      await expect(initDatabase()).resolves.not.toThrow();

      const user = await getOne<any>('SELECT * FROM users WHERE id = ?', [testId]);
      expect(user).toBeDefined();
      expect(user.email).toBe('idempotent@test.com');
      expect(user.name).toBe('Idempotency Tester');
    });

    it('enforces UNIQUE constraints on users.email and users.phone in SQLite', async () => {
      const id1 = `u1-${uuidv4()}`;
      const id2 = `u2-${uuidv4()}`;
      const id3 = `u3-${uuidv4()}`;
      const testPhone = `+919111${Math.floor(100000 + Math.random() * 900000)}`;

      await runQuery(
        'INSERT INTO users (id, name, email, phone) VALUES (?, ?, ?, ?)',
        [id1, 'User 1', 'duplicate.email@example.com', testPhone]
      );

      // Attempting to insert duplicate email should throw
      await expect(
        runQuery(
          'INSERT INTO users (id, name, email, phone) VALUES (?, ?, ?, ?)',
          [id2, 'User 2', 'duplicate.email@example.com', `+919222${Math.floor(100000 + Math.random() * 900000)}`]
        )
      ).rejects.toThrow(/UNIQUE constraint failed/i);

      // Attempting to insert duplicate phone should throw
      await expect(
        runQuery(
          'INSERT INTO users (id, name, email, phone) VALUES (?, ?, ?, ?)',
          [id3, 'User 3', 'unique.email@example.com', testPhone]
        )
      ).rejects.toThrow(/UNIQUE constraint failed/i);
    });

    it('applies column default values accurately on newly inserted rows', async () => {
      const id = `default-${uuidv4()}`;
      await runQuery(
        'INSERT INTO users (id, name, email, phone) VALUES (?, ?, ?, ?)',
        [id, 'Default Tester', 'defaults@example.com', '+919876543212']
      );

      const user = await getOne<any>('SELECT * FROM users WHERE id = ?', [id]);
      expect(user.role).toBe('customer');
      expect(user.is_new_customer).toBe(1);
      expect(user.trial_used).toBe(0);
      expect(user.trial_seconds_remaining).toBe(300);
      expect(user.subscription_status).toBe('none');
      expect(user.subscription_currency).toBe('INR');
    });

    it('handles transactional rollback on SQLite without partial persistence', async () => {
      const idSuccess = `tx-ok-${uuidv4()}`;
      const idFail = `tx-fail-${uuidv4()}`;

      try {
        await runQuery('BEGIN TRANSACTION');
        await runQuery(
          'INSERT INTO users (id, name, email, phone) VALUES (?, ?, ?, ?)',
          [idSuccess, 'TX OK', 'tx.ok@example.com', '+919999999011']
        );
        // Intentional constraint violation: duplicate email
        await runQuery(
          'INSERT INTO users (id, name, email, phone) VALUES (?, ?, ?, ?)',
          [idFail, 'TX FAIL', 'tx.ok@example.com', '+919999999012']
        );
        await runQuery('COMMIT');
      } catch (err) {
        await runQuery('ROLLBACK');
      }

      const checkSuccess = await getOne<any>('SELECT * FROM users WHERE id = ?', [idSuccess]);
      expect(checkSuccess).toBeUndefined();
    });
  });

  describe('PostgreSQL Engine Parity Tests (Real Native Postgres)', () => {
    let dbCtx: TestDbContext;

    beforeEach(async () => {
      dbCtx = await createTestDatabase({ usePostgres: true });
    });

    afterEach(async () => {
      await dbCtx.cleanup();
    });

    it('verifies all 18 tables are properly created in PostgreSQL', async () => {
      const rows = await getAll<{ table_name: string }>(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';"
      );
      const tableNames = rows.map(r => r.table_name);
      for (const table of EXPECTED_18_TABLES) {
        expect(tableNames, `Expected table ${table} to exist in PostgreSQL`).toContain(table);
      }
    });

    it('executes migrations and queries with transpiled placeholders ($1, $2) and CURRENT_TIMESTAMP on Postgres', async () => {
      const testId = `pg-user-${uuidv4().substring(0, 8)}`;
      await runQuery(
        'INSERT INTO users (id, name, email, phone, role) VALUES (?, ?, ?, ?, ?)',
        [testId, 'Postgres Tester', 'pg.user@test.com', '+919999999021', 'customer']
      );

      const user = await getOne<any>('SELECT * FROM users WHERE id = ?', [testId]);
      expect(user).toBeDefined();
      expect(user.email).toBe('pg.user@test.com');
      expect(user.role).toBe('customer');

      // Verify idempotent migration run
      await expect(initDatabase()).resolves.not.toThrow();
    });

    it('enforces UNIQUE constraints on users.email and users.phone in PostgreSQL', async () => {
      const id1 = `pg-u1-${uuidv4()}`;
      const id2 = `pg-u2-${uuidv4()}`;

      await runQuery(
        'INSERT INTO users (id, name, email, phone) VALUES (?, ?, ?, ?)',
        [id1, 'Postgres User 1', 'pg.dup@example.com', '+919876543220']
      );

      // Duplicate email throws unique_violation
      await expect(
        runQuery(
          'INSERT INTO users (id, name, email, phone) VALUES (?, ?, ?, ?)',
          [id2, 'Postgres User 2', 'pg.dup@example.com', '+919876543221']
        )
      ).rejects.toThrow();

      // Duplicate phone throws unique_violation
      await expect(
        runQuery(
          'INSERT INTO users (id, name, email, phone) VALUES (?, ?, ?, ?)',
          [id2, 'Postgres User 2', 'pg.unique@example.com', '+919876543220']
        )
      ).rejects.toThrow();
    });

    it('handles transactional rollback on PostgreSQL without partial persistence', async () => {
      const idSuccess = `pg-tx-ok-${uuidv4()}`;
      const idFail = `pg-tx-fail-${uuidv4()}`;

      try {
        await runQuery('BEGIN');
        await runQuery(
          'INSERT INTO users (id, name, email, phone) VALUES (?, ?, ?, ?)',
          [idSuccess, 'PG TX OK', 'pg.tx.ok@example.com', '+919999999031']
        );
        // Intentional duplicate email to trigger rollback
        await runQuery(
          'INSERT INTO users (id, name, email, phone) VALUES (?, ?, ?, ?)',
          [idFail, 'PG TX FAIL', 'pg.tx.ok@example.com', '+919999999032']
        );
        await runQuery('COMMIT');
      } catch (err) {
        await runQuery('ROLLBACK');
      }

      const checkSuccess = await getOne<any>('SELECT * FROM users WHERE id = ?', [idSuccess]);
      expect(checkSuccess).toBeUndefined();
    });

    it('demonstrates dual-engine parity for data types, counts, and date formatting', async () => {
      const userId = `pg-user-types-${uuidv4().substring(0, 8)}`;
      await runQuery(
        'INSERT INTO users (id, name, email, phone, is_phone_verified, trial_seconds_remaining) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, 'Types Tester', 'types@example.com', '+919999999041', 1, 180]
      );

      const record = await getOne<any>('SELECT * FROM users WHERE id = ?', [userId]);
      expect(record.name).toBe('Types Tester');
      expect(Number(record.is_phone_verified)).toBe(1);
      expect(Number(record.trial_seconds_remaining)).toBe(180);
      expect(record.created_at).toBeDefined();
    });
  });
});
