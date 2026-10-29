import type { User, BirthProfile } from '../context/AuthContext';

export const WHATSAPP_PHONE_NUMBER = '919983353533';
export const WHATSAPP_DISPLAY_PHONE = '+91 9983353533';

export interface WhatsAppMessageOptions {
  user?: User | null;
  profile?: BirthProfile | null;
  customTopic?: string;
}

export interface BookingWhatsAppOptions {
  step: 'details' | 'payment' | 'success';
  wizardStep: number;
  currentPkg?: {
    name: string;
    price?: number;
    durationMinutes?: number;
    [key: string]: any;
  } | null;
  formattedPrice?: string;
  user?: User | null;
  profile?: BirthProfile | null;
  guestProfile?: {
    fullName?: string;
    phone?: string;
    dob?: string;
    tob?: string;
    pob?: string;
    tobUncertain?: boolean;
  } | null;
  newProfile?: {
    fullName?: string;
    dob?: string;
    tob?: string;
    pob?: string;
    tobUncertain?: boolean;
  } | null;
  showAddProfile?: boolean;
  selectedDate?: string;
  selectedWindow?: string;
  customerNotes?: string;
  utr?: string;
  createdApptId?: string;
}

/**
 * Builds a step-aware WhatsApp consultation message based on exactly what details
 * the user has entered up to their current booking step.
 * Forwards maximum available details (account coordinates, birth chart, package, schedule)
 * and appends new details as seeker progresses through the booking steps.
 */
export function buildBookingWhatsAppMessage(options: BookingWhatsAppOptions): string {
  const {
    step,
    wizardStep,
    currentPkg,
    formattedPrice,
    user,
    profile,
    guestProfile,
    newProfile,
    showAddProfile,
    selectedDate,
    selectedWindow,
    customerNotes,
    utr,
    createdApptId
  } = options;

  // New step sequence:
  // Step 1: Birth Profile Details
  // Step 2: Schedule & Questions
  // Step 3: Package Selection (shifted right before payment)
  // Step 4: Payment Verification
  // Step 5: Success
  const currentStepNumber = step === 'payment' ? 4 : step === 'success' ? 5 : wizardStep;

  // Resolve contact details
  let name = '';
  let phone = '';
  let email = user?.email || '';

  // Resolve birth details
  let dob = '';
  let tob = '';
  let pob = '';

  if (showAddProfile && newProfile) {
    name = (newProfile.fullName || '').trim();
    dob = newProfile.dob || '';
    tob = newProfile.tobUncertain
      ? 'Approximate / Uncertain'
      : (newProfile.tob && newProfile.tob !== '12:00' ? newProfile.tob : (newProfile.tob || ''));
    pob = (newProfile.pob || '').trim();
  } else if (profile) {
    name = (profile.full_name || '').trim();
    dob = profile.dob || '';
    tob = profile.tob_uncertain
      ? `${profile.tob || ''} (Approximate)`.trim()
      : (profile.tob || '');
    pob = (profile.pob || '').trim();
  } else if (guestProfile) {
    name = (guestProfile.fullName || '').trim();
    phone = (guestProfile.phone || '').trim();
    dob = guestProfile.dob || '';
    tob = guestProfile.tobUncertain
      ? 'Approximate / Uncertain'
      : (guestProfile.tob && guestProfile.tob !== '12:00' ? guestProfile.tob : '');
    pob = (guestProfile.pob || '').trim();
  }

  // Account fallbacks for authenticated seeker
  if (!name && user?.name) name = user.name;
  if (!phone && user?.phone) phone = user.phone;

  const pkgPriceDisplay = formattedPrice || (currentPkg ? (currentPkg.price === 0 ? 'Complimentary' : `₹${currentPkg.price}`) : '');

  const lines: string[] = [
    '🕉️ *Namaste Amit Ji!* 🙏',
    '',
    'I am reaching out via your website (*amitastro.com*) to consult with you and request astrological guidance.',
    ''
  ];

  // 1. CONTACT DETAILS (Include whenever known)
  const contactLines: string[] = [];
  if (name) contactLines.push(`• *Name:* ${name}`);
  if (phone) contactLines.push(`• *Phone:* ${phone.startsWith('+') ? phone : `+91 ${phone}`}`);
  if (email) contactLines.push(`• *Email:* ${email}`);

  if (contactLines.length > 0) {
    lines.push('📋 *My Contact Details:*', ...contactLines, '');
  }

  // 2. BIRTH CHART COORDINATES
  // Always forward account/profile birth coordinates if available, or whatever guest details entered
  const birthLines: string[] = [];
  if (name && (dob || pob)) birthLines.push(`• *Full Name:* ${name}`);
  if (dob) birthLines.push(`• *Date of Birth:* ${dob}`);
  if (tob) birthLines.push(`• *Time of Birth:* ${tob}`);
  if (pob) birthLines.push(`• *Place of Birth:* ${pob}`);

  if (birthLines.length > 0) {
    lines.push('🌟 *Birth Chart Coordinates:*', ...birthLines, '');
  }

  // 3. CONSULTATION PACKAGE
  // Always include selected package if available
  if (currentPkg) {
    lines.push(
      '📦 *Consultation Package:*',
      `• *Selected Package:* ${currentPkg.name}${pkgPriceDisplay ? ` (${pkgPriceDisplay})` : ''}`
    );
    const duration = currentPkg.durationMinutes || currentPkg.duration_minutes;
    if (duration) {
      lines.push(`• *Duration:* ${duration} Minutes`);
    }
    lines.push('');
  }

  // 4. PREFERRED SCHEDULE
  // Include if reached Step 2 (Schedule) or beyond, and date is selected
  if (currentStepNumber >= 2 && selectedDate) {
    lines.push(
      '🗓️ *Preferred Schedule:*',
      `• *Preferred Date:* ${selectedDate}`
    );
    if (selectedWindow) {
      lines.push(`• *Preferred Time:* ${selectedWindow}`);
    }
    lines.push('');
  }

  // 5. DISCUSSION TOPICS / QUESTIONS (Step 2 and beyond)
  // Only add if user actually filled them!
  if (currentStepNumber >= 2 && customerNotes && customerNotes.trim()) {
    lines.push(
      '💬 *Topics / Questions for Discussion:*',
      `• ${customerNotes.trim()}`,
      ''
    );
  }

  // 6. PAYMENT / UTR REFERENCE (Step 4)
  if (currentStepNumber >= 4 && utr && utr.trim()) {
    lines.push(
      '💳 *Payment Reference:*',
      `• *UTR / Ref No:* ${utr.trim()}`,
      ''
    );
  }

  // 7. CONFIRMED APPOINTMENT ID (Step 5)
  if (currentStepNumber >= 5 && createdApptId) {
    lines.push(
      '🔖 *Booking Reference:*',
      `• *Appointment ID:* #${createdApptId}`,
      ''
    );
  }

  lines.push('Looking forward to your esteemed guidance. Pranam! 🙏');

  return lines.join('\n');
}

