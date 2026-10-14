import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/server';
import { createTestDatabase, TestDbContext } from '../helpers/testDb';
import { createAdminFixture } from '../helpers/factories';
import { generateAuthContextForUser } from '../helpers/authHelper';
import { getOne } from '../../src/db/database';

describe('API: Blog CMS, Bilingual Content & Admin Operations', () => {
  let dbCtx: TestDbContext;
  let admin: any;
  let adminAuth: any;

  beforeAll(async () => {
    dbCtx = await createTestDatabase();
    admin = await createAdminFixture({ email: 'admin.cms@amitastro.com' });
    adminAuth = generateAuthContextForUser(admin);
  });

  afterAll(async () => {
    await dbCtx.cleanup();
  });

  describe('Blog Categories & Posts CRUD', () => {
    let createdPostId: string;
    const testSlug = 'understanding-jupiter-transit-2026';

    it('returns seeded Vedic blog categories (/api/blog/categories)', async () => {
      const res = await request(app).get('/api/blog/categories');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.categories)).toBe(true);
      expect(res.body.categories.length).toBeGreaterThan(0);
    });

    it('admin creates new bilingual blog post (/api/blog/admin/posts)', async () => {
      const res = await request(app)
        .post('/api/blog/admin/posts')
        .set('Authorization', adminAuth.authHeader.Authorization)
        .send({
          title: 'Understanding Jupiter Transit: Cosmic Blessings & Expansion',
          titleHi: 'बृहस्पति गोचर: ब्रह्मांडीय आशीर्वाद और विस्तार',
          slug: testSlug,
          excerpt: 'How the transit of Jupiter shapes wisdom and career trajectory.',
          excerptHi: 'बृहस्पति का गोचर किस प्रकार ज्ञान और करियर की दिशा तय करता है।',
          contentMarkdown: '# Jupiter Transit\n\nExpansion and ethical clarity.',
          contentMarkdownHi: '# बृहस्पति गोचर\n\nविस्तार और नैतिक स्पष्टता।',
          categoryId: 'cat-vedic',
          tags: ['Jupiter', 'Guru', 'Transits'],
          readingTimeMin: 5
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.post).toBeDefined();
      expect(res.body.post.title_hi).toContain('बृहस्पति');
      createdPostId = res.body.post.id;
    });

    it('public can view created post by slug (/api/blog/posts/:slug)', async () => {
      const res = await request(app).get(`/api/blog/posts/${testSlug}`);
      expect(res.status).toBe(200);
      expect(res.body.post).toBeDefined();
      expect(res.body.post.slug).toBe(testSlug);
      expect(res.body.post.title).toContain('Jupiter Transit');
    });

    it('admin updates blog post (/api/blog/admin/posts/:id)', async () => {
      const res = await request(app)
        .put(`/api/blog/admin/posts/${createdPostId}`)
        .set('Authorization', adminAuth.authHeader.Authorization)
        .send({
          title: 'Updated: Understanding Jupiter Transit 2026',
          readingTimeMin: 7
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.post.title).toContain('Updated:');
    });

    it('admin deletes blog post (/api/blog/admin/posts/:id)', async () => {
      const res = await request(app)
        .delete(`/api/blog/admin/posts/${createdPostId}`)
        .set('Authorization', adminAuth.authHeader.Authorization);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const deleted = await getOne<any>('SELECT * FROM blog_posts WHERE id = ?', [createdPostId]);
      expect(deleted).toBeUndefined();
    });
  });

  describe('Admin Operations: Blackout Dates, Broadcasts & Analytics', () => {
    it('admin adds and deletes blackout dates', async () => {
      const dateStr = '2026-12-25';

      // Add blackout date
      const addRes = await request(app)
        .post('/api/admin/blackout-dates')
        .set('Authorization', adminAuth.authHeader.Authorization)
        .send({ date: dateStr, reason: 'Christmas holiday' });

      expect(addRes.status).toBe(201);
      expect(addRes.body.success).toBe(true);

      // Delete blackout date
      const delRes = await request(app)
        .delete(`/api/admin/blackout-dates/${dateStr}`)
        .set('Authorization', adminAuth.authHeader.Authorization);

      expect(delRes.status).toBe(200);
      expect(delRes.body.success).toBe(true);
    });

    it('admin dispatches broadcast announcement (/api/admin/broadcast)', async () => {
      const res = await request(app)
        .post('/api/admin/broadcast')
        .set('Authorization', adminAuth.authHeader.Authorization)
        .send({
          title: 'Diwali Auspicious Muhurat Booking Open',
          message: 'Slots are now open for special Lakshmi Puja Kundli readings.',
          targetAudience: 'all'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Broadcast sent');
    });

    it('ingests live telemetry event and reports in realtime analytics dashboard', async () => {
      const trackRes = await request(app)
        .post('/api/analytics/track')
        .send({
          session_id: 'sess-test-01',
          visitor_id: 'vis-test-01',
          event_type: 'pageview',
          page_path: '/blog/demystifying-mahadasha',
          page_title: 'Mahadasha Article',
          device_type: 'mobile',
          browser: 'Safari',
          os: 'iOS'
        });

      expect(trackRes.status).toBe(200);
      expect(trackRes.body.success).toBe(true);

      // Admin reads realtime analytics
      const analyticsRes = await request(app)
        .get('/api/admin/analytics/realtime')
        .set('Authorization', adminAuth.authHeader.Authorization);

      expect(analyticsRes.status).toBe(200);
      expect(analyticsRes.body).toHaveProperty('activeNow');
      expect(Array.isArray(analyticsRes.body.events)).toBe(true);
    });
  });
});
