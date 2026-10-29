import type { User, BirthProfile } from '../context/AuthContext';

export const WHATSAPP_PHONE_NUMBER = '919983353633';
export const WHATSAPP_DISPLAY_PHONE = '+91 9983353633';

export interface WhatsAppMessageOptions {
  user?: User | null;
  profile?: BirthProfile | null;
  customTopic?: string;
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
