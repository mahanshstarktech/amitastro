import { describe, it, expect } from 'vitest';

/**
 * Pure calculation logic mirroring trialController.ts
 */
function calculateTrialDeduction(currentSeconds: number, secondsDeducted: number): {
  newSeconds: number;
  isCutoff: boolean;
  warningOneMin: boolean;
} {
  const deduct = Math.max(1, secondsDeducted || 5);
  const newSeconds = Math.max(0, currentSeconds - deduct);
  const isCutoff = newSeconds === 0;
  const warningOneMin = newSeconds <= 60 && newSeconds > 0;

  return { newSeconds, isCutoff, warningOneMin };
}

function checkTrialEligibility(user: {
  phone: string;
  trialUsed: boolean;
  secondsRemaining: number;
}, phoneHistoryRecords: Array<{ phone: string; trialUsed: boolean }>): boolean {
  if (user.trialUsed) return false;
  if (user.secondsRemaining <= 0) return false;

  const phoneAlreadyUsed = phoneHistoryRecords.some(r => r.phone === user.phone && r.trialUsed);
  if (phoneAlreadyUsed) return false;

  return true;
}

describe('Unit: Trial Gate Logic (5-Minute Free Call Enforcement)', () => {
  it('deducts time correctly from initial 300-second allocation', () => {
    const result = calculateTrialDeduction(300, 10);
    expect(result.newSeconds).toBe(290);
    expect(result.isCutoff).toBe(false);
    expect(result.warningOneMin).toBe(false);
  });

  it('triggers 60-second warning flag when timer drops to 60 or below', () => {
    const at60 = calculateTrialDeduction(70, 10);
    expect(at60.newSeconds).toBe(60);
    expect(at60.warningOneMin).toBe(true);
    expect(at60.isCutoff).toBe(false);

    const at30 = calculateTrialDeduction(45, 15);
    expect(at30.newSeconds).toBe(30);
    expect(at30.warningOneMin).toBe(true);
    expect(at30.isCutoff).toBe(false);
  });

  it('triggers isCutoff = true and zeroes timer when decrement exceeds remaining time', () => {
    const cutoff = calculateTrialDeduction(10, 15);
    expect(cutoff.newSeconds).toBe(0);
    expect(cutoff.isCutoff).toBe(true);
    expect(cutoff.warningOneMin).toBe(false); // No warning once cutoff
  });

  it('enforces one-time trial eligibility per verified phone across distinct user accounts', () => {
    const phone = '+919811122233';

    // Account 1: fresh user, phone never seen
    const account1 = { phone, trialUsed: false, secondsRemaining: 300 };
    expect(checkTrialEligibility(account1, [])).toBe(true);

    // Account 1 finishes trial
    const phoneHistory = [{ phone, trialUsed: true }];

    // Account 2 created with identical phone number trying to abuse free trial
    const account2 = { phone, trialUsed: false, secondsRemaining: 300 };
    expect(checkTrialEligibility(account2, phoneHistory)).toBe(false);
  });
});
