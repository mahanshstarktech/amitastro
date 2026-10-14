import { describe, it, expect, beforeEach } from 'vitest';
import crypto from 'crypto';
import { securityService } from '../../src/services/securityService';

describe('Unit: SecurityService (Zoho IAM-Grade Engine)', () => {
  beforeEach(() => {
    securityService.resetFailedAttempts('test@example.com', '127.0.0.1');
  });

  describe('RSA Public Key Retrieval and Structure', () => {
    it('returns an active 2048-bit RSA public key with correct metadata', () => {
      const keyData = securityService.getActivePublicKey();
      expect(keyData).toBeDefined();
      expect(keyData.keyId).toMatch(/^rsa_[a-f0-9]{16}/);
      expect(keyData.publicKey).toContain('-----BEGIN PUBLIC KEY-----');
      expect(keyData.algorithm).toBe('RSA-OAEP-256');
      expect(keyData.serverTime).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('RSA-OAEP Encryption/Decryption Round Trip & Anti-Replay', () => {
    function encryptWithActiveKey(payload: { password: string; timestamp: number; nonce: string }, keyId?: string) {
      const activeKey = securityService.getActivePublicKey();
      const targetPublicKey = activeKey.publicKey;

      const buffer = Buffer.from(JSON.stringify(payload), 'utf8');
      const encrypted = crypto.publicEncrypt(
        {
          key: targetPublicKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256'
        },
        buffer
      );

      return {
        cipherBase64: encrypted.toString('base64'),
        keyId: activeKey.keyId
      };
    }

    it('successfully decrypts a freshly encrypted password payload', () => {
      const nonce = crypto.randomUUID();
      const { cipherBase64, keyId } = encryptWithActiveKey({
        password: 'SuperSecretPassword@2026',
        timestamp: Date.now(),
        nonce
      });

      const decrypted = securityService.decryptPayload(cipherBase64, keyId);
      expect(decrypted).toBe('SuperSecretPassword@2026');
    });

    it('rejects an expired payload older than 2 minutes', () => {
      const nonce = crypto.randomUUID();
      const expiredTimestamp = Date.now() - 130_000; // 130 seconds ago (> 120s limit)
      const { cipherBase64, keyId } = encryptWithActiveKey({
        password: 'ExpiredPassword@123',
        timestamp: expiredTimestamp,
        nonce
      });

      expect(() => securityService.decryptPayload(cipherBase64, keyId)).toThrow(
        /Authentication payload expired/
      );
    });

    it('rejects replayed credentials using the same nonce twice', () => {
      const nonce = `nonce-${crypto.randomUUID()}`;
      const { cipherBase64, keyId } = encryptWithActiveKey({
        password: 'ReplayTargetPassword',
        timestamp: Date.now(),
        nonce
      });

      // First decryption succeeds
      const first = securityService.decryptPayload(cipherBase64, keyId);
      expect(first).toBe('ReplayTargetPassword');

      // Second decryption with identical nonce must fail
      expect(() => securityService.decryptPayload(cipherBase64, keyId)).toThrow(
        /Replayed credentials detected/
      );
    });

    it('throws error when keyId does not exist in key history', () => {
      const nonce = crypto.randomUUID();
      const { cipherBase64 } = encryptWithActiveKey({
        password: 'Password',
        timestamp: Date.now(),
        nonce
      });

      expect(() => securityService.decryptPayload(cipherBase64, 'non-existent-key-id')).toThrow(
        /Encryption key expired or invalid/
      );
    });
  });

  describe('Brute-Force & Progressive Account Lockout', () => {
    const email = 'victim@example.com';
    const ip = '192.168.1.100';

    beforeEach(() => {
      securityService.resetFailedAttempts(email, ip);
    });

    it('starts with 0 attempts and not locked', () => {
      const status = securityService.checkLockout(email, ip);
      expect(status.isLocked).toBe(false);
      expect(status.attempts).toBe(0);
    });

    it('progressively tracks failed attempts and locks after 5 consecutive failures', async () => {
      for (let i = 1; i <= 4; i++) {
        const attempt = await securityService.recordFailedAttempt(email, ip);
        expect(attempt.attempts).toBe(i);
        expect(attempt.isLocked).toBe(false);
      }

      // 5th failed attempt triggers 15-minute lockout
      const fifthAttempt = await securityService.recordFailedAttempt(email, ip);
      expect(fifthAttempt.attempts).toBe(5);
      expect(fifthAttempt.isLocked).toBe(true);

      const status = securityService.checkLockout(email, ip);
      expect(status.isLocked).toBe(true);
      expect(status.remainingSeconds).toBeGreaterThan(800); // ~900s
    });

    it('resets failed attempts upon successful login', async () => {
      await securityService.recordFailedAttempt(email, ip);
      await securityService.recordFailedAttempt(email, ip);
      expect(securityService.checkLockout(email, ip).attempts).toBe(2);

      securityService.resetFailedAttempts(email, ip);
      expect(securityService.checkLockout(email, ip).attempts).toBe(0);
      expect(securityService.checkLockout(email, ip).isLocked).toBe(false);
    });
  });

  describe('CSRF Token Generation and Constant-Time Comparison', () => {
    it('generates a 64-character high-entropy hex token', () => {
      const token1 = securityService.generateCsrfToken();
      const token2 = securityService.generateCsrfToken();
      expect(token1).toHaveLength(64);
      expect(token2).toHaveLength(64);
      expect(token1).not.toBe(token2);
    });

    it('timingSafeCompare correctly compares equal and unequal strings', () => {
      const token = securityService.generateCsrfToken();
      expect(securityService.timingSafeCompare(token, token)).toBe(true);
      expect(securityService.timingSafeCompare(token, token.slice(0, 63) + 'x')).toBe(false);
      expect(securityService.timingSafeCompare(token, 'short-string')).toBe(false);
      expect(securityService.timingSafeCompare(undefined, token)).toBe(false);
      expect(securityService.timingSafeCompare('', '')).toBe(false);
    });
  });

  describe('Auth Session Cookie Configuration', () => {
    it('sets session and csrf cookies with strict maxAge, path and security flags', () => {
      const cookieCalls: Record<string, { val: string; opts: any }> = {};
      const mockRes: any = {
        cookie: (name: string, val: string, opts: any) => {
          cookieCalls[name] = { val, opts };
        }
      };

      securityService.setAuthSessionCookies(mockRes, 'test-jwt-token', 'test-csrf-token');

      // Verify Session Cookie
      expect(cookieCalls['amitastro_session']).toBeDefined();
      expect(cookieCalls['amitastro_session'].val).toBe('test-jwt-token');
      expect(cookieCalls['amitastro_session'].opts.httpOnly).toBe(true);
      expect(cookieCalls['amitastro_session'].opts.sameSite).toBe('lax');
      expect(cookieCalls['amitastro_session'].opts.path).toBe('/');
      expect(cookieCalls['amitastro_session'].opts.maxAge).toBe(30 * 24 * 60 * 60 * 1000);

      // Verify CSRF Cookie
      expect(cookieCalls['_zcsr_tmp']).toBeDefined();
      expect(cookieCalls['_zcsr_tmp'].val).toBe('test-csrf-token');
      expect(cookieCalls['_zcsr_tmp'].opts.httpOnly).toBe(false);
      expect(cookieCalls['_zcsr_tmp'].opts.sameSite).toBe('lax');
      expect(cookieCalls['_zcsr_tmp'].opts.path).toBe('/');
      expect(cookieCalls['_zcsr_tmp'].opts.maxAge).toBe(30 * 24 * 60 * 60 * 1000);
    });

    it('clears all session cookies with root path on logout', () => {
      const clearedCookies: Record<string, any> = {};
      const mockRes: any = {
        clearCookie: (name: string, opts: any) => {
          clearedCookies[name] = opts;
        }
      };

      securityService.clearAuthSessionCookies(mockRes);
      expect(clearedCookies['amitastro_session']).toEqual({ path: '/' });
      expect(clearedCookies['_zcsr_tmp']).toEqual({ path: '/' });
      expect(clearedCookies['nakshaktram_session']).toEqual({ path: '/' });
    });
  });
});
