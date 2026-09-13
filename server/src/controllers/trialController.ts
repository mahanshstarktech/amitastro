import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getOne, runQuery } from '../db/database';

export const getTrialStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const user = await getOne<any>('SELECT phone, trial_used, trial_seconds_remaining FROM users WHERE id = ?', [userId]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if phone number was ever used for trial on ANY account
    const phoneHistory = await getOne<any>(
      'SELECT id FROM users WHERE phone = ? AND trial_used = 1',
      [user.phone]
    );

    const isEligible = !user.trial_used && !phoneHistory && user.trial_seconds_remaining > 0;

    return res.json({
      isEligible,
      trialUsed: !!user.trial_used || !!phoneHistory,
      secondsRemaining: user.trial_seconds_remaining,
      totalTrialSeconds: 300 // 5 minutes
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const deductTrialTime = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { secondsDeducted } = req.body;
    const deduct = Math.max(1, parseInt(secondsDeducted, 10) || 5);

    const user = await getOne<any>('SELECT phone, trial_used, trial_seconds_remaining FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.trial_used || user.trial_seconds_remaining <= 0) {
      return res.json({
        isCutoff: true,
        secondsRemaining: 0,
        message: 'Trial period has ended.'
      });
    }

    const newSeconds = Math.max(0, user.trial_seconds_remaining - deduct);
    const isCutoff = newSeconds === 0;

    await runQuery(`
      UPDATE users SET
        trial_seconds_remaining = ?,
        trial_used = CASE WHEN ? = 0 THEN 1 ELSE trial_used END
      WHERE id = ?
    `, [newSeconds, newSeconds, userId]);

    // If cutoff, lock chat as well
    if (isCutoff) {
      await runQuery('UPDATE chat_conversations SET is_locked = 1 WHERE customer_id = ?', [userId]);
    }

    return res.json({
      isCutoff,
      secondsRemaining: newSeconds,
      warningOneMin: newSeconds <= 60 && newSeconds > 0
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
