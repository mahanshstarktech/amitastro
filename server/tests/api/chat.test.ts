import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/server';
import { createTestDatabase, TestDbContext } from '../helpers/testDb';
import { createUserFixture, createAdminFixture } from '../helpers/factories';
import { generateAuthContextForUser } from '../helpers/authHelper';
import { runQuery, getOne } from '../../src/db/database';

describe('API: In-App Chat, Unified Inbox & CRM Notes', () => {
  let dbCtx: TestDbContext;
  let customer: any;
  let admin: any;
  let customerAuth: any;
  let adminAuth: any;
  let conversationId: string;

  beforeAll(async () => {
    dbCtx = await createTestDatabase();
    customer = await createUserFixture({ email: 'chat.customer@example.com' });
    admin = await createAdminFixture({ email: 'admin.chat@amitastro.com' });

    customerAuth = generateAuthContextForUser(customer);
    adminAuth = generateAuthContextForUser(admin);
  });

  afterAll(async () => {
    await dbCtx.cleanup();
  });

  describe('GET /api/chat/conversation', () => {
    it('creates and returns consultation chat thread for customer with welcome message', async () => {
      const res = await request(app)
        .get('/api/chat/conversation')
        .set('Authorization', customerAuth.authHeader.Authorization);

      expect(res.status).toBe(200);
      expect(res.body.conversation).toBeDefined();
      expect(Array.isArray(res.body.messages)).toBe(true);
      expect(res.body.messages.length).toBeGreaterThan(0);
      expect(res.body.messages[0].sender_type).toBe('admin');
      expect(res.body.messages[0].content).toContain('Namaste');

      conversationId = res.body.conversation.id;
    });
  });

  describe('POST /api/chat/message', () => {
    it('customer sends text message and attachment to astrologer', async () => {
      const res = await request(app)
        .post('/api/chat/message')
        .set('Authorization', customerAuth.authHeader.Authorization)
        .send({
          conversationId,
          content: 'Here is my palm photo for analysis',
          messageType: 'image',
          attachmentUrl: 'https://example.com/palm.jpg'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message.content).toBe('Here is my palm photo for analysis');
      expect(res.body.message.attachment_url).toBe('https://example.com/palm.jpg');

      // Verify unread count for admin incremented
      const conv = await getOne<any>('SELECT unread_admin_count FROM chat_conversations WHERE id = ?', [conversationId]);
      expect(conv.unread_admin_count).toBeGreaterThanOrEqual(1);
    });

    it('rejects empty message without text or attachment with 400', async () => {
      const res = await request(app)
        .post('/api/chat/message')
        .set('Authorization', customerAuth.authHeader.Authorization)
        .send({ conversationId, content: '' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Message content or attachment is required');
    });

    it('blocks customer message with 403 when conversation is locked after trial expiration', async () => {
      // Lock conversation
      await runQuery('UPDATE chat_conversations SET is_locked = 1 WHERE id = ?', [conversationId]);

      const res = await request(app)
        .post('/api/chat/message')
        .set('Authorization', customerAuth.authHeader.Authorization)
        .send({ conversationId, content: 'Trying to chat after trial ended' });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('trial chat budget has expired');

      // Unlock for remaining tests
      await runQuery('UPDATE chat_conversations SET is_locked = 0 WHERE id = ?', [conversationId]);
    });
  });

  describe('Admin Inbox & Unified Chat Operations', () => {
    it('admin views unified inbox with seeker metadata (/api/chat/admin/inbox)', async () => {
      const res = await request(app)
        .get('/api/chat/admin/inbox')
        .set('Authorization', adminAuth.authHeader.Authorization);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.conversations)).toBe(true);
      expect(res.body.conversations.some((c: any) => c.id === conversationId)).toBe(true);
    });

    it('admin updates customer private CRM notes and tags (/api/chat/admin/crm/:customerId)', async () => {
      const res = await request(app)
        .post(`/api/chat/admin/crm/${customer.id}`)
        .set('Authorization', adminAuth.authHeader.Authorization)
        .send({
          notes: 'Seeker prefers remedies in Hindi. Saturn dasha active.',
          tags: ['VIP', 'Saturn Transit', 'Prefers Hindi']
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const crmMeta = await getOne<any>('SELECT * FROM customer_crm_meta WHERE user_id = ?', [customer.id]);
      expect(crmMeta.internal_notes).toContain('Saturn dasha active');
      expect(crmMeta.tags_json).toContain('Saturn Transit');
    });
  });
});
