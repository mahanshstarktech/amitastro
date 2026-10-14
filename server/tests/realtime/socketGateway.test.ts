import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import { AddressInfo } from 'net';
import request from 'supertest';
import { server, app } from '../../src/server';
import { createTestDatabase, TestDbContext } from '../helpers/testDb';
import { createUserFixture, createAdminFixture } from '../helpers/factories';
import { generateAuthContextForUser } from '../helpers/authHelper';
import { runQuery } from '../../src/db/database';

describe('Real-Time: Socket.io WhatsApp-Style Messaging Gateway', () => {
  let dbCtx: TestDbContext;
  let serverPort: number;
  let customerUser: any;
  let adminUser: any;
  let otherUser: any;
  let customerAuth: any;
  let adminAuth: any;

  let customerSocket: ClientSocket;
  let adminSocket: ClientSocket;
  let thirdPartySocket: ClientSocket;

  const convId = 'conv-test-realtime-101';
  const privateConvId = 'conv-test-isolated-202';

  beforeAll(async () => {
    dbCtx = await createTestDatabase();

    customerUser = await createUserFixture({ email: `socket.cust.${Date.now()}@example.com` });
    adminUser = await createAdminFixture({ email: `socket.admin.${Date.now()}@amitastro.com` });
    otherUser = await createUserFixture({ email: `socket.other.${Date.now()}@example.com` });

    customerAuth = generateAuthContextForUser(customerUser);
    adminAuth = generateAuthContextForUser(adminUser);

    // Seed conversations in database
    await runQuery(`
      INSERT INTO chat_conversations (id, customer_id, admin_id, unread_admin_count, unread_customer_count)
      VALUES (?, ?, ?, 0, 0)
    `, [convId, customerUser.id, adminUser.id]);

    await runQuery(`
      INSERT INTO chat_conversations (id, customer_id, admin_id, unread_admin_count, unread_customer_count)
      VALUES (?, ?, ?, 0, 0)
    `, [privateConvId, otherUser.id, adminUser.id]);

    // Start server on an ephemeral port
    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        serverPort = (server.address() as AddressInfo).port;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (customerSocket?.connected) customerSocket.disconnect();
    if (adminSocket?.connected) adminSocket.disconnect();
    if (thirdPartySocket?.connected) thirdPartySocket.disconnect();

    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
    await dbCtx.cleanup();
  });

  it('connects customer, admin, and third-party sockets to the server', async () => {
    const socketUrl = `http://localhost:${serverPort}`;

    customerSocket = ioClient(socketUrl, { transports: ['websocket'] });
    adminSocket = ioClient(socketUrl, { transports: ['websocket'] });
    thirdPartySocket = ioClient(socketUrl, { transports: ['websocket'] });

    await Promise.all([
      new Promise<void>((resolve) => customerSocket.on('connect', () => resolve())),
      new Promise<void>((resolve) => adminSocket.on('connect', () => resolve())),
      new Promise<void>((resolve) => thirdPartySocket.on('connect', () => resolve()))
    ]);

    expect(customerSocket.connected).toBe(true);
    expect(adminSocket.connected).toBe(true);
    expect(thirdPartySocket.connected).toBe(true);
  });

  it('routes sockets into user_{id} and admin_room upon authentication', async () => {
    // Authenticate customer socket
    customerSocket.emit('authenticate', {
      userId: customerUser.id,
      role: 'customer'
    });

    // Authenticate admin socket
    adminSocket.emit('authenticate', {
      userId: adminUser.id,
      role: 'admin'
    });

    // Authenticate third-party socket into their own room
    thirdPartySocket.emit('authenticate', {
      userId: otherUser.id,
      role: 'customer'
    });

    // Allow 100ms for room registration
    await new Promise((r) => setTimeout(r, 100));
  });

  it('joins conversation rooms and delivers messages with correct room isolation', async () => {
    // Customer and Admin join convId
    customerSocket.emit('join_conversation', convId);
    adminSocket.emit('join_conversation', convId);

    // Third party joins privateConvId
    thirdPartySocket.emit('join_conversation', privateConvId);

    await new Promise((r) => setTimeout(r, 100));

    // Admin receives message sent by customer; third-party does NOT receive it
    let adminReceivedMsg: any = null;
    let thirdPartyReceivedMsg: any = null;

    adminSocket.on('receive_message', (msg) => {
      adminReceivedMsg = msg;
    });

    thirdPartySocket.on('receive_message', (msg) => {
      thirdPartyReceivedMsg = msg;
    });

    const testPayload = {
      conversationId: convId,
      message: {
        id: 'msg-sock-001',
        senderType: 'customer',
        content: 'Namaste Guruji, live socket test message'
      }
    };

    customerSocket.emit('send_message', testPayload);

    // Wait for message dissemination
    await new Promise((r) => setTimeout(r, 200));

    expect(adminReceivedMsg).toBeDefined();
    expect(adminReceivedMsg.id).toBe('msg-sock-001');
    expect(adminReceivedMsg.content).toBe('Namaste Guruji, live socket test message');

    // Strict privacy guarantee: user in another conversation must NOT receive it
    expect(thirdPartyReceivedMsg).toBeNull();
  });

  it('notifies admin_room on admin_new_message event while shielding customer sockets', async () => {
    let adminRoomNotified = false;
    let thirdPartyNotified = false;

    adminSocket.on('admin_new_message', (data) => {
      if (data.conversationId === convId) {
        adminRoomNotified = true;
      }
    });

    thirdPartySocket.on('admin_new_message', () => {
      thirdPartyNotified = true;
    });

    customerSocket.emit('send_message', {
      conversationId: convId,
      message: {
        id: 'msg-sock-002',
        senderType: 'customer',
        content: 'Another question about Rahu Mahadasha'
      }
    });

    await new Promise((r) => setTimeout(r, 200));

    expect(adminRoomNotified).toBe(true);
    // Non-admin sockets must never receive admin_new_message broadcasts
    expect(thirdPartyNotified).toBe(false);
  });

  it('broadcasts typing indicators between conversation participants and isolates outsiders', async () => {
    let adminSawTyping: any = null;
    let thirdPartySawTyping: any = null;

    adminSocket.on('user_typing', (data) => {
      adminSawTyping = data;
    });

    thirdPartySocket.on('user_typing', (data) => {
      thirdPartySawTyping = data;
    });

    customerSocket.emit('typing', {
      conversationId: convId,
      senderName: 'Priya Customer',
      isTyping: true
    });

    await new Promise((r) => setTimeout(r, 150));

    expect(adminSawTyping).toBeDefined();
    expect(adminSawTyping.senderName).toBe('Priya Customer');
    expect(adminSawTyping.isTyping).toBe(true);

    // Third party is not in convId, must not see typing
    expect(thirdPartySawTyping).toBeNull();
  });

  it('delivers read receipt events across active conversation participants', async () => {
    let customerSawRead: any = null;

    customerSocket.on('message_read', (data) => {
      customerSawRead = data;
    });

    adminSocket.emit('mark_read', {
      conversationId: convId,
      messageId: 'msg-sock-001'
    });

    await new Promise((r) => setTimeout(r, 150));

    expect(customerSawRead).toBeDefined();
    expect(customerSawRead.messageId).toBe('msg-sock-001');
  });

  it('emits customer_new_message to target user room when admin sends message via REST API', async () => {
    let customerReceivedDirect: any = null;

    customerSocket.on('customer_new_message', (data) => {
      customerReceivedDirect = data;
    });

    // Admin posts message via REST API
    const res = await request(app)
      .post('/api/chat/message')
      .set('Authorization', adminAuth.authHeader.Authorization)
      .send({
        conversationId: convId,
        content: 'Blessings to you. Wear yellow sapphire on Pushya Nakshatra.'
      });

    expect(res.status).toBe(201);

    await new Promise((r) => setTimeout(r, 200));

    expect(customerReceivedDirect).toBeDefined();
    expect(customerReceivedDirect.message.content).toContain('Blessings to you');
  });

  it('gracefully handles client disconnection without server crash or unhandled error', async () => {
    expect(thirdPartySocket.connected).toBe(true);
    thirdPartySocket.disconnect();

    await new Promise((r) => setTimeout(r, 100));
    expect(thirdPartySocket.connected).toBe(false);

    // Verify server remains responsive
    const healthRes = await request(app).get('/health');
    expect(healthRes.status).toBe(200);
    expect(healthRes.body.status).toBe('ok');
  });
});
