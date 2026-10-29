import { Request, Response } from 'express';
import https from 'https';
import { runQuery, getOne } from '../db/database';
import { callGemini, getGeminiApiKey } from '../services/geminiService';

export async function generateAstrologyResponse(userQuestion: string): Promise<string> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return `Namaste! Astrologer Amit Soni has received your query regarding: "${userQuestion}".\n\nFor a detailed personal reading, reply *BOOK* to choose a consultation package.`;
  }

  const systemInstruction = `You are the authentic Vedic astrology assistant for Astrologer Amit Soni (Amit Astro).
Provide a wise, concise, and respectful response rooted in classical Vedic astrology (Parashara, Navagraha, Karma).
Keep the reply under 120 words so it is easy to read on WhatsApp.
Conclude with a positive Vedic blessing or practical remedy (mantra, meditation).`;

  try {
    const reply = await callGemini(userQuestion, systemInstruction, 0.4);
    return reply.trim();
  } catch (err) {
    return `Namaste! Astrologer Amit Soni has received your query regarding: "${userQuestion}".\n\nTo schedule a comprehensive 1-on-1 reading with Amit Ji, reply *BOOK*.`;
  }
}

export const getWhatsAppToken = (): string => {
  return process.env.WHATSAPP_CLOUD_API_TOKEN || '';
};

export const getPhoneNumberId = (): string => {
  return process.env.WHATSAPP_PHONE_NUMBER_ID || '';
};

export const getVerifyToken = (): string => {
  return process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'amit_astro_wa_secret_2026';
};

/**
 * 1. Webhook Verification (GET /api/whatsapp/webhook)
 * Meta calls this during webhook setup to verify token handshake.
 */
export const verifyWebhook = (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const expectedToken = getVerifyToken();

  if (mode === 'subscribe' && token === expectedToken) {
    console.log('[WhatsApp Webhook Verified Successfully]');
    return res.status(200).send(challenge);
  }

  console.warn('[WhatsApp Webhook Verification Failed]: Mismatch in verify token');
  return res.sendStatus(403);
};

/**
 * 2. Incoming Messages Handler (POST /api/whatsapp/webhook)
 * Handles incoming messages, button clicks, and list replies.
 */
