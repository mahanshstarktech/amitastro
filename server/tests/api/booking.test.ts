import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { z } from 'zod';
import { app } from '../../src/server';
import { createTestDatabase, TestDbContext } from '../helpers/testDb';
import { createUserFixture, createAdminFixture, createBirthProfileFixture } from '../helpers/factories';
import { generateAuthContextForUser } from '../helpers/authHelper';

const PackageSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  price: z.number(),
  duration_minutes: z.number(),
  includes: z.array(z.string())
});

describe('API: Consultation Booking Engine & Status State Machine', () => {
  let dbCtx: TestDbContext;
  let customer: any;
  let admin: any;
  let customerAuth: any;
  let adminAuth: any;
  let profile: any;
  let createdApptId: string;

  beforeAll(async () => {
    dbCtx = await createTestDatabase();
    customer = await createUserFixture({ email: 'seeker.booking@example.com' });
    admin = await createAdminFixture({ email: 'admin.booking@amitastro.com' });

    customerAuth = generateAuthContextForUser(customer);
    adminAuth = generateAuthContextForUser(admin);

    profile = await createBirthProfileFixture(customer.id, { fullName: 'Priya Seeker' });
  });

  afterAll(async () => {
    await dbCtx.cleanup();
  });

  describe('GET /api/packages', () => {
    it('returns available consultation packages matching contract', async () => {
      const res = await request(app).get('/api/packages');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.packages)).toBe(true);
      expect(res.body.packages.length).toBeGreaterThan(0);

      // Verify contract for standard packages
      for (const pkg of res.body.packages) {
        expect(PackageSchema.safeParse(pkg).success).toBe(true);
      }
    });
  });

  describe('GET /api/availability', () => {
    it('returns IST working windows and blackout dates', async () => {
      const res = await request(app).get('/api/availability');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('workingWindows');
      expect(res.body).toHaveProperty('blackoutDates');
      expect(res.body).toHaveProperty('timeWindows');
      expect(res.body.bufferMinutes).toBe(10);
    });
  });

  describe('POST /api/appointments & Status Transitions', () => {
    it('creates appointment request with initial Requested status', async () => {
      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', customerAuth.authHeader.Authorization)
        .send({
          birthProfileId: profile.id,
          packageId: 'pkg-premium',
          consultationType: 'call',
          requestedDate: '2026-11-15',
          requestedTimeWindow: '11:00 AM - 01:00 PM',
          timezoneUser: 'America/New_York',
          customerNotes: 'Transit analysis query'
        });

      expect(res.status).toBe(201);
      expect(res.body.appointment).toBeDefined();
      expect(res.body.appointment.status).toBe('Requested');
      expect(res.body.appointment.requested_date).toBe('2026-11-15');
      createdApptId = res.body.appointment.id;
    });

    it('rejects booking with missing parameters with 400', async () => {
      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', customerAuth.authHeader.Authorization)
        .send({ birthProfileId: profile.id }); // Missing packageId, date, etc.

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Missing required');
    });

    it('admin transitions appointment status through lifecycle: Requested -> Confirmed -> In Progress -> Completed', async () => {
      // 1. Confirmed
      const res1 = await request(app)
        .patch(`/api/appointments/${createdApptId}/status`)
        .set('Authorization', adminAuth.authHeader.Authorization)
        .send({ status: 'Confirmed' });
      expect(res1.status).toBe(200);
      expect(res1.body.appointment.status).toBe('Confirmed');

      // 2. In Progress
      const res2 = await request(app)
        .patch(`/api/appointments/${createdApptId}/status`)
        .set('Authorization', adminAuth.authHeader.Authorization)
        .send({ status: 'In Progress' });
      expect(res2.status).toBe(200);
      expect(res2.body.appointment.status).toBe('In Progress');

      // 3. Completed (activates follow-up chat)
      const res3 = await request(app)
        .patch(`/api/appointments/${createdApptId}/status`)
        .set('Authorization', adminAuth.authHeader.Authorization)
        .send({ status: 'Completed' });
      expect(res3.status).toBe(200);
      expect(res3.body.appointment.status).toBe('Completed');
    });

    it('rejects illegal status transition values with 400', async () => {
      const res = await request(app)
        .patch(`/api/appointments/${createdApptId}/status`)
        .set('Authorization', adminAuth.authHeader.Authorization)
        .send({ status: 'INVALID_STATUS' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid status');
    });
  });

  describe('Follow-up Messages (/api/appointments/:id/followup)', () => {
    it('customer and admin can send and retrieve post-consultation follow-up messages', async () => {
      // Customer sends follow-up on their own completed appointment
      const sendRes = await request(app)
        .post(`/api/appointments/${createdApptId}/followup`)
        .set('Authorization', customerAuth.authHeader.Authorization)
        .send({ content: 'Namaste Amit ji, should I wear the yellow sapphire on Thursday?' });

      expect(sendRes.status).toBe(201);
      expect(sendRes.body.success).toBe(true);

      // Fetch follow-ups
      const getRes = await request(app)
        .get(`/api/appointments/${createdApptId}/followup`)
        .set('Authorization', customerAuth.authHeader.Authorization);

      expect(getRes.status).toBe(200);
      expect(Array.isArray(getRes.body.messages)).toBe(true);
      expect(getRes.body.messages.some((m: any) => m.content.includes('yellow sapphire'))).toBe(true);
    });
  });
});
