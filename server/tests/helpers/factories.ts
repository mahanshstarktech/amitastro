import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { runQuery, getOne } from '../../src/db/database';

export async function createUserFixture(overrides: Partial<any> = {}) {
  const id = overrides.id || `usr-${uuidv4().substring(0, 8)}`;
  const email = overrides.email || `user-${uuidv4().substring(0, 6)}@example.com`;
  const phone = overrides.phone || `+9198${Math.floor(10000000 + Math.random() * 90000000)}`;
  const name = overrides.name || 'Test Seeker';
  const rawPassword = overrides.password || 'Test@1234';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(rawPassword, salt);
  const role = overrides.role || 'customer';
  const isPhoneVerified = overrides.isPhoneVerified !== undefined ? overrides.isPhoneVerified : 1;
  const isEmailVerified = overrides.isEmailVerified !== undefined ? overrides.isEmailVerified : 1;
  const trialUsed = overrides.trialUsed !== undefined ? overrides.trialUsed : 0;
  const trialSecondsRemaining = overrides.trialSecondsRemaining !== undefined ? overrides.trialSecondsRemaining : 300;

  await runQuery(`
    INSERT INTO users (id, name, email, phone, password_hash, role, is_phone_verified, is_email_verified, trial_used, trial_seconds_remaining, is_new_customer)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `, [id, name, email, phone, passwordHash, role, isPhoneVerified ? 1 : 0, isEmailVerified ? 1 : 0, trialUsed ? 1 : 0, trialSecondsRemaining]);

  const user = await getOne<any>('SELECT * FROM users WHERE id = ?', [id]);
  return { ...user, rawPassword };
}

export async function createAdminFixture(overrides: Partial<any> = {}) {
  return createUserFixture({
    role: 'admin',
    email: overrides.email || `admin-${uuidv4().substring(0, 6)}@amitastro.com`,
    name: overrides.name || 'Admin Amit',
    ...overrides
  });
}

export async function createBirthProfileFixture(userId: string, overrides: Partial<any> = {}) {
  const id = overrides.id || `bp-${uuidv4().substring(0, 8)}`;
  const fullName = overrides.fullName || 'Priya Sharma';
  const relation = overrides.relation || 'self';
  const dob = overrides.dob || '1995-05-20';
  const tob = overrides.tob || '10:30';
  const pob = overrides.pob || 'Jaipur, Rajasthan';
  const lat = overrides.lat || 26.9124;
  const lng = overrides.lng || 75.7873;
  const timezone = overrides.timezone || 'Asia/Kolkata';

  await runQuery(`
    INSERT INTO birth_profiles (id, user_id, relation, full_name, dob, tob, tob_uncertain, pob, pob_lat, pob_lng, pob_timezone)
    VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)
  `, [id, userId, relation, fullName, dob, tob, pob, lat, lng, timezone]);

  return getOne<any>('SELECT * FROM birth_profiles WHERE id = ?', [id]);
}

export async function createAppointmentFixture(userId: string, profileId: string, packageId: string = 'pkg-premium', overrides: Partial<any> = {}) {
  const id = overrides.id || `appt-${uuidv4().substring(0, 8)}`;
  const requestedDate = overrides.requestedDate || '2026-11-01';
  const requestedTimeWindow = overrides.requestedTimeWindow || '11:00 AM - 01:00 PM';
  const timezoneUser = overrides.timezoneUser || 'Asia/Kolkata';
  const status = overrides.status || 'Requested';
  const consultationType = overrides.consultationType || 'call';

  await runQuery(`
    INSERT INTO appointments (id, customer_id, birth_profile_id, package_id, consultation_type, requested_date, requested_time_window, timezone_user, customer_notes, status, followup_days)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Test consultation notes', ?, 7)
  `, [id, userId, profileId, packageId, consultationType, requestedDate, requestedTimeWindow, timezoneUser, status]);

  return getOne<any>('SELECT * FROM appointments WHERE id = ?', [id]);
}

export async function createPaymentFixture(appointmentId: string, userId: string, overrides: Partial<any> = {}) {
  const id = overrides.id || `pay-${uuidv4().substring(0, 8)}`;
  const amount = overrides.amount || 1799;
  const utr = overrides.utr || `${Math.floor(100000000000 + Math.random() * 900000000000)}`;
  const status = overrides.status || 'Pending';

  await runQuery(`
    INSERT INTO payments (id, appointment_id, user_id, amount, payment_method, utr_reference, screenshot_url, status)
    VALUES (?, ?, ?, ?, 'upi_qr', ?, 'https://example.com/screenshot.png', ?)
  `, [id, appointmentId, userId, amount, utr, status]);

  return getOne<any>('SELECT * FROM payments WHERE id = ?', [id]);
}
