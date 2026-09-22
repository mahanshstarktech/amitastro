import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, User as UserIcon, Menu, X, ChevronDown, Compass, ShieldCheck, Download, Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

interface AppleHeaderProps {
  onOpenAuth: (mode?: 'login' | 'signup') => void;
  onOpenBooking: () => void;
  currentPage?: string;
  onNavigate: (path: string) => void;
}

export const AppleHeader: React.FC<AppleHeaderProps> = ({
  onOpenAuth,
  onOpenBooking,
  currentPage = 'home',
  onNavigate
}) => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [blogDropdownOpen, setBlogDropdownOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);

    // PWA install prompt listener
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  const blogCategories = [
    { name: 'All Topics', path: '/blog' },
    { name: 'Kundli & Horoscope', path: '/blog/kundli' },
    { name: 'Vastu Shastra (Home & Business)', path: '/blog/vastu' },
    { name: 'Planetary Transits & Sade Sati', path: '/blog/transits' },
    { name: 'Vedic Philosophy', path: '/blog/vedic' },
    { name: 'Gemstones & Ratna', path: '/blog/gemstones' },
    { name: 'Numerology', path: '/blog/numerology' }
  ];

  return (
    <header
      className="frosted-glass"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        height: isScrolled ? 58 : 68,
        transition: 'height 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex',
        alignItems: 'center'
      }}
    >
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        {/* Brand Logo */}
        <div
          onClick={() => onNavigate('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
            textDecoration: 'none'
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #3A3A6E, #232347)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 2px 8px rgba(58, 58, 110, 0.2)'
            }}
          >
            <Sparkles size={18} color="#C9A24B" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, color: '#1D1D1F', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {t('brand.name', 'Amit Astro')}
            </div>
            <div style={{ fontSize: 10.5, color: '#6E6E73', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              {t('brand.astrologer', 'Amit · Vedic Astrologer')}
            </div>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav style={{ display: 'none', alignItems: 'center', gap: 28 }} className="desktop-nav">
          <button
            onClick={() => onNavigate('/')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 14.5,
              fontWeight: currentPage === 'home' ? 600 : 400,
              color: currentPage === 'home' ? '#1D1D1F' : '#6E6E73',
              transition: 'color 0.15s ease'
            }}
          >
            {t('nav.home', 'Home')}
          </button>

          {/* Blog Dropdown */}
          <div
            style={{ position: 'relative' }}
            onMouseEnter={() => setBlogDropdownOpen(true)}
            onMouseLeave={() => setBlogDropdownOpen(false)}
          >
            <button
              onClick={() => onNavigate('/blog')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 14.5,
                fontWeight: currentPage.startsWith('blog') ? 600 : 400,
                color: currentPage.startsWith('blog') ? '#1D1D1F' : '#6E6E73',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                transition: 'color 0.15s ease'
              }}
            >
              {t('nav.blog', 'Articles')} <ChevronDown size={14} />
            </button>

            {blogDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: -20,
                  width: 270,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 16,
                  padding: '10px 8px',
                  boxShadow: '0 12px 36px rgba(0, 0, 0, 0.08)',
                  border: '1px solid #E5E5EA',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  animation: 'dropdownFade 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                {blogCategories.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => {
                      onNavigate(cat.path);
                      setBlogDropdownOpen(false);
                    }}
                    style={{
                      textAlign: 'left',
                      background: 'none',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: 10,
                      fontSize: 13.5,
                      color: '#1D1D1F',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F5F5F7')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigate('/about')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 14.5,
              fontWeight: currentPage === 'about' ? 600 : 400,
              color: currentPage === 'about' ? '#1D1D1F' : '#6E6E73',
              transition: 'color 0.15s ease'
            }}
          >
            {t('nav.about', 'About Amit')}
          </button>

          <button
            onClick={() => onNavigate('/pricing')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 14.5,
              fontWeight: currentPage === 'pricing' ? 600 : 400,
              color: currentPage === 'pricing' ? '#1D1D1F' : '#6E6E73',
              transition: 'color 0.15s ease'
            }}
          >
            {t('nav.pricing', 'Pricing & Packages')}
          </button>

          <button
            onClick={() => onNavigate('/contact')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 14.5,
              fontWeight: currentPage === 'contact' ? 600 : 400,
              color: currentPage === 'contact' ? '#1D1D1F' : '#6E6E73',
              transition: 'color 0.15s ease'
            }}
          >
            {t('nav.contact', 'Contact')}
          </button>
        </nav>

        {/* Right CTA / Auth Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 1vw, 14px)', flexShrink: 0 }}>
          {/* Desktop Language Switcher Button (Right side of top-nav, hidden on mobile) */}
          <div className="desktop-lang-switcher" style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: '#F5F5F7',
                borderRadius: 20,
                padding: '3px 4px',
                border: '1px solid #E5E5EA',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.03)'
              }}
            >
              <Globe size={13} color="#6E6E73" style={{ marginLeft: 6, marginRight: 3 }} />
              <button
                type="button"
                onClick={() => setLanguage('en')}
                style={{
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 9px',
                  borderRadius: 16,
                  fontSize: 12,
                  fontWeight: language === 'en' ? 700 : 500,
                  backgroundColor: language === 'en' ? '#FFFFFF' : 'transparent',
                  color: language === 'en' ? '#1D1D1F' : '#6E6E73',
                  boxShadow: language === 'en' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage('hi')}
                style={{
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 9px',
                  borderRadius: 16,
                  fontSize: 12,
                  fontWeight: language === 'hi' ? 700 : 500,
                  backgroundColor: language === 'hi' ? '#FFFFFF' : 'transparent',
                  color: language === 'hi' ? '#1D1D1F' : '#6E6E73',
                  boxShadow: language === 'hi' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                हिन्दी
              </button>
            </div>
          </div>

          {/* PWA Install Button if available */}
          {deferredPrompt && (
            <button
              onClick={handleInstallClick}
              className="apple-btn-secondary install-btn"
              style={{ padding: '7px 12px', fontSize: 12.5 }}
              title="Install Amit Astro App"
            >
              <Download size={14} /> {t('nav.install', 'Install')}
            </button>
          )}

          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {isAdmin ? (
                <button
                  onClick={() => onNavigate('/admin')}
                  className="apple-badge-primary portal-badge"
                  style={{ cursor: 'pointer', padding: '6px 12px', border: 'none' }}
                >
                  <ShieldCheck size={14} /> Admin
                </button>
              ) : (
                <button
                  onClick={() => onNavigate('/app')}
                  className="apple-badge-gold portal-badge"
                  style={{ cursor: 'pointer', padding: '6px 12px', border: 'none' }}
                >
                  <UserIcon size={14} /> Portal
                </button>
              )}

              <button
                onClick={logout}
                className="signout-desktop-btn"
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 13,
                  color: '#6E6E73',
                  cursor: 'pointer',
                  padding: '6px 6px'
                }}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => onOpenAuth('login')}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 14,
                fontWeight: 500,
                color: '#1D1D1F',
                cursor: 'pointer',
                padding: '6px 10px'
              }}
            >
              Sign In
            </button>
          )}

          {/* Primary Book CTA */}
          <button
            onClick={onOpenBooking}
            className="apple-btn-primary top-book-btn"
            style={{
              padding: isScrolled ? '7px 16px' : '9px 20px',
              fontSize: 14,
              boxShadow: '0 4px 14px rgba(58, 58, 110, 0.2)',
              whiteSpace: 'nowrap'
            }}
          >
            <Calendar size={14} /> {t('nav.book_now', 'Book Consultation')}
          </button>
        </div>
      </div>

      <style>{`
        @media (min-width: 1040px) {
          .desktop-nav { display: flex !important; gap: clamp(14px, 1.8vw, 28px) !important; }
        }
        @media (max-width: 1039px) {
          .desktop-nav { display: none !important; }
        }
        @media (max-width: 768px) {
          .top-book-btn { display: none !important; }
          .signout-desktop-btn { display: none !important; }
          .install-btn { display: none !important; }
          .desktop-lang-switcher { display: none !important; }
        }
        @keyframes dropdownFade {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </header>
  );
};
