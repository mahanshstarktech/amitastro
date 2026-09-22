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
        Body: `Your Amit Astro verification code is ${code}. Valid for 90 seconds.`
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
 * Real Free Email OTP Service (Resend / Brevo / Native HTTPS)
 * Resend free tier gives 3,000 emails/month; Brevo gives 300 emails/day.
 */
export async function sendRealEmailOtp(email: string, code: string): Promise<{ success: boolean; provider: string; error?: string }> {
  // 1. Resend (resend.com - 100% Free, 3,000 emails/month)
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const fromEmail = process.env.EMAIL_FROM || 'Amit Astro <onboarding@resend.dev>';
      const postData = JSON.stringify({
        from: fromEmail,
        to: [email],
        subject: `${code} is your Amit Astro verification code`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #E5E5EA; borderRadius: 16px; backgroundColor: #FFFFFF;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #1D1D1F; margin: 0; font-size: 22px;">Amit Astro</h2>
              <p style="color: #6E6E73; font-size: 13px; margin-top: 4px;">Vedic Astrology & Vastu Consultation by Amit</p>
            </div>
            <p style="color: #1D1D1F; font-size: 15px; line-height: 1.5;">Namaste,</p>
            <p style="color: #1D1D1F; font-size: 14px; line-height: 1.5;">Use the following 6-digit one-time code to verify your email and access your astrological portal:</p>
            <div style="background-color: #F5F5F7; border-radius: 12px; padding: 18px; text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #1D1D1F;">${code}</span>
            </div>
            <p style="color: #86868B; font-size: 12px;">This code is valid for 90 seconds. If you did not request this verification, you can safely disregard this email.</p>
          </div>
        `
      });

      await makeHttpsRequest({
        hostname: 'api.resend.com',
        path: '/emails',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      }, postData);

      console.log(`[Real Email OTP] Dispatched code ${code} to ${email} via Resend.`);
      return { success: true, provider: 'resend' };
    } catch (err: any) {
      console.error('[Real Email Error - Resend]:', err.message);
      return { success: false, provider: 'resend', error: err.message };
    }
  }

  // 2. Brevo / Sendinblue (300 free emails/day)
  const brevoApiKey = process.env.BREVO_API_KEY;
  if (brevoApiKey) {
    try {
      const fromEmail = process.env.EMAIL_FROM || 'contact@amitastro.com';
      const postData = JSON.stringify({
        sender: { name: 'Amit Astro', email: fromEmail },
        to: [{ email }],
        subject: `Your Amit Astro verification code: ${code}`,
        htmlContent: `<p>Your verification code is <strong>${code}</strong> (valid for 90 seconds).</p>`
      });

      await makeHttpsRequest({
        hostname: 'api.brevo.com',
        path: '/v3/smtp/email',
        method: 'POST',
        headers: {
          'api-key': brevoApiKey,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      }, postData);

      console.log(`[Real Email OTP] Dispatched code ${code} to ${email} via Brevo.`);
      return { success: true, provider: 'brevo' };
    } catch (err: any) {
      console.error('[Real Email Error - Brevo]:', err.message);
      return { success: false, provider: 'brevo', error: err.message };
    }
  }

  // Fallback: Simulated Email in Console
  console.log(`[Email Gateway Simulated Mode] OTP for ${email}: ${code}`);
  return { success: true, provider: 'simulated' };
}

/**
 * Real Telegram Notification Service for Astrologer Amit
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
      text: `✨ *Amit Astro Alert*\n\n${messageText}`,
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

    console.log('[Telegram Alert Sent Successfully to Amit]');
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
  const encodedNotes = encodeURIComponent(notes || 'Amit Astro Consultation');
  
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
