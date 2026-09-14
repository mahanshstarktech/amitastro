import https from 'https';

/**
 * Real SMS Gateway Service (Twilio / MSG91 / Fast2SMS)
 * When environment variables are provided, real SMS messages are dispatched.
 */
export async function sendRealSmsOtp(phone: string, code: string): Promise<{ success: boolean; provider: string; error?: string }> {
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER;

  // 1. If Twilio is configured
  if (twilioSid && twilioAuth && twilioFrom) {
    try {
      const authHeader = 'Basic ' + Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64');
      const postData = new URLSearchParams({
        To: phone,
        From: twilioFrom,
        Body: `Your Nakshaktram verification code is ${code}. Valid for 90 seconds.`
      }).toString();

      await makeHttpsRequest({
        hostname: 'api.twilio.com',
        path: `/2010-04-01/Accounts/${twilioSid}/Messages.json`,
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData)
        }
      }, postData);

      console.log(`[Real SMS] Dispatched OTP ${code} to ${phone} via Twilio.`);
      return { success: true, provider: 'twilio' };
    } catch (err: any) {
      console.error('[Real SMS Error - Twilio]:', err.message);
      return { success: false, provider: 'twilio', error: err.message };
    }
  }

  // 2. If MSG91 is configured
  const msg91AuthKey = process.env.MSG91_AUTH_KEY;
  const msg91TemplateId = process.env.MSG91_TEMPLATE_ID;
  if (msg91AuthKey && msg91TemplateId) {
    try {
      const cleanedPhone = phone.replace(/[^0-9]/g, '');
      const path = `/api/v5/otp?template_id=${msg91TemplateId}&mobile=${cleanedPhone}&authkey=${msg91AuthKey}&otp=${code}`;
      await makeHttpsRequest({
        hostname: 'control.msg91.com',
        path,
        method: 'POST'
      });
      console.log(`[Real SMS] Dispatched OTP ${code} to ${phone} via MSG91.`);
      return { success: true, provider: 'msg91' };
    } catch (err: any) {
      console.error('[Real SMS Error - MSG91]:', err.message);
      return { success: false, provider: 'msg91', error: err.message };
    }
  }

  // Fallback: Log to console in dev mode
  console.log(`[SMS Gateway Simulated Mode] OTP for ${phone}: ${code}`);
  return { success: true, provider: 'simulated' };
}

/**
 * Real Telegram Notification Service for Astrologer Amit Soni
 * Dispatches live booking requests and payment proofs straight to Amit's Telegram.
 */
export async function sendTelegramAdminAlert(messageText: string): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.log('[Telegram Alert Simulated]:', messageText);
    return false;
  }

  try {
    const postData = JSON.stringify({
      chat_id: chatId,
      text: `✨ *Nakshaktram Alert*\n\n${messageText}`,
      parse_mode: 'Markdown'
    });

    await makeHttpsRequest({
      hostname: 'api.telegram.org',
      path: `/bot${botToken}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, postData);

    console.log('[Telegram Alert Sent Successfully to Amit Soni]');
    return true;
  } catch (err: any) {
    console.error('[Telegram Notification Error]:', err.message);
    return false;
  }
}

/**
 * Real Mobile UPI Deep-Linking Generator
 * Generates an intent URI that automatically opens Google Pay, PhonePe, Paytm, or BHIM on mobile devices.
 */
export function generateRealUpiIntent(data: {
  vpa: string;
  name: string;
  amount: number;
  transactionRef: string;
  notes?: string;
}): { intentUrl: string; qrUrl: string } {
  const { vpa, name, amount, transactionRef, notes } = data;
  const encodedName = encodeURIComponent(name);
  const encodedNotes = encodeURIComponent(notes || 'Nakshaktram Consultation');
  
  // Standard NPCI UPI Intent Format
  const intentUrl = `upi://pay?pa=${vpa}&pn=${encodedName}&mc=0000&tr=${transactionRef}&tn=${encodedNotes}&am=${amount}&cu=INR`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(intentUrl)}`;

  return { intentUrl, qrUrl };
}

// Lightweight native HTTPS helper with zero external dependencies
function makeHttpsRequest(options: https.RequestOptions, body?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (body) req.write(body);
    req.end();
  });
}
