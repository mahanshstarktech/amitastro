import { describe, it, expect } from 'vitest';
import { subscriptionService, SUBSCRIPTION_COUNTRY_PRICING } from '../../src/services/subscriptionService';

describe('Unit: SubscriptionService & Tier Badges', () => {
  describe('Country Pricing Resolution', () => {
    it('resolves correct currencies and amounts for all 9 international regions', () => {
      const regions = [
        { code: 'IN', currency: 'INR', amount: 100000 },
        { code: 'US', currency: 'USD', amount: 1200 },
        { code: 'GB', currency: 'GBP', amount: 950 },
        { code: 'DE', currency: 'EUR', amount: 1100 },
        { code: 'EU', currency: 'EUR', amount: 1100 },
        { code: 'AE', currency: 'AED', amount: 4400 },
        { code: 'AU', currency: 'AUD', amount: 1850 },
        { code: 'CA', currency: 'CAD', amount: 1650 },
        { code: 'RU', currency: 'RUB', amount: 110000 }
      ];

      for (const r of regions) {
        const pricing = subscriptionService.getPricingForCountry(r.code);
        expect(pricing).toBeDefined();
        expect(pricing.currency).toBe(r.currency);
        expect(pricing.annualAmount).toBe(r.amount);
      }
    });

    it('falls back safely to India (IN) for unknown or undefined country codes', () => {
      const fallbackUnknown = subscriptionService.getPricingForCountry('ZZ');
      expect(fallbackUnknown.countryCode).toBe('IN');
      expect(fallbackUnknown.currency).toBe('INR');

      const fallbackUndefined = subscriptionService.getPricingForCountry(undefined);
      expect(fallbackUndefined.countryCode).toBe('IN');
    });
  });

  describe('User Plan & Badge Derivation', () => {
    it('assigns Admin badge for admin role', async () => {
      const adminUser = { role: 'admin', plan: 'family', plan_badge: 'Family' };
      const info = await subscriptionService.getUserPlanAndBadge(adminUser);
      expect(info.planBadge).toBe('Admin');
    });

    it('assigns Free(Trial) badge for newly registered users with no subscriptions', async () => {
      const freeUser = { role: 'customer', plan: 'free', plan_badge: 'Free(Trial)' };
      const info = await subscriptionService.getUserPlanAndBadge(freeUser);
      expect(info.planBadge).toBe('Free(Trial)');
      expect(info.isFamilySubscriber).toBe(false);
    });

    it('derives Pro, Plus, and Lite badges from user plan property', async () => {
      const proUser = { role: 'customer', plan: 'pro', plan_badge: 'Pro' };
      const plusUser = { role: 'customer', plan: 'plus', plan_badge: 'Plus' };
      const liteUser = { role: 'customer', plan: 'lite', plan_badge: 'Lite' };

      expect((await subscriptionService.getUserPlanAndBadge(proUser)).planBadge).toBe('Pro');
      expect((await subscriptionService.getUserPlanAndBadge(plusUser)).planBadge).toBe('Plus');
      expect((await subscriptionService.getUserPlanAndBadge(liteUser)).planBadge).toBe('Lite');
    });
  });
});
