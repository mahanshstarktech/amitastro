import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/server';
import { createTestDatabase, TestDbContext } from '../helpers/testDb';
import { createUserFixture, createAdminFixture, createBirthProfileFixture } from '../helpers/factories';
import { generateAuthContextForUser } from '../helpers/authHelper';
import { subscriptionService } from '../../src/services/subscriptionService';
import { getOne, getAll } from '../../src/db/database';

describe('API: Family 360 Plan, Netflix-Style Autopay & Member Gating', () => {
  let dbCtx: TestDbContext;
  let regularUser: any;
  let familyUser: any;
  let admin: any;
  let regularAuth: any;
  let familyAuth: any;
  let adminAuth: any;

  beforeAll(async () => {
    dbCtx = await createTestDatabase();
    regularUser = await createUserFixture({ email: 'regular@example.com' });
    familyUser = await createUserFixture({ email: 'family.vip@example.com' });
    admin = await createAdminFixture({ email: 'admin.family@amitastro.com' });

    regularAuth = generateAuthContextForUser(regularUser);
    familyAuth = generateAuthContextForUser(familyUser);
    adminAuth = generateAuthContextForUser(admin);

    // Activate Family 360 Plan for familyUser
    await subscriptionService.activateFamilySubscription(familyUser.id, {
      amount: 100000,
      currency: 'INR',
      adminId: admin.id
    });
  });

  afterAll(async () => {
    await dbCtx.cleanup();
  });

  describe('GET /api/subscription/config', () => {
    it('returns configuration for Family 360 with international pricing', async () => {
      const res = await request(app).get('/api/subscription/config?country=US');
      expect(res.status).toBe(200);
      expect(res.body.planId).toBe('family-360');
      expect(res.body.currency).toBe('USD');
      expect(res.body.annualAmount).toBe(1200);
      expect(res.body.maxFamilyMembers).toBe(4);
      expect(Array.isArray(res.body.features)).toBe(true);
    });
  });

  describe('Family Member Profile Gating (Max 4 Members)', () => {
    it('blocks regular non-subscriber from adding non-self family profile with 403', async () => {
      const res = await request(app)
        .post('/api/profiles')
        .set('Authorization', regularAuth.authHeader.Authorization)
        .send({
          fullName: 'Spouse Name',
          relation: 'spouse',
          dob: '1994-06-12',
          pob: 'Delhi'
        });

      expect(res.status).toBe(403);
      expect(res.body.requiresFamilyPlan).toBe(true);
      expect(res.body.error).toContain('Family 360 subscribers');
    });

    it('allows Family 360 subscriber to add up to 4 family members', async () => {
      const relations = ['spouse', 'child', 'father', 'mother'];

      for (let i = 0; i < 4; i++) {
        const res = await request(app)
          .post('/api/profiles')
          .set('Authorization', familyAuth.authHeader.Authorization)
          .send({
            fullName: `Family Member ${i + 1}`,
            relation: relations[i],
            dob: `199${i}-01-01`,
            pob: 'Jaipur'
          });

        expect(res.status).toBe(201);
        expect(res.body.profile.relation).toBe(relations[i]);
      }

      const totalProfiles = await getAll<any>('SELECT * FROM birth_profiles WHERE user_id = ?', [familyUser.id]);
      expect(totalProfiles.length).toBe(4);
    });

    it('rejects adding a 5th family member when max 4 limit is reached with 400', async () => {
      const res = await request(app)
        .post('/api/profiles')
        .set('Authorization', familyAuth.authHeader.Authorization)
        .send({
          fullName: 'Fifth Family Member',
          relation: 'child',
          dob: '2010-05-15',
          pob: 'Jaipur'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('maximum limit of 4 family members');
    });
  });

  describe('Family 360 Zero-Fee Booking Bypass', () => {
    it('family subscriber booking generates auto-verified zero-fee pass', async () => {
      const profiles = await getAll<any>('SELECT * FROM birth_profiles WHERE user_id = ? LIMIT 1', [familyUser.id]);

      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', familyAuth.authHeader.Authorization)
        .send({
          birthProfileId: profiles[0].id,
          packageId: 'pkg-family-360',
          consultationType: 'call',
          requestedDate: '2026-11-20',
          requestedTimeWindow: '11:00 AM - 01:00 PM',
          timezoneUser: 'Asia/Kolkata',
          customerNotes: 'VIP consultation'
        });

      expect(res.status).toBe(201);
      expect(res.body.appointment).toBeDefined();

      // Verify payment table has auto-verified zero-amount record with FAMILY-360-PASS
      const payment = await getOne<any>('SELECT * FROM payments WHERE appointment_id = ?', [res.body.appointment.id]);
      expect(payment).toBeDefined();
      expect(payment.amount).toBe(0);
      expect(payment.status).toBe('Verified');
      expect(payment.utr_reference).toBe('FAMILY-360-PASS');
    });
  });

  describe('Netflix-Style Autopay Controls', () => {
    it('toggles autopay on/off (/api/subscription/autopay)', async () => {
      // Turn off autopay
      const offRes = await request(app)
        .patch('/api/subscription/autopay')
        .set('Authorization', familyAuth.authHeader.Authorization)
        .send({ autopay: false });

      expect(offRes.status).toBe(200);
      expect(offRes.body.autopayEnabled).toBe(false);

      // Turn on autopay
      const onRes = await request(app)
        .patch('/api/subscription/autopay')
        .set('Authorization', familyAuth.authHeader.Authorization)
        .send({ autopay: true });

      expect(onRes.status).toBe(200);
      expect(onRes.body.autopayEnabled).toBe(true);
    });

    it('cancels and resumes subscription', async () => {
      // Cancel
      const cancelRes = await request(app)
        .post('/api/subscription/cancel')
        .set('Authorization', familyAuth.authHeader.Authorization)
        .send({ reason: 'Temporarily pausing' });

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.message).toContain('cancelled');

      // Resume
      const resumeRes = await request(app)
        .post('/api/subscription/resume')
        .set('Authorization', familyAuth.authHeader.Authorization);

      expect(resumeRes.status).toBe(200);
      expect(resumeRes.body.message).toContain('resumed');
    });
  });
});
