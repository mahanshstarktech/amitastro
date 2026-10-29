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

  const currentStepNumber = step === 'payment' ? 4 : step === 'success' ? 5 : wizardStep;

  // Resolve contact & birth details based on authenticated profile or guest input
  let name = '';
  let phone = '';
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

  // Fallbacks from user object if authenticated
  if (!name && user?.name) name = user.name;
  if (!phone && user?.phone) phone = user.phone;

  const pkgPriceDisplay = formattedPrice || (currentPkg ? (currentPkg.price === 0 ? 'Complimentary' : `₹${currentPkg.price}`) : '');

  const lines: string[] = ['Namaste Amit Ji 🙏'];

  // STEP 1: Package Selection
  if (currentStepNumber === 1) {
    lines.push(
      'I was booking a consultation on your website (amitastro.com) and would like to continue over WhatsApp.',
      '',
      '📋 *My Consultation Details (Step 1 - Package Selection):*'
    );

    if (currentPkg) {
      lines.push(`• *Selected Package:* ${currentPkg.name}${pkgPriceDisplay ? ` (${pkgPriceDisplay})` : ''}`);
    }
    if (name) {
      lines.push(`• *Name:* ${name}`);
    }
    if (phone) {
      lines.push(`• *Phone:* ${phone.startsWith('+') ? phone : `+91 ${phone}`}`);
    }
    if (user?.email) {
      lines.push(`• *Email:* ${user.email}`);
    }

    lines.push('', 'Kindly guide me on the next steps to proceed. Pranam!');
    return lines.join('\n');
  }

  // STEP 2: Birth Profile Details
  if (currentStepNumber === 2) {
    lines.push(
      'I was booking a consultation on your website (amitastro.com) and would like to continue over WhatsApp.',
      '',
      '📋 *My Consultation Details (Step 2 - Birth Profile):*'
    );

    if (currentPkg) {
      lines.push(`• *Selected Package:* ${currentPkg.name}${pkgPriceDisplay ? ` (${pkgPriceDisplay})` : ''}`);
    }
    if (name) {
      lines.push(`• *Name:* ${name}`);
    }
    if (phone) {
      lines.push(`• *Phone:* ${phone.startsWith('+') ? phone : `+91 ${phone}`}`);
    }
    if (dob) {
      lines.push(`• *Date of Birth:* ${dob}`);
    }
    if (tob) {
      lines.push(`• *Time of Birth:* ${tob}`);
    }
    if (pob) {
      lines.push(`• *Place of Birth:* ${pob}`);
    }

    lines.push('', 'Kindly guide me on available consultation slots for this chart. Pranam!');
    return lines.join('\n');
  }

  // STEP 3: Schedule & Discussion Topics
  if (currentStepNumber === 3) {
    lines.push(
      'I was booking a consultation on your website (amitastro.com) and would like to continue over WhatsApp.',
      '',
      '📋 *My Consultation Details (Step 3 - Schedule & Questions):*'
    );

    if (currentPkg) {
      lines.push(`• *Selected Package:* ${currentPkg.name}${pkgPriceDisplay ? ` (${pkgPriceDisplay})` : ''}`);
    }
    if (name) {
      lines.push(`• *Name:* ${name}`);
    }
    if (phone) {
      lines.push(`• *Phone:* ${phone.startsWith('+') ? phone : `+91 ${phone}`}`);
    }
    if (dob) {
      lines.push(`• *Date of Birth:* ${dob}`);
    }
    if (tob) {
      lines.push(`• *Time of Birth:* ${tob}`);
    }
    if (pob) {
      lines.push(`• *Place of Birth:* ${pob}`);
    }
    if (selectedDate) {
      lines.push(`• *Preferred Date:* ${selectedDate}`);
    }
    if (selectedWindow) {
      lines.push(`• *Preferred Time:* ${selectedWindow}`);
    }
    // Only add topics if user actually filled them
    if (customerNotes && customerNotes.trim()) {
      lines.push(`• *Questions / Topics:* ${customerNotes.trim()}`);
    }

    lines.push('', 'Kindly confirm your availability for this slot. Pranam!');
    return lines.join('\n');
  }

  // STEP 4: Payment Verification
  if (currentStepNumber === 4) {
    lines.push(
      'I was booking a consultation on your website (amitastro.com) and reached the payment step.',
      '',
      '📋 *My Consultation Details (Step 4 - Payment):*'
    );

    if (currentPkg) {
      lines.push(`• *Selected Package:* ${currentPkg.name}${pkgPriceDisplay ? ` (${pkgPriceDisplay})` : ''}`);
    }
    if (name) {
      lines.push(`• *Name:* ${name}`);
    }
    if (phone) {
      lines.push(`• *Phone:* ${phone.startsWith('+') ? phone : `+91 ${phone}`}`);
    }
    if (dob) {
      lines.push(`• *Date of Birth:* ${dob}`);
    }
    if (selectedDate) {
      lines.push(`• *Preferred Date:* ${selectedDate}`);
    }
    if (selectedWindow) {
      lines.push(`• *Preferred Time:* ${selectedWindow}`);
    }
    if (customerNotes && customerNotes.trim()) {
      lines.push(`• *Questions / Topics:* ${customerNotes.trim()}`);
    }
    if (utr && utr.trim()) {
      lines.push(`• *Payment Ref / UTR:* ${utr.trim()}`);
    }

    lines.push('', 'Kindly confirm your payment verification or receipt. Pranam!');
    return lines.join('\n');
  }

  // STEP 5: Success
  lines.push(
    'I have placed my consultation booking request on amitastro.com and would like to coordinate over WhatsApp.',
    '',
    '📋 *Confirmed Consultation Details:*'
  );
  if (createdApptId) {
    lines.push(`• *Booking Reference:* #${createdApptId}`);
  }
  if (currentPkg) {
    lines.push(`• *Selected Package:* ${currentPkg.name}`);
  }
  if (name) {
    lines.push(`• *Name:* ${name}`);
  }
  if (selectedDate) {
    lines.push(`• *Date:* ${selectedDate}`);
  }
  if (selectedWindow) {
    lines.push(`• *Time Window:* ${selectedWindow}`);
  }
  lines.push('', 'Looking forward to our consultation session. Pranam!');
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