export const handleIncomingMessage = async (req: Request, res: Response) => {
  // Always acknowledge immediately with 200 OK to prevent Meta from retrying or disabling webhook
  res.status(200).send('EVENT_RECEIVED');

  try {
    const body = req.body;
    if (!body || body.object !== 'whatsapp_business_account') {
      return;
    }

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    // Ignore delivery status receipts (sent, delivered, read)
    if (!message) {
      return;
    }

    const fromPhone = message.from; // Customer's phone number
    const msgType = message.type;
    const incomingText = message.text?.body?.trim() || '';
    const selectedButtonId = message.interactive?.button_reply?.id;
    const selectedListId = message.interactive?.list_reply?.id;

    console.log(`[WhatsApp Inbound] From: ${fromPhone} | Type: ${msgType} | Text: "${incomingText}" | Btn: ${selectedButtonId || 'none'}`);

    // Mark message as read (shows blue checkmark to user)
    await whatsappService.markMessageAsRead(message.id);

    // FLOW 1: Welcome Greeting / Start command
    if (incomingText.toLowerCase().match(/^(hi|hello|namaste|pranam|start|\/start|hey|menu)/i)) {
      await whatsappService.sendInteractiveWelcomeMenu(fromPhone);
      return;
    }

    // FLOW 2: Book Consultation button or keyword
    if (selectedButtonId === 'btn_book_consult' || incomingText.toLowerCase() === 'book' || incomingText.toLowerCase().includes('consultation')) {
      await whatsappService.sendPackageList(fromPhone);
      return;
    }

    // FLOW 3: Package Selected from List
    if (selectedListId && selectedListId.startsWith('pkg_')) {
      const pkgTitles: Record<string, string> = {
        pkg_discovery: 'Discovery Consult (₹1,100)',
        pkg_deep: 'Deep Consult (₹5,100)',
        pkg_emergency: 'Emergency Same-Day (₹7,500)',
        pkg_family: 'Family 360 Plan (₹11,000)'
      };
      const chosen = pkgTitles[selectedListId] || 'Vedic Consultation';
      await whatsappService.sendTextMessage(
        fromPhone,
        `🙏 *${chosen} Selected*\n\nTo confirm your consultation with Astrologer Amit Soni, please reply with your birth details in this format:\n\n1. *Name:*\n2. *Date of Birth (YYYY-MM-DD):*\n3. *Time of Birth:*\n4. *Place of Birth:*\n5. *Preferred Date & Time:*\n\nOnce received, we will schedule your session and send the confirmed time slot! Pranam! ✨`
      );
      return;
    }

    // FLOW 4: Speak to Astrologer / Direct Contact
    if (selectedButtonId === 'btn_direct_contact' || incomingText.toLowerCase().includes('talk to amit') || incomingText.toLowerCase().includes('contact')) {
      await whatsappService.sendTextMessage(
        fromPhone,
        `🕉️ *Amit Astro Direct Contact*\n\nAstrologer Amit Soni conducts consultations directly via phone or WhatsApp audio/video.\n\n📍 *Office:* Jaipur, Rajasthan\n📞 *Direct WhatsApp:* +91 9983353533\n🌐 *Website:* https://amitastro.com\n\nReply with *BOOK* to view available slots or packages.`
      );
      return;
    }

    // FLOW 5: Astrology Question -> AI Vedic Knowledge Engine (Gemini)
    if (selectedButtonId === 'btn_ask_astrology' || incomingText.length > 3) {
      if (selectedButtonId === 'btn_ask_astrology') {
        await whatsappService.sendTextMessage(
          fromPhone,
          `🔮 *Ask Any Vedic Astrology Query*\n\nYou can ask about:\n• Career & Business growth\n• Marriage & Kundli matching\n• Sade Sati, Rahu/Ketu remedies\n• Gemstone recommendations\n\nSimply reply with your question now!`
        );
        return;
      }

      // Query Gemini AI Service for astrological guidance
      try {
        const aiResponse = await generateAstrologyResponse(incomingText);
        await whatsappService.sendTextMessage(
          fromPhone,
          `🕉️ *Vedic Wisdom (Amit Astro)*\n\n${aiResponse}\n\n━━━━━━━━━━━━━━━\n_Need a personalized birth chart reading with Astrologer Amit Soni? Reply *BOOK* to schedule a private session._`
        );
      } catch (aiErr: any) {
        await whatsappService.sendTextMessage(
          fromPhone,
          `Namaste! Astrologer Amit Soni has received your query: "${incomingText}".\n\nOur team will review your birth chart details and get back to you shortly. You can also reply *BOOK* to schedule a 1-on-1 session.`
        );
      }
      return;
    }

  } catch (err: any) {
    console.error('[WhatsApp Webhook Handler Error]:', err.message);
  }
};

/**
 * Send standard plain text message via WhatsApp Cloud API
 */
export function sendTextMessage(toPhone: string, text: string): Promise<any> {
  const payload = JSON.stringify({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: toPhone.replace(/[^0-9]/g, ''),
    type: 'text',
    text: { preview_url: true, body: text }
  });

  return postToMeta(payload);
}

/**
 * Send interactive 3-button welcome message
 */
