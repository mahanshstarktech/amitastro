import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/auth';
import { getAll, getOne, runQuery } from '../db/database';
import { sendTelegramAdminAlert } from '../services/realServices';

// Follow-up days per package slug
const FOLLOWUP_DAYS_MAP: Record<string, number> = {
  'quick-consult': 0,
  'standard': 3,
  'premium': 7,
  'trial': 0
};

export const getPackages = async (req: any, res: Response) => {
  try {
    const packages = await getAll<any>('SELECT * FROM packages ORDER BY price ASC');
    const parsed = packages.map(pkg => ({
      ...pkg,
      includes: JSON.parse(pkg.includes_json || '[]'),
      followupDays: FOLLOWUP_DAYS_MAP[pkg.slug] || 0
    }));
    return res.json({ packages: parsed });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const getAvailability = async (req: any, res: Response) => {
  try {
    const rules = await getAll<any>('SELECT * FROM availability_rules WHERE is_active = 1 ORDER BY weekday ASC');
    const blackoutDates = await getAll<any>('SELECT * FROM blackout_dates ORDER BY date ASC');

    return res.json({
      workingWindows: rules,
      blackoutDates: blackoutDates.map(b => b.date),
      defaultWindowsIST: [
        { name: 'Morning / Afternoon', start: '09:00', end: '17:00' },
        { name: 'Evening / Night', start: '20:00', end: '23:59' }
      ],
      timeWindows: [
        '09:00 AM - 11:00 AM',
        '11:00 AM - 01:00 PM',
        '02:00 PM - 04:00 PM',
        '04:00 PM - 05:00 PM',
        '08:00 PM - 10:00 PM',
        '10:00 PM - 12:00 AM'
      ],
      bufferMinutes: 10
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const createAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const customerId = req.user!.id;
    const {
      birthProfileId,
      packageId,
      consultationType,
      requestedDate,
      requestedTimeWindow,
      timezoneUser,
      customerNotes
    } = req.body;

    if (!birthProfileId || !packageId || !requestedDate || !requestedTimeWindow) {
      return res.status(400).json({ error: 'Missing required appointment parameters' });
    }

    // Verify birth profile belongs to this customer
    const profile = await getOne<any>('SELECT * FROM birth_profiles WHERE id = ? AND user_id = ?', [birthProfileId, customerId]);
    if (!profile) {
      return res.status(400).json({ error: 'Birth profile not found or does not belong to your account' });
    }

    // Verify package
    const pkg = await getOne<any>('SELECT * FROM packages WHERE id = ?', [packageId]);
    if (!pkg) {
      return res.status(400).json({ error: 'Selected package is invalid' });
    }

    // If trial package, check eligibility
    if (pkg.is_trial) {
      const user = await getOne<any>('SELECT trial_used, is_new_customer FROM users WHERE id = ?', [customerId]);
      if (user?.trial_used) {
        return res.status(400).json({ error: 'The 5-minute free trial is only available for first-time sessions.' });
      }
      if (!user?.is_new_customer) {
        return res.status(400).json({ error: 'The free trial is only available for new clients.' });
      }
    }

    const followupDays = FOLLOWUP_DAYS_MAP[pkg.slug] || 0;
    const apptId = `appt-${uuidv4().substring(0, 8)}`;

    await runQuery(`
      INSERT INTO appointments (
        id, customer_id, birth_profile_id, package_id, consultation_type,
        requested_date, requested_time_window, timezone_user, customer_notes, status, followup_days
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Requested', ?)
    `, [
      apptId,
      customerId,
      birthProfileId,
      packageId,
      consultationType || 'call',
      requestedDate,
      requestedTimeWindow,
      timezoneUser || 'Asia/Kolkata',
      customerNotes || '',
      followupDays
    ]);

    // If paid package, create an initial pending payment record
    if (pkg.price > 0) {
      const payId = `pay-${uuidv4().substring(0, 8)}`;
      await runQuery(`
        INSERT INTO payments (id, appointment_id, user_id, amount, payment_method, status)
        VALUES (?, ?, ?, ?, 'upi_qr', 'Pending')
      `, [payId, apptId, customerId, pkg.price]);
    }

    // Audit log
    await runQuery(`
      INSERT INTO audit_logs (id, admin_id, action, target_type, target_id, details)
      VALUES (?, 'system', 'APPOINTMENT_REQUESTED', 'appointment', ?, ?)
    `, [`audit-${uuidv4().substring(0, 8)}`, apptId, `Requested ${pkg.name} for date ${requestedDate}`]);

    const created = await getOne<any>(`
      SELECT a.*, p.name as package_name, p.price as package_price, bp.full_name as profile_name
      FROM appointments a
      JOIN packages p ON a.package_id = p.id
      JOIN birth_profiles bp ON a.birth_profile_id = bp.id
      WHERE a.id = ?
    `, [apptId]);

    // Send real Telegram alert to Amit Soni
    sendTelegramAdminAlert(
      `🔔 *New Consultation Requested*\n` +
      `• Package: ${pkg.name} (₹${pkg.price})\n` +
      `• Date: ${requestedDate} (${requestedTimeWindow})\n` +
      `• Client Chart: ${created?.profile_name}\n` +
      `• Mode: ${consultationType || 'call'}\n` +
      `• Client Note: ${customerNotes || 'None'}`
    ).catch(() => {});

    return res.status(201).json({
      success: true,
      message: 'Consultation request submitted! Amit will confirm your slot shortly.',
      appointment: created
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const getMyAppointments = async (req: AuthRequest, res: Response) => {
  try {
    const customerId = req.user!.id;
    const appointments = await getAll<any>(`
      SELECT 
        a.*, 
        p.name as package_name, 
        p.price as package_price, 
        p.duration_minutes,
        bp.full_name as profile_name,
        bp.dob,
        bp.pob,
        pay.status as payment_status,
        pay.utr_reference,
        CASE 
          WHEN a.followup_chat_expires_at IS NOT NULL AND a.followup_chat_expires_at > datetime('now') THEN 1
          ELSE 0
        END as followup_active,
        (SELECT COUNT(*) FROM followup_messages fm WHERE fm.appointment_id = a.id AND fm.is_read = 0 AND fm.sender_type = 'admin') as followup_unread
      FROM appointments a
      JOIN packages p ON a.package_id = p.id
      JOIN birth_profiles bp ON a.birth_profile_id = bp.id
      LEFT JOIN payments pay ON pay.appointment_id = a.id
      WHERE a.customer_id = ?
      ORDER BY a.created_at DESC
    `, [customerId]);

    return res.json({ appointments });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const getAllAppointments = async (req: AuthRequest, res: Response) => {
  try {
    const { status, date } = req.query;
    let query = `
      SELECT 
        a.*,
        u.name as customer_name,
        u.phone as customer_phone,
        u.email as customer_email,
        p.name as package_name,
        p.price as package_price,
        p.duration_minutes,
        bp.full_name as profile_name,
        bp.dob,
        bp.tob,
        bp.pob,
        pay.id as payment_id,
        pay.status as payment_status,
        pay.utr_reference,
        pay.screenshot_url,
        CASE 
          WHEN a.followup_chat_expires_at IS NOT NULL AND a.followup_chat_expires_at > datetime('now') THEN 1
          ELSE 0
        END as followup_active,
        (SELECT COUNT(*) FROM followup_messages fm WHERE fm.appointment_id = a.id AND fm.is_read = 0 AND fm.sender_type = 'customer') as followup_unread_admin
      FROM appointments a
      JOIN users u ON a.customer_id = u.id
      JOIN packages p ON a.package_id = p.id
      JOIN birth_profiles bp ON a.birth_profile_id = bp.id
      LEFT JOIN payments pay ON pay.appointment_id = a.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }
    if (date) {
      query += ' AND a.requested_date = ?';
      params.push(date);
    }

    query += ' ORDER BY a.created_at DESC';

    const appointments = await getAll<any>(query, params);
    return res.json({ appointments });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const updateAppointmentStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, confirmedTimeIst } = req.body;

    const existing = await getOne<any>('SELECT a.*, p.slug as package_slug FROM appointments a JOIN packages p ON a.package_id = p.id WHERE a.id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Compute follow-up expiry when confirming
    let followupExpiresAt = existing.followup_chat_expires_at;
    if (status === 'Confirmed' && existing.followup_days > 0 && !followupExpiresAt) {
      const now = new Date();
      now.setDate(now.getDate() + existing.followup_days);
      followupExpiresAt = now.toISOString();
    }

    await runQuery(`
      UPDATE appointments SET
        status = ?,
        confirmed_time_ist = COALESCE(?, confirmed_time_ist),
        followup_chat_expires_at = COALESCE(?, followup_chat_expires_at)
      WHERE id = ?
    `, [status, confirmedTimeIst || null, followupExpiresAt || null, id]);

    // Audit log
    await runQuery(`
      INSERT INTO audit_logs (id, admin_id, action, target_type, target_id, details)
      VALUES (?, ?, 'APPOINTMENT_STATUS_UPDATE', 'appointment', ?, ?)
    `, [`audit-${uuidv4().substring(0, 8)}`, req.user!.id, id, `Status updated to ${status}`]);

    const updated = await getOne<any>('SELECT * FROM appointments WHERE id = ?', [id]);
    return res.json({ success: true, appointment: updated });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// ── FOLLOW-UP CHAT ENDPOINTS ──────────────────────────────────────────────────

export const getFollowupMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params; // appointment id
    const userId = req.user!.id;
    const isAdmin = req.user!.role === 'admin';

    const appt = await getOne<any>(`
      SELECT a.*, p.name as package_name, u.name as customer_name, u.phone as customer_phone
      FROM appointments a
      JOIN packages p ON a.package_id = p.id
      JOIN users u ON a.customer_id = u.id
      WHERE a.id = ?
    `, [id]);

    if (!appt) return res.status(404).json({ error: 'Appointment not found' });
    if (!isAdmin && appt.customer_id !== userId) return res.status(403).json({ error: 'Access denied' });

    const now = new Date();
    const expiresAt = appt.followup_chat_expires_at ? new Date(appt.followup_chat_expires_at) : null;
    const isActive = expiresAt ? now < expiresAt : false;
    const daysRemaining = expiresAt ? Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;

    const messages = await getAll<any>(
      'SELECT * FROM followup_messages WHERE appointment_id = ? ORDER BY created_at ASC',
      [id]
    );

    // Mark as read
    if (isAdmin) {
      await runQuery(`UPDATE followup_messages SET is_read = 1 WHERE appointment_id = ? AND sender_type = 'customer'`, [id]);
    } else {
      await runQuery(`UPDATE followup_messages SET is_read = 1 WHERE appointment_id = ? AND sender_type = 'admin'`, [id]);
    }

    return res.json({
      appointment: appt,
      messages,
      followup: {
        isActive,
        expiresAt: appt.followup_chat_expires_at,
        daysRemaining,
        totalDays: appt.followup_days
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const sendFollowupMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params; // appointment id
    const userId = req.user!.id;
    const isAdmin = req.user!.role === 'admin';
    const { content, attachmentUrl } = req.body;

    if (!content && !attachmentUrl) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const appt = await getOne<any>('SELECT * FROM appointments WHERE id = ?', [id]);
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });
    if (!isAdmin && appt.customer_id !== userId) return res.status(403).json({ error: 'Access denied' });

    // Check window expiry for customers (admins can always reply)
    if (!isAdmin) {
      if (!appt.followup_chat_expires_at) {
        return res.status(403).json({ error: 'Follow-up chat is not available for this consultation package.' });
      }
      if (new Date() > new Date(appt.followup_chat_expires_at)) {
        return res.status(403).json({ error: 'Your follow-up chat window has expired. Please book a new consultation.' });
      }
    }

    const msgId = `fu-${uuidv4().substring(0, 8)}`;
    const senderType = isAdmin ? 'admin' : 'customer';

    await runQuery(`
      INSERT INTO followup_messages (id, appointment_id, sender_type, sender_id, content, attachment_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [msgId, id, senderType, userId, content || '', attachmentUrl || null]);

    const message = await getOne<any>('SELECT * FROM followup_messages WHERE id = ?', [msgId]);
    return res.status(201).json({ success: true, message });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const getActiveFollowups = async (req: AuthRequest, res: Response) => {
  try {
    const followups = await getAll<any>(`
      SELECT 
        a.*,
        u.name as customer_name,
        u.phone as customer_phone,
        p.name as package_name,
        (SELECT COUNT(*) FROM followup_messages fm WHERE fm.appointment_id = a.id AND fm.is_read = 0 AND fm.sender_type = 'customer') as unread_count,
        (SELECT content FROM followup_messages fm WHERE fm.appointment_id = a.id ORDER BY fm.created_at DESC LIMIT 1) as last_message
      FROM appointments a
      JOIN users u ON a.customer_id = u.id
      JOIN packages p ON a.package_id = p.id
      WHERE a.followup_chat_expires_at IS NOT NULL
        AND a.followup_chat_expires_at > datetime('now')
      ORDER BY a.followup_chat_expires_at ASC
    `);
    return res.json({ followups });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
