import React from 'react';
import { Check, Star, Sparkles, Calendar, ShieldCheck, HelpCircle } from 'lucide-react';

interface PricingPageProps {
  onOpenBooking: (pkgId?: string) => void;
  onOpenTrial: () => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ onOpenBooking, onOpenTrial }) => {
  return (
    <div style={{ minHeight: '100vh', paddingBottom: 96 }}>
      {/* Header */}
      <section style={{ backgroundColor: '#F5F5F7', padding: '64px 0 48px', borderBottom: '1px solid #E5E5EA', textAlign: 'center' }}>
        <div className="container">
          <span className="apple-badge-gold">Transparent, Fixed Investments</span>
          <h1 className="text-display" style={{ fontSize: 44, marginTop: 10, marginBottom: 12 }}>
            Consultation Packages
          </h1>
          <p className="text-body-large" style={{ maxWidth: 640, margin: '0 auto' }}>
            Direct, uninterrupted time with Amit Soni. No hidden fees or automated answers — strictly personalized analysis.
          </p>
        </div>
      </section>

      {/* Pricing Cards Table */}
      <div className="container" style={{ marginTop: 54 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 20,
            alignItems: 'stretch'
          }}
        >
          {/* 1. Trial (Free) */}
          <div className="apple-card" style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <span className="apple-badge-primary" style={{ marginBottom: 12 }}>
                1-Time First Session
              </span>
              <h3 style={{ fontSize: 22, fontWeight: 700, margin: '8px 0 6px' }}>Trial Session</h3>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#1D1D1F', marginBottom: 4 }}>
                Free
              </div>
              <div style={{ fontSize: 13, color: '#6E6E73', marginBottom: 20 }}>
                5-Minute Discovery Call
              </div>

              <div style={{ padding: '8px 12px', backgroundColor: '#F5F5F7', borderRadius: 8, fontSize: 12, color: '#6E6E73', marginBottom: 20 }}>
                Cost/Min: <strong>₹0.00</strong> (1 per verified phone)
              </div>

              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13.5 }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Check size={16} color="#2FA84F" /> 5-minute phone consultation
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Check size={16} color="#2FA84F" /> Shared trial chat budget
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Check size={16} color="#2FA84F" /> High-level chart impressions
                </li>
              </ul>
            </div>

            <button
              onClick={onOpenTrial}
              className="apple-btn-secondary"
              style={{ width: '100%', marginTop: 28, padding: 12 }}
            >
              Start Free Trial
            </button>
          </div>

          {/* 2. Quick Consult */}
          <div className="apple-card" style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <span className="apple-badge-primary" style={{ marginBottom: 12 }}>
                Focused Question
              </span>
              <h3 style={{ fontSize: 22, fontWeight: 700, margin: '8px 0 6px' }}>Quick Consult</h3>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#1D1D1F', marginBottom: 4 }}>
                ₹500
              </div>
              <div style={{ fontSize: 13, color: '#6E6E73', marginBottom: 20 }}>
                15-Minute Dedicated Call
              </div>

              <div style={{ padding: '8px 12px', backgroundColor: '#F5F5F7', borderRadius: 8, fontSize: 12, color: '#6E6E73', marginBottom: 20 }}>
                Cost/Min: <strong>₹33.33</strong>
              </div>

              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13.5 }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Check size={16} color="#2FA84F" /> 1 specific query analyzed
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Check size={16} color="#2FA84F" /> Direct phone call with Amit
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Check size={16} color="#2FA84F" /> Immediate clarity on decision
                </li>
              </ul>
            </div>

            <button
              onClick={() => onOpenBooking('pkg-quick')}
              className="apple-btn-secondary"
              style={{ width: '100%', marginTop: 28, padding: 12 }}
            >
              Book Quick Consult
            </button>
          </div>

          {/* 3. Standard (Decoy) */}
          <div className="apple-card" style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <span className="apple-badge-primary" style={{ marginBottom: 12 }}>
                Dasha Breakdown
              </span>
              <h3 style={{ fontSize: 22, fontWeight: 700, margin: '8px 0 6px' }}>Standard Consult</h3>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#1D1D1F', marginBottom: 4 }}>
                ₹999
              </div>
              <div style={{ fontSize: 13, color: '#6E6E73', marginBottom: 20 }}>
                30-Minute Comprehensive Call
              </div>

              <div style={{ padding: '8px 12px', backgroundColor: '#F5F5F7', borderRadius: 8, fontSize: 12, color: '#6E6E73', marginBottom: 20 }}>
                Cost/Min: <strong>₹33.30</strong>
              </div>

              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13.5 }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Check size={16} color="#2FA84F" /> Full Kundli & Dasha analysis
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Check size={16} color="#2FA84F" /> 3-Day follow-up in-app chat
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Check size={16} color="#2FA84F" /> Core astrological remedies
                </li>
              </ul>
            </div>

            <button
              onClick={() => onOpenBooking('pkg-standard')}
              className="apple-btn-secondary"
              style={{ width: '100%', marginTop: 28, padding: 12 }}
            >
              Book Standard
            </button>
          </div>

          {/* 4. Premium (Decoy Winner / Most Popular) */}
          <div
            className="apple-card"
            style={{
              padding: '36px 26px',
              border: '2px solid #C9A24B',
              boxShadow: '0 16px 40px rgba(201, 162, 75, 0.15)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div
                style={{
                  position: 'absolute',
                  top: -12,
                  right: 20,
                  backgroundColor: '#C9A24B',
                  color: '#FFFFFF',
                  fontSize: 10.5,
                  fontWeight: 700,
                  padding: '4px 12px',
                  borderRadius: 9999,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                ⭐ Most Popular
              </div>

              <span className="apple-badge-gold" style={{ marginBottom: 12 }}>
                Full Life Guidance
              </span>
              <h3 style={{ fontSize: 24, fontWeight: 700, margin: '8px 0 6px' }}>Premium Deep Consult</h3>
              <div style={{ fontSize: 36, fontWeight: 700, color: '#1D1D1F', marginBottom: 4 }}>
                ₹1,799
              </div>
              <div style={{ fontSize: 13, color: '#2FA84F', fontWeight: 600, marginBottom: 20 }}>
                45–60 Min Call + Remedies PDF
              </div>

              <div style={{ padding: '8px 12px', backgroundColor: 'rgba(47, 168, 79, 0.1)', borderRadius: 8, fontSize: 12, color: '#2FA84F', fontWeight: 600, marginBottom: 20 }}>
                Cost/Min: Only ₹29.98 (Lowest & Best Value)
              </div>

              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 11, fontSize: 13.5 }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Check size={16} color="#2FA84F" /> <strong>45–60 min in-depth call</strong>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Check size={16} color="#2FA84F" /> <strong>Written Remedies PDF Report</strong>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Check size={16} color="#2FA84F" /> <strong>7-Day follow-up chat with Amit</strong>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Check size={16} color="#2FA84F" /> Priority slot confirmation
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Check size={16} color="#2FA84F" /> Family chart brief glance
                </li>
              </ul>
            </div>

            <button
              onClick={() => onOpenBooking('pkg-premium')}
              className="apple-btn-gold"
              style={{ width: '100%', marginTop: 28, padding: 14 }}
            >
              Book Premium Session
            </button>
          </div>
        </div>

        {/* Social Proof Directly Under Pricing Table (Section 13) */}
        <div
          style={{
            marginTop: 48,
            padding: '24px 28px',
            backgroundColor: '#F5F5F7',
            borderRadius: 18,
            textAlign: 'center',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 28,
            border: '1px solid #E5E5EA'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Star size={18} color="#C9A24B" fill="#C9A24B" />
            <span style={{ fontWeight: 600, color: '#1D1D1F' }}>4.9 / 5 Rating</span>
          </div>
          <div style={{ color: '#E5E5EA' }}>|</div>
          <div style={{ color: '#6E6E73', fontSize: 14 }}>
            Over <strong>1,000+</strong> consultations conducted with complete privacy
          </div>
          <div style={{ color: '#E5E5EA' }}>|</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#2FA84F', fontWeight: 500, fontSize: 14 }}>
            <ShieldCheck size={16} /> 100% Satisfaction & Rescheduling Guarantee
          </div>
        </div>
      </div>
    </div>
  );
};
