import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Calendar, ArrowRight, ShieldCheck, Star, Users, Award, 
  Compass, CheckCircle2, ChevronRight, MessageSquare, Phone, BookOpen, 
  HelpCircle, ChevronDown, Check
} from 'lucide-react';
import { apiRequest } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { YouTubeShowcase } from '../../components/home/YouTubeShowcase';
import { CustomerReviewsShowcase } from '../../components/home/CustomerReviewsShowcase';

interface HomePageProps {
  onOpenBooking: (pkgId?: string) => void;
  onOpenTrial: () => void;
  onNavigate: (path: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onOpenBooking,
  onOpenTrial,
  onNavigate
}) => {
  const { isAuthenticated, user } = useAuth();
  const { t } = useLanguage();
  const showTrialCTA = !isAuthenticated || (!!user?.isNewCustomer && !user?.trialUsed);

  const [featuredPosts, setFeaturedPosts] = useState<any[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    apiRequest<{ posts: any[] }>('/blog/posts?featured=true&limit=3')
      .then((res) => setFeaturedPosts(res.posts || []))
      .catch(() => {});
  }, []);

  const services = [
    {
      title: 'Janma Kundli & Dasha Breakdown',
      desc: 'Precision analysis of your natal chart, identifying planetary strengths, favorable Yogas, and unfolding Vimshottari cycles.',
      tag: 'Kundli',
      icon: Compass,
      link: '/blog/kundli'
    },
    {
      title: 'Vastu Shastra (Home & Commercial)',
      desc: 'Directional balance of the 5 primordial elements (Pancha Bhoota) to promote peace at home and prosperity in business.',
      tag: 'Vastu',
      icon: Sparkles,
      link: '/blog/vastu'
    },
    {
      title: 'Transit Analysis & Sade Sati',
      desc: 'Clarity on major cosmic shifts — Saturn’s 7.5-year cycle, Jupiter transit, and Rahu-Ketu nodal movements with sattvic remedies.',
      tag: 'Transits',
      icon: Award,
      link: '/blog/transits'
    },
    {
      title: 'Authentic Gemstone (Ratna) Guidance',
      desc: 'Cosmic prism alignment. Prescribing genuine, high-vibrational gemstones strictly based on Lagna dignity — never generic sun signs.',
      tag: 'Gemstones',
      icon: Star,
      link: '/blog/gemstones'
    },
    {
      title: 'Vedic Numerology & Name Resonance',
      desc: 'Harmonize your name spelling and life path number with ruling planetary frequencies for sustained professional momentum.',
      tag: 'Numerology',
      icon: Users,
      link: '/blog/numerology'
    }
  ];

  const steps = [
    {
      num: '01',
      title: 'Share Birth Details',
      desc: 'Enter exact date, time, and city of birth in your private profile for accurate chart casting.'
    },
    {
      num: '02',
      title: 'Select Preferred Slot',
      desc: 'Pick your preferred consultation window in your local timezone across our 6-week rolling calendar.'
    },
    {
      num: '03',
      title: 'Convenient Confirmation',
      desc: 'Amit confirms the session via in-app chat or WhatsApp with verified slot coordination.'
    },
    {
      num: '04',
      title: '1-on-1 Consultation',
      desc: 'Receive deep clarity, honest answers, and practical remedies tailored to your planetary periods.'
    }
  ];

  const faqs = [
    {
      q: 'How does the consultation with Amit take place?',
      a: 'Consultations are conducted directly over a personal phone call or through our high-definition real-time in-app chat. When your slot is confirmed, Amit connects with you at the agreed time. You also have access to follow-up chat support depending on your package.'
    },
    {
      q: 'How does the 5-minute complimentary trial session work?',
      a: 'Every first-time client with a verified mobile number is eligible for one 5-minute trial discovery session. A visible countdown timer is shown, with a 1-minute alert, and automatically concludes at 5:00 so you can experience Amit’s serene consultation style completely risk-free.'
    },
    {
      q: 'What if I am unsure about my exact time of birth?',
      a: 'When filling out your birth details, you can select the "Approximate / Not Sure" option. Amit uses classical birth time rectification techniques (Prashna Kundli and major life events verification) to refine your chart.'
    },
    {
      q: 'What languages does Amit consult in?',
      a: 'Amit consults fluently in both Hindi and English. You can specify your language preference in the discussion notes when booking or toggle it anytime in the app settings.'
    },
    {
      q: 'How are payments processed?',
      a: 'We accept instant UPI transfers (Google Pay, PhonePe, Paytm, BHIM) and direct NEFT/IMPS bank transfers. You simply submit your 12-digit UTR reference number or payment receipt screenshot, and your slot is promptly confirmed.'
    }
  ];

  return (
    <div className="constellation-bg" style={{ minHeight: '100vh' }}>
      {/* HERO SECTION */}
      <section className="section-padding" style={{ paddingTop: 72, paddingBottom: 88 }}>
        <div className="container" style={{ textAlign: 'center' }}>
          {/* Subtle Pill Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
            <span className="apple-badge-gold">
              <Sparkles size={13} /> {t('hero.badge', 'Trusted Vedic Wisdom for Clarity & Direction')}
            </span>
          </div>

          {/* Headline */}
          <h1
            className="text-display"
            style={{
              maxWidth: 900,
              margin: '0 auto 20px',
              fontWeight: 700
            }}
          >
            {t('hero.title_part1', 'Cosmic clarity meets')} <br />
            {t('hero.title_part2', 'calm, thoughtful guidance.')}
          </h1>

          {/* Supporting Copy */}
          <p
            className="text-body-large"
            style={{
              maxWidth: 680,
              margin: '0 auto 36px',
              fontSize: 18,
              lineHeight: 1.6
            }}
          >
            {t('hero.subtitle', 'Personalized Vedic Kundli breakdown, spatial Vastu alignment, and sattvic remedies with Amit. No clichés, no fear — only grounded wisdom for your path ahead.')}
          </p>

          {/* Action CTAs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 14, marginBottom: 48 }}>
            <button
              onClick={() => onOpenBooking()}
              className="apple-btn-primary"
              style={{ padding: '13px 28px', fontSize: 16 }}
            >
              <Calendar size={17} /> {t('hero.cta_primary', 'Book a Consultation')}
            </button>

            {showTrialCTA && (
              <button
                onClick={onOpenTrial}
                className="apple-btn-secondary"
                style={{ padding: '13px 24px', fontSize: 16 }}
              >
                <Phone size={17} /> {t('hero.cta_trial', '5-Min Free Trial')}
              </button>
            )}

            <button
              onClick={() => onNavigate('/blog')}
              className="apple-btn-secondary"
              style={{ padding: '13px 22px', fontSize: 16 }}
            >
              {t('nav.blog', 'Read Articles')} <ArrowRight size={15} />
            </button>
          </div>

          {/* Amit Hero Profile Card */}
          <div
            className="apple-card"
            style={{
              maxWidth: 720,
              margin: '0 auto',
              padding: '24px 28px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 20,
              backgroundColor: 'rgba(255, 255, 255, 0.92)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, textAlign: 'left' }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 20,
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E5EA',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 8,
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.08)'
                }}
              >
                <img
                  src="/icons/logo-mark.png"
                  alt="Amit Astro"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 18, color: '#1D1D1F' }}>
                  {t('brand.astrologer_name', 'Amit')}
                </div>
                <div style={{ fontSize: 13.5, color: '#6E6E73' }}>
                  {t('brand.tagline', 'Vedic Astrology & Vastu Consultation')}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <Star size={14} color="#C9A24B" fill="#C9A24B" />
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: '#1D1D1F' }}>4.9/5</span>
                  <span style={{ fontSize: 12, color: '#86868B' }}>(1,000+ Verified Consultations)</span>
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 12, color: '#86868B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Availability Today
              </div>
              <div style={{ fontSize: 13.5, color: '#2FA84F', fontWeight: 600 }}>
                ● Slots Open (Morning & Night Windows)
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST METRICS BAR (Section 4) */}
      <section style={{ backgroundColor: '#F5F5F7', borderTop: '1px solid #E5E5EA', borderBottom: '1px solid #E5E5EA', padding: '36px 0' }}>
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 24,
              textAlign: 'center'
            }}
          >
            <div>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#1D1D1F', letterSpacing: '-0.02em' }}>
                15+ Years
              </div>
              <div style={{ fontSize: 13.5, color: '#6E6E73', marginTop: 4 }}>
                Classical Jyotish Experience
              </div>
            </div>

            <div>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#1D1D1F', letterSpacing: '-0.02em' }}>
                1,000+
              </div>
              <div style={{ fontSize: 13.5, color: '#6E6E73', marginTop: 4 }}>
                Satisfied Clients Globally
              </div>
            </div>

            <div>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#1D1D1F', letterSpacing: '-0.02em' }}>
                100%
              </div>
              <div style={{ fontSize: 13.5, color: '#6E6E73', marginTop: 4 }}>
                Confidential & Dispassionate
              </div>
            </div>

            <div>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#1D1D1F', letterSpacing: '-0.02em' }}>
                Pan-India & Abroad
              </div>
              <div style={{ fontSize: 13.5, color: '#6E6E73', marginTop: 4 }}>
                Trusted across 14+ Countries
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES OVERVIEW (Section 4) */}
      <section className="section-padding">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 54 }}>
            <span className="apple-badge-primary">Dedicated Disciplines</span>
            <h2 className="text-h1" style={{ marginTop: 8, marginBottom: 12 }}>
              Authentic Vedic Consultations
            </h2>
            <p className="text-body-large" style={{ maxWidth: 600, margin: '0 auto' }}>
              Each session is rooted in sacred texts, mathematical planetary positions, and compassionate listening.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
            {services.map((s) => {
              const IconComp = s.icon;
              return (
                <div
                  key={s.title}
                  className="apple-card"
                  style={{
                    padding: '30px 26px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                  onClick={() => onNavigate(s.link)}
                >
                  <div>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        backgroundColor: 'rgba(58, 58, 110, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 18,
                        color: '#3A3A6E'
                      }}
                    >
                      <IconComp size={22} />
                    </div>
                    <span className="apple-badge-gold" style={{ marginBottom: 10 }}>
                      {s.tag}
                    </span>
                    <h3 className="text-h3" style={{ fontSize: 19, margin: '8px 0 10px' }}>
                      {s.title}
                    </h3>
                    <p className="text-body" style={{ fontSize: 14.5, lineHeight: 1.6 }}>
                      {s.desc}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#3A3A6E', fontSize: 13.5, fontWeight: 600, marginTop: 20 }}>
                    Learn More & Book <ChevronRight size={15} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS 4-STEPS (Section 4) */}
      <section style={{ backgroundColor: '#F5F5F7', padding: '80px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span className="apple-badge-gold">Seamless 4-Step Journey</span>
            <h2 className="text-h1" style={{ marginTop: 8, marginBottom: 10 }}>
              How Amit Astro Works
            </h2>
            <p className="text-body" style={{ fontSize: 16 }}>
              From initial intent to deep astrological insight in four transparent steps.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {steps.map((st) => (
              <div
                key={st.num}
                className="apple-card"
                style={{ padding: '28px 24px', backgroundColor: '#FFFFFF' }}
              >
                <div style={{ fontSize: 32, fontWeight: 700, color: '#C9A24B', marginBottom: 12 }}>
                  {st.num}
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 600, color: '#1D1D1F', marginBottom: 8 }}>
                  {st.title}
                </h3>
                <p style={{ fontSize: 14, color: '#6E6E73', lineHeight: 1.5 }}>
                  {st.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED BLOG POSTS (Section 4 & 5) */}
      {featuredPosts && featuredPosts.length > 0 && (
        <section className="section-padding">
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40, flexWrap: 'wrap', gap: 16 }}>
              <div>
                <span className="apple-badge-primary">Vedic Knowledge Base</span>
                <h2 className="text-h1" style={{ marginTop: 8 }}>
                  Essays & Astrological Guidance
                </h2>
              </div>
              <button
                onClick={() => onNavigate('/blog')}
                className="apple-btn-secondary"
                style={{ fontSize: 14 }}
              >
                View All Articles <ArrowRight size={14} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
              {featuredPosts.map((post) => (
                <div
                  key={post.id}
                  className="apple-card"
                  style={{ overflow: 'hidden', cursor: 'pointer' }}
                  onClick={() => onNavigate(`/blog/post/${post.slug}`)}
                >
                  <img
                    src={post.hero_image_url}
                    alt={post.title}
                    style={{ width: '100%', height: 200, objectFit: 'cover' }}
                  />
                  <div style={{ padding: '22px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span className="apple-badge-gold" style={{ fontSize: 11 }}>
                        {post.category_name}
                      </span>
                      <span style={{ fontSize: 12, color: '#86868B' }}>
                        {post.reading_time_min} min read
                      </span>
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1D1D1F', marginBottom: 8, lineHeight: 1.35 }}>
                      {post.title}
                    </h3>
                    <p style={{ fontSize: 13.5, color: '#6E6E73', lineHeight: 1.5, marginBottom: 16 }}>
                      {post.excerpt}
                    </p>
                    <div style={{ fontSize: 13, color: '#3A3A6E', fontWeight: 600 }}>
                      Read Article →
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* YOUTUBE SHOWCASE (Landscape & Portrait Shorts) */}
      <YouTubeShowcase />

      {/* GOOGLE CUSTOMER REVIEWS (Reflections from Seekers) */}
      <CustomerReviewsShowcase />

      {/* PRICING TEASER WITH DECOY EFFECT (Section 4 & 13) */}
      <section className="section-padding">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span className="apple-badge-gold">Decoy Value Model</span>
            <h2 className="text-h1" style={{ marginTop: 8, marginBottom: 10 }}>
              Consultation Packages
            </h2>
            <p className="text-body" style={{ fontSize: 16 }}>
              Choose the depth of consultation suited to your queries.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, alignItems: 'center' }}>
            {/* Quick Consult */}
            <div className="apple-card" style={{ padding: '32px 24px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#86868B', textTransform: 'uppercase' }}>
                Quick Answer
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 700, margin: '6px 0 10px' }}>
                Quick Consult
              </h3>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#1D1D1F', marginBottom: 4 }}>
                ₹500
              </div>
              <div style={{ fontSize: 12.5, color: '#6E6E73', marginBottom: 20 }}>
                15-Minute Focused Phone Call
              </div>

              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13.5, marginBottom: 24 }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Check size={16} color="#2FA84F" /> One specific query analyzed
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Check size={16} color="#2FA84F" /> Direct phone call with Amit
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#A1A1A6' }}>
                  Chat add-on optional (₹100)
                </li>
              </ul>

              <button
                onClick={() => onOpenBooking('pkg-quick')}
                className="apple-btn-secondary"
                style={{ width: '100%', padding: 12 }}
              >
                Select Quick
              </button>
            </div>

            {/* Standard (Decoy) */}
            <div className="apple-card" style={{ padding: '32px 24px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#86868B', textTransform: 'uppercase' }}>
                Standard Session
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 700, margin: '6px 0 10px' }}>
                Standard Consult
              </h3>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#1D1D1F', marginBottom: 4 }}>
                ₹999
              </div>
              <div style={{ fontSize: 12.5, color: '#6E6E73', marginBottom: 20 }}>
                30-Minute Comprehensive Call
              </div>

              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13.5, marginBottom: 24 }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Check size={16} color="#2FA84F" /> Kundli & Dasha breakdown
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Check size={16} color="#2FA84F" /> 3-Day follow-up in-app chat
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Check size={16} color="#2FA84F" /> Core astrological remedies
                </li>
              </ul>

              <button
                onClick={() => onOpenBooking('pkg-standard')}
                className="apple-btn-secondary"
                style={{ width: '100%', padding: 12 }}
              >
                Select Standard
              </button>
            </div>

            {/* Premium ⭐ (Most Popular / Decoy Winner) */}
            <div
              className="apple-card"
              style={{
                padding: '38px 28px',
                border: '2px solid #C9A24B',
                boxShadow: '0 12px 36px rgba(201, 162, 75, 0.15)',
                position: 'relative'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: -12,
                  right: 24,
                  backgroundColor: '#C9A24B',
                  color: '#FFFFFF',
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '4px 12px',
                  borderRadius: 9999,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                ⭐ Most Popular & Best Value
              </div>

              <div style={{ fontSize: 13, fontWeight: 600, color: '#8E6A1C', textTransform: 'uppercase' }}>
                Complete Guidance
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 700, margin: '6px 0 10px' }}>
                Premium Deep Consult
              </h3>
              <div style={{ fontSize: 36, fontWeight: 700, color: '#1D1D1F', marginBottom: 4 }}>
                ₹1,799
              </div>
              <div style={{ fontSize: 12.5, color: '#2FA84F', fontWeight: 600, marginBottom: 20 }}>
                Only ₹29.98/min (Highest Value)
              </div>

              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13.5, marginBottom: 24 }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Check size={16} color="#2FA84F" /> <strong>45–60 min in-depth call</strong>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Check size={16} color="#2FA84F" /> <strong>Written Remedies PDF Report</strong>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Check size={16} color="#2FA84F" /> <strong>7-Day direct follow-up chat</strong>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Check size={16} color="#2FA84F" /> Priority slot scheduling
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Check size={16} color="#2FA84F" /> Gemstone & Vastu recommendations
                </li>
              </ul>

              <button
                onClick={() => onOpenBooking('pkg-premium')}
                className="apple-btn-gold"
                style={{ width: '100%', padding: 14 }}
              >
                Reserve Premium Slot
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 28 }}>
            <span
              onClick={() => onNavigate('/pricing')}
              style={{ color: '#3A3A6E', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
            >
              View Full Pricing Inclusions & Comparison →
            </span>
          </div>
        </div>
      </section>

      {/* FAQ ACCORDION (Section 4) */}
      <section style={{ backgroundColor: '#F5F5F7', padding: '80px 0' }}>
        <div className="container" style={{ maxWidth: 840 }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <span className="apple-badge-primary">Transparent Answers</span>
            <h2 className="text-h1" style={{ marginTop: 8 }}>
              Frequently Asked Questions
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {faqs.map((f, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="apple-card"
                  style={{
                    padding: '20px 24px',
                    backgroundColor: '#FFFFFF',
                    cursor: 'pointer'
                  }}
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 600, fontSize: 16, color: '#1D1D1F' }}>
                      {f.q}
                    </div>
                    <ChevronDown
                      size={18}
                      color="#6E6E73"
                      style={{
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
                        transition: 'transform 0.2s ease'
                      }}
                    />
                  </div>
                  {isOpen && (
                    <div style={{ marginTop: 12, fontSize: 14.5, color: '#6E6E73', lineHeight: 1.6, borderTop: '1px solid #E5E5EA', paddingTop: 12 }}>
                      {f.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};