export function sendInteractiveWelcomeMenu(toPhone: string): Promise<any> {
  const payload = JSON.stringify({
    messaging_product: 'whatsapp',
    to: toPhone.replace(/[^0-9]/g, ''),
    type: 'interactive',
    interactive: {
      type: 'button',
      header: { type: 'text', text: '🕉️ Welcome to Amit Astro' },
      body: { text: 'Namaste! Welcome to Astrologer Amit Soni’s official Vedic advisory portal. How may we guide your spiritual and life journey today?' },
      footer: { text: 'Select an option below:' },
      action: {
        buttons: [
          { type: 'reply', reply: { id: 'btn_book_consult', title: '📅 Book Consultation' } },
          { type: 'reply', reply: { id: 'btn_ask_astrology', title: '🔮 Ask Astrology AI' } },
          { type: 'reply', reply: { id: 'btn_direct_contact', title: '📞 Contact Amit Ji' } }
        ]
      }
    }
  });

  return postToMeta(payload);
}

/**
 * Send interactive package selection list
 */
export function sendPackageList(toPhone: string): Promise<any> {
  const payload = JSON.stringify({
    messaging_product: 'whatsapp',
    to: toPhone.replace(/[^0-9]/g, ''),
    type: 'interactive',
    interactive: {
      type: 'list',
      header: { type: 'text', text: 'Vedic Consultation Packages' },
      body: { text: 'Please choose the consultation tier that best suits your requirements:' },
      footer: { text: 'Amit Astro · Authentic Vedic Astrology' },
      action: {
        button: 'Select Package',
        sections: [
          {
            title: 'Personal Consultations',
            rows: [
              { id: 'pkg_discovery', title: 'Discovery Consult', description: '₹1,100 · 15 mins audio call' },
              { id: 'pkg_deep', title: 'Deep Consult', description: '₹5,100 · 45 mins comprehensive Kundli' },
              { id: 'pkg_emergency', title: 'Emergency Same-Day', description: '₹7,500 · Priority within 2 hours' },
              { id: 'pkg_family', title: 'Family 360 Plan', description: '₹11,000 · Up to 4 family members' }
            ]
          }
        ]
      }
    }
  });

  return postToMeta(payload);
}

/**
 * Mark an incoming message as read
 */
export function markMessageAsRead(messageId: string): Promise<any> {
  const payload = JSON.stringify({
    messaging_product: 'whatsapp',
    status: 'read',
    message_id: messageId
  });

  return postToMeta(payload);
}

/**
 * Dispatches an outbound WhatsApp notification to Amit or customer
 * (Equivalent to sendTelegramAdminAlert)
 */
export async function sendWhatsAppNotification(toPhone: string, messageText: string): Promise<boolean> {
  const token = getWhatsAppToken();
  const phoneId = getPhoneNumberId();

  if (!token || !phoneId) {
    console.log('[WhatsApp Notification Simulated]:', messageText);
    return false;
  }

  try {
    await sendTextMessage(toPhone, messageText);
    console.log(`[WhatsApp Alert Sent Successfully to ${toPhone}]`);
    return true;
  } catch (err: any) {
    console.error('[WhatsApp Notification Error]:', err.message);
    return false;
  }
}

/**
 * Helper to execute HTTPS POST request to Meta Graph API v21.0
 */
function postToMeta(jsonData: string): Promise<any> {
  const token = getWhatsAppToken();
  const phoneId = getPhoneNumberId();

  if (!token || !phoneId) {
    console.log('[WhatsApp Cloud API Not Configured]: Message simulated');
    return Promise.resolve({ simulated: true });
  }

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'graph.facebook.com',
      port: 443,
      path: `/v21.0/${phoneId}/messages`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(jsonData)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body || '{}');
          if (res.statusCode && res.statusCode >= 400) {
            console.error('[Meta Graph API Error Status]:', res.statusCode, parsed);
          }
          resolve(parsed);
        } catch (e) {
          resolve({ raw: body });
        }
      });
    });

    req.on('error', (err) => {
      console.error('[Meta Graph API Network Error]:', err.message);
      reject(err);
    });

    req.write(jsonData);
    req.end();
  });
}

export const whatsappService = {
  sendTextMessage,
  sendInteractiveWelcomeMenu,
  sendPackageList,
  markMessageAsRead,
  sendWhatsAppNotification,
  postToMeta
};

