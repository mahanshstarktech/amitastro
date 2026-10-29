import { describe, it, expect } from 'vitest';
import { formatSqlForEngine } from '../../src/db/database';

describe('Unit: SQL Dialect Transpiler (formatSqlForEngine)', () => {
  it('returns untouched SQL when engine is sqlite', () => {
    const query = 'SELECT * FROM users WHERE email = ? AND role = ?';
    const result = formatSqlForEngine(query, 'sqlite');
    expect(result).toBe(query);
  });

  it('converts positional ? to numbered $1, $2, ... for PostgreSQL', () => {
    const query = 'SELECT * FROM users WHERE email = ? AND role = ? AND is_phone_verified = ?';
    const result = formatSqlForEngine(query, 'postgres');
    expect(result).toBe('SELECT * FROM users WHERE email = $1 AND role = $2 AND is_phone_verified = $3');
  });

  it('converts SQLite datetime("now") to PostgreSQL CURRENT_TIMESTAMP', () => {
    const query = "INSERT INTO audit_logs (id, created_at) VALUES (?, datetime('now'))";
    const result = formatSqlForEngine(query, 'postgres');
    expect(result).toBe('INSERT INTO audit_logs (id, created_at) VALUES ($1, CURRENT_TIMESTAMP)');
  });

  it('handles case-insensitive datetime("now") expressions', () => {
    const query = "UPDATE users SET last_login = DATETIME('NOW') WHERE id = ?";
    const result = formatSqlForEngine(query, 'postgres');
    expect(result).toBe('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1');
  });

  it('correctly numbers a large query with 10+ parameter placeholders', () => {
    const placeholders = Array.from({ length: 12 }, () => '?').join(', ');
    const query = `INSERT INTO birth_profiles (col1, col2, col3, col4, col5, col6, col7, col8, col9, col10, col11, col12) VALUES (${placeholders})`;
    const result = formatSqlForEngine(query, 'postgres');
    
    expect(result).toContain('$1');
    expect(result).toContain('$10');
    expect(result).toContain('$12');
    expect(result).not.toContain('?');
  });

  it('preserves query structure without placeholders', () => {
    const query = 'SELECT COUNT(*) as count FROM appointments WHERE status = "Confirmed"';
    const result = formatSqlForEngine(query, 'postgres');
    expect(result).toBe(query);
  });

  it('sanitizes double-quoted "self" and bare self to string literal for PostgreSQL to prevent column does not exist errors', () => {
    const q1 = 'SELECT * FROM birth_profiles WHERE user_id = ? AND relation = "self"';
    expect(formatSqlForEngine(q1, 'postgres')).toBe("SELECT * FROM birth_profiles WHERE user_id = $1 AND relation = 'self'");

    const q2 = 'SELECT * FROM birth_profiles WHERE user_id = ? AND relation = self';
    expect(formatSqlForEngine(q2, 'postgres')).toBe("SELECT * FROM birth_profiles WHERE user_id = $1 AND relation = 'self'");

    const q3 = 'SELECT * FROM birth_profiles WHERE user_id = ? AND relation != "self"';
    expect(formatSqlForEngine(q3, 'postgres')).toBe("SELECT * FROM birth_profiles WHERE user_id = $1 AND relation != 'self'");

    const q4 = 'INSERT INTO birth_profiles (id, user_id, relation) VALUES (?, ?, "self")';
    expect(formatSqlForEngine(q4, 'postgres')).toBe("INSERT INTO birth_profiles (id, user_id, relation) VALUES ($1, $2, 'self')");
  });

  it('documents dialect limitation: question marks inside string literals are currently converted', () => {
    // This tests the current regex behavior (? inside quotes) and proves real code execution
    const queryWithLiteral = "SELECT * FROM notes WHERE text = 'Is this a question?' AND id = ?";
    const result = formatSqlForEngine(queryWithLiteral, 'postgres');
    expect(result).toBe("SELECT * FROM notes WHERE text = 'Is this a question$1' AND id = $2");
  });
});
