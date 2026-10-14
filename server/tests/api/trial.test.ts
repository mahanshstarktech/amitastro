import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/server';
import { createTestDatabase, TestDbContext } from '../helpers/testDb';
import { createUserFixture } from '../helpers/factories';
import { generateAuthContextForUser } from '../helpers/authHelper';
import { getOne, runQuery } from '../../src/db/database';

describe('API: 5-Minute Free Discovery Trial Call Engine', () => {
  let dbCtx: TestDbContext;
  let trialUser: any;
  let trialAuth: any;

  beforeAll(async () => {
    dbCtx = await createTestDatabase();
    trialUser = await createUserFixture({
      email: 'trial.user@example.com',
      phone: '+919811199999',
      trialUsed: 0,
      trialSecondsRemaining: 300
    });
    trialAuth = generateAuthContextForUser(trialUser);

    // Create an initial chat conversation for this user
    await runQuery(`
      INSERT INTO chat_conversations (id, customer_id, admin_id, is_locked)
      VALUES ('conv-trial-user', ?, 'admin-amit', 0)
    `, [trialUser.id]);
  });

  afterAll(async () => {
    await dbCtx.cleanup();
  });

  describe('GET /api/trial/status', () => {
    it('returns eligibility and full 300 seconds budget for new user', async () => {
      const res = await request(app)
        .get('/api/trial/status')
        .set('Authorization', trialAuth.authHeader.Authorization);

      expect(res.status).toBe(200);
      expect(res.body.isEligible).toBe(true);
      expect(res.body.trialUsed).toBe(false);
      expect(res.body.secondsRemaining).toBe(300);
      expect(res.body.totalTrialSeconds).toBe(300);
    });
  });

  describe('POST /api/trial/deduct Countdown & Cutoff Enforcement', () => {
    it('deducts elapsed call time in real-time increments', async () => {
      const res = await request(app)
        .post('/api/trial/deduct')
        .set('Authorization', trialAuth.authHeader.Authorization)
        .send({ secondsDeducted: 120 }); // Deduct 2 minutes

      expect(res.status).toBe(200);
      expect(res.body.isCutoff).toBe(false);
      expect(res.body.secondsRemaining).toBe(180);
      expect(res.body.warningOneMin).toBe(false);
    });

    it('triggers warningOneMin when remaining seconds <= 60', async () => {
      const res = await request(app)
        .post('/api/trial/deduct')
        .set('Authorization', trialAuth.authHeader.Authorization)
        .send({ secondsDeducted: 130 }); // 180 - 130 = 50s remaining

      expect(res.status).toBe(200);
      expect(res.body.isCutoff).toBe(false);
      expect(res.body.secondsRemaining).toBe(50);
      expect(res.body.warningOneMin).toBe(true);
    });

    it('triggers isCutoff = true and locks chat conversation when budget reaches 0', async () => {
      const res = await request(app)
        .post('/api/trial/deduct')
        .set('Authorization', trialAuth.authHeader.Authorization)
        .send({ secondsDeducted: 60 }); // 50 - 60 = 0s

      expect(res.status).toBe(200);
      expect(res.body.isCutoff).toBe(true);
      expect(res.body.secondsRemaining).toBe(0);

      // Verify DB: trial_used = 1
      const updatedUser = await getOne<any>('SELECT trial_used, trial_seconds_remaining FROM users WHERE id = ?', [trialUser.id]);
      expect(updatedUser.trial_used).toBe(1);
      expect(updatedUser.trial_seconds_remaining).toBe(0);

      // Verify DB: chat conversation automatically locked
      const updatedConv = await getOne<any>('SELECT is_locked FROM chat_conversations WHERE customer_id = ?', [trialUser.id]);
      expect(updatedConv.is_locked).toBe(1);
    });

    it('subsequent trial deduction attempts return isCutoff = true immediately', async () => {
      const res = await request(app)
        .post('/api/trial/deduct')
        .set('Authorization', trialAuth.authHeader.Authorization)
        .send({ secondsDeducted: 10 });

      expect(res.status).toBe(200);
      expect(res.body.isCutoff).toBe(true);
      expect(res.body.secondsRemaining).toBe(0);
      expect(res.body.message).toContain('ended');
    });

    it('user whose phone has trial_used = 1 is ineligible for free trial', async () => {
      const res = await request(app)
        .get('/api/trial/status')
        .set('Authorization', trialAuth.authHeader.Authorization);

      expect(res.status).toBe(200);
      expect(res.body.isEligible).toBe(false);
      expect(res.body.trialUsed).toBe(true);
      expect(res.body.secondsRemaining).toBe(0);
    });
  });
});
