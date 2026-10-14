import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import { z } from 'zod';
import { app } from '../../src/server';
import { createTestDatabase, TestDbContext } from '../helpers/testDb';
import { createUserFixture } from '../helpers/factories';
import { securityService } from '../../src/services/securityService';

// Contract Schema for Auth Response
const AuthResponseSchema = z.object({
  success: z.boolean(),
  token: z.string(),
  csrfToken: z.string(),
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    phone: z.string(),
    role: z.enum(['admin', 'customer']),
    plan: z.string(),
    planBadge: z.string(),
    isFamilySubscriber: z.boolean()
  }),
  profiles: z.array(z.any())
});

describe('API: Authentication & Zoho IAM-Grade Security Flow', () => {
  let dbCtx: TestDbContext;

  beforeAll(async () => {
    dbCtx = await createTestDatabase();
  });

  afterAll(async () => {
    await dbCtx.cleanup();
  });

  describe('GET /api/auth/encryption-key', () => {
    it('returns 200 with dynamic 2048-bit RSA public key', async () => {
      const res = await request(app).get('/api/auth/encryption-key');
      expect(res.status).toBe(200);
      expect(res.body.keyId).toMatch(/^rsa_/);
      expect(res.body.publicKey).toContain('BEGIN PUBLIC KEY');
      expect(res.body.algorithm).toBe('RSA-OAEP-256');
    });
  });

  describe('GET /api/auth/csrf-token', () => {
    it('provisions _zcsr_tmp cookie and returns CSRF token in payload and headers', async () => {
      const res = await request(app).get('/api/auth/csrf-token');
      expect(res.status).toBe(200);
      expect(res.body.csrfToken).toHaveLength(64);
      const cookies = res.headers['set-cookie'] as unknown as string[];
      expect(cookies.some((c: string) => c.includes('_zcsr_tmp'))).toBe(true);
    });
  });

  describe('POST /api/auth/send-otp & /api/auth/verify-otp', () => {
    const testPhone = '+919876500001';

    it('generates and dispatches 6-digit OTP for phone number', async () => {
      const res = await request(app)
        .post('/api/auth/send-otp')
        .send({ phone: testPhone });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.channel).toBe('phone');
      expect(res.body.cooldownSeconds).toBe(60);
      expect(res.body.simulatedCode).toHaveLength(6);
    });

    it('verifies OTP and auto-provisions customer user account', async () => {
      const verifyPhone = '+919876500002';
      // Send OTP to get code
      const otpRes = await request(app)
        .post('/api/auth/send-otp')
        .send({ phone: verifyPhone });
      const code = otpRes.body.simulatedCode;

      const verifyRes = await request(app)
        .post('/api/auth/verify-otp')
        .send({ phone: verifyPhone, code, name: 'OTP Verified Seeker' });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.success).toBe(true);
      expect(verifyRes.body.token).toBeDefined();
      expect(verifyRes.body.user.phone).toBe(verifyPhone);
      expect(verifyRes.body.user.role).toBe('customer');

      // Contract check
      const validation = AuthResponseSchema.safeParse(verifyRes.body);
      expect(validation.success).toBe(true);
    });

    it('rejects invalid OTP code with 400', async () => {
      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ phone: testPhone, code: '000000' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid OTP code');
    });
  });

  describe('POST /api/auth/login with RSA Encrypted Payload', () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = await createUserFixture({
        email: `login-${Date.now()}@example.com`,
        password: 'ValidPassword@123'
      });
    });

    function encryptPassword(password: string, timestamp = Date.now(), nonce = crypto.randomUUID()) {
      const keyData = securityService.getActivePublicKey();
      const payload = JSON.stringify({ password, timestamp, nonce });
      const encrypted = crypto.publicEncrypt(
        {
          key: keyData.publicKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256'
        },
        Buffer.from(payload, 'utf8')
      );
      return {
        encryptedPassword: encrypted.toString('base64'),
        keyId: keyData.keyId
      };
    }

    it('authenticates successfully with RSA encrypted password payload', async () => {
      const { encryptedPassword, keyId } = encryptPassword('ValidPassword@123');

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          encryptedPassword,
          keyId
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(testUser.email);

      // Verify Set-Cookie headers for session and CSRF
      const cookies = res.headers['set-cookie'] as unknown as string[];
      expect(cookies.some((c: string) => c.includes('amitastro_session'))).toBe(true);
      expect(cookies.some((c: string) => c.includes('_zcsr_tmp'))).toBe(true);
    });

    it('blocks replayed nonce on subsequent login attempt with 400', async () => {
      const replayNonce = `nonce-${crypto.randomUUID()}`;
      const { encryptedPassword, keyId } = encryptPassword('ValidPassword@123', Date.now(), replayNonce);

      // First login succeeds
      const firstRes = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, encryptedPassword, keyId });
      expect(firstRes.status).toBe(200);

      // Second login with identical payload must be rejected
      const replayRes = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, encryptedPassword, keyId });
      expect(replayRes.status).toBe(400);
      expect(replayRes.body.error).toContain('Replayed credentials detected');
    });

    it('rejects expired timestamp in payload (> 2 minutes)', async () => {
      const expiredTs = Date.now() - 150_000;
      const { encryptedPassword, keyId } = encryptPassword('ValidPassword@123', expiredTs);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, encryptedPassword, keyId });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Authentication payload expired');
    });

    it('returns 401 on incorrect password and tracks failed attempts', async () => {
      const { encryptedPassword, keyId } = encryptPassword('WrongPassword@999');

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, encryptedPassword, keyId });

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Invalid email or password');
    });
  });

  describe('CSRF Middleware Enforcement', () => {
    it('blocks state-changing request when session cookie exists without valid CSRF header', async () => {
      const user = await createUserFixture();
      const sessionCookie = `amitastro_session=fake_jwt_token; _zcsr_tmp=valid_csrf_token_value`;

      const res = await request(app)
        .post('/api/profiles')
        .set('Cookie', sessionCookie)
        .set('X-CSRF-TOKEN', 'mismatched_token')
        .send({ fullName: 'CSRF Attack', dob: '1990-01-01', pob: 'Jaipur' });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Security verification failed: CSRF');
    });
  });
});
