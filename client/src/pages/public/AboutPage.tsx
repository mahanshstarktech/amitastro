import React from 'react';
import { Sparkles, Calendar, Award, Star, Compass, ShieldCheck, ArrowRight, Heart } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface AboutPageProps {
  onOpenBooking: () => void;
  onNavigate: (path: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onOpenBooking, onNavigate }) => {
  const { t } = useLanguage();

  const specs = [
    { title: 'Janma Kundli Breakdown', desc: 'Accurate planetary positioning and Vimshottari Dasha calculation.', link: '/blog/kundli' },
    { title: 'Home & Business Vastu', desc: 'Harmonizing spatial energy flows without destructive renovations.', link: '/blog/vastu' },
    { title: 'Planetary Remedies & Mantras', desc: 'Sattvic charity, focused sadhana, and planetary alignment.', link: '/blog/transits' },
    { title: 'Authentic Gemmology (Ratna)', desc: 'Precise gemstone pairings according to natal ascendant dignity.', link: '/blog/gemstones' },
    { title: 'Vedic Numerology', desc: 'Vibrational alignment of personal and commercial names.', link: '/blog/numerology' }
  ];

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 96 }}>
      {/* Header Section */}
      <section style={{ backgroundColor: '#F5F5F7', padding: '72px 0 54px', borderBottom: '1px solid #E5E5EA' }}>
        <div className="container" style={{ maxWidth: 880, textAlign: 'center' }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 30,
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E5EA',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
              padding: 12
            }}
          >
            <img
              src="/icons/logo-mark.png"
              alt="Amit Astro"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>

          <h1 className="text-display" style={{ fontSize: 44, marginBottom: 6 }}>
            {t('brand.astrologer_name', 'Amit')}
          </h1>
          <p style={{ fontSize: 18, color: '#3A3A6E', fontWeight: 500, marginBottom: 28 }}>
            {t('brand.tagline', 'Vedic Astrology & Vastu Consultation')}
          </p>

          {/* Stat Row (Section 6) */}
          <div
            className="apple-card"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 16,
              padding: '24px 20px',
              backgroundColor: '#FFFFFF',
              textAlign: 'center'
            }}
          >
            <div>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#1D1D1F' }}>15+ Years</div>
              <div style={{ fontSize: 12.5, color: '#6E6E73', marginTop: 2 }}>Classical Vedic Study</div>
            </div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#1D1D1F' }}>5+ Years</div>
              <div style={{ fontSize: 12.5, color: '#6E6E73', marginTop: 2 }}>Professional Practice</div>
            </div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#1D1D1F' }}>1,000+</div>
              <div style={{ fontSize: 12.5, color: '#6E6E73', marginTop: 2 }}>Global Clients Consulted</div>
            </div>
          </div>
        </div>
      </section>

      {/* Narrative & Philosophy (Section 6) */}
      <section className="container" style={{ maxWidth: 840, paddingTop: 64 }}>
        <h2 className="text-h2" style={{ marginBottom: 16 }}>
          Philosophy & Approach
        </h2>
        <div style={{ fontSize: 17, color: '#1D1D1F', lineHeight: 1.8, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <p>
            Astrology was never conceived by the ancient Rishis as an instrument of dread or passive fatalism. In its highest expression, <strong>Jyotish</strong> literally translates to <em>the science of light</em> — illuminating the contours of human karma, unconscious tendencies, and divine timing.
          </p>
          <p>
            Having studied classical Parashari scriptures and practical Vastu principles for over 15 years, my approach centers on <strong>clarity, calmness, and actionable responsibility</strong>. A chart consultation does not simply predict what tomorrow will bring; it reveals what you are called to cultivate today.
          </p>
          <blockquote
            style={{
              backgroundColor: '#F5F5F7',
              borderLeft: '4px solid #C9A24B',
              padding: '20px 24px',
              borderRadius: '0 16px 16px 0',
              fontStyle: 'italic',
              color: '#1D1D1F',
              fontSize: 18,
              lineHeight: 1.6
            }}
          >
            "Planets are neither our tormentors nor our benefactors. They are impartial celestial timekeepers that mirror the maturity of our deeds. When we understand the cosmic weather, we can dress accordingly."
          </blockquote>
          <p>
            Whether you are navigating a challenging Saturn Sade Sati, contemplating a marriage or business venture, or seeking energetic balance in your home, our conversations remain strictly confidential, empathetic, and grounded in reality.
          </p>
        </div>

        {/* Specializations */}
        <div style={{ marginTop: 64 }}>
          <h2 className="text-h2" style={{ marginBottom: 20 }}>
            Core Areas of Practice
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {specs.map((s) => (
              <div
                key={s.title}
                className="apple-card"
                style={{ padding: '20px 18px', cursor: 'pointer' }}
                onClick={() => onNavigate(s.link)}
              >
                <div style={{ fontWeight: 600, fontSize: 16, color: '#1D1D1F', marginBottom: 6 }}>
                  {s.title}
                </div>
                <p style={{ fontSize: 13.5, color: '#6E6E73', lineHeight: 1.5, marginBottom: 12 }}>
                  {s.desc}
                </p>
                <span style={{ fontSize: 12.5, color: '#3A3A6E', fontWeight: 600 }}>
                  Explore Guide →
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Band CTA (Section 6) */}
        <div
          className="apple-card"
          style={{
            marginTop: 72,
            padding: '44px 32px',
            backgroundColor: '#F5F5F7',
            borderRadius: 22,
            textAlign: 'center',
            border: '1px solid #E5E5EA'
          }}
        >
          <h2 className="text-h1" style={{ fontSize: 32, marginBottom: 10 }}>
            Ready to know what the stars say?
          </h2>
          <p className="text-body-large" style={{ maxWidth: 540, margin: '0 auto 28px' }}>
            Book a confidential 1-on-1 consultation slot or begin with our 5-minute trial session.
          </p>
          <button
            onClick={onOpenBooking}
            className="apple-btn-primary"
            style={{ padding: '14px 32px', fontSize: 16 }}
          >
            <Calendar size={18} /> Book a Consultation
          </button>
        </div>
      </section>
    </div>
  );
};
