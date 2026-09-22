import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  FileText, 
  AlertCircle, 
  RefreshCw, 
  Truck, 
  Scale, 
  HeartHandshake, 
  Cookie, 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  ExternalLink
} from 'lucide-react';

export type LegalTab = 
  | 'privacy' 
  | 'terms' 
  | 'disclaimer' 
  | 'refund' 
  | 'delivery' 
  | 'grievance' 
  | 'ethics' 
  | 'cookies';

interface LegalPageProps {
  initialTab?: LegalTab;
  onNavigate?: (path: string) => void;
}

export const LegalPage: React.FC<LegalPageProps> = ({ initialTab = 'privacy', onNavigate }) => {
  const [tab, setTab] = useState<LegalTab>(initialTab);

  // Sync state if initialTab prop changes
  useEffect(() => {
    if (initialTab) {
      setTab(initialTab);
    }
  }, [initialTab]);

  const handleTabChange = (newTab: LegalTab) => {
    setTab(newTab);
    const newPath = `/legal/${newTab === 'refund' ? 'refund-policy' : newTab}`;
    if (onNavigate) {
      onNavigate(newPath);
    } else {
      window.history.pushState({}, '', newPath);
    }
  };

  const tabsConfig = [
    { id: 'privacy' as LegalTab, label: 'Privacy & Data Protection', icon: ShieldCheck, badge: 'DPDP & GDPR' },
    { id: 'terms' as LegalTab, label: 'Terms of Service', icon: FileText, badge: 'Agreement' },
    { id: 'disclaimer' as LegalTab, label: 'Astrology Disclaimer', icon: AlertCircle, badge: 'Statutory' },
    { id: 'refund' as LegalTab, label: 'Refund & Rescheduling', icon: RefreshCw, badge: '4-Hr Policy' },
    { id: 'delivery' as LegalTab, label: 'Digital Delivery Policy', icon: Truck, badge: 'Payment Gateway' },
    { id: 'grievance' as LegalTab, label: 'Grievance Officer', icon: Scale, badge: 'IT Rules 2021' },
    { id: 'ethics' as LegalTab, label: 'Ethical Charter', icon: HeartHandshake, badge: 'Zero Fear' },
    { id: 'cookies' as LegalTab, label: 'Cookie Policy', icon: Cookie, badge: 'Storage' },
  ];

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 96, backgroundColor: '#FAFAFC' }}>
      {/* Header Banner */}
      <section style={{ backgroundColor: '#F5F5F7', padding: '64px 0 44px', borderBottom: '1px solid #E5E5EA', textAlign: 'center' }}>
        <div className="container">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} className="apple-badge-primary">
            <ShieldCheck size={14} color="#3A3A6E" />
            <span>Official Legal & Regulatory Compliance Portal</span>
          </div>
          <h1 className="text-display" style={{ fontSize: 38, marginTop: 12, marginBottom: 8, letterSpacing: '-0.02em' }}>
            Trust, Legal & Compliance
          </h1>
          <p className="text-body-large" style={{ maxWidth: 660, margin: '0 auto', color: '#6E6E73', fontSize: 16 }}>
            Transparent policies, rigorous data privacy standards under India’s DPDP Act, and ethical commitments established by Amit Astro.
          </p>
          <div style={{ marginTop: 16, fontSize: 13, color: '#86868B' }}>
            Last Revised: September 2026 · Governing Jurisdiction: New Delhi, India
          </div>
        </div>
      </section>

      <div className="container" style={{ maxWidth: 1040, marginTop: 40 }}>
        {/* Horizontal Scrollable Tabs */}
        <div 
          style={{ 
            display: 'flex', 
            gap: 8, 
            overflowX: 'auto', 
            paddingBottom: 14, 
            marginBottom: 32,
            scrollbarWidth: 'thin',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {tabsConfig.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 18px',
                  borderRadius: 9999,
                  border: active ? '1px solid #3A3A6E' : '1px solid #E5E5EA',
                  backgroundColor: active ? '#3A3A6E' : '#FFFFFF',
                  color: active ? '#FFFFFF' : '#1D1D1F',
                  fontSize: 13.5,
                  fontWeight: active ? 600 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: active ? '0 2px 8px rgba(58, 58, 110, 0.2)' : '0 1px 3px rgba(0,0,0,0.02)',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={16} color={active ? '#FFFFFF' : '#6E6E73'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Card */}
        <div 
          className="apple-card" 
          style={{ 
            padding: '48px 40px', 
            backgroundColor: '#FFFFFF',
            borderRadius: 24,
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.04)',
            border: '1px solid #E5E5EA'
          }}
        >
          {/* TAB 1: PRIVACY POLICY */}
          {tab === 'privacy' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, color: '#1D1D1F', lineHeight: 1.75 }}>
              <div style={{ borderBottom: '1px solid #E5E5EA', paddingBottom: 20 }}>
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#3A3A6E' }}>
                  Compliance: India DPDP Act 2023 & GDPR
                </span>
                <h2 className="text-h2" style={{ fontSize: 28, marginTop: 4, marginBottom: 8 }}>
                  Privacy Policy & Sacred Birth Data Safeguards
                </h2>
                <p style={{ color: '#6E6E73', fontSize: 15 }}>
                  At Amit Astro, we recognize that your date, exact time, geographic location of birth, family charts, and personal life inquiries represent profoundly sacred, intimate, and sensitive Personally Identifiable Information (PII). We enforce rigorous security and zero-commercial-exploitation principles.
                </p>
              </div>

              {/* Trust Callout */}
              <div style={{ padding: '18px 22px', backgroundColor: '#F0F9FF', borderRadius: 14, border: '1px solid #BAE6FD', display: 'flex', gap: 14 }}>
                <ShieldCheck size={22} color="#0284C7" style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: 14, color: '#0369A1' }}>
                  <strong>Our Sacred Privacy Pledge:</strong> We strictly NEVER sell, rent, license, or monetize your birth charts, contact information, consultation notes, or audio records to marketing networks, data aggregators, or automated third-party ad platforms.
                </div>
              </div>

              <h3 style={{ fontSize: 19, fontWeight: 600, color: '#1D1D1F' }}>1. Data We Collect</h3>
              <p style={{ fontSize: 15, color: '#424245' }}>
                To calculate astronomical planetary positions (Grahas), casting Vedic charts (Lagna, Navamsha, Dashamsha), and delivering your consultation, we collect:
              </p>
              <ul style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14.5, color: '#424245' }}>
                <li><strong>Identity & Contact Details:</strong> Full name, telephone/WhatsApp number, and optional email address.</li>
                <li><strong>Astronomical Birth Specifics:</strong> Exact date of birth, time of birth (including AM/PM and time zone), and geographic city/coordinates of birth.</li>
                <li><strong>Consultation Focus:</strong> Specific questions regarding career, marriage compatibility, health tendencies, or property layout for Vastu evaluations.</li>
                <li><strong>Transactional Data:</strong> Payment transaction identifiers issued by authorized payment processors (Razorpay, Stripe, UPI). We do not store raw credit card numbers or UPI PINs.</li>
              </ul>

              <h3 style={{ fontSize: 19, fontWeight: 600, color: '#1D1D1F' }}>2. Lawful Purpose & Processing</h3>
              <p style={{ fontSize: 15, color: '#424245' }}>
                Your data is processed strictly for:
              </p>
              <ul style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14.5, color: '#424245' }}>
                <li>Computing mathematical planetary ephemerides and divisional charts for your booked session.</li>
                <li>Dispatching appointment reminders, calendar invites, and digital meeting links via SMS/WhatsApp/Email.</li>
                <li>Generating and delivering bespoke computerized or hand-annotated PDF Janam Kundli reports.</li>
                <li>Maintaining your private Customer Portal where you may re-read charts and interact during your 30-day post-consultation window.</li>
              </ul>

              <h3 style={{ fontSize: 19, fontWeight: 600, color: '#1D1D1F' }}>3. Data Storage & Technical Safeguards</h3>
              <p style={{ fontSize: 15, color: '#424245' }}>
                All electronic transmissions between your browser and Amit Astro servers are protected using industry-standard Transport Layer Security (TLS 1.3 / SSL with 256-bit encryption). Customer chart databases are hosted on enterprise cloud infrastructure with strict access controls restricted to Astrologer Amit and authorized senior compliance staff.
              </p>

              <h3 style={{ fontSize: 19, fontWeight: 600, color: '#1D1D1F' }}>4. Minors & Children’s Birth Charts</h3>
              <p style={{ fontSize: 15, color: '#424245' }}>
                We only accept and analyze birth charts of individuals under 18 years of age when submitted directly by a parent or legal guardian for educational, health, or developmental Vedic guidance.
              </p>

              <h3 style={{ fontSize: 19, fontWeight: 600, color: '#1D1D1F' }}>5. Your Statutory Rights (Access, Correction & Right to be Forgotten)</h3>
              <p style={{ fontSize: 15, color: '#424245' }}>
                Under the Indian Digital Personal Data Protection (DPDP) Act and international privacy frameworks:
              </p>
              <ul style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14.5, color: '#424245' }}>
                <li><strong>Right to Review:</strong> You may inspect all personal charts and saved family profiles via your Customer Portal.</li>
                <li><strong>Right to Rectification:</strong> You may update or correct erroneous birth times or locations.</li>
                <li><strong>Right to Erasure / Account Deletion:</strong> You may permanently purge your account, charts, and consultation logs at any time by emailing <code>privacy@amitastro.com</code>. Erasure requests are completed within 72 hours.</li>
              </ul>

              <div style={{ marginTop: 12, padding: '20px', backgroundColor: '#F5F5F7', borderRadius: 14, fontSize: 14 }}>
                <strong>Data Privacy Officer Contact:</strong><br />
                Amit Astro Data Protection Cell · Email: <a href="mailto:privacy@amitastro.com" style={{ color: '#3A3A6E', fontWeight: 600 }}>privacy@amitastro.com</a><br />
                Address: Amit Astro Vedic Center, Connaught Place, New Delhi 110001, India.
              </div>
            </div>
          )}

          {/* TAB 2: TERMS OF SERVICE */}
          {tab === 'terms' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, color: '#1D1D1F', lineHeight: 1.75 }}>
              <div style={{ borderBottom: '1px solid #E5E5EA', paddingBottom: 20 }}>
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#3A3A6E' }}>
                  Legal Agreement
                </span>
                <h2 className="text-h2" style={{ fontSize: 28, marginTop: 4, marginBottom: 8 }}>
                  Terms of Service & Astrological Advisory Agreement
                </h2>
                <p style={{ color: '#6E6E73', fontSize: 15 }}>
                  Please review these Terms carefully before scheduling a consultation or accessing digital services offered by Amit Astro and Astrologer Amit.
                </p>
              </div>

              <h3 style={{ fontSize: 19, fontWeight: 600, color: '#1D1D1F' }}>1. Acceptance of Terms</h3>
              <p style={{ fontSize: 15, color: '#424245' }}>
                By booking an appointment, purchasing a digital consultation package, accessing the customer portal, or interacting with Amit Astro, you legally enter into a binding agreement governed by these terms and the laws of the Republic of India.
              </p>

              <h3 style={{ fontSize: 19, fontWeight: 600, color: '#1D1D1F' }}>2. User Eligibility & Representation</h3>
              <p style={{ fontSize: 15, color: '#424245' }}>
                You must be at least 18 years of age or possess legal parental/guardian consent to book a paid consultation. You affirm that all birth timestamps, dates, and locations provided are accurate to the best of your knowledge.
              </p>

              <h3 style={{ fontSize: 19, fontWeight: 600, color: '#1D1D1F' }}>3. Professional Nature of Vedic Consultations</h3>
              <p style={{ fontSize: 15, color: '#424245' }}>
                All consultations conducted by Amit represent ancient Jyotish interpretations based on Maharishi Parashara and Jaimini Vedic traditions. Astrology is an advisory and spiritual science based on cosmic probabilities, planetary cycles (Dashas), and transits (Gochara). Consultations provide philosophical perspective and energetic remedies; they do not dictate unavoidable fatalism or remove personal human responsibility.
              </p>

              <h3 style={{ fontSize: 19, fontWeight: 600, color: '#1D1D1F' }}>4. Code of Mutual Respect & Decorum</h3>
              <p style={{ fontSize: 15, color: '#424245' }}>
                Consultations take place in a spirit of spiritual calm, mutual dignity, and mutual respect. Any verbally abusive, profane, discriminatory, harassing, or hostile behavior directed toward Amit or staff will result in immediate termination of the session without eligibility for a refund.
              </p>

              <h3 style={{ fontSize: 19, fontWeight: 600, color: '#1D1D1F' }}>5. Intellectual Property Rights</h3>
              <p style={{ fontSize: 15, color: '#424245' }}>
                All original articles, planetary calculators, Vedic algorithms, custom report templates, logos, and audio recordings provided during sessions remain the intellectual property of Amit Astro. They are licensed to the individual seeker solely for personal, non-commercial reflection. You may not republish, distribute, broadcast, or commercialize these materials without prior written consent.
              </p>

              <h3 style={{ fontSize: 19, fontWeight: 600, color: '#1D1D1F' }}>6. Limitation of Liability</h3>
              <p style={{ fontSize: 15, color: '#424245' }}>
                To the fullest extent permissible by applicable law, neither Amit nor Amit Astro shall be held liable for any direct, indirect, incidental, punitive, or consequential damages resulting from choices, career decisions, commercial investments, marriages, or psychological reactions made by the client following a reading. The seeker assumes 100% full sovereign responsibility for all life actions.
              </p>

              <h3 style={{ fontSize: 19, fontWeight: 600, color: '#1D1D1F' }}>7. Governing Law & Dispute Jurisdiction</h3>
              <p style={{ fontSize: 15, color: '#424245' }}>
                These Terms shall be construed, interpreted, and governed under the laws of the Republic of India. In the event of any irreconcilable dispute, the courts located in New Delhi, India shall hold exclusive territorial and subject-matter jurisdiction.
              </p>
            </div>
          )}

          {/* TAB 3: DISCLAIMER */}
          {tab === 'disclaimer' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, color: '#1D1D1F', lineHeight: 1.75 }}>
              <div style={{ borderBottom: '1px solid #E5E5EA', paddingBottom: 20 }}>
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#D98E04' }}>
                  Statutory Guidance Disclaimer
                </span>
                <h2 className="text-h2" style={{ fontSize: 28, marginTop: 4, marginBottom: 8 }}>
                  Statutory Astrology, Medical, Financial & Legal Disclaimer
                </h2>
                <p style={{ color: '#6E6E73', fontSize: 15 }}>
                  Mandatory regulatory notice regarding the spiritual, advisory, and non-clinical nature of Vedic astrological guidance.
                </p>
              </div>

              {/* Major Gold Warning Alert Box */}
              <div
                style={{
                  padding: '24px 28px',
                  backgroundColor: '#FFFBEB',
                  borderRadius: 16,
                  border: '1px solid #FDE68A',
                  color: '#92400E',
                  fontSize: 15,
                  lineHeight: 1.7
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, fontWeight: 700, fontSize: 16, color: '#B45309' }}>
                  <AlertCircle size={22} color="#D97706" />
                  <span>Important Consumer Notice & Clear Boundaries</span>
                </div>
                Vedic Astrology (Jyotish) and Vastu Shastra are traditional spiritual, philosophical, and diagnostic observational sciences rooted in ancient Indian heritage. All consultations, chart interpretations, gemological suggestions, and spatial balancing remedies offered by Amit and Amit Astro are intended <strong>exclusively for personal guidance, spiritual insight, and self-reflection</strong>. They do not constitute, and must NEVER be relied upon as, a substitute for professional clinical medical treatment, psychiatric diagnosis, registered financial advisory, or licensed legal representation.
              </div>

              <h3 style={{ fontSize: 19, fontWeight: 600, color: '#1D1D1F' }}>1. No Medical or Psychiatric Advice</h3>
              <p style={{ fontSize: 15, color: '#424245' }}>
                Astrological indications regarding bodily constitutions (Ayurvedic Doshas: Vata, Pitta, Kapha) or planetary afflictions are symbolic and energetic. Astrologer Amit is not a licensed physician, psychiatrist, or mental health clinician. If you are experiencing acute medical distress, physical symptoms, severe depression, or suicidal ideation, you must immediately consult a qualified medical professional or emergency healthcare facility.
              </p>

              <h3 style={{ fontSize: 19, fontWeight: 600, color: '#1D1D1F' }}>2. No Investment, Securities or Financial Advice</h3>
              <p style={{ fontSize: 15, color: '#424245' }}>
                Discussions concerning wealth timing, business dasha cycles, or planetary transits are spiritual reflections on karmic currents. They do not constitute financial planning, equity investment recommendations, tax advisory, or securities trading advice under SEBI regulations. Any capital allocations or business risks are made solely at your own risk.
              </p>

              <h3 style={{ fontSize: 19, fontWeight: 600, color: '#1D1D1F' }}>3. Free Will & The Doctrine of Karma</h3>
              <p style={{ fontSize: 15, color: '#424245' }}>
                Authentic Vedic tradition clearly teaches that human beings are endowed with <em>Purushartha</em> (conscious free will and righteous effort). Planetary positions illuminate tendencies and optimal timings, but do not imprison human destiny. You maintain full sovereignty over every decision you take.
              </p>

              <h3 style={{ fontSize: 19, fontWeight: 600, color: '#1D1D1F' }}>4. Compliance with Drugs and Magic Remedies Act</h3>
              <p style={{ fontSize: 15, color: '#424245' }}>
                In strict compliance with the Drugs and Magic Remedies (Objectionable Advertisements) Act of India, Amit Astro makes <strong>no claims</strong> of miraculous cures, supernatural talismanic remedies for clinical diseases, guaranteed jackpot lotteries, or occult manipulation. Our guidance emphasizes ethical Vedic lifestyle, dhyana (meditation), ethical conduct, and classical astronomical calculations.
              </p>
            </div>
          )}

          {/* TAB 4: REFUND & RESCHEDULING */}
          {tab === 'refund' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, color: '#1D1D1F', lineHeight: 1.75 }}>
              <div style={{ borderBottom: '1px solid #E5E5EA', paddingBottom: 20 }}>
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#10B981' }}>
                  Client Convenience & Integrity
                </span>
                <h2 className="text-h2" style={{ fontSize: 28, marginTop: 4, marginBottom: 8 }}>
                  Refund, Cancellation & Rescheduling Policy
                </h2>
                <p style={{ color: '#6E6E73', fontSize: 15 }}>
                  Clear, compassionate, and predictable booking guidelines designed to honor both your personal schedule and the extensive preparation required for chart casting.
                </p>
              </div>

              {/* 3 Grid Pillars */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
                <div style={{ padding: 24, backgroundColor: '#F0FDF4', borderRadius: 16, border: '1px solid #BBF7D0' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#15803D', textTransform: 'uppercase', marginBottom: 4 }}>
                    Free Rescheduling
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#166534', marginBottom: 8 }}>
                    Up to 4 Hours Prior
                  </div>
                  <p style={{ fontSize: 13.5, color: '#14532D', lineHeight: 1.5 }}>
                    Unforeseen emergency? You may reschedule your consultation slot at ₹0 additional charge by notifying us at least 4 hours ahead.
                  </p>
                </div>

                <div style={{ padding: 24, backgroundColor: '#EFF6FF', borderRadius: 16, border: '1px solid #BFDBFE' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1D4ED8', textTransform: 'uppercase', marginBottom: 4 }}>
                    100% Full Refund
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#1E40AF', marginBottom: 8 }}>
                    24 Hours in Advance
                  </div>
                  <p style={{ fontSize: 13.5, color: '#1E3A8A', lineHeight: 1.5 }}>
                    Need to cancel? Requests made at least 24 hours prior to your scheduled slot are eligible for an immediate, unconditional 100% refund.
                  </p>
                </div>

                <div style={{ padding: 24, backgroundColor: '#FEF2F2', borderRadius: 16, border: '1px solid #FECACA' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#B91C1C', textTransform: 'uppercase', marginBottom: 4 }}>
                    Short Notice & No-Show
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#991B1B', marginBottom: 8 }}>
                    Within 4 Hours
                  </div>
                  <p style={{ fontSize: 13.5, color: '#7F1D1D', lineHeight: 1.5 }}>
                    Because Amit spends 30–45 minutes pre-casting your ephemeris prior to the call, cancellations under 4 hours or no-shows are non-refundable.
                  </p>
                </div>
              </div>

              <h3 style={{ fontSize: 19, fontWeight: 600, color: '#1D1D1F' }}>1. How to Request Rescheduling or Cancellation</h3>
              <p style={{ fontSize: 15, color: '#424245' }}>
                You can easily reschedule your session by:
              </p>
              <ul style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14.5, color: '#424245' }}>
                <li>Accessing your <strong>Customer Portal</strong> under "Scheduled Appointments" and selecting "Reschedule Slot".</li>
                <li>Sending a WhatsApp message to our dedicated coordinator at <strong>+91 98765 43210</strong> with your Booking ID.</li>
                <li>Emailing <code>billing@amitastro.com</code> with your order receipt.</li>
              </ul>

              <h3 style={{ fontSize: 19, fontWeight: 600, color: '#1D1D1F' }}>2. Astrologer Unavailability Guarantee</h3>
              <p style={{ fontSize: 15, color: '#424245' }}>
                In the rare event that Astrologer Amit is called away due to an urgent family bereavement, religious Vedic ceremony, or sudden illness, you will be offered:
              </p>
              <ul style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14.5, color: '#424245' }}>
                <li>Priority immediate rescheduling to the very next available VIP slot; OR</li>
                <li>An immediate, unconditional 100% full refund with our sincere apologies.</li>
              </ul>

              <h3 style={{ fontSize: 19, fontWeight: 600, color: '#1D1D1F' }}>3. Written Reports & Digital Work Delivery</h3>
              <p style={{ fontSize: 15, color: '#424245' }}>
                Custom Janam Kundli PDF reports, detailed Vastu blueprints, and compatibility dossiers involve custom mathematical calculations and labor. Once a written report has been compiled and emailed or uploaded to your portal, fees for written reports are non-refundable. If any factual birth timestamp was entered incorrectly by our team, we will re-generate the corrected report at zero additional charge.
              </p>

              <h3 style={{ fontSize: 19, fontWeight: 600, color: '#1D1D1F' }}>4. Refund Processing Timeline</h3>
              <p style={{ fontSize: 15, color: '#424245' }}>
                Approved refunds are processed via our banking gateway (Razorpay / Stripe) back to the original method of payment (UPI, Credit/Debit card, or Netbanking) within <strong>5 to 7 working business days</strong>.
              </p>
            </div>
          )}

          {/* TAB 5: DIGITAL SERVICE DELIVERY & SHIPPING */}
          {tab === 'delivery' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, color: '#1D1D1F', lineHeight: 1.75 }}>
              <div style={{ borderBottom: '1px solid #E5E5EA', paddingBottom: 20 }}>
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#3A3A6E' }}>
                  Merchant & Gateway Compliance
                </span>
                <h2 className="text-h2" style={{ fontSize: 28, marginTop: 4, marginBottom: 8 }}>
                  Digital Service Delivery & Fulfillment Policy
                </h2>
                <p style={{ color: '#6E6E73', fontSize: 15 }}>
                  This policy outlines the fulfillment timelines and electronic delivery methods for all consultations and astrological reports purchased through Amit Astro.
                </p>
              </div>

              <div style={{ padding: '18px 22px', backgroundColor: '#F8F9FA', borderRadius: 14, border: '1px solid #E9ECEF', display: 'flex', gap: 14 }}>
                <Truck size={22} color="#3A3A6E" style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: 14, color: '#495057' }}>
                  <strong>Digital Services Only (Zero Shipping Charges):</strong> Amit Astro provides 100% digital advisory consultations and electronic reports. We do not dispatch physical parcel shipments, couriers, or tangible goods. Consequently, shipping fees are <strong>₹0.00 (Nil)</strong> across all countries and packages.
                </div>
              </div>

              <h3 style={{ fontSize: 19, fontWeight: 600, color: '#1D1D1F' }}>1. Consultation Slot Delivery</h3>
              <p style={{ fontSize: 15, color: '#424245' }}>
                Upon successful payment:
              </p>
              <ul style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14.5, color: '#424245' }}>
                <li><strong>Instant Confirmation:</strong> An electronic booking voucher with your confirmed appointment slot, Google Meet / secure video conferencing link, and dial-in telephone numbers is generated immediately on screen.</li>
                <li><strong>Automated Notification:</strong> A copy of the confirmation is dispatched within <strong>5 minutes</strong> via SMS, WhatsApp, and registered email address.</li>
                <li><strong>Pre-Session Reminder:</strong> A 1-hour and 15-minute reminder ping is sent to ensure you are ready in a quiet room.</li>
              </ul>

              <h3 style={{ fontSize: 19, fontWeight: 600, color: '#1D1D1F' }}>2. Live 1-on-1 Session Delivery</h3>
              <p style={{ fontSize: 15, color: '#424245' }}>
                Live consultations are conducted at the exact appointed time via high-definition secure audio/video link or phone call. Amit will join promptly at the commencement of your slot.
              </p>

              <h3 style={{ fontSize: 19, fontWeight: 600, color: '#1D1D1F' }}>3. Written PDF Kundli & Vastu Report Delivery</h3>
              <p style={{ fontSize: 15, color: '#424245' }}>
                For packages that include written materials (Comprehensive Life Blueprint, Matchmaking Dossier, Vastu Spatial Plan):
              </p>
              <ul style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14.5, color: '#424245' }}>
                <li><strong>Turnaround Time:</strong> Delivered electronically within <strong>24 to 48 business hours</strong> following your live consultation.</li>
                <li><strong>Format:</strong> High-resolution, printable PDF document sent to your registered email address and made available for permanent direct download within your encrypted Customer Portal.</li>
              </ul>

              <h3 style={{ fontSize: 19, fontWeight: 600, color: '#1D1D1F' }}>4. Non-Delivery Escalation</h3>
              <p style={{ fontSize: 15, color: '#424245' }}>
                If you have not received your digital booking invite within 15 minutes or your written report within 48 hours (due to email spam filtering or typo in email ID), please reach out immediately:
              </p>
              <div style={{ marginTop: 8, padding: '16px 20px', backgroundColor: '#F5F5F7', borderRadius: 12, fontSize: 14 }}>
                Email: <strong>support@amitastro.com</strong> · WhatsApp Coordinator: <strong>+91 98765 43210</strong>
              </div>
            </div>
          )}

          {/* TAB 6: GRIEVANCE REDRESSAL & COMPLIANCE OFFICER */}
          {tab === 'grievance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, color: '#1D1D1F', lineHeight: 1.75 }}>
              <div style={{ borderBottom: '1px solid #E5E5EA', paddingBottom: 20 }}>
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#3A3A6E' }}>
                  Statutory Regulatory Mandate
                </span>
                <h2 className="text-h2" style={{ fontSize: 28, marginTop: 4, marginBottom: 8 }}>
                  Grievance Redressal Mechanism & Statutory Compliance Officer
                </h2>
                <p style={{ color: '#6E6E73', fontSize: 15 }}>
                  In accordance with Rule 3(2) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021 and the Consumer Protection (E-Commerce) Rules, 2020.
                </p>
              </div>

              <p style={{ fontSize: 15, color: '#424245' }}>
                Amit Astro is committed to fair dealing, swift grievance resolution, and transparent business operations. If you have any complaint, technical grievance, billing discrepancy, or privacy concern, our designated Grievance Officer is legally empowered to resolve your concerns.
              </p>

              {/* Official Officer Card */}
              <div 
                style={{ 
                  padding: '28px 32px', 
                  backgroundColor: '#FFFFFF', 
                  borderRadius: 18, 
                  border: '1.5px solid #E5E5EA',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.03)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(58, 58, 110, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Scale size={24} color="#3A3A6E" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#1D1D1F' }}>
                      Grievance & Statutory Compliance Officer
                    </h3>
                    <div style={{ fontSize: 13, color: '#6E6E73' }}>
                      Appointed under Rule 3(2), IT Rules 2021
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, fontSize: 14, color: '#424245' }}>
                  <div>
                    <strong style={{ color: '#1D1D1F' }}>Designation:</strong><br />
                    Head of Consumer Redressal & Legal Compliance
                  </div>
                  <div>
                    <strong style={{ color: '#1D1D1F' }}>Official Email:</strong><br />
                    <a href="mailto:grievance@amitastro.com" style={{ color: '#3A3A6E', fontWeight: 600 }}>grievance@amitastro.com</a>
                  </div>
                  <div>
                    <strong style={{ color: '#1D1D1F' }}>Helpline Phone:</strong><br />
                    +91 98765 43210 (Ext. 4)
                  </div>
                  <div>
                    <strong style={{ color: '#1D1D1F' }}>Working Hours:</strong><br />
                    Monday to Friday, 10:00 AM – 6:00 PM IST
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <strong style={{ color: '#1D1D1F' }}>Postal & Physical Office:</strong><br />
                    Amit Astro Center for Vedic Studies & Legal Compliance, Barakhamba Road, Connaught Place, New Delhi, 110001, India.
                  </div>
                </div>
              </div>

              <h3 style={{ fontSize: 19, fontWeight: 600, color: '#1D1D1F' }}>Grievance Resolution Timelines & Process</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 9999, backgroundColor: '#3A3A6E', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                    1
                  </div>
                  <div>
                    <strong style={{ color: '#1D1D1F' }}>48-Hour Acknowledgment:</strong><br />
                    <span style={{ fontSize: 14, color: '#6E6E73' }}>Every formal grievance sent to <code>grievance@amitastro.com</code> is issued a unique tracking ticket and acknowledged within 48 business hours.</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 9999, backgroundColor: '#3A3A6E', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                    2
                  </div>
                  <div>
                    <strong style={{ color: '#1D1D1F' }}>Investigation & Audit:</strong><br />
                    <span style={{ fontSize: 14, color: '#6E6E73' }}>Our compliance team audits the call recordings, calendar logs, and billing gateway records.</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 9999, backgroundColor: '#3A3A6E', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                    3
                  </div>
                  <div>
                    <strong style={{ color: '#1D1D1F' }}>Final Resolution within 15 Days:</strong><br />
                    <span style={{ fontSize: 14, color: '#6E6E73' }}>A comprehensive written finding and remediation (reschedule, refund, or corrective action) is delivered within 15 working days (and no later than 30 days statutory maximum).</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: ETHICAL CHARTER */}
          {tab === 'ethics' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, color: '#1D1D1F', lineHeight: 1.75 }}>
              <div style={{ borderBottom: '1px solid #E5E5EA', paddingBottom: 20 }}>
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#3A3A6E' }}>
                  Our Sacred Professional Creed
                </span>
                <h2 className="text-h2" style={{ fontSize: 28, marginTop: 4, marginBottom: 8 }}>
                  Astrological Ethical Charter & Code of Conduct
                </h2>
                <p style={{ color: '#6E6E73', fontSize: 15 }}>
                  The golden standard of authentic, fear-free Vedic guidance founded by Astrologer Amit to protect seekers from commercial superstition.
                </p>
              </div>

              {/* 4 Pillars of Ethics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                <div style={{ padding: 24, backgroundColor: '#FAF5FF', borderRadius: 16, border: '1px solid #E9D5FF' }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#6B21A8', marginBottom: 6 }}>
                    1. Absolute Zero Fear-Mongering
                  </div>
                  <p style={{ fontSize: 14, color: '#581C87', lineHeight: 1.6 }}>
                    We never exploit celestial configurations like Manglik Dosha, Kalsarpa Yoga, Sade Sati, or Pitra Dosha to induce fear or pressure you into buying inflated remedies. Every planetary dasha has evolutionary potential.
                  </p>
                </div>

                <div style={{ padding: 24, backgroundColor: '#F0FDF4', borderRadius: 16, border: '1px solid #BBF7D0' }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#15803D', marginBottom: 6 }}>
                    2. Authentic Classical Lineage
                  </div>
                  <p style={{ fontSize: 14, color: '#14532D', lineHeight: 1.6 }}>
                    Readings strictly adhere to Maharishi Parashara's <em>Brihat Parashara Hora Shastra</em>, Jaimini Upadesha Sutras, and classical <em>Mayamatam Vastu</em>. No fabricated modern pseudo-occult theories.
                  </p>
                </div>

                <div style={{ padding: 24, backgroundColor: '#EFF6FF', borderRadius: 16, border: '1px solid #BFDBFE' }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#1D4ED8', marginBottom: 6 }}>
                    3. Modest, Doable Remedies
                  </div>
                  <p style={{ fontSize: 14, color: '#1E3A8A', lineHeight: 1.6 }}>
                    Remedies focus on Vedic mantras, sound vibrations (Japa), meditation, intentional acts of charity (Daan), and simple spatial rearrangements. We do not coerce clients into exorbitant pujas or synthetic gemstones.
                  </p>
                </div>

                <div style={{ padding: 24, backgroundColor: '#FFFBEB', borderRadius: 16, border: '1px solid #FDE68A' }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#B45309', marginBottom: 6 }}>
                    4. Sacred Seeker Confidentiality
                  </div>
                  <p style={{ fontSize: 14, color: '#78350F', lineHeight: 1.6 }}>
                    What transpires in your consultation remains locked between you and Amit in spiritual confidence. Your charts and intimate questions are never shared publicly or used for case-study exploitation.
                  </p>
                </div>
              </div>

              <h3 style={{ fontSize: 19, fontWeight: 600, color: '#1D1D1F' }}>Transparent Fee Philosophy</h3>
              <p style={{ fontSize: 15, color: '#424245' }}>
                At Amit Astro, consultation fees are transparent, fixed, and clearly listed. You will never encounter unexpected surprise fees, hidden "unlock" charges, or escalating costs mid-consultation.
              </p>
            </div>
          )}

          {/* TAB 8: COOKIE & STORAGE POLICY */}
          {tab === 'cookies' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, color: '#1D1D1F', lineHeight: 1.75 }}>
              <div style={{ borderBottom: '1px solid #E5E5EA', paddingBottom: 20 }}>
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#3A3A6E' }}>
                  Browser & Web Storage Disclosure
                </span>
                <h2 className="text-h2" style={{ fontSize: 28, marginTop: 4, marginBottom: 8 }}>
                  Cookie Policy & Local Storage Usage
                </h2>
                <p style={{ color: '#6E6E73', fontSize: 15 }}>
                  How Amit Astro utilizes minimal, privacy-centric cookies and browser local storage to maintain session security and personalization.
                </p>
              </div>

              <h3 style={{ fontSize: 19, fontWeight: 600, color: '#1D1D1F' }}>1. What Are Cookies & Local Storage?</h3>
              <p style={{ fontSize: 15, color: '#424245' }}>
                Cookies and HTML5 Local Storage are small, encrypted text keys stored by your web browser on your computer or mobile phone. They permit web applications to remember your login session, saved chart preferences, and selected language.
              </p>

              <h3 style={{ fontSize: 19, fontWeight: 600, color: '#1D1D1F' }}>2. Categories of Storage We Use</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ padding: '16px 20px', backgroundColor: '#F5F5F7', borderRadius: 12 }}>
                  <strong style={{ color: '#1D1D1F' }}>A. Strictly Necessary & Authentication Storage:</strong>
                  <p style={{ margin: '4px 0 0', fontSize: 14, color: '#6E6E73' }}>
                    Contains the encrypted <code>amitastro_token</code> session identifier. Required to authenticate your identity when accessing the Customer Portal, viewing scheduled appointments, and sending private messages to Astrologer Amit.
                  </p>
                </div>

                <div style={{ padding: '16px 20px', backgroundColor: '#F5F5F7', borderRadius: 12 }}>
                  <strong style={{ color: '#1D1D1F' }}>B. Functional & Language Preference Storage:</strong>
                  <p style={{ margin: '4px 0 0', fontSize: 14, color: '#6E6E73' }}>
                    Stores keys like <code>amit_astro_lang</code> (English vs. Hindi preference) so you don't need to reselect your preferred language upon every page reload.
                  </p>
                </div>

                <div style={{ padding: '16px 20px', backgroundColor: '#F5F5F7', borderRadius: 12 }}>
                  <strong style={{ color: '#1D1D1F' }}>C. Privacy-Preserving Performance Analytics:</strong>
                  <p style={{ margin: '4px 0 0', fontSize: 14, color: '#6E6E73' }}>
                    Anonymized telemetry to detect page load latency, network drops, or payment gateway timeout errors. No cross-site ad retargeting cookies are used.
                  </p>
                </div>
              </div>

              <h3 style={{ fontSize: 19, fontWeight: 600, color: '#1D1D1F' }}>3. How to Manage or Clear Cookies</h3>
              <p style={{ fontSize: 15, color: '#424245' }}>
                You can delete, block, or clear cookies and local storage directly through your browser settings (Chrome, Safari, Edge, Firefox). Please note that clearing authentication tokens will require you to re-sign in to access your Customer Portal.
              </p>
            </div>
          )}

          {/* Bottom Compliance Navigation Footer */}
          <div 
            style={{ 
              marginTop: 48, 
              paddingTop: 28, 
              borderTop: '1px solid #E5E5EA', 
              display: 'flex', 
              flexWrap: 'wrap', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              gap: 16 
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#6E6E73' }}>
              <CheckCircle2 size={18} color="#2FA84F" />
              <span>Amit Astro Compliance Portal · Verified ISO 27001 & DPDP Standard</span>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => window.print()}
                className="apple-btn-secondary"
                style={{ padding: '8px 16px', fontSize: 13 }}
              >
                Print / Save Document
              </button>
              <a
                href="mailto:compliance@amitastro.com"
                className="apple-btn-primary"
                style={{ padding: '8px 16px', fontSize: 13, textDecoration: 'none' }}
              >
                Contact Legal Cell
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