/**
 * Builds a polite, professionally formatted WhatsApp consultation message.
 * Adheres strictly to WhatsApp markdown: *bold* and emojis.
 */
export function buildWhatsAppConsultMessage(options: WhatsAppMessageOptions = {}): string {
  const { user, profile, customTopic } = options;

  if (user && (user.name || user.email || user.phone)) {
    const lines: string[] = [
      '🕉️ *Namaste Amit ji!* 🙏',
      '',
      'I am reaching out via your website (*amitastro.com*) to consult with you and request a personalized quote for Vedic astrology & Kundli guidance.',
      '',
      '📋 *My Contact Details:*',
      `• *Name:* ${user.name || 'Seeker'}`,
    ];

    if (user.phone) {
      lines.push(`• *Phone:* +91 ${user.phone}`);
    }
    if (user.email) {
      lines.push(`• *Email:* ${user.email}`);
    }

    if (profile && (profile.dob || profile.full_name)) {
      lines.push(
        '',
        '🌟 *Birth Chart Coordinates:*',
        `• *Full Name:* ${profile.full_name || user.name}`,
        `• *Date of Birth:* ${profile.dob || 'Not specified'}`,
        `• *Time of Birth:* ${profile.tob ? (profile.tob_uncertain ? `${profile.tob} (Approximate)` : profile.tob) : 'Not specified'}`,
        `• *Place of Birth:* ${profile.pob || 'Not specified'}`
      );
    }

    if (customTopic) {
      lines.push('', `• *Specific Topic / Query:* ${customTopic}`);
    }

    lines.push(
      '',
      'Could you please guide me on suitable consultation options, package fees, and your earliest availability?',
      '',
      'Looking forward to your esteemed guidance. Pranam! 🙏'
    );

    return lines.join('\n');
  }

  // Guest / Unauthenticated user prebuilt message
  const guestLines: string[] = [
    '🕉️ *Namaste Amit ji!* 🙏',
    '',
    'I am visiting your website (*amitastro.com*) and would like to get a quick quote and consult with you regarding Vedic astrology & Kundli guidance.',
    '',
    'Could you please share your consultation packages, fees, and available slots to get started?',
    '',
    'Looking forward to your reply. Thank you! 🙏'
  ];

  return guestLines.join('\n');
}

/**
 * Generates direct WhatsApp send URL using api.whatsapp.com to preserve 4-byte UTF-8 emojis.
 */
export function getWhatsAppSendUrl(options: WhatsAppMessageOptions = {}): string {
  const message = buildWhatsAppConsultMessage(options);
  return `https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE_NUMBER}&text=${encodeURIComponent(message)}`;
}

/**
 * Directly opens WhatsApp in a new browser tab/window.
 */
export function openWhatsAppConsult(options: WhatsAppMessageOptions = {}): Window | null {
  const url = getWhatsAppSendUrl(options);
  return window.open(url, '_blank', 'noopener,noreferrer');
}
