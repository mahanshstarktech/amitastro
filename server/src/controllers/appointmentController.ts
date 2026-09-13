import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/auth';
import { getAll, getOne, runQuery } from '../db/database';

export const getPackages = async (req: any, res: Response) => {
  try {
    const packages = await getAll<any>('SELECT * FROM packages ORDER BY price ASC');
    const parsed = packages.map(pkg => ({
      ...pkg,
      includes: JSON.parse(pkg.includes_json || '[]')
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

    // Verify package
    const pkg = await getOne<any>('SELECT * FROM packages WHERE id = ?', [packageId]);
    if (!pkg) {
      return res.status(400).json({ error: 'Selected package is invalid' });
    }

    // If trial package, check eligibility
    if (pkg.is_trial) {
      const user = await getOne<any>('SELECT trial_used FROM users WHERE id = ?', [customerId]);
      if (user?.trial_used) {
        return res.status(400).json({ error: 'The 5-minute free trial is only available for first-time sessions.' });
      }
    }

    const apptId = `appt-${uuidv4().substring(0, 8)}`;
    await runQuery(`
      INSERT INTO appointments (
        id, customer_id, birth_profile_id, package_id, consultation_type,
        requested_date, requested_time_window, timezone_user, customer_notes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Requested')
    `, [
      apptId,
      customerId,
      birthProfileId,
      packageId,
      consultationType || 'call',
      requestedDate,
      requestedTimeWindow,
      timezoneUser || 'Asia/Kolkata',
      customerNotes || ''
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

    return res.status(201).json({
      success: true,
      message: 'Consultation request submitted! Amit Soni will confirm your slot shortly.',
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
        pay.utr_reference
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
        pay.screenshot_url
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

    const existing = await getOne<any>('SELECT * FROM appointments WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    await runQuery(`
      UPDATE appointments SET
        status = ?,
        confirmed_time_ist = COALESCE(?, confirmed_time_ist)
      WHERE id = ?
    `, [status, confirmedTimeIst || null, id]);

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
