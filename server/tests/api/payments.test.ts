import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/server';
import { createTestDatabase, TestDbContext } from '../helpers/testDb';
import { createUserFixture, createAdminFixture, createBirthProfileFixture, createAppointmentFixture } from '../helpers/factories';
import { generateAuthContextForUser } from '../helpers/authHelper';
import { getOne, getAll } from '../../src/db/database';

describe('API: Manual UPI Payment Verification Queue & State Transitions', () => {
  let dbCtx: TestDbContext;
  let customer: any;
  let admin: any;
  let customerAuth: any;
  let adminAuth: any;
  let profile: any;
  let appt: any;

  beforeAll(async () => {
    dbCtx = await createTestDatabase();
    customer = await createUserFixture({ email: 'payment.seeker@example.com' });
    admin = await createAdminFixture({ email: 'admin.payments@amitastro.com' });

    customerAuth = generateAuthContextForUser(customer);
    adminAuth = generateAuthContextForUser(admin);

    profile = await createBirthProfileFixture(customer.id, { fullName: 'Payment Seeker' });
    appt = await createAppointmentFixture(customer.id, profile.id, 'pkg-premium');
  });

  afterAll(async () => {
    await dbCtx.cleanup();
  });

  describe('GET /api/payments/config', () => {
    it('returns official UPI VPA and bank transfer details', async () => {
      const res = await request(app).get('/api/payments/config');
      expect(res.status).toBe(200);
      expect(res.body.upi).toHaveProperty('vpa');
      expect(res.body.bank).toHaveProperty('accountNumber');
      expect(res.body.bank).toHaveProperty('ifscCode');
    });
  });

  describe('POST /api/payments/proof & Verification Pipeline', () => {
    const testUtr = '425981029384';
    let paymentRecord: any;

    it('submits 12-digit UTR payment proof and sets status to Pending', async () => {
      const res = await request(app)
        .post('/api/payments/proof')
        .set('Authorization', customerAuth.authHeader.Authorization)
        .send({
          appointmentId: appt.id,
          utrReference: testUtr,
          screenshotUrl: 'https://example.com/receipt.jpg',
          amount: 1799,
          paymentMethod: 'upi_qr'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Payment proof submitted');

      paymentRecord = await getOne<any>('SELECT * FROM payments WHERE appointment_id = ?', [appt.id]);
      expect(paymentRecord).toBeDefined();
      expect(paymentRecord.status).toBe('Pending');
      expect(paymentRecord.utr_reference).toBe(testUtr);
    });

    it('rejects submission without UTR with 400', async () => {
      const res = await request(app)
        .post('/api/payments/proof')
        .set('Authorization', customerAuth.authHeader.Authorization)
        .send({ appointmentId: appt.id });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('UTR / Transaction Reference Number is required');
    });

    it('admin views pending payment in queue (/api/payments/pending)', async () => {
      const res = await request(app)
        .get('/api/payments/pending')
        .set('Authorization', adminAuth.authHeader.Authorization);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.payments)).toBe(true);
      expect(res.body.payments.some((p: any) => p.utr_reference === testUtr)).toBe(true);
    });

    it('admin verifies payment: marks Verified, confirms appointment, and records audit log', async () => {
      const res = await request(app)
        .post(`/api/payments/${paymentRecord.id}/verify`)
        .set('Authorization', adminAuth.authHeader.Authorization);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Payment verified and plan activated');

      // 1. Verify Payment is Verified
      const updatedPayment = await getOne<any>('SELECT * FROM payments WHERE id = ?', [paymentRecord.id]);
      expect(updatedPayment.status).toBe('Verified');
      expect(updatedPayment.verified_by).toBe(admin.id);

      // 2. Linked appointment automatically moved to Confirmed
      const updatedAppt = await getOne<any>('SELECT * FROM appointments WHERE id = ?', [appt.id]);
      expect(updatedAppt.status).toBe('Confirmed');

      // 3. User plan badge elevated to Pro
      const updatedUser = await getOne<any>('SELECT * FROM users WHERE id = ?', [customer.id]);
      expect(updatedUser.plan_badge).toBe('Pro');

      // 4. Audit log entry written
      const auditLog = await getOne<any>('SELECT * FROM audit_logs WHERE action = "PAYMENT_VERIFIED" AND target_id = ?', [paymentRecord.id]);
      expect(auditLog).toBeDefined();
    });

    it('idempotency: verifying an already verified payment succeeds safely without corrupting state', async () => {
      const res = await request(app)
        .post(`/api/payments/${paymentRecord.id}/verify`)
        .set('Authorization', adminAuth.authHeader.Authorization);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('admin can reject payment with reason and status shifts to Rejected', async () => {
      // Create new payment to reject
      const rejectAppt = await createAppointmentFixture(customer.id, profile.id, 'pkg-standard');
      await request(app)
        .post('/api/payments/proof')
        .set('Authorization', customerAuth.authHeader.Authorization)
        .send({ appointmentId: rejectAppt.id, utrReference: '000011112222', amount: 999 });

      const newPay = await getOne<any>('SELECT * FROM payments WHERE appointment_id = ?', [rejectAppt.id]);

      const res = await request(app)
        .post(`/api/payments/${newPay.id}/reject`)
        .set('Authorization', adminAuth.authHeader.Authorization)
        .send({ reason: 'Bank transaction reference not received in HDFC statement' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const rejectedRecord = await getOne<any>('SELECT * FROM payments WHERE id = ?', [newPay.id]);
      expect(rejectedRecord.status).toBe('Rejected');
      expect(rejectedRecord.rejection_reason).toContain('HDFC statement');
    });
  });
});
