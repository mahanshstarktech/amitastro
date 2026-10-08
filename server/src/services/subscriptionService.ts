import { v4 as uuidv4 } from 'uuid';
import { getOne, getAll, runQuery } from '../db/database';
import { logSecurityEvent } from '../middleware/security';

export type PlanType = 'free' | 'lite' | 'plus' | 'pro' | 'family';
export type PlanBadgeType = 'Free(Trial)' | 'Lite' | 'Plus' | 'Pro' | 'Family' | 'Admin';

export interface CountrySubscriptionPricing {
  countryCode: string;
  currency: string;
  currencySymbol: string;
  annualAmount: number;
  formattedAnnual: string;
  monthlyEquivalent: string;
  savingsNote: string;
}

export const SUBSCRIPTION_COUNTRY_PRICING: Record<string, CountrySubscriptionPricing> = {
  IN: {
    countryCode: 'IN',
    currency: 'INR',
    currencySymbol: '₹',
    annualAmount: 100000,
    formattedAnnual: '₹1,00,000 / year',
    monthlyEquivalent: '₹8,333 / month',
    savingsNote: 'Unlimited family consultations & 4 member charts included'
  },
  US: {
    countryCode: 'US',
    currency: 'USD',
    currencySymbol: '$',
    annualAmount: 1200,
    formattedAnnual: '$1,200 / year',
    monthlyEquivalent: '$100 / month',
    savingsNote: 'Unlimited family consultations & 4 member charts included'
  },
  DE: {
    countryCode: 'DE',
    currency: 'EUR',
    currencySymbol: '€',
    annualAmount: 1100,
    formattedAnnual: '€1,100 / year',
    monthlyEquivalent: '€91.60 / month',
    savingsNote: 'Unlimited family consultations & 4 member charts included'
  },
  EU: {
    countryCode: 'EU',
    currency: 'EUR',
    currencySymbol: '€',
    annualAmount: 1100,
    formattedAnnual: '€1,100 / year',
    monthlyEquivalent: '€91.60 / month',
    savingsNote: 'Unlimited family consultations & 4 member charts included'
  },
  GB: {
    countryCode: 'GB',
    currency: 'GBP',
    currencySymbol: '£',
    annualAmount: 950,
    formattedAnnual: '£950 / year',
    monthlyEquivalent: '£79.17 / month',
    savingsNote: 'Unlimited family consultations & 4 member charts included'
  },
  AE: {
    countryCode: 'AE',
    currency: 'AED',
    currencySymbol: 'AED ',
    annualAmount: 4400,
    formattedAnnual: '4,400 AED / year',
    monthlyEquivalent: '366.67 AED / month',
    savingsNote: 'Unlimited family consultations & 4 member charts included'
  },
  AU: {
    countryCode: 'AU',
    currency: 'AUD',
    currencySymbol: 'A$',
    annualAmount: 1850,
    formattedAnnual: 'A$1,850 / year',
    monthlyEquivalent: 'A$154.17 / month',
    savingsNote: 'Unlimited family consultations & 4 member charts included'
  },
  CA: {
    countryCode: 'CA',
    currency: 'CAD',
    currencySymbol: 'C$',
    annualAmount: 1650,
    formattedAnnual: 'C$1,650 / year',
    monthlyEquivalent: 'C$137.50 / month',
    savingsNote: 'Unlimited family consultations & 4 member charts included'
  },
  RU: {
    countryCode: 'RU',
    currency: 'RUB',
    currencySymbol: '₽',
    annualAmount: 110000,
    formattedAnnual: '₽1,10,000 / year',
    monthlyEquivalent: '₽9,166 / month',
    savingsNote: 'Unlimited family consultations & 4 member charts included'
  }
};

export class SubscriptionService {
  /**
   * Resolves country pricing for Family 360 Plan
   */
  public getPricingForCountry(countryCode?: string): CountrySubscriptionPricing {
    const code = (countryCode || 'IN').toUpperCase();
    return SUBSCRIPTION_COUNTRY_PRICING[code] || SUBSCRIPTION_COUNTRY_PRICING['IN'];
  }

