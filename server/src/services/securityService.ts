import crypto from 'crypto';
import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

interface KeyPairEntry {
  id: string;
  publicKey: string;
  privateKey: string;
  createdAt: number;
}

interface DecryptedPayload {
  password: string;
  timestamp: number;
  nonce: string;
}

interface AttemptTracker {
  attempts: number;
  lastAttempt: number;
  lockedUntil: number;
}

// ----------------------------------------------------------------------
// 1. DYNAMIC RSA PUBLIC-KEY ENCRYPTION ENGINE (ZASEC.encrypt equivalent)
// ----------------------------------------------------------------------
class SecurityEngine {
  private activeKey: KeyPairEntry;
  private keyHistory: Map<string, KeyPairEntry> = new Map();
  private seenNonces: Map<string, number> = new Map(); // Nonce -> Timestamp for Replay Defense
  private attemptTracker: Map<string, AttemptTracker> = new Map(); // Identifier/IP -> Attempt stats

  constructor() {
    this.activeKey = this.generateNewKeyPair();
    this.keyHistory.set(this.activeKey.id, this.activeKey);

    // Rotate RSA key every 6 hours
    setInterval(() => {
      this.rotateKeyPair();
    }, 6 * 60 * 60 * 1000);

    // Purge expired nonces every 60 seconds (nonces are valid for 2 minutes)
    setInterval(() => {
      this.purgeExpiredNonces();
      this.purgeExpiredAttempts();
    }, 60 * 1000);
  }

