import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getOne, runQuery, getAll } from '../db/database';
import { sendRealSmsOtp, sendRealEmailOtp } from '../services/realServices';

const JWT_SECRET = process.env.JWT_SECRET || 'nakshaktram_secret_jwt_key_2026';

export const sendOtp = async (req: Request, res: Response) => {
  try {
    const { phone, email, channel } = req.body;
    const target = (channel === 'email' || (!phone && email)) ? email?.trim().toLowerCase() : phone?.trim();

    if (!target) {
      return res.status(400).json({ error: 'Phone number or email address is required' });
    }

    const isEmail = target.includes('@');

    // Rate limiting check: check if OTP was sent in the last 30 seconds
    const existing = await getOne<any>('SELECT * FROM otps WHERE phone = ?', [target]);
    const now = Date.now();
    if (existing && existing.expires_at - now > 60000) {
      return res.status(429).json({
        error: 'Please wait before requesting another OTP',
        cooldownRemaining: Math.ceil((existing.expires_at - now - 60000) / 1000)
      });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = now + 90 * 1000; // 90 seconds expiry

    await runQuery(`
      INSERT INTO otps (phone, code, expires_at, attempts)
      VALUES (?, ?, ?, 0)
      ON CONFLICT(phone) DO UPDATE SET code = ?, expires_at = ?, attempts = 0
    `, [target, code, expiresAt, code, expiresAt]);

    let dispatchResult;
    if (isEmail) {
      dispatchResult = await sendRealEmailOtp(target, code);
    } else {
      dispatchResult = await sendRealSmsOtp(target, code);
    }

    return res.json({
      success: true,
      channel: isEmail ? 'email' : 'phone',
      message: `OTP sent successfully via ${isEmail ? 'email' : 'SMS'}`,
      provider: dispatchResult.provider,
      simulatedCode: dispatchResult.provider === 'simulated' ? code : undefined,
      cooldownSeconds: 60
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { phone, email, code, name, password } = req.body;
    const target = phone ? phone.trim() : email ? email.trim().toLowerCase() : '';

    if (!target || !code) {
      return res.status(400).json({ error: 'Destination (phone/email) and OTP code are required' });
    }

    const otpRecord = await getOne<any>('SELECT * FROM otps WHERE phone = ?', [target]);
    if (!otpRecord) {
      return res.status(400).json({ error: 'No OTP requested for this phone/email' });
    }

    if (Date.now() > otpRecord.expires_at) {
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    if (otpRecord.attempts >= 5) {
      return res.status(429).json({ error: 'Too many incorrect attempts. Please request a new OTP.' });
    }

    if (otpRecord.code !== code.trim()) {
      await runQuery('UPDATE otps SET attempts = attempts + 1 WHERE phone = ?', [target]);
      return res.status(400).json({ error: 'Invalid OTP code. Please check and re-enter.' });
    }

    // OTP verified — consume code
    await runQuery('DELETE FROM otps WHERE phone = ?', [target]);

    const isEmail = target.includes('@');
    // Check if user already exists
    let user = isEmail
      ? await getOne<any>('SELECT * FROM users WHERE email = ?', [target])
      : await getOne<any>('SELECT * FROM users WHERE phone = ?', [target]);

    if (!user) {
      // Create new customer account
      const userId = `usr-${uuidv4().substring(0, 8)}`;
      const userEmail = isEmail ? target : email ? email.trim().toLowerCase() : `${target.replace(/[^0-9]/g, '')}@nakshaktram.user`;
      const userPhone = isEmail ? (phone ? phone.trim() : `email-${uuidv4().substring(0, 8)}`) : target;
      const userName = name ? name.trim() : isEmail ? target.split('@')[0] : 'Nakshaktram Seeker';
      const dummyPassword = password || uuidv4();
      const hash = await bcrypt.hash(dummyPassword, 10);

      await runQuery(`
        INSERT INTO users (id, name, email, phone, password_hash, role, is_phone_verified, is_new_customer)
        VALUES (?, ?, ?, ?, ?, 'customer', 1, 1)
      `, [userId, userName, userEmail, userPhone, hash]);

      // Create CRM metadata
      await runQuery(`
        INSERT INTO customer_crm_meta (user_id, tags_json, internal_notes)
        VALUES (?, '["New Client"]', '')
      `, [userId]);

      user = await getOne<any>('SELECT * FROM users WHERE id = ?', [userId]);
    } else {
      // Mark verified
      await runQuery('UPDATE users SET is_phone_verified = 1 WHERE id = ?', [user.id]);
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const profiles = await getAll<any>('SELECT * FROM birth_profiles WHERE user_id = ? ORDER BY created_at ASC', [user.id]);

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isPhoneVerified: true,
        isNewCustomer: user.is_new_customer !== 0,
        trialUsed: !!user.trial_used,
        trialSecondsRemaining: user.trial_seconds_remaining
      },
      profiles
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const googleAuth = async (req: Request, res: Response) => {
  try {
    const { email, name, googleId } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Google email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    let user = await getOne<any>('SELECT * FROM users WHERE email = ?', [cleanEmail]);

    if (!user) {
      const userId = `usr-${uuidv4().substring(0, 8)}`;
      const userName = name ? name.trim() : cleanEmail.split('@')[0];
      const dummyPhone = `google-${uuidv4().substring(0, 8)}`;
      const hash = await bcrypt.hash(uuidv4(), 10);

      await runQuery(`
        INSERT INTO users (id, name, email, phone, password_hash, role, is_phone_verified, is_new_customer)
        VALUES (?, ?, ?, ?, ?, 'customer', 1, 1)
      `, [userId, userName, cleanEmail, dummyPhone, hash]);

      await runQuery(`
        INSERT INTO customer_crm_meta (user_id, tags_json, internal_notes)
        VALUES (?, '["Google Auth", "New Client"]', '')
      `, [userId]);

      user = await getOne<any>('SELECT * FROM users WHERE id = ?', [userId]);
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const profiles = await getAll<any>('SELECT * FROM birth_profiles WHERE user_id = ? ORDER BY created_at ASC', [user.id]);

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
        isNewCustomer: user.is_new_customer !== 0,
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

    const user = await getOne<any>('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (!user) {
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
        isNewCustomer: user.is_new_customer !== 0,
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
        isNewCustomer: user.is_new_customer !== 0,
        trialUsed: !!user.trial_used,
        trialSecondsRemaining: user.trial_seconds_remaining
      },
      profiles
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
