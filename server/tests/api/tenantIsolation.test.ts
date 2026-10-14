import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/server';
import { createTestDatabase, TestDbContext } from '../helpers/testDb';
import { createUserFixture, createAdminFixture, createBirthProfileFixture } from '../helpers/factories';
import { generateAuthContextForUser } from '../helpers/authHelper';

describe('API: Tenant Isolation (IDOR) & Role-Based Authorization', () => {
  let dbCtx: TestDbContext;
  let userA: any;
  let userB: any;
  let admin: any;
  let authA: any;
  let authB: any;
  let authAdmin: any;

  beforeAll(async () => {
    dbCtx = await createTestDatabase();
    userA = await createUserFixture({ email: `userA-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com` });
    userB = await createUserFixture({ email: `userB-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com` });
    admin = await createAdminFixture({ email: `admin-${Date.now()}-${Math.random().toString(36).substring(7)}@amitastro.com` });

    authA = generateAuthContextForUser(userA);
    authB = generateAuthContextForUser(userB);
    authAdmin = generateAuthContextForUser(admin);
  });

  afterAll(async () => {
    await dbCtx.cleanup();
  });

  describe('Birth Profile IDOR Protection', () => {
    it('prevents User B from modifying User A’s birth profile (returns 404/not authorized)', async () => {
      const profileA = await createBirthProfileFixture(userA.id, { fullName: 'User A Profile' });

      // User B attempts to overwrite User A's profile
      const res = await request(app)
        .put(`/api/profiles/${profileA.id}`)
        .set('Authorization', authB.authHeader.Authorization)
        .send({ fullName: 'Malicious Overwrite' });

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found');
    });

    it('prevents User B from deleting User A’s birth profile', async () => {
      const profileA = await createBirthProfileFixture(userA.id, { fullName: 'User A Delete Target' });

      const res = await request(app)
        .delete(`/api/profiles/${profileA.id}`)
        .set('Authorization', authB.authHeader.Authorization);

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found');
    });

    it('allows User A to modify and delete their own profile', async () => {
      const profileA = await createBirthProfileFixture(userA.id, { fullName: 'Original Name' });

      const updateRes = await request(app)
        .put(`/api/profiles/${profileA.id}`)
        .set('Authorization', authA.authHeader.Authorization)
        .send({ fullName: 'Updated Name', dob: '1992-05-10', pob: 'Mumbai' });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.profile.full_name).toBe('Updated Name');

      const deleteRes = await request(app)
        .delete(`/api/profiles/${profileA.id}`)
        .set('Authorization', authA.authHeader.Authorization);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.message).toContain('deleted');
    });
  });

  describe('Administrative Route Privilege Guarding', () => {
    it('blocks regular users from accessing /api/admin/dashboard with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', authA.authHeader.Authorization);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Administrator privileges required');
    });

    it('blocks regular users from accessing /api/admin/customers with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/admin/customers')
        .set('Authorization', authA.authHeader.Authorization);

      expect(res.status).toBe(403);
    });

    it('blocks regular users from accessing /api/payments/pending with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/payments/pending')
        .set('Authorization', authA.authHeader.Authorization);

      expect(res.status).toBe(403);
    });

    it('blocks regular users from accessing /api/chat/admin/inbox with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/chat/admin/inbox')
        .set('Authorization', authA.authHeader.Authorization);

      expect(res.status).toBe(403);
    });

    it('allows verified Admin to access administrative endpoints', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', authAdmin.authHeader.Authorization);

      expect(res.status).toBe(200);
      expect(res.body.metrics).toHaveProperty('todayConfirmed');
      expect(res.body.metrics).toHaveProperty('pendingPayments');
    });
  });

  describe('Unauthenticated Route Rejection', () => {
    it('rejects protected routes with 401 when no token is provided', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Authentication token required');
    });

    it('rejects protected routes with 403 when malformed or forged token is provided', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer forged_invalid_jwt_token');

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Invalid or expired authentication token');
    });
  });
});