  private generateNewKeyPair(): KeyPairEntry {
    const id = `rsa_${uuidv4().replace(/-/g, '').substring(0, 16)}`;
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });

    return {
      id,
      publicKey,
      privateKey,
      createdAt: Date.now()
    };
  }

  private rotateKeyPair() {
    const nextKey = this.generateNewKeyPair();
    this.keyHistory.set(nextKey.id, nextKey);
    this.activeKey = nextKey;

    // Prune keys older than 24 hours
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    for (const [id, entry] of this.keyHistory.entries()) {
      if (entry.createdAt < cutoff && id !== this.activeKey.id) {
        this.keyHistory.delete(id);
      }
    }
  }

  /**
   * Returns active public key in PEM format for in-browser ZASEC-style encryption
   */
  public getActivePublicKey() {
    return {
      keyId: this.activeKey.id,
      publicKey: this.activeKey.publicKey,
      algorithm: 'RSA-OAEP-256',
      serverTime: Date.now()
    };
  }

  /**
   * Decrypts client payload encrypted with RSA-OAEP & SHA-256
   * Enforces Anti-Replay Timestamp Window and Nonce Cache
   */
  public decryptPayload(encryptedBase64: string, keyId?: string): string {
    const targetKey = (keyId && this.keyHistory.get(keyId)) || this.activeKey;
    if (!targetKey) {
      throw new Error('Encryption key expired or invalid. Please refresh the page and try again.');
    }

    try {
      const buffer = Buffer.from(encryptedBase64, 'base64');
      const decryptedBuffer = crypto.privateDecrypt(
        {
          key: targetKey.privateKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256'
        },
        buffer
      );

      const jsonStr = decryptedBuffer.toString('utf8');
      const parsed: DecryptedPayload = JSON.parse(jsonStr);

      if (!parsed.password) {
        throw new Error('Malformed payload structure: missing password component');
      }

      // 1. Anti-Replay: Verify Timestamp freshness (Window: 2 minutes)
      const now = Date.now();
      const timeDiff = Math.abs(now - (parsed.timestamp || 0));
      if (timeDiff > 120_000) {
        throw new Error('Authentication payload expired. Please submit again.');
      }

      // 2. Anti-Replay: Verify Nonce Uniqueness
      if (parsed.nonce) {
        if (this.seenNonces.has(parsed.nonce)) {
          throw new Error('Security alert: Replayed credentials detected. Request blocked.');
        }
        this.seenNonces.set(parsed.nonce, now);
      }

      return parsed.password;
    } catch (err: any) {
      if (err.message && err.message.includes('Security alert')) throw err;
      if (err.message && err.message.includes('Authentication payload expired')) throw err;
      throw new Error(`Failed to decrypt credentials: ${err.message || 'Ciphertext decryption error'}`);
    }
  }

  private purgeExpiredNonces() {
    const cutoff = Date.now() - 150_000; // 2.5 minutes
    for (const [nonce, time] of this.seenNonces.entries()) {
      if (time < cutoff) {
        this.seenNonces.delete(nonce);
      }
    }
  }

  // ----------------------------------------------------------------------
  // 2. BRUTE-FORCE, FRAUD & PROGRESSIVE ACCOUNT LOCKOUT ENGINE
  // ----------------------------------------------------------------------
  private getTrackerKey(identifier: string, ip: string): string {
    return `${identifier.toLowerCase().trim()}_@_${ip || 'unknown'}`;
  }

  public checkLockout(identifier: string, ip: string): { isLocked: boolean; remainingSeconds: number; attempts: number; requiresCaptcha: boolean } {
    const key = this.getTrackerKey(identifier, ip);
    const record = this.attemptTracker.get(key);
    if (!record) {
      return { isLocked: false, remainingSeconds: 0, attempts: 0, requiresCaptcha: false };
    }

    const now = Date.now();
    if (record.lockedUntil > now) {
      const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
      return { isLocked: true, remainingSeconds, attempts: record.attempts, requiresCaptcha: true };
    }

    return {
      isLocked: false,
      remainingSeconds: 0,
      attempts: record.attempts,
      requiresCaptcha: record.attempts >= 3
    };
  }

  public async recordFailedAttempt(identifier: string, ip: string): Promise<{ attempts: number; isLocked: boolean; delayMs: number }> {
    const key = this.getTrackerKey(identifier, ip);
    const now = Date.now();
    let record = this.attemptTracker.get(key);

    if (!record) {
      record = { attempts: 1, lastAttempt: now, lockedUntil: 0 };
    } else {
      record.attempts += 1;
      record.lastAttempt = now;
    }

    let delayMs = 0;
    // 3 to 4 attempts: enforce progressive delay (1.5s - 2.5s) to break fast automated scripts
    if (record.attempts >= 3 && record.attempts < 5) {
      delayMs = 1500 + (record.attempts - 3) * 1000;
    } else if (record.attempts >= 5) {
      // 5+ attempts: Lock account for 15 minutes
      record.lockedUntil = now + 15 * 60 * 1000;
    }

    this.attemptTracker.set(key, record);

    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    return {
      attempts: record.attempts,
      isLocked: record.lockedUntil > now,
      delayMs
    };
  }

  public resetFailedAttempts(identifier: string, ip: string) {
    const key = this.getTrackerKey(identifier, ip);
    this.attemptTracker.delete(key);
  }

  private purgeExpiredAttempts() {
    const now = Date.now();
    const cutoff = now - 30 * 60 * 1000; // 30 mins
    for (const [key, record] of this.attemptTracker.entries()) {
      if (record.lastAttempt < cutoff && record.lockedUntil <= now) {
        this.attemptTracker.delete(key);
      }
    }
  }

  // ----------------------------------------------------------------------
  // 3. CRYPTOGRAPHIC UTILITIES & TIMING-ATTACK DEFENSES
  // ----------------------------------------------------------------------
  /**
   * Constant-time string equality check to neutralize timing side-channel attacks
   */
  public timingSafeCompare(a?: string, b?: string): boolean {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    if (bufA.length !== bufB.length) {
      // Use constant time dummy comparison to avoid short-circuiting timing leak
      crypto.timingSafeEqual(bufA, bufA);
      return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
  }

  /**
   * Generates high-entropy CSRF double-submit token
   */
  public generateCsrfToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Issues hardened domain-scoped session cookies (HttpOnly, SameSite, Secure)
   */
  public setAuthSessionCookies(res: Response, token: string, csrfToken: string) {
    const isProd = process.env.NODE_ENV === 'production';

    // 1. Session Token Cookie: Strictly HttpOnly (neutralizes XSS token theft)
    res.cookie('amitastro_session', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    // 2. Anti-CSRF Cookie: Readable by JS to pass in X-CSRF-TOKEN header (Double-Submit Pattern)
    res.cookie('_zcsr_tmp', csrfToken, {
      httpOnly: false,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });
  }

  public clearAuthSessionCookies(res: Response) {
    res.clearCookie('amitastro_session', { path: '/' });
    res.clearCookie('_zcsr_tmp', { path: '/' });
    res.clearCookie('nakshaktram_session', { path: '/' });
  }
}

export const securityService = new SecurityEngine();
