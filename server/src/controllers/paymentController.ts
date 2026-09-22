import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/auth';
import { getAll, getOne, runQuery } from '../db/database';
import { generateRealUpiIntent, sendTelegramAdminAlert } from '../services/realServices';

export const getPaymentConfig = (req: any, res: Response) => {
  const amount = parseFloat(req.query.amount as string) || 1799;
  const vpa = process.env.UPI_VPA || 'amitastro@upi';
  const name = process.env.UPI_NAME || 'Amit (Amit Astro Consultations)';

  const { intentUrl, qrUrl } = generateRealUpiIntent({
    vpa,
    name,
    amount,
    transactionRef: `AMIT-${Date.now()}`
  });

  return res.json({
    upi: {
      vpa,
      name,
      intentUrl,
      qrImage: qrUrl
    },
    bank: {
      accountName: 'Amit',
      bankName: 'HDFC Bank',
      accountNumber: '50100492817291',
      ifscCode: 'HDFC0001234',
      branch: 'Jaipur Central, Rajasthan'
    }
  });
};

export const submitPaymentProof = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { appointmentId, utrReference, screenshotUrl, amount, paymentMethod } = req.body;

    if (!utrReference) {
      return res.status(400).json({ error: 'UTR / Transaction Reference Number is required' });
    }

    // Check if appointment exists
    const appt = await getOne<any>('SELECT * FROM appointments WHERE id = ?', [appointmentId]);
    if (!appt) {
      return res.status(404).json({ error: 'Linked appointment not found' });
    }

    // Check if payment record already exists
    let existingPayment = await getOne<any>('SELECT * FROM payments WHERE appointment_id = ?', [appointmentId]);

    if (existingPayment) {
      await runQuery(`
        UPDATE payments SET
          utr_reference = ?,
          screenshot_url = COALESCE(?, screenshot_url),
          payment_method = ?,
          status = 'Pending',
          rejection_reason = NULL
        WHERE id = ?
      `, [utrReference, screenshotUrl || null, paymentMethod || 'upi_qr', existingPayment.id]);
    } else {
      const payId = `pay-${uuidv4().substring(0, 8)}`;
      await runQuery(`
        INSERT INTO payments (id, appointment_id, user_id, amount, payment_method, utr_reference, screenshot_url, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')
      `, [payId, appointmentId, userId, amount || 999, paymentMethod || 'upi_qr', utrReference, screenshotUrl || null]);
    }

    // Send real Telegram alert to Amit Soni
    sendTelegramAdminAlert(
      `💳 *Payment UTR Submitted*\n` +
      `• UTR / Ref: \`${utrReference}\`\n` +
      `• Amount: ₹${amount || 999}\n` +
      `• Appointment ID: ${appointmentId}\n` +
      `• Action: Please verify in Admin Queue.`
    ).catch(() => {});

    return res.json({
      success: true,
      message: 'Payment proof submitted! We will verify and confirm your consultation within a few moments.'
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const getPendingPayments = async (req: AuthRequest, res: Response) => {
  try {
    const payments = await getAll<any>(`
      SELECT 
        p.*,
        u.name as customer_name,
        u.phone as customer_phone,
        u.email as customer_email,
        a.requested_date,
        a.requested_time_window,
        pkg.name as package_name
      FROM payments p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN appointments a ON p.appointment_id = a.id
      LEFT JOIN packages pkg ON a.package_id = pkg.id
      WHERE p.status = 'Pending'
      ORDER BY p.created_at DESC
    `);

    return res.json({ payments });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const verifyPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = req.user!.id;

    const payment = await getOne<any>('SELECT * FROM payments WHERE id = ?', [id]);
    if (!payment) {
      return res.status(404).json({ error: 'Payment record not found' });
    }

    // Mark verified
    await runQuery(`
      UPDATE payments SET
        status = 'Verified',
        verified_by = ?,
        verified_at = datetime('now')
      WHERE id = ?
    `, [adminId, id]);

    // Automatically confirm linked appointment
    if (payment.appointment_id) {
      await runQuery(`
        UPDATE appointments SET status = 'Confirmed' WHERE id = ?
      `, [payment.appointment_id]);
    }

    // Audit log
    await runQuery(`
      INSERT INTO audit_logs (id, admin_id, action, target_type, target_id, details)
      VALUES (?, ?, 'PAYMENT_VERIFIED', 'payment', ?, ?)
    `, [`audit-${uuidv4().substring(0, 8)}`, adminId, id, `Verified UTR: ${payment.utr_reference}`]);

    return res.json({ success: true, message: 'Payment verified and appointment confirmed!' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const rejectPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user!.id;

    const payment = await getOne<any>('SELECT * FROM payments WHERE id = ?', [id]);
    if (!payment) {
      return res.status(404).json({ error: 'Payment record not found' });
    }

    await runQuery(`
      UPDATE payments SET
        status = 'Rejected',
        rejection_reason = ?,
        verified_by = ?,
        verified_at = datetime('now')
      WHERE id = ?
    `, [reason || 'UTR could not be matched with bank statements', adminId, id]);

    return res.json({ success: true, message: 'Payment marked as rejected' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
