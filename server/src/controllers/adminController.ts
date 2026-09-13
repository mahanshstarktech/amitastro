import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/auth';
import { getAll, getOne, runQuery } from '../db/database';

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const todayConfirmed = await getOne<any>(`
      SELECT COUNT(*) as count FROM appointments
      WHERE requested_date = ? AND status = 'Confirmed'
    `, [today]);

    const pendingRequests = await getOne<any>(`
      SELECT COUNT(*) as count FROM appointments WHERE status = 'Requested'
    `);

    const pendingPayments = await getOne<any>(`
      SELECT COUNT(*) as count FROM payments WHERE status = 'Pending'
    `);

    const totalCustomers = await getOne<any>(`
      SELECT COUNT(*) as count FROM users WHERE role = 'customer'
    `);

    const verifiedRevenue = await getOne<any>(`
      SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'Verified'
    `);

    const unreadChatTotal = await getOne<any>(`
      SELECT COALESCE(SUM(unread_admin_count), 0) as total FROM chat_conversations
    `);

    const recentAppointments = await getAll<any>(`
      SELECT a.*, u.name as customer_name, u.phone as customer_phone, p.name as package_name, p.price
      FROM appointments a
      JOIN users u ON a.customer_id = u.id
      JOIN packages p ON a.package_id = p.id
      ORDER BY a.created_at DESC
      LIMIT 5
    `);

    return res.json({
      metrics: {
        todayConfirmed: todayConfirmed?.count || 0,
        pendingRequests: pendingRequests?.count || 0,
        pendingPayments: pendingPayments?.count || 0,
        totalCustomers: totalCustomers?.count || 0,
        verifiedRevenue: verifiedRevenue?.total || 0,
        unreadChats: unreadChatTotal?.total || 0
      },
      recentAppointments
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const getCustomersCrm = async (req: AuthRequest, res: Response) => {
  try {
    const { search } = req.query;
    let sql = `
      SELECT 
        u.id, u.name, u.email, u.phone, u.trial_used, u.trial_seconds_remaining, u.created_at,
        crm.internal_notes, crm.tags_json,
        (SELECT COUNT(*) FROM appointments WHERE customer_id = u.id) as appointment_count,
        (SELECT COALESCE(SUM(p.amount), 0) FROM payments p WHERE p.user_id = u.id AND p.status = 'Verified') as total_spent
      FROM users u
      LEFT JOIN customer_crm_meta crm ON crm.user_id = u.id
      WHERE u.role = 'customer'
    `;
    const params: any[] = [];

    if (search) {
      sql += ' AND (u.name LIKE ? OR u.phone LIKE ? OR u.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY u.created_at DESC';

    const customers = await getAll<any>(sql, params);
    const parsed = customers.map(c => ({
      ...c,
      tags: JSON.parse(c.tags_json || '[]')
    }));

    return res.json({ customers: parsed });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const getCustomerDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = await getOne<any>('SELECT * FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const profiles = await getAll<any>('SELECT * FROM birth_profiles WHERE user_id = ?', [id]);
    const appointments = await getAll<any>(`
      SELECT a.*, p.name as package_name, p.price, p.duration_minutes
      FROM appointments a
      JOIN packages p ON a.package_id = p.id
      WHERE a.customer_id = ?
      ORDER BY a.created_at DESC
    `, [id]);
    const payments = await getAll<any>('SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC', [id]);
    const crm = await getOne<any>('SELECT * FROM customer_crm_meta WHERE user_id = ?', [id]);

    return res.json({
      customer: user,
      birthProfiles: profiles,
      appointments,
      payments,
      crm: {
        notes: crm?.internal_notes || '',
        tags: JSON.parse(crm?.tags_json || '[]')
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const updatePackage = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { price, durationMinutes, includes, isPopular } = req.body;

    await runQuery(`
      UPDATE packages SET
        price = COALESCE(?, price),
        duration_minutes = COALESCE(?, duration_minutes),
        includes_json = COALESCE(?, includes_json),
        is_popular = COALESCE(?, is_popular)
      WHERE id = ?
    `, [price, durationMinutes, includes ? JSON.stringify(includes) : null, isPopular !== undefined ? (isPopular ? 1 : 0) : null, id]);

    return res.json({ success: true, message: 'Package updated' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const getAvailabilitySettings = async (req: AuthRequest, res: Response) => {
  try {
    const rules = await getAll<any>('SELECT * FROM availability_rules ORDER BY weekday ASC');
    const blackoutDates = await getAll<any>('SELECT * FROM blackout_dates ORDER BY date ASC');
    return res.json({ rules, blackoutDates });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const updateAvailabilityRules = async (req: AuthRequest, res: Response) => {
  try {
    const { rules } = req.body; // Array of day rules
    if (Array.isArray(rules)) {
      for (const rule of rules) {
        await runQuery(`
          UPDATE availability_rules SET
            window1_start = ?,
            window1_end = ?,
            window2_start = ?,
            window2_end = ?,
            slot_duration = ?,
            buffer_time = ?,
            is_active = ?
          WHERE weekday = ?
        `, [
          rule.window1_start,
          rule.window1_end,
          rule.window2_start,
          rule.window2_end,
          rule.slot_duration,
          rule.buffer_time,
          rule.is_active ? 1 : 0,
          rule.weekday
        ]);
      }
    }
    return res.json({ success: true, message: 'Availability rules updated successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const addBlackoutDate = async (req: AuthRequest, res: Response) => {
  try {
    const { date, reason } = req.body;
    if (!date) return res.status(400).json({ error: 'Date is required' });

    const id = `bo-${uuidv4().substring(0, 8)}`;
    await runQuery(`
      INSERT INTO blackout_dates (id, date, reason)
      VALUES (?, ?, ?)
      ON CONFLICT(date) DO UPDATE SET reason = ?
    `, [id, date, reason || 'Unavailable', reason || 'Unavailable']);

    return res.status(201).json({ success: true, message: 'Blackout date added' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const removeBlackoutDate = async (req: AuthRequest, res: Response) => {
  try {
    const { date } = req.params;
    await runQuery('DELETE FROM blackout_dates WHERE date = ?', [date]);
    return res.json({ success: true, message: 'Blackout date removed' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const sendBroadcast = async (req: AuthRequest, res: Response) => {
  try {
    const { title, message, channels, targetSegment } = req.body;
    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }

    const broadcastId = `bc-${uuidv4().substring(0, 8)}`;
    await runQuery(`
      INSERT INTO broadcasts (id, title, message, channels_json, target_segment)
      VALUES (?, ?, ?, ?, ?)
    `, [broadcastId, title, message, JSON.stringify(channels || ['in_app']), targetSegment || 'all']);

    // Log action
    await runQuery(`
      INSERT INTO audit_logs (id, admin_id, action, target_type, target_id, details)
      VALUES (?, ?, 'BROADCAST_SENT', 'broadcast', ?, ?)
    `, [`audit-${uuidv4().substring(0, 8)}`, req.user!.id, broadcastId, `Broadcast: ${title}`]);

    return res.status(201).json({ success: true, message: 'Broadcast sent to selected customer channels!' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const getAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    // Simulated realistic funnel metrics
    const funnel = {
      visits: 4280,
      signups: 612,
      bookingRequests: 194,
      confirmed: 148,
      paid: 132
    };

    const packageDistribution = await getAll<any>(`
      SELECT p.name, p.price, COUNT(a.id) as booking_count
      FROM packages p
      LEFT JOIN appointments a ON a.package_id = p.id
      GROUP BY p.id
      ORDER BY booking_count DESC
    `);

    const topBlogPosts = await getAll<any>(`
      SELECT title, reading_time_min, published_at FROM blog_posts
      ORDER BY published_at DESC LIMIT 5
    `);

    const auditLogs = await getAll<any>(`
      SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 20
    `);

    return res.json({
      funnel,
      packageDistribution,
      topBlogPosts,
      auditLogs
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
