import React, { useState } from 'react';
import { Sparkles, MessageCircle, Mail, Phone, ArrowRight, CheckCircle2 } from 'lucide-react';

interface AppleFooterProps {
  onNavigate: (path: string) => void;
}

export const AppleFooter: React.FC<AppleFooterProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer style={{ backgroundColor: '#F5F5F7', borderTop: '1px solid #E5E5EA', marginTop: 'auto' }}>
      <div className="container" style={{ padding: '64px 24px 32px' }}>
        {/* Top Newsletter & Authority Banner */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 24,
            paddingBottom: 48,
            borderBottom: '1px solid #E5E5EA'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Sparkles size={18} color="#C9A24B" />
              <span style={{ fontWeight: 600, fontSize: 18, color: '#1D1D1F' }}>
                The Nakshaktram Chronicle
              </span>
            </div>
            <p style={{ color: '#6E6E73', fontSize: 14, maxWidth: 460 }}>
              Receive thoughtful Vedic transit updates, Ekadashi alerts, and Vastu adjustments directly from Amit Soni. No noise, strictly spiritual wisdom.
            </p>
          </div>

          <form onSubmit={handleSubscribe} style={{ display: 'flex', gap: 8, width: '100%', maxWidth: 380 }}>
            {subscribed ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#2FA84F', fontSize: 14, fontWeight: 500 }}>
                <CheckCircle2 size={18} /> Subscribed to cosmic updates!
              </div>
            ) : (
              <>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  className="apple-input"
                  style={{ fontSize: 14, padding: '10px 14px' }}
                />
                <button
                  type="submit"
                  className="apple-btn-primary"
                  style={{ padding: '10px 18px', fontSize: 14, whiteSpace: 'nowrap' }}
                >
                  Join <ArrowRight size={14} />
                </button>
              </>
            )}
          </form>
        </div>

        {/* 4-Column Directory */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 36,
            padding: '48px 0 40px'
          }}
        >
          {/* Col 1: About */}
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: '#1D1D1F', marginBottom: 16 }}>
              About Nakshaktram
            </div>
            <p style={{ fontSize: 13.5, color: '#6E6E73', lineHeight: 1.6, marginBottom: 16 }}>
              Founded by <strong>Amit Soni</strong>, Nakshaktram unites classical Parashari Vedic Astrology, authentic Vastu Shastra, and bespoke cosmic remedies with modern discretion and clarity.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13.5, color: '#6E6E73' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Phone size={14} color="#3A3A6E" /> +91 98765 43210
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Mail size={14} color="#3A3A6E" /> consultations@nakshaktram.com
              </div>
            </div>
          </div>

          {/* Col 2: Services */}
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: '#1D1D1F', marginBottom: 16 }}>
              Consultations & Guidance
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13.5 }}>
              <li>
                <span onClick={() => onNavigate('/pricing')} style={{ color: '#6E6E73', cursor: 'pointer' }}>
                  Janma Kundli & Dasha Breakdown
                </span>
              </li>
              <li>
                <span onClick={() => onNavigate('/blog/vastu')} style={{ color: '#6E6E73', cursor: 'pointer' }}>
                  Home Vastu (Residential Layouts)
                </span>
              </li>
              <li>
                <span onClick={() => onNavigate('/blog/vastu')} style={{ color: '#6E6E73', cursor: 'pointer' }}>
                  Commercial & Business Vastu
                </span>
              </li>
              <li>
                <span onClick={() => onNavigate('/blog/transits')} style={{ color: '#6E6E73', cursor: 'pointer' }}>
                  Saturn Sade Sati & Transit Advice
                </span>
              </li>
              <li>
                <span onClick={() => onNavigate('/blog/gemstones')} style={{ color: '#6E6E73', cursor: 'pointer' }}>
                  Authentic Ratna (Gemstone) Guidance
                </span>
              </li>
              <li>
                <span onClick={() => onNavigate('/blog/numerology')} style={{ color: '#6E6E73', cursor: 'pointer' }}>
                  Vedic Numerology & Name Alignment
                </span>
              </li>
            </ul>
          </div>

          {/* Col 3: Quick Navigation */}
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: '#1D1D1F', marginBottom: 16 }}>
              Platform Sitemap
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13.5 }}>
              <li><span onClick={() => onNavigate('/')} style={{ color: '#6E6E73', cursor: 'pointer' }}>Home</span></li>
              <li><span onClick={() => onNavigate('/about')} style={{ color: '#6E6E73', cursor: 'pointer' }}>About Amit Soni</span></li>
              <li><span onClick={() => onNavigate('/pricing')} style={{ color: '#6E6E73', cursor: 'pointer' }}>Consultation Packages</span></li>
              <li><span onClick={() => onNavigate('/blog')} style={{ color: '#6E6E73', cursor: 'pointer' }}>Astrology & Vastu Blog</span></li>
              <li><span onClick={() => onNavigate('/contact')} style={{ color: '#6E6E73', cursor: 'pointer' }}>Contact & Directions</span></li>
              <li>
                <a
                  href="https://wa.me/919876543210?text=Namaste%20Amit%20ji,%20I%20would%20like%20to%20inquire%20about%20a%20consultation."
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#2FA84F', display: 'inline-flex', alignItems: 'center', gap: 5, textDecoration: 'none', fontWeight: 500 }}
                >
                  <MessageCircle size={14} /> WhatsApp Assistant
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Trust & Admin */}
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: '#1D1D1F', marginBottom: 16 }}>
              Client Trust & Hours
            </div>
            <p style={{ fontSize: 13, color: '#6E6E73', lineHeight: 1.6, marginBottom: 14 }}>
              <strong>Consultation Windows (IST):</strong><br />
              Morning: 09:00 AM – 05:00 PM<br />
              Evening: 08:00 PM – 12:00 Midnight<br />
              Monday through Sunday (Subject to slots)
            </p>
            <div style={{ marginTop: 12 }}>
              <button
                onClick={() => onNavigate('/admin')}
                style={{
                  background: 'none',
                  border: '1px solid #D1D1D6',
                  borderRadius: 6,
                  padding: '4px 10px',
                  fontSize: 11.5,
                  color: '#6E6E73',
                  cursor: 'pointer'
                }}
              >
                Astrologer Portal Login
              </button>
            </div>
          </div>
        </div>

        {/* Mandatory Legal & Disclaimer Box (Section 17) */}
        <div
          style={{
            padding: '18px 20px',
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            border: '1px solid #E5E5EA',
            marginBottom: 28
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 12, color: '#1D1D1F', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
            Astrological Guidance Disclaimer
          </div>
          <p style={{ fontSize: 12, color: '#86868B', lineHeight: 1.5 }}>
            Vedic astrology (Jyotish) and Vastu Shastra are traditional disciplines of cosmic analysis, spiritual reflection, and spatial alignment. All consultations, analyses, and remedial suggestions provided by Amit Soni and Nakshaktram are intended solely for personal guidance and spiritual insight. They do not constitute, nor should they ever be treated as a substitute for, professional medical diagnostics, psychological treatment, legal counsel, or financial advice.
          </p>
        </div>

        {/* Bottom Bar: Copyright & Policies */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
            paddingTop: 16,
            borderTop: '1px solid #E5E5EA',
            fontSize: 12.5,
            color: '#86868B'
          }}
        >
          <div>
            © {new Date().getFullYear()} Nakshaktram by Amit Soni. All rights reserved.
          </div>

          <div style={{ display: 'flex', gap: 20 }}>
            <span onClick={() => onNavigate('/legal/privacy')} style={{ cursor: 'pointer', color: '#6E6E73' }}>
              Privacy Policy
            </span>
            <span onClick={() => onNavigate('/legal/terms')} style={{ cursor: 'pointer', color: '#6E6E73' }}>
              Terms of Service
            </span>
            <span onClick={() => onNavigate('/legal/refund-policy')} style={{ cursor: 'pointer', color: '#6E6E73' }}>
              Refund & Cancellation
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
