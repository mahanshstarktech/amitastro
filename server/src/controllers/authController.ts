import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getOne, runQuery, getAll } from '../db/database';
import { sendRealSmsOtp } from '../services/realServices';

const JWT_SECRET = process.env.JWT_SECRET || 'nakshaktram_secret_jwt_key_2026';

export const sendOtp = async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Rate limiting check: check if OTP was sent in the last 60 seconds
    const existing = await getOne<any>('SELECT * FROM otps WHERE phone = ?', [phone]);
    const now = Date.now();
    if (existing && existing.expires_at - now > 30000) { // sent less than 60s ago
      return res.status(429).json({
        error: 'Please wait before requesting another OTP',
        cooldownRemaining: Math.ceil((existing.expires_at - now - 30000) / 1000)
      });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = now + 90 * 1000; // 90 seconds expiry

    await runQuery(`
      INSERT INTO otps (phone, code, expires_at, attempts)
      VALUES (?, ?, ?, 0)
      ON CONFLICT(phone) DO UPDATE SET code = ?, expires_at = ?, attempts = 0
    `, [phone, code, expiresAt, code, expiresAt]);

    // Dispatch real SMS (Twilio / MSG91 / Fast2SMS)
    const smsResult = await sendRealSmsOtp(phone, code);

    return res.json({
      success: true,
      message: 'OTP sent successfully via SMS',
      provider: smsResult.provider,
      simulatedCode: smsResult.provider === 'simulated' ? code : undefined,
      cooldownSeconds: 60
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { phone, code, name, email, password } = req.body;
    if (!phone || !code) {
      return res.status(400).json({ error: 'Phone and OTP code are required' });
    }

    const otpRecord = await getOne<any>('SELECT * FROM otps WHERE phone = ?', [phone]);
    if (!otpRecord) {
      return res.status(400).json({ error: 'No OTP requested for this phone number' });
    }

    if (Date.now() > otpRecord.expires_at) {
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    if (otpRecord.attempts >= 5) {
      return res.status(429).json({ error: 'Too many incorrect attempts. Please request a new OTP.' });
    }

    // Allow the actual generated code OR fallback master demo code '123456'
    if (otpRecord.code !== code && code !== '123456') {
      await runQuery('UPDATE otps SET attempts = attempts + 1 WHERE phone = ?', [phone]);
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Verified! Clean OTP
    await runQuery('DELETE FROM otps WHERE phone = ?', [phone]);

    // Check if user exists by phone or email
    let user = await getOne<any>('SELECT * FROM users WHERE phone = ? OR email = ?', [phone, email || '']);

    if (!user) {
      // Create user
      const userId = `usr-${uuidv4().substring(0, 8)}`;
      let passwordHash = null;
      if (password) {
        const salt = await bcrypt.genSalt(10);
        passwordHash = await bcrypt.hash(password, salt);
      }

      await runQuery(`
        INSERT INTO users (id, name, email, phone, password_hash, role, is_phone_verified)
        VALUES (?, ?, ?, ?, ?, 'customer', 1)
      `, [userId, name || 'User', email || `${phone.replace(/[^0-9]/g, '')}@nakshaktram.app`, passwordHash]);

      user = await getOne<any>('SELECT * FROM users WHERE id = ?', [userId]);

      // Initialize CRM entry
      await runQuery(`
        INSERT INTO customer_crm_meta (user_id, internal_notes, tags_json)
        VALUES (?, '', '["New Signup"]')
      `, [userId]);
    } else {
      // Mark phone verified
      await runQuery('UPDATE users SET is_phone_verified = 1 WHERE id = ?', [user.id]);
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const profiles = await getAll<any>('SELECT * FROM birth_profiles WHERE user_id = ?', [user.id]);

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isPhoneVerified: !!user.is_phone_verified,
        trialUsed: !!user.trial_used,
        trialSecondsRemaining: user.trial_seconds_remaining
      },
      profiles
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await getOne<any>('SELECT * FROM users WHERE email = ?', [email]);
    if (!user || !user.password_hash) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const profiles = await getAll<any>('SELECT * FROM birth_profiles WHERE user_id = ?', [user.id]);

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isPhoneVerified: !!user.is_phone_verified,
        trialUsed: !!user.trial_used,
        trialSecondsRemaining: user.trial_seconds_remaining
      },
      profiles
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const getMe = async (req: any, res: Response) => {
  try {
    const user = await getOne<any>('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const profiles = await getAll<any>('SELECT * FROM birth_profiles WHERE user_id = ? ORDER BY created_at ASC', [user.id]);

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isPhoneVerified: !!user.is_phone_verified,
        trialUsed: !!user.trial_used,
        trialSecondsRemaining: user.trial_seconds_remaining
      },
      profiles
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
