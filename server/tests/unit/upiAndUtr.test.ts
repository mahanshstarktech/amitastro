import { describe, it, expect } from 'vitest';
import { generateRealUpiIntent } from '../../src/services/realServices';

/**
 * UTR validation rule mirroring payment submission requirements
 */
export function validateBankUtr(utr: string): { isValid: boolean; error?: string } {
  if (!utr || typeof utr !== 'string') {
    return { isValid: false, error: 'UTR / Transaction Reference Number is required' };
  }
  const clean = utr.trim();
  if (clean.length !== 12) {
    return { isValid: false, error: 'UTR must be exactly 12 digits' };
  }
  if (!/^\d{12}$/.test(clean)) {
    return { isValid: false, error: 'UTR must contain only numeric digits' };
  }
  return { isValid: true };
}

describe('Unit: UPI Intent Generation & 12-Digit UTR Validation', () => {
  describe('UPI Intent URL Generation', () => {
    it('generates a standard NPCI compliant UPI URI with correct query parameters', () => {
      const data = {
        vpa: 'amitastro@hdfcbank',
        name: 'Amit Soni Astrologer',
        amount: 1799,
        transactionRef: 'TXN-998811',
        notes: 'Premium Kundli Analysis'
      };

      const result = generateRealUpiIntent(data);
      expect(result.intentUrl).toMatch(/^upi:\/\/pay\?/);
      expect(result.intentUrl).toContain('pa=amitastro@hdfcbank');
      expect(result.intentUrl).toContain('pn=Amit%20Soni%20Astrologer');
      expect(result.intentUrl).toContain('am=1799');
      expect(result.intentUrl).toContain('cu=INR');
      expect(result.intentUrl).toContain('tr=TXN-998811');
      expect(result.intentUrl).toContain('tn=Premium%20Kundli%20Analysis');

      expect(result.qrUrl).toContain('api.qrserver.com');
      expect(result.qrUrl).toContain(encodeURIComponent(result.intentUrl));
    });

    it('correctly handles special characters and emojis in payee name or notes', () => {
      const data = {
        vpa: 'amitastro@okaxis',
        name: 'Amit & Associates',
        amount: 999,
        transactionRef: 'REF/2026/01',
        notes: 'Kundli + Vastu ✨ Consultation'
      };

      const result = generateRealUpiIntent(data);
      expect(result.intentUrl).toContain('pn=Amit%20%26%20Associates');
      expect(result.intentUrl).toContain('tn=Kundli%20%2B%20Vastu%20%E2%9C%A8%20Consultation');
    });
  });

  describe('12-Digit UTR Verification Boundary Tests', () => {
    it('accepts valid 12-digit numeric UTRs', () => {
      expect(validateBankUtr('425981029384').isValid).toBe(true);
      expect(validateBankUtr('001122334455').isValid).toBe(true);
      expect(validateBankUtr('  425981029384  ').isValid).toBe(true); // Trims whitespace
    });

    it('rejects UTRs with letters or alphanumeric codes', () => {
      const res = validateBankUtr('42598102938A');
      expect(res.isValid).toBe(false);
      expect(res.error).toBe('UTR must contain only numeric digits');
    });

    it('rejects short UTRs (< 12 digits)', () => {
      const res = validateBankUtr('12345678901'); // 11 digits
      expect(res.isValid).toBe(false);
      expect(res.error).toBe('UTR must be exactly 12 digits');
    });

    it('rejects long UTRs (> 12 digits)', () => {
      const res = validateBankUtr('1234567890123'); // 13 digits
      expect(res.isValid).toBe(false);
      expect(res.error).toBe('UTR must be exactly 12 digits');
    });

    it('rejects empty or whitespace-only inputs', () => {
      expect(validateBankUtr('').isValid).toBe(false);
      expect(validateBankUtr('   ').isValid).toBe(false);
    });
  });
});
