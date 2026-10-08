import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { subscriptionService, SUBSCRIPTION_COUNTRY_PRICING } from '../services/subscriptionService';
import { getOne, getAll, runQuery } from '../db/database';
import { v4 as uuidv4 } from 'uuid';
import { sendTelegramAdminAlert } from '../services/realServices';

/**
 * Public/User: Get Family 360 Plan configuration and international pricing
 */
export const getSubscriptionConfig = async (req: any, res: Response) => {
  try {
    const country = (req.query.country as string) || 'IN';
    const activePricing = subscriptionService.getPricingForCountry(country);

    return res.json({
      planId: 'family-360',
      name: 'Family 360 Plan',
      badge: 'Family',
      billingCycle: 'yearly',
      isAutopay: true,
      country: activePricing.countryCode,
      currency: activePricing.currency,
      currencySymbol: activePricing.currencySymbol,
      annualAmount: activePricing.annualAmount,
      formattedAnnual: activePricing.formattedAnnual,
      monthlyEquivalent: activePricing.monthlyEquivalent,
      savingsNote: activePricing.savingsNote,
      maxFamilyMembers: 4,
      features: [
        '1-Year Unlimited Consultations with Amit Soni',
        'Add Up to 4 Family Members (Spouse, Children, Parents)',
        'Full Vedic Kundli & Dasha Breakdown for Every Member',
        'Direct VIP Follow-up Chat & Priority Hotline',
        'Comprehensive Annual Remedies, Gemstone & Vastu Audit',
        'Netflix-Style Autopay with Flexible One-Click Cancellation'
      ],
      allCountryPricing: SUBSCRIPTION_COUNTRY_PRICING
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Authenticated: Get my current subscription and plan badge details
 */
export const getMySubscription = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const user = await getOne<any>('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const planInfo = await subscriptionService.getUserPlanAndBadge(user);
    const familyInfo = await subscriptionService.isUserFamilySubscribed(userId);

    const subscriptionRecord = await getOne<any>(
      'SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [userId]
    );

    const familyProfiles = await getAll<any>(
      "SELECT id, full_name, relation, dob, pob FROM birth_profiles WHERE user_id = ? AND relation != 'self' ORDER BY created_at ASC",
      [userId]
    );

    return res.json({
      plan: planInfo.plan,
      planBadge: planInfo.planBadge,
      isFamilySubscriber: familyInfo.isSubscribed,
      familySlots: {
        total: familyInfo.familySlotsTotal,
        used: familyInfo.familySlotsUsed,
        remaining: familyInfo.familySlotsRemaining,
        profiles: familyProfiles
      },
      subscription: {
        status: user.subscription_status || 'none',
        autopayEnabled: !!user.subscription_autopay,
        expiresAt: user.subscription_expires_at || null,
        daysRemaining: planInfo.daysRemaining || 0,
        amount: user.subscription_amount || 100000,
        currency: user.subscription_currency || 'INR',
        mandateReference: subscriptionRecord ? subscriptionRecord.mandate_reference : null,
        currentPeriodStart: subscriptionRecord ? subscriptionRecord.current_period_start : null,
        nextBillingAt: user.subscription_expires_at || null
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Authenticated: Initiate or submit payment proof for Family 360 subscription
 */
export const subscribeFamily = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { countryCode, utrReference, paymentMethod, screenshotUrl } = req.body;

    const pricing = subscriptionService.getPricingForCountry(countryCode);
    const user = await getOne<any>('SELECT * FROM users WHERE id = ?', [userId]);

    // Check if user is already an active subscriber
    const currentSub = await subscriptionService.isUserFamilySubscribed(userId);
    if (currentSub.isSubscribed && req.user!.role !== 'admin') {
      return res.status(400).json({
        error: 'You already have an active Family 360 subscription valid until ' + currentSub.expiresAt
      });
    }

    const payId = `pay-${uuidv4().substring(0, 8)}`;
    const subId = `sub-order-${uuidv4().substring(0, 8)}`;

    await runQuery(`
      INSERT INTO payments (
        id, appointment_id, user_id, amount, payment_method, utr_reference,
        screenshot_url, status, subscription_id
      ) VALUES (?, NULL, ?, ?, ?, ?, ?, 'Pending', ?)
    `, [
      payId,
      userId,
      pricing.annualAmount,
      paymentMethod || 'upi_autopay',
      utrReference || `AUTOPAY-${Date.now()}`,
      screenshotUrl || null,
      subId
    ]);

    // Alert Admin via Telegram
    sendTelegramAdminAlert(
      `👑 *NEW FAMILY 360 SUBSCRIPTION ORDER*\n` +
      `• User: ${user.name} (${user.email || user.phone})\n` +
      `• Amount: ${pricing.currencySymbol}${pricing.annualAmount.toLocaleString()} / year (Autopay)\n` +
      `• Reference / UTR: \`${utrReference || 'Autopay Setup'}\`\n` +
      `• Action: Please verify in Admin Portal to activate 1-Year Family Pass.`
    ).catch(() => {});

    return res.json({
      success: true,
      paymentId: payId,
      subscriptionOrderId: subId,
      amount: pricing.annualAmount,
      currency: pricing.currency,
      message: 'Subscription request registered! Your 1-Year Family 360 membership with Autopay will activate upon confirmation.'
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Authenticated: Toggle Netflix-style autopay
 */
export const toggleAutopay = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { autopay } = req.body;

    const updated = await subscriptionService.toggleAutopay(userId, !!autopay);
    return res.json({
      success: true,
      autopayEnabled: updated,
      message: updated
        ? 'Autopay successfully enabled. Your annual Family 360 plan will renew automatically.'
        : 'Autopay paused. Your plan will remain active until the current subscription year ends.'
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Authenticated: Cancel future auto-renewals
 */
export const cancelSubscription = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    await subscriptionService.cancelSubscription(userId);
    return res.json({
      success: true,
      message: 'Auto-renewal cancelled. You will continue to have full Family 360 access until the end of your billing cycle.'
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Authenticated: Resume auto-renewal
 */
export const resumeSubscription = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    await subscriptionService.resumeSubscription(userId);
    return res.json({
      success: true,
      message: 'Family 360 auto-renewal resumed successfully!'
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Admin: Get all subscribers
 */
export const adminGetSubscriptions = async (req: AuthRequest, res: Response) => {
  try {
    const subscribers = await getAll<any>(`
      SELECT 
        u.id as user_id,
        u.name,
        u.email,
        u.phone,
        u.plan,
        u.plan_badge,
        u.subscription_status,
        u.subscription_autopay,
        u.subscription_expires_at,
        u.subscription_amount,
        u.subscription_currency,
        s.id as subscription_id,
        s.current_period_start,
        s.current_period_end,
        s.mandate_reference,
        (SELECT COUNT(*) FROM birth_profiles bp WHERE bp.user_id = u.id AND bp.relation != 'self') as family_members_count
      FROM users u
      LEFT JOIN subscriptions s ON u.id = s.user_id
      WHERE u.subscription_status = 'active' OR u.plan = 'family'
      ORDER BY u.created_at DESC
    `);

    return res.json({ subscribers });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Admin: Manually grant Family 360 membership to a customer
 */
export const adminGrantFamilyPlan = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user!.id;
    const { userId } = req.params;
    const { amount, currency } = req.body;

    const result = await subscriptionService.activateFamilySubscription(userId, {
      adminId,
      amount: amount || 100000,
      currency: currency || 'INR'
    });

    return res.json({
      message: 'Family 360 annual plan successfully granted to customer!',
      ...result
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Admin: Manually revoke subscription
 */
export const adminRevokeFamilyPlan = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user!.id;
    const { userId } = req.params;
    const { reason } = req.body;

    await subscriptionService.revokeSubscription(userId, adminId, reason || 'Admin manual revocation');
    return res.json({
      success: true,
      message: 'Subscription successfully revoked.'
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
