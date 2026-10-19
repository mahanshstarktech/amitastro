import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/server';
import * as whatsappController from '../../src/controllers/whatsappController';

describe('API: WhatsApp Cloud API Webhook Handlers', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/whatsapp/webhook (Verification Handshake)', () => {
    it('returns challenge with 200 when hub.verify_token matches expected token', async () => {
      const challengeCode = '1122334455';
      const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'amit_astro_wa_secret_2026';

      const res = await request(app)
        .get('/api/whatsapp/webhook')
        .query({
          'hub.mode': 'subscribe',
          'hub.verify_token': verifyToken,
          'hub.challenge': challengeCode
        });

      expect(res.status).toBe(200);
      expect(res.text).toBe(challengeCode);
    });

    it('returns 403 Forbidden when hub.verify_token does not match', async () => {
      const res = await request(app)
        .get('/api/whatsapp/webhook')
        .query({
          'hub.mode': 'subscribe',
          'hub.verify_token': 'wrong_invalid_token',
          'hub.challenge': '12345'
        });

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/whatsapp/webhook (Incoming Messages & Button Clicks)', () => {
    it('accepts incoming user message payload and responds 200 EVENT_RECEIVED', async () => {
      const mockSendMenu = vi.spyOn(whatsappController.whatsappService, 'sendInteractiveWelcomeMenu').mockResolvedValue({ success: true });

      const incomingPayload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: {
                    display_phone_number: '15550269876',
                    phone_number_id: '109283748291029'
                  },
                  messages: [
                    {
                      from: '919876543210',
                      id: 'wamid.HBgLM...',
                      timestamp: '1729320000',
                      text: {
                        body: 'Namaste Amit Ji'
                      },
                      type: 'text'
                    }
                  ]
                },
                field: 'messages'
              }
            ]
          }
        ]
      };

      const res = await request(app)
        .post('/api/whatsapp/webhook')
        .send(incomingPayload);

      expect(res.status).toBe(200);
      expect(res.text).toBe('EVENT_RECEIVED');
      expect(mockSendMenu).toHaveBeenCalledWith('919876543210');
    });

    it('handles interactive button clicks (e.g., btn_book_consult) gracefully', async () => {
      const mockSendList = vi.spyOn(whatsappController.whatsappService, 'sendPackageList').mockResolvedValue({ success: true });

      const buttonClickPayload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  messages: [
                    {
                      from: '919876543210',
                      id: 'wamid.HBgLM2...',
                      timestamp: '1729320050',
                      type: 'interactive',
                      interactive: {
                        type: 'button_reply',
                        button_reply: {
                          id: 'btn_book_consult',
                          title: '📅 Book Consultation'
                        }
                      }
                    }
                  ]
                },
                field: 'messages'
              }
            ]
          }
        ]
      };

      const res = await request(app)
        .post('/api/whatsapp/webhook')
        .send(buttonClickPayload);

      expect(res.status).toBe(200);
      expect(res.text).toBe('EVENT_RECEIVED');
      expect(mockSendList).toHaveBeenCalledWith('919876543210');
    });
  });
});
