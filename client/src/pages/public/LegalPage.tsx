import React, { useState } from 'react';

interface LegalPageProps {
  initialTab?: 'privacy' | 'terms' | 'refund';
}

export const LegalPage: React.FC<LegalPageProps> = ({ initialTab = 'privacy' }) => {
  const [tab, setTab] = useState<'privacy' | 'terms' | 'refund'>(initialTab);

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 96 }}>
      <section style={{ backgroundColor: '#F5F5F7', padding: '64px 0 44px', borderBottom: '1px solid #E5E5EA', textAlign: 'center' }}>
        <div className="container">
          <span className="apple-badge-primary">Trust & Compliance</span>
          <h1 className="text-display" style={{ fontSize: 40, marginTop: 10, marginBottom: 8 }}>
            Policies & Astrology Disclaimers
          </h1>
          <p className="text-body-large" style={{ maxWidth: 600, margin: '0 auto' }}>
            Amit Astro values your absolute privacy and sets clear boundaries regarding cosmic guidance.
          </p>
        </div>
      </section>

      <div className="container" style={{ maxWidth: 880, marginTop: 44 }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: 12, borderBottom: '1px solid #E5E5EA', paddingBottom: 12, marginBottom: 36 }}>
          <button
            onClick={() => setTab('privacy')}
            style={{
              padding: '8px 18px',
              borderRadius: 9999,
              border: tab === 'privacy' ? '1px solid #3A3A6E' : '1px solid #E5E5EA',
              backgroundColor: tab === 'privacy' ? '#3A3A6E' : '#FFFFFF',
              color: tab === 'privacy' ? '#FFFFFF' : '#1D1D1F',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Privacy Policy (PII & Birth Data)
          </button>

          <button
            onClick={() => setTab('terms')}
            style={{
              padding: '8px 18px',
              borderRadius: 9999,
              border: tab === 'terms' ? '1px solid #3A3A6E' : '1px solid #E5E5EA',
              backgroundColor: tab === 'terms' ? '#3A3A6E' : '#FFFFFF',
              color: tab === 'terms' ? '#FFFFFF' : '#1D1D1F',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Terms of Service & Disclaimer
          </button>

          <button
            onClick={() => setTab('refund')}
            style={{
              padding: '8px 18px',
              borderRadius: 9999,
              border: tab === 'refund' ? '1px solid #3A3A6E' : '1px solid #E5E5EA',
              backgroundColor: tab === 'refund' ? '#3A3A6E' : '#FFFFFF',
              color: tab === 'refund' ? '#FFFFFF' : '#1D1D1F',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Refund & Rescheduling
          </button>
        </div>

        {/* Content Box */}
        <div className="apple-card" style={{ padding: '40px 36px', backgroundColor: '#FFFFFF' }}>
          {tab === 'privacy' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, color: '#1D1D1F', lineHeight: 1.7 }}>
              <h2 className="text-h2" style={{ fontSize: 24 }}>Privacy Policy & Personal Birth Data Protection</h2>
              <p>
                At <strong>Amit Astro</strong>, we recognize that birth charts, exact birth timings, family genealogies, and personal life questions are deeply sensitive personal information (PII). We hold your information in highest confidence.
              </p>
              <h3 style={{ fontSize: 18, fontWeight: 600 }}>1. Data We Collect</h3>
              <p>
                We collect your name, mobile phone number, optional email address, and birth specifics (date, time, and coordinates/city of birth). This information is utilized solely by Amit for casting mathematical planetary positions (Kundli) and delivering your consultation.
              </p>
              <h3 style={{ fontSize: 18, fontWeight: 600 }}>2. No Third-Party Commercial Sharing</h3>
              <p>
                We strictly never sell, lease, or rent your personal birth information or phone numbers to third-party marketing networks or automated bots.
              </p>
              <h3 style={{ fontSize: 18, fontWeight: 600 }}>3. Right to Deletion & Export</h3>
              <p>
                In compliance with modern digital data principles, you may request full export or permanent anonymization/deletion of your account and saved family birth profiles at any time by contacting privacy@amitastro.com or through your account portal.
              </p>
            </div>
          )}

          {tab === 'terms' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, color: '#1D1D1F', lineHeight: 1.7 }}>
              <h2 className="text-h2" style={{ fontSize: 24 }}>Terms of Service & Astrology Disclaimer</h2>
              <div
                style={{
                  padding: '16px 20px',
                  backgroundColor: '#FFF8E6',
                  borderRadius: 12,
                  border: '1px solid #D98E04',
                  color: '#9C6500',
                  fontSize: 14.5
                }}
              >
                <strong>Statutory Astrology & Guidance Disclaimer:</strong> All astrological analyses, planetary calculations, and Vastu consultations provided by Amit and Amit Astro are traditional Vedic opinions offered purely for spiritual clarity, personal enrichment, and guidance purposes. They do not constitute, and must not be used as, a substitute for professional clinical medical advice, psychiatric therapy, legal representation, or financial/investment counseling.
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 600 }}>1. Nature of Consultations</h3>
              <p>
                Astrology deals with cosmic probabilities and karmic tendencies. Individual decisions remain strictly the personal responsibility of the seeker. Amit Astro and Amit accept no liability for personal or commercial actions taken following a session.
              </p>
              <h3 style={{ fontSize: 18, fontWeight: 600 }}>2. Client Conduct</h3>
              <p>
                We maintain a respectful, spiritually supportive environment. Any abusive, harassing, or hostile behavior toward Amit or our support team results in immediate session termination without refund.
              </p>
            </div>
          )}

          {tab === 'refund' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, color: '#1D1D1F', lineHeight: 1.7 }}>
              <h2 className="text-h2" style={{ fontSize: 24 }}>Refund, Rescheduling & Cancellation Policy</h2>
              <p>
                We respect your valuable time and schedule our days meticulously around reserved appointment slots.
              </p>
              <h3 style={{ fontSize: 18, fontWeight: 600 }}>1. Free Rescheduling (Up to 4 Hours Prior)</h3>
              <p>
                If an unforeseen personal emergency occurs, you may reschedule your consultation slot at no additional charge by notifying us at least 4 hours before the scheduled time window.
              </p>
              <h3 style={{ fontSize: 18, fontWeight: 600 }}>2. Cancellation & Refunds</h3>
              <p>
                Cancellations requested at least 24 hours in advance of the confirmed slot are eligible for a 100% full refund to the original source of payment. Because Amit reserves dedicated prep time to cast and analyze your chart before the call, cancellations requested within 4 hours or no-shows are non-refundable.
              </p>
              <h3 style={{ fontSize: 18, fontWeight: 600 }}>3. Astrologer Unavailability</h3>
              <p>
                In the rare event that Amit is called away for an urgent religious ceremony or health reason, we will immediately offer priority rescheduling at your convenience or an unconditional immediate 100% refund.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
