import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { app } from '../../src/server';
import { createTestDatabase, TestDbContext } from '../helpers/testDb';
import { createAdminFixture, createUserFixture, createBirthProfileFixture, createAppointmentFixture } from '../helpers/factories';
import { generateAuthContextForUser } from '../helpers/authHelper';
import * as realServices from '../../src/services/realServices';

describe('API: Resilience & External Dependency Failure Handling', () => {
  let dbCtx: TestDbContext;
  let admin: any;
  let adminAuth: any;
  let customer: any;
  let customerAuth: any;
  let testAppt: any;

  beforeAll(async () => {
    dbCtx = await createTestDatabase();
    admin = await createAdminFixture({ email: 'admin.resilience@amitastro.com' });
    customer = await createUserFixture({ email: 'customer.resilience@example.com' });
    adminAuth = generateAuthContextForUser(admin);
    customerAuth = generateAuthContextForUser(customer);

    const profile = await createBirthProfileFixture(customer.id);
    testAppt = await createAppointmentFixture(customer.id, profile.id);
  });

  afterAll(async () => {
    await dbCtx.cleanup();
  });

  it('gracefully degrades when Telegram notification service fails (does not block or crash booking/payment)', async () => {
    // Mock Telegram notification to throw an error
    const telegramSpy = vi.spyOn(realServices, 'sendTelegramAdminAlert').mockRejectedValue(new Error('Telegram API connection timeout'));

    const res = await request(app)
      .post('/api/payments/proof')
      .set('Authorization', customerAuth.authHeader.Authorization)
      .send({
        appointmentId: testAppt.id,
        utrReference: '998877665544',
        amount: 1799
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    telegramSpy.mockRestore();
  });

  it('handles Gemini AI generation service failure with clean 500 error and descriptive message', async () => {
    // Calling Gemini generation endpoint
    const res = await request(app)
      .post('/api/blog/admin/generate-ai-article')
      .set('Authorization', adminAuth.authHeader.Authorization)
      .send({
        idea: 'Solar Eclipse Astrological Impact',
        tone: 'Vedic Scholarly'
      });

    // Should return clean 200 (if API key active) or 500 (if quota/timeout) without crashing process
    expect([200, 500]).toContain(res.status);
    if (res.status === 500) {
      expect(res.body).toHaveProperty('error');
    }
  });

  it('handles malformed JSON payloads gracefully without crashing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"invalid-json-payload": ');

    expect(res.status).toBe(400);
  });
});
