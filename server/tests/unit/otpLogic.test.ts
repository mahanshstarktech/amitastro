import { describe, it, expect } from 'vitest';

export function generate6DigitOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function validateOtpAttempt(
  record: { code: string; expires_at: number; attempts: number } | null,
  submittedCode: string,
  now: number = Date.now()
): { success: boolean; status: number; error?: string } {
  if (!record) {
    return { success: false, status: 400, error: 'No OTP requested for this phone/email' };
  }

  if (now > record.expires_at) {
    return { success: false, status: 400, error: 'OTP has expired. Please request a new one.' };
  }

  if (record.attempts >= 5) {
    return { success: false, status: 429, error: 'Too many incorrect attempts. Please request a new OTP.' };
  }

  if (record.code !== submittedCode.trim()) {
    return { success: false, status: 400, error: 'Invalid OTP code. Please check and re-enter.' };
  }

  return { success: true, status: 200 };
}

describe('Unit: OTP Generation, TTL and Attempt Thresholds', () => {
  it('generates a 6-digit numeric string within 100000 and 999999', () => {
    for (let i = 0; i < 50; i++) {
      const otp = generate6DigitOtp();
      expect(otp).toHaveLength(6);
      expect(/^\d{6}$/.test(otp)).toBe(true);
      const num = Number(otp);
      expect(num).toBeGreaterThanOrEqual(100000);
      expect(num).toBeLessThanOrEqual(999999);
    }
  });

  it('validates correct code within the 90-second validity window', () => {
    const now = Date.now();
    const record = { code: '482910', expires_at: now + 90_000, attempts: 0 };
    const res = validateOtpAttempt(record, '482910', now + 10_000); // 10s later
    expect(res.success).toBe(true);
    expect(res.status).toBe(200);
  });

  it('rejects expired OTP code (> 90 seconds)', () => {
    const now = Date.now();
    const record = { code: '482910', expires_at: now + 90_000, attempts: 0 };
    const res = validateOtpAttempt(record, '482910', now + 95_000); // 95s later (expired)
    expect(res.success).toBe(false);
    expect(res.status).toBe(400);
    expect(res.error).toContain('OTP has expired');
  });

  it('blocks attempt and returns 429 when attempt threshold reaches 5', () => {
    const now = Date.now();
    const record = { code: '482910', expires_at: now + 60_000, attempts: 5 };
    const res = validateOtpAttempt(record, '482910', now);
    expect(res.success).toBe(false);
    expect(res.status).toBe(429);
    expect(res.error).toContain('Too many incorrect attempts');
  });

  it('returns invalid error when code does not match and attempts < 5', () => {
    const now = Date.now();
    const record = { code: '482910', expires_at: now + 60_000, attempts: 2 };
    const res = validateOtpAttempt(record, '999999', now);
    expect(res.success).toBe(false);
    expect(res.status).toBe(400);
    expect(res.error).toContain('Invalid OTP code');
  });
});