  /**
   * Evaluates the authentic plan and badge for a user based on:
   * 1. Admin status -> 'Admin'
   * 2. Active Family 360 Subscription -> 'Family'
   * 3. Purchased Consultation Package history:
   *    - Premium -> 'Pro'
   *    - Standard -> 'Plus'
   *    - Quick Consult -> 'Lite'
   * 4. Free account -> 'Free(Trial)'
   */
  public async getUserPlanAndBadge(user: any): Promise<{
    plan: PlanType;
    planBadge: PlanBadgeType;
    isFamilySubscriber: boolean;
    subscriptionExpiresAt?: string | null;
    subscriptionAutopay?: boolean;
    daysRemaining?: number;
  }> {
    if (!user) {
      return {
        plan: 'free',
        planBadge: 'Free(Trial)',
        isFamilySubscriber: false
      };
    }

    let userObj = user;
    if (typeof user === 'string') {
      userObj = await getOne<any>('SELECT * FROM users WHERE id = ?', [user]);
      if (!userObj) {
        return {
          plan: 'free',
          planBadge: 'Free(Trial)',
          isFamilySubscriber: false
        };
      }
    }

    // 1. Admin check: Admins are 'Admin' with zero plan restrictions
    if (userObj.role === 'admin') {
      return {
        plan: 'family',
        planBadge: 'Admin',
        isFamilySubscriber: true,
        subscriptionAutopay: true
      };
    }

    // 2. Active Family 360 Subscription Check
    if (userObj.subscription_status === 'active' && userObj.subscription_expires_at) {
      const expiresEpoch = new Date(userObj.subscription_expires_at).getTime();
      const now = Date.now();

      if (expiresEpoch > now) {
        const daysRemaining = Math.ceil((expiresEpoch - now) / (1000 * 60 * 60 * 24));
        return {
          plan: 'family',
          planBadge: 'Family',
          isFamilySubscriber: true,
          subscriptionExpiresAt: userObj.subscription_expires_at,
          subscriptionAutopay: userObj.subscription_autopay !== 0,
          daysRemaining
        };
      } else {
        // Expired subscription - update database safely
        await runQuery(
          "UPDATE users SET subscription_status = 'expired' WHERE id = ?",
          [userObj.id]
        ).catch(() => {});
      }
    }

    // 3. One-Time Consultation Packages Check (Verified / Completed Appointments)
    const highestPurchased = await getOne<any>(`
      SELECT p.slug, p.price
      FROM appointments a
      JOIN packages p ON a.package_id = p.id
      WHERE a.customer_id = ? AND a.status IN ('Confirmed', 'Completed')
      ORDER BY p.price DESC
      LIMIT 1
    `, [userObj.id]).catch(() => null);

    if (highestPurchased) {
      if (highestPurchased.slug === 'premium' || highestPurchased.price >= 1799) {
        return {
          plan: 'pro',
          planBadge: 'Pro',
          isFamilySubscriber: false
        };
      }
      if (highestPurchased.slug === 'standard' || highestPurchased.price >= 999) {
        return {
          plan: 'plus',
          planBadge: 'Plus',
          isFamilySubscriber: false
        };
      }
      if (highestPurchased.slug === 'quick-consult' || highestPurchased.price >= 500) {
        return {
          plan: 'lite',
          planBadge: 'Lite',
          isFamilySubscriber: false
        };
      }
    }

    // 4. Fallback to explicit userObj.plan field if set
    if (userObj.plan === 'family') return { plan: 'family', planBadge: 'Family', isFamilySubscriber: true };
    if (userObj.plan === 'pro') return { plan: 'pro', planBadge: 'Pro', isFamilySubscriber: false };
    if (userObj.plan === 'plus') return { plan: 'plus', planBadge: 'Plus', isFamilySubscriber: false };
    if (userObj.plan === 'lite') return { plan: 'lite', planBadge: 'Lite', isFamilySubscriber: false };

    // 5. Default Free Account
    return {
      plan: 'free',
      planBadge: 'Free(Trial)',
      isFamilySubscriber: false
    };
  }

  /**
   * Strictly verifies if a user has an active Family 360 subscription.
   * Also returns current slots usage (family members count out of 4).
   */
  public async isUserFamilySubscribed(userId: string): Promise<{
    isSubscribed: boolean;
    plan: PlanType | 'admin';
    badge: PlanBadgeType;
    familySlotsTotal: number;
    familySlotsUsed: number;
    familySlotsRemaining: number;
    expiresAt?: string | null;
    autopayEnabled?: boolean;
    daysRemaining?: number;
    nextBillingAt?: string | null;
  }> {
    const user = await getOne<any>('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return {
        isSubscribed: false,
        plan: 'free',
        badge: 'Free(Trial)',
        familySlotsTotal: 4,
        familySlotsUsed: 0,
        familySlotsRemaining: 4
      };
    }

    // Count family members (relation != 'self')
    const familyCountRes = await getOne<any>(
      "SELECT COUNT(*) as cnt FROM birth_profiles WHERE user_id = ? AND relation != 'self'",
      [userId]
    );
    const familySlotsUsed = familyCountRes ? familyCountRes.cnt : 0;
    const familySlotsTotal = 4;
    const familySlotsRemaining = Math.max(0, familySlotsTotal - familySlotsUsed);

    // Admin has perpetual full access
    if (user.role === 'admin') {
      return {
        isSubscribed: true,
        plan: 'admin',
        badge: 'Admin',
        familySlotsTotal: 99,
        familySlotsUsed,
        familySlotsRemaining: 99,
        autopayEnabled: true
      };
    }

    // Subscription validation
    if (user.subscription_status === 'active' && user.subscription_expires_at) {
      const expiresEpoch = new Date(user.subscription_expires_at).getTime();
      const now = Date.now();

      if (expiresEpoch > now) {
        const daysRemaining = Math.ceil((expiresEpoch - now) / (1000 * 60 * 60 * 24));
        return {
          isSubscribed: true,
          plan: 'family',
          badge: 'Family',
          familySlotsTotal,
          familySlotsUsed,
          familySlotsRemaining,
          expiresAt: user.subscription_expires_at,
          autopayEnabled: user.subscription_autopay !== 0,
          daysRemaining,
          nextBillingAt: user.subscription_expires_at
        };
      }
    }

