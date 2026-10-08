import { Request, Response, NextFunction } from 'express';
import { securityService } from '../services/securityService';
import { runQuery } from '../db/database';
import { v4 as uuidv4 } from 'uuid';

// In-memory IP rate limiter for auth routes
const ipRateMap = new Map<string, { count: number; resetTime: number }>();

// Purge expired rate limits every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of ipRateMap.entries()) {
    if (data.resetTime <= now) {
      ipRateMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);

/**
 * Strict Rate Limiter for Authentication & Sensitive Endpoints
 * Prevents high-frequency bot probing, credential stuffing, and volumetric DoS
 */
export const authRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '127.0.0.1';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 45; // Max 45 requests per minute per IP for auth routes

  let data = ipRateMap.get(ip);
  if (!data || data.resetTime <= now) {
    data = { count: 1, resetTime: now + windowMs };
    ipRateMap.set(ip, data);
  } else {
    data.count += 1;
    if (data.count > maxRequests) {
      return res.status(429).json({
        error: 'Too many requests from this network. Please wait a moment before trying again.',
        retryAfter: Math.ceil((data.resetTime - now) / 1000)
      });
    }
  }

  next();
};

/**
 * Double-Submit Cookie Anti-CSRF Protection Middleware (Zoho IAM Pattern)
 * Validates X-CSRF-TOKEN / X-ZCSRF-TOKEN header against _zcsr_tmp cookie
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  const isProd = process.env.NODE_ENV === 'production';

  // 1. On safe requests, automatically provision or refresh the CSRF cookie if absent
  if (safeMethods.includes(req.method)) {
    if (!req.cookies || !req.cookies['_zcsr_tmp']) {
      const csrfToken = securityService.generateCsrfToken();
      res.cookie('_zcsr_tmp', csrfToken, {
        httpOnly: false,
        secure: isProd,
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60 * 1000
      });
      res.setHeader('X-CSRF-TOKEN', csrfToken);
    }
    return next();
  }

  // 2. Exemptions for public registration & OTP endpoints where user session doesn't exist yet
  const exemptPaths = [
    '/api/auth/login',
    '/api/auth/send-otp',
    '/api/auth/verify-otp',
    '/api/auth/send-dual-otp',
    '/api/auth/verify-dual-otp',
    '/api/auth/complete-manual-registration',
    '/api/auth/google',
    '/api/auth/encryption-key',
    '/api/admin/analytics/track',
    '/api/trial/claim'
  ];

  if (exemptPaths.some((p) => req.originalUrl.startsWith(p))) {
    return next();
  }

  // 3. For state-changing requests, inspect CSRF headers
  const headerToken = (req.headers['x-csrf-token'] || req.headers['x-zcsrf-token']) as string;
  const cookieToken = req.cookies && req.cookies['_zcsr_tmp'];

  // If request uses browser cookies (e.g. session cookie), CSRF is strictly mandatory
  const hasSessionCookie = Boolean(req.cookies && req.cookies['amitastro_session']);

  if (hasSessionCookie) {
    if (!headerToken || !cookieToken || !securityService.timingSafeCompare(headerToken, cookieToken)) {
      return res.status(403).json({
        error: 'Security verification failed: CSRF token mismatch or missing. Please refresh and try again.'
      });
    }
  } else if (headerToken && cookieToken) {
    // If client supplied both, enforce validation
    if (!securityService.timingSafeCompare(headerToken, cookieToken)) {
      return res.status(403).json({
        error: 'Security verification failed: Invalid CSRF token.'
      });
    }
  }

  next();
};

/**
 * Audit Logger for Security-Relevant Operations
 */
export const logSecurityEvent = async (adminOrUserId?: string | null, action: string = 'SECURITY_EVENT', details: string = '', targetId?: string) => {
  try {
    const id = `audit-${uuidv4().substring(0, 8)}`;
    await runQuery(`
      INSERT INTO audit_logs (id, admin_id, action, target_type, target_id, details)
      VALUES (?, ?, ?, 'security', ?, ?)
    `, [id, adminOrUserId || 'system', action, targetId || null, details]);
  } catch (err) {
    console.error('[SecurityAudit] Failed to record audit log:', err);
  }
};
