import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Calendar, ArrowRight, ShieldCheck, Star, Users, Award, 
  Compass, CheckCircle2, ChevronRight, ChevronLeft, MessageSquare, Phone, BookOpen, 
  HelpCircle, ChevronDown, Check, Clock
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
  const shelfRef = useRef<HTMLDivElement>(null);
  const servicesShelfRef = useRef<HTMLDivElement>(null);

  const scrollShelf = (direction: 'left' | 'right') => {
    if (shelfRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      shelfRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollServicesShelf = (direction: 'left' | 'right') => {
    if (servicesShelfRef.current) {
      const scrollAmount = direction === 'left' ? -360 : 360;
      servicesShelfRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

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
      desc: 'Enter exact date, time, and city of birth in your private profile for accurate chart casting.',
      icon: Compass,
      bg: 'rgba(58, 58, 110, 0.08)',
      color: '#3A3A6E',
      footerText: 'Birth Chart Rectification'
    },
    {
      num: '02',
      title: 'Select Preferred Slot',
      desc: 'Pick your preferred consultation window in your local timezone across our 6-week rolling calendar.',
      icon: Clock,
      bg: 'rgba(201, 162, 75, 0.12)',
      color: '#B8860B',
      footerText: 'Rolling 6-Week Calendar'
    },
    {
      num: '03',
      title: 'Convenient Confirmation',
      desc: 'Amit confirms the session via in-app chat or WhatsApp with verified slot coordination.',
      icon: MessageSquare,
      bg: 'rgba(47, 168, 79, 0.1)',
      color: '#2FA84F',
      footerText: 'Direct Slot Coordination'
    },
    {
      num: '04',
      title: '1-on-1 Consultation',
      desc: 'Receive deep clarity, honest answers, and practical remedies tailored to your planetary periods.',
      icon: Sparkles,
      bg: 'rgba(88, 86, 214, 0.1)',
      color: '#5856D6',
      footerText: 'Scriptural & Practical Remedies'
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
          <div className="hero-profile-card">
            <div className="hero-profile-info">
              <div className="hero-profile-avatar">
                <img
                  src="/icons/logo-mark.png"
                  alt="Amit Astro"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
              <div className="hero-profile-details">
                <div className="hero-profile-name">
                  {t('brand.astrologer_name', 'Amit')}
                </div>
                <div className="hero-profile-tagline">
                  {t('brand.tagline', 'Vedic Astrology & Vastu Consultation')}
                </div>
                <div className="hero-profile-stars">
                  <Star size={14} color="#C9A24B" fill="#C9A24B" />
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: '#1D1D1F' }}>4.9/5</span>
                  <span style={{ fontSize: 12, color: '#86868B' }}>(1,000+ Verified Consultations)</span>
                </div>
              </div>
            </div>

            <div className="hero-profile-badge">
              <div className="hero-profile-badge-title">
                Availability Today
              </div>
              <div className="hero-profile-badge-slots">
                <span className="hero-status-dot" />
                <span>Slots Open (Morning & Night Windows)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST METRICS BAR (Aligned & Fully Responsive) */}
      <section className="trust-metrics-section">
        <div className="container">
          <div className="trust-metrics-grid">
            <div className="trust-metric-tile">
              <div className="trust-metric-val">
                15+ Years
              </div>
              <div className="trust-metric-label">
                Classical Jyotish Experience
              </div>
            </div>

            <div className="trust-metric-tile">
              <div className="trust-metric-val">
                1,000+
              </div>
              <div className="trust-metric-label">
                Satisfied Clients Globally
              </div>
            </div>

            <div className="trust-metric-tile">
              <div className="trust-metric-val">
                100%
              </div>
              <div className="trust-metric-label">
                Confidential & Dispassionate
              </div>
            </div>

            <div className="trust-metric-tile">
              <div className="trust-metric-val">
                Pan-India & Abroad
              </div>
              <div className="trust-metric-label">
                Trusted across 14+ Countries
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AUTHENTIC VEDIC CONSULTATIONS APPLE STORE SHELF */}
      <section className="section-padding" style={{ paddingBottom: 64 }}>
        <div className="container">
          <div className="apple-shelf-header-wrap" style={{ marginBottom: 32 }}>
            <div>
              <span className="apple-badge-primary">Dedicated Disciplines</span>
              <h2 className="apple-shelf-headline" style={{ marginTop: 8 }}>
                Authentic Vedic Consultations.{' '}
                <span className="apple-shelf-headline-sub">
                  Rooted in sacred texts & compassionate guidance.
                </span>
              </h2>
            </div>

            <div className="apple-shelf-ctrls">
              <button
                onClick={() => scrollServicesShelf('left')}
                className="apple-shelf-btn"
                aria-label="Previous consultation"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => scrollServicesShelf('right')}
                className="apple-shelf-btn"
                aria-label="Next consultation"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div ref={servicesShelfRef} className="apple-services-shelf">
            {services.map((s) => {
              const IconComp = s.icon;
              return (
                <div
                  key={s.title}
                  className="apple-service-card"
                  onClick={() => onNavigate(s.link)}
                >
                  <div>
                    <div
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 14,
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
                    <span className="apple-badge-gold" style={{ marginBottom: 12 }}>
                      {s.tag}
                    </span>
                    <h3 className="text-h3" style={{ fontSize: 20, margin: '8px 0 10px', lineHeight: 1.3 }}>
                      {s.title}
                    </h3>
                    <p className="text-body" style={{ fontSize: 14.5, lineHeight: 1.55, color: '#6E6E73' }}>
                      {s.desc}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#3A3A6E', fontSize: 13.5, fontWeight: 600, marginTop: 24, paddingTop: 14, borderTop: '1px solid #F5F5F7' }}>
                    Learn More & Book <ChevronRight size={15} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW AMIT ASTRO WORKS: DUAL-MODE (Desktop 4-Col Grid vs Mobile Apple Carousel) */}
      <section className="apple-shelf-section" id="how-it-works">
        <div className="container">
          {/* Desktop 4-Card Side-by-Side View */}
          <div className="how-it-works-desktop">
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <span className="apple-badge-gold">Seamless 4-Step Journey</span>
              <h2 className="text-h1" style={{ marginTop: 8, marginBottom: 10 }}>
                How Amit Astro Works
              </h2>
              <p className="text-body" style={{ fontSize: 16, maxWidth: 640, margin: '0 auto' }}>
                From initial intent to deep astrological insight in four transparent, reassuring steps.
              </p>
            </div>

            <div className="how-it-works-grid">
              {steps.map((st) => (
                <div key={st.num} className="how-it-works-card">
                  <div className="how-it-works-step-num">{st.num}</div>
                  <h3 className="how-it-works-card-title">{st.title}</h3>
                  <p className="how-it-works-card-desc">{st.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile & Tablet Apple Store Shelf View */}
          <div className="how-it-works-mobile">
            <div className="apple-shelf-header-wrap">
              <div>
                <span className="apple-badge-gold" style={{ marginBottom: 12 }}>
                  The Amit Astro Experience
                </span>
                <h2 className="apple-shelf-headline">
                  How Amit Astro works.{' '}
                  <span className="apple-shelf-headline-sub">
                    Even more reasons to consult with us.
                  </span>
                </h2>
              </div>

              <div className="apple-shelf-ctrls">
                <button
                  onClick={() => scrollShelf('left')}
                  className="apple-shelf-btn"
                  aria-label="Previous step"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => scrollShelf('right')}
                  className="apple-shelf-btn"
                  aria-label="Next step"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            <div ref={shelfRef} className="apple-shelf-scroll">
              {steps.map((st) => {
                const IconComp = st.icon;
                return (
                  <div key={st.num} className="apple-shelf-card">
                    <div>
                      <div className="apple-shelf-top">
                        <div className="apple-shelf-icon" style={{ backgroundColor: st.bg, color: st.color }}>
                          <IconComp size={22} />
                        </div>
                        <span className="apple-shelf-step-num">Step {st.num}</span>
                      </div>

                      <h3 className="apple-shelf-card-title">
                        {st.title}
                      </h3>

                      <p className="apple-shelf-card-desc">
                        {st.desc}
                      </p>
                    </div>

                    <div className="apple-shelf-card-footer">
                      <span>{st.footerText}</span>
                      <ChevronRight size={14} />
                    </div>
                  </div>
                );
              })}
            </div>
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