    return {
      isSubscribed: false,
      plan: user.plan || 'free',
      badge: user.plan_badge || 'Free(Trial)',
      familySlotsTotal,
      familySlotsUsed,
      familySlotsRemaining
    };
  }

  /**
   * Activates Family 360 Plan for 1 complete year with Netflix-style autopay
   */
  public async activateFamilySubscription(
    userId: string,
    options: {
      amount?: number;
      currency?: string;
      mandateRef?: string;
      adminId?: string;
    } = {}
  ): Promise<{ success: boolean; subscriptionId: string; expiresAt: string }> {
    const user = await getOne<any>('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) throw new Error('User not found');

    const now = new Date();
    const oneYearLater = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    const expiresAtStr = oneYearLater.toISOString();
    const subscriptionId = `sub-${uuidv4().substring(0, 8)}`;
    const mandateReference = options.mandateRef || `AMIT-AUTOPAY-${uuidv4().substring(0, 8).toUpperCase()}`;

    const amount = options.amount || 100000;
    const currency = options.currency || 'INR';

    // 1. Update user record
    await runQuery(`
      UPDATE users SET
        plan = 'family',
        plan_badge = 'Family',
        subscription_status = 'active',
        subscription_autopay = 1,
        subscription_cycle = 'yearly',
        subscription_expires_at = ?,
        subscription_id = ?,
        subscription_currency = ?,
        subscription_amount = ?
      WHERE id = ?
    `, [expiresAtStr, subscriptionId, currency, amount, userId]);

    // 2. Insert into subscriptions table
    await runQuery(`
      INSERT INTO subscriptions (
        id, user_id, plan, status, amount, currency, billing_cycle,
        autopay_enabled, current_period_start, current_period_end, next_billing_at, mandate_reference
      ) VALUES (?, ?, 'family_360', 'active', ?, ?, 'yearly', 1, ?, ?, ?, ?)
    `, [
      subscriptionId,
      userId,
      amount,
      currency,
      now.toISOString(),
      expiresAtStr,
      expiresAtStr,
      mandateReference
    ]);

    // 3. Security Audit Log
    logSecurityEvent(
      options.adminId || userId,
      'FAMILY_360_ACTIVATED',
      `Family 360 annual subscription activated for user ${user.email} (Expiry: ${expiresAtStr}, Autopay: Active, Amount: ${currency} ${amount})`,
      userId
    );

    return {
      success: true,
      subscriptionId,
      expiresAt: expiresAtStr
    };
  }

  /**
   * Toggles Netflix-style recurring autopay ON or OFF
   */
  public async toggleAutopay(userId: string, autopay: boolean): Promise<boolean> {
    const user = await getOne<any>('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) throw new Error('User not found');

    await runQuery(
      'UPDATE users SET subscription_autopay = ? WHERE id = ?',
      [autopay ? 1 : 0, userId]
    );

    await runQuery(
      'UPDATE subscriptions SET autopay_enabled = ? WHERE user_id = ? AND status = "active"',
      [autopay ? 1 : 0, userId]
    );

    logSecurityEvent(
      userId,
      'AUTOPAY_STATUS_CHANGED',
      `User ${user.email} changed subscription autopay to: ${autopay ? 'ENABLED' : 'PAUSED'}`,
      userId
    );

    return autopay;
  }

  /**
   * Cancels future renewals (keeps access alive until the active year ends)
   */
  public async cancelSubscription(userId: string): Promise<boolean> {
    const user = await getOne<any>('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) throw new Error('User not found');

    await runQuery(
      'UPDATE users SET subscription_autopay = 0 WHERE id = ?',
      [userId]
    );

    await runQuery(`
      UPDATE subscriptions SET
        autopay_enabled = 0,
        cancelled_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND status = 'active'
    `, [userId]);

    logSecurityEvent(
      userId,
      'SUBSCRIPTION_CANCELLED',
      `User ${user.email} disabled auto-renewal. Access preserved until ${user.subscription_expires_at}`,
      userId
    );

    return true;
  }

  /**
   * Resumes auto-renewal on an active subscription
   */
  public async resumeSubscription(userId: string): Promise<boolean> {
    return this.toggleAutopay(userId, true);
  }

  /**
   * Admin-only: Revokes a subscription immediately
   */
  public async revokeSubscription(userId: string, adminId: string, reason: string): Promise<boolean> {
    await runQuery(`
      UPDATE users SET
        plan = 'free',
        plan_badge = 'Free(Trial)',
        subscription_status = 'revoked',
        subscription_autopay = 0,
        subscription_expires_at = NULL
      WHERE id = ?
    `, [userId]);

    await runQuery(`
      UPDATE subscriptions SET
        status = 'revoked',
        cancelled_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `, [userId]);

    logSecurityEvent(
      adminId,
      'SUBSCRIPTION_REVOKED',
      `Admin revoked Family 360 subscription for user ID: ${userId}. Reason: ${reason}`,
      userId
    );

    return true;
  }
}

export const subscriptionService = new SubscriptionService();
