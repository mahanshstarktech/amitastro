import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Sparkles, 
  Calendar, 
  User as UserIcon, 
  Settings as SettingsIcon,
  Globe, 
  Download, 
  ShieldCheck, 
  ChevronDown, 
  LogOut, 
  Check, 
  Compass, 
  HelpCircle, 
  HeartHandshake, 
  FileText,
  MessageCircle,
  ExternalLink,
  Search,
  X,
  Phone
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useCountry } from '../../context/CountryContext';
import { useHeaderActions } from '../../context/HeaderActionsContext';

interface AppleHeaderProps {
  onOpenAuth: (mode?: 'login' | 'signup') => void;
  onOpenBooking: () => void;
  onOpenTrial?: () => void;
  onOpenSettings?: () => void;
  currentPage?: string;
  onNavigate: (path: string) => void;
}

export const AppleHeader: React.FC<AppleHeaderProps> = ({
  onOpenAuth,
  onOpenBooking,
  onOpenTrial,
  onOpenSettings,
  currentPage = 'home',
  onNavigate
}) => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { country, countryInfo, setCountry, availableCountries } = useCountry();
  const [isScrolled, setIsScrolled] = useState(false);
  const [blogDropdownOpen, setBlogDropdownOpen] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const isHomePage = currentPage === 'home' || currentPage === '' || currentPage === '/';

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    config,
    isOptionsDrawerOpen,
    setOptionsDrawerOpen,
    isSearchExpanded,
    setSearchExpanded
  } = useHeaderActions();

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close drawer and search when current page changes
  useEffect(() => {
    setOptionsDrawerOpen(false);
    setSearchExpanded(false);
  }, [currentPage]);

  // Focus input when search expands
  useEffect(() => {
    if (isSearchExpanded) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isSearchExpanded]);

  // Listen for Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isSearchExpanded) setSearchExpanded(false);
        if (isOptionsDrawerOpen) setOptionsDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchExpanded, isOptionsDrawerOpen]);

  const accountRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setIsScrolled((prev) => {
        if (!prev && y > 24) return true;
        if (prev && y < 8) return false;
        return prev;
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    // PWA install prompt listener
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Click outside listener for dropdowns
    const handleClickOutside = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountDropdownOpen(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      document.removeEventListener('mousedown', handleClickOutside);
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
    <>
      <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1100,
        height: 62,
        transition: 'background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        backgroundColor: isScrolled ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.74)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: isScrolled ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(0, 0, 0, 0.05)',
        boxShadow: isScrolled ? '0 4px 20px rgba(0, 0, 0, 0.03)' : '0 1px 0 rgba(0, 0, 0, 0.02)'
      }}
    >
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          width: '100%',
          padding: '0 clamp(16px, 2.5vw, 36px)',
          gap: 16
        }}
      >
        {/* VERY LEFT: Brand Logo & Name */}
        <div
          onClick={() => onNavigate('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
            textDecoration: 'none',
            flexShrink: 0
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E5EA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
              overflow: 'hidden',
              padding: 3,
              flexShrink: 0
            }}
          >
            <img
              src="/icons/logo-mark.png"
              alt="Amit Astro Logo"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17.5, color: '#1D1D1F', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {t('brand.name', 'Amit Astro')}
            </div>
            <div style={{ fontSize: 10, color: '#6E6E73', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              {t('brand.astrologer', 'Amit · Vedic Astrologer')}
            </div>
          </div>
        </div>

        {/* CENTER: Desktop Navigation Links */}
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

          {/* Articles Dropdown */}
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
                  boxShadow: '0 12px 36px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #E5E5EA',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  animation: 'dropdownFade 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  zIndex: 1100
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

        {/* VERY RIGHT: Settings Icon + Account/Person Icon + Book Consultation CTA (Hidden on mobile & tabs) */}
        <div 
          className="desktop-header-controls"
          style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}
        >
          {/* 1. SETTINGS ICON & DROPDOWN (Language, Install App, Quick Links) */}
          <div style={{ position: 'relative' }} ref={settingsRef}>
            <button
              type="button"
              onClick={() => {
                setSettingsDropdownOpen(!settingsDropdownOpen);
                setAccountDropdownOpen(false);
              }}
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                backgroundColor: settingsDropdownOpen ? '#E5E5EA' : '#F5F5F7',
                border: '1px solid #E5E5EA',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: settingsDropdownOpen ? '#1D1D1F' : '#515154',
                transition: 'all 0.15s ease'
              }}
              title="Settings & Preferences"
              aria-label="Settings"
            >
              <SettingsIcon size={18} />
            </button>

            {settingsDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 10px)',
                  right: 0,
                  width: 280,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 18,
                  padding: '16px',
                  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.12)',
                  border: '1px solid #E5E5EA',
                  animation: 'dropdownFade 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  zIndex: 1100,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14
                }}
              >
                {/* Country & Currency Section */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5, fontWeight: 600, color: '#86868B', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 13 }}>{countryInfo.flagEmoji}</span>
                      <span>Country & Currency</span>
                    </div>
                    <span style={{ fontSize: 11, color: '#3A3A6E', fontWeight: 700 }}>{countryInfo.currency}</span>
                  </div>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 12,
                      border: '1px solid #E5E5EA',
                      backgroundColor: '#F5F5F7',
                      color: '#1D1D1F',
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: 'pointer',
                      outline: 'none',
                      appearance: 'none',
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%236E6E73' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'calc(100% - 12px) center'
                    }}
                  >
                    {availableCountries.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flagEmoji} {c.name} ({c.currency})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ height: 1, backgroundColor: '#E5E5EA' }} />

                {/* Language Switcher Section */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#86868B', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
                    <Globe size={13} color="#3A3A6E" />
                    <span>Language / भाषा</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => setLanguage('en')}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 12,
                        border: language === 'en' ? '1.5px solid #3A3A6E' : '1px solid #E5E5EA',
                        backgroundColor: language === 'en' ? 'rgba(58, 58, 110, 0.08)' : '#F5F5F7',
                        color: language === 'en' ? '#3A3A6E' : '#1D1D1F',
                        fontSize: 13,
                        fontWeight: language === 'en' ? 600 : 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {language === 'en' && <Check size={14} color="#3A3A6E" />} English
                    </button>
                    <button
                      type="button"
                      onClick={() => setLanguage('hi')}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 12,
                        border: language === 'hi' ? '1.5px solid #3A3A6E' : '1px solid #E5E5EA',
                        backgroundColor: language === 'hi' ? 'rgba(58, 58, 110, 0.08)' : '#F5F5F7',
                        color: language === 'hi' ? '#3A3A6E' : '#1D1D1F',
                        fontSize: 13,
                        fontWeight: language === 'hi' ? 600 : 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {language === 'hi' && <Check size={14} color="#3A3A6E" />} हिन्दी
                    </button>
                  </div>
                </div>

                <div style={{ height: 1, backgroundColor: '#E5E5EA' }} />

                {/* Install App Section */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#86868B', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
                    Application
                  </div>
                  {deferredPrompt ? (
                    <button
                      onClick={() => {
                        handleInstallClick();
                        setSettingsDropdownOpen(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 12,
                        backgroundColor: '#F5F5F7',
                        border: '1px solid #E5E5EA',
                        color: '#1D1D1F',
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        textAlign: 'left'
                      }}
                    >
                      <Download size={16} color="#3A3A6E" />
                      <div>
                        <div style={{ fontWeight: 600 }}>Install Amit Astro App</div>
                        <div style={{ fontSize: 11, color: '#86868B' }}>Fast home screen access</div>
                      </div>
                    </button>
                  ) : (
                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: 12,
                        backgroundColor: '#F5F5F7',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 12.5,
                        color: '#424245'
                      }}
                    >
                      <Download size={15} color="#2FA84F" />
                      <div>
                        <div style={{ fontWeight: 600 }}>PWA Ready</div>
                        <div style={{ fontSize: 11, color: '#86868B' }}>Add to Home Screen from browser menu</div>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ height: 1, backgroundColor: '#E5E5EA' }} />

                {/* Support & Legal Quick Links */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <button
                    onClick={() => {
                      onNavigate('/faq');
                      setSettingsDropdownOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      borderRadius: 8,
                      background: 'none',
                      border: 'none',
                      fontSize: 13,
                      color: '#424245',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F5F5F7')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <HelpCircle size={15} color="#3A3A6E" /> Help Center & FAQs
                  </button>

                  <button
                    onClick={() => {
                      onNavigate('/legal/privacy');
                      setSettingsDropdownOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      borderRadius: 8,
                      background: 'none',
                      border: 'none',
                      fontSize: 13,
                      color: '#424245',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F5F5F7')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <ShieldCheck size={15} color="#0284C7" /> Privacy & Legal Terms
                  </button>

                  <button
                    onClick={() => {
                      onNavigate('/legal/ethics');
                      setSettingsDropdownOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      borderRadius: 8,
                      background: 'none',
                      border: 'none',
                      fontSize: 13,
                      color: '#424245',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F5F5F7')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <HeartHandshake size={15} color="#C9A24B" /> Astrological Ethical Charter
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 2. PERSON / ACCOUNT ICON & DROPDOWN (Profile, Portal, Admin, Sign Out) */}
          <div style={{ position: 'relative' }} ref={accountRef}>
            <button
              type="button"
              onClick={() => {
                setAccountDropdownOpen(!accountDropdownOpen);
                setSettingsDropdownOpen(false);
              }}
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                backgroundColor: accountDropdownOpen ? '#E5E5EA' : (isAuthenticated ? '#3A3A6E' : '#F5F5F7'),
                border: isAuthenticated ? '1px solid #3A3A6E' : '1px solid #E5E5EA',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: isAuthenticated ? '#FFFFFF' : '#515154',
                transition: 'all 0.15s ease',
                position: 'relative'
              }}
              title="Account & Portal"
              aria-label="Account"
            >
              {isAuthenticated && user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.name}
                  style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <UserIcon size={18} />
              )}
              {isAuthenticated && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: 9,
                    height: 9,
                    borderRadius: '50%',
                    backgroundColor: '#2FA84F',
                    border: '1.5px solid #FFFFFF'
                  }}
                />
              )}
            </button>

            {accountDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 10px)',
                  right: 0,
                  width: 290,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 18,
                  padding: '16px',
                  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.12)',
                  border: '1px solid #E5E5EA',
                  animation: 'dropdownFade 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  zIndex: 1100,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12
                }}
              >
                {isAuthenticated && user ? (
                  <>
                    {/* Signed-in User Info Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 10, borderBottom: '1px solid #E5E5EA' }}>
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.name}
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '1.5px solid #E5E5EA',
                            flexShrink: 0
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            backgroundColor: '#3A3A6E',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: 16,
                            flexShrink: 0
                          }}
                        >
                          {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon size={20} />}
                        </div>
                      )}
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontWeight: 700, fontSize: 14.5, color: '#1D1D1F', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {user.name}
                        </div>
                        <div style={{ fontSize: 12, color: '#86868B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {user.email || user.phone}
                        </div>
                        <div style={{ marginTop: 3 }}>
                          {isAdmin ? (
                            <span className="apple-badge-primary" style={{ fontSize: 10, padding: '2px 7px' }}>
                              <ShieldCheck size={11} /> Admin Astrologer
                            </span>
                          ) : (
                            <span className="apple-badge-gold" style={{ fontSize: 10, padding: '2px 7px' }}>
                              <Sparkles size={11} /> Seeker Member
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Navigation Options */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {isAdmin && (
                        <button
                          onClick={() => {
                            onNavigate('/admin');
                            setAccountDropdownOpen(false);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '9px 10px',
                            borderRadius: 10,
                            background: 'none',
                            border: 'none',
                            fontSize: 13.5,
                            fontWeight: 600,
                            color: '#3A3A6E',
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F5F5F7')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <ShieldCheck size={16} color="#3A3A6E" /> Astrologer Admin Panel
                        </button>
                      )}

                      <button
                        onClick={() => {
                          onNavigate('/app');
                          setAccountDropdownOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '9px 10px',
                          borderRadius: 10,
                          background: 'none',
                          border: 'none',
                          fontSize: 13.5,
                          fontWeight: 500,
                          color: '#1D1D1F',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F5F5F7')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <Compass size={16} color="#3A3A6E" /> Customer Kundli Portal
                      </button>

                      <button
                        onClick={() => {
                          onNavigate('/app');
                          setAccountDropdownOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '9px 10px',
                          borderRadius: 10,
                          background: 'none',
                          border: 'none',
                          fontSize: 13.5,
                          fontWeight: 500,
                          color: '#1D1D1F',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F5F5F7')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <Calendar size={16} color="#3A3A6E" /> Scheduled Slots & History
                      </button>

                      <button
                        onClick={() => {
                          onNavigate('/app');
                          setAccountDropdownOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '9px 10px',
                          borderRadius: 10,
                          background: 'none',
                          border: 'none',
                          fontSize: 13.5,
                          fontWeight: 500,
                          color: '#1D1D1F',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F5F5F7')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <MessageCircle size={16} color="#2FA84F" /> 30-Day Astrologer Chat
                      </button>
                    </div>

                    <div style={{ height: 1, backgroundColor: '#E5E5EA' }} />

                    {/* Sign Out Button */}
                    <button
                      onClick={() => {
                        logout();
                        setAccountDropdownOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '9px 10px',
                        borderRadius: 10,
                        background: 'none',
                        border: 'none',
                        fontSize: 13.5,
                        fontWeight: 500,
                        color: '#E03131',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FFF5F5')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <LogOut size={16} color="#E03131" /> Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    {/* Unauthenticated State Header */}
                    <div style={{ paddingBottom: 6 }}>
                      <div style={{ fontWeight: 700, fontSize: 16, color: '#1D1D1F', marginBottom: 4 }}>
                        Seeker Portal
                      </div>
                      <p style={{ fontSize: 13, color: '#6E6E73', margin: 0, lineHeight: 1.5 }}>
                        Sign in to access your Janma Kundli charts, scheduled consultation calls, and private remedial chat with Amit.
                      </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                      <button
                        onClick={() => {
                          setAccountDropdownOpen(false);
                          onOpenAuth('login');
                        }}
                        className="apple-btn-primary"
                        style={{ width: '100%', padding: '10px', fontSize: 13.5, justifyContent: 'center' }}
                      >
                        Sign In to Account
                      </button>

                      <button
                        onClick={() => {
                          setAccountDropdownOpen(false);
                          onOpenAuth('signup');
                        }}
                        className="apple-btn-secondary"
                        style={{ width: '100%', padding: '10px', fontSize: 13.5, justifyContent: 'center' }}
                      >
                        New Seeker? Register
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* 3. PRIMARY CTA: Book Consultation Button */}
          <button
            onClick={onOpenBooking}
            className="apple-btn-primary top-book-btn"
            style={{
              padding: '8px 18px',
              fontSize: 14,
              boxShadow: '0 4px 14px rgba(58, 58, 110, 0.2)',
              whiteSpace: 'nowrap'
            }}
          >
            <Calendar size={14} /> {t('nav.book_now', 'Book Consultation')}
          </button>
        </div>

        {/* Mobile & Tablet Header Controls: Only rendered on subpages (Articles, Portal, FAQ, Admin, Legal, etc.) */}
        {!isHomePage && (
          <div 
            className="apple-mobile-header-actions"
            style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}
          >
            {/* Search Button (if applicable to this page) */}
            {config?.hasSearch && (
              <button
                type="button"
                onClick={() => {
                  setSearchExpanded(!isSearchExpanded);
                  if (isOptionsDrawerOpen) setOptionsDrawerOpen(false);
                }}
                className={`apple-header-icon-btn ${isSearchExpanded ? 'active' : ''}`}
                title={isSearchExpanded ? 'Close search' : 'Search'}
                aria-label="Toggle search"
              >
                <Search size={18} />
              </button>
            )}

            {/* Apple 2-Bar Morphing Menu Button (Expands categories/options for this page) */}
            <button
              type="button"
              onClick={() => {
                setOptionsDrawerOpen(!isOptionsDrawerOpen);
                if (isSearchExpanded) setSearchExpanded(false);
              }}
              className={`apple-menu-bars-btn ${isOptionsDrawerOpen ? 'open' : ''}`}
              title={isOptionsDrawerOpen ? 'Close menu' : 'Open menu'}
              aria-label="Toggle menu"
            >
              <span className="apple-menu-bar top-bar" />
              <span className="apple-menu-bar bottom-bar" />
            </button>
          </div>
        )}
      </div>

      <style>{`
        @media (min-width: 1040px) {
          .desktop-nav { display: flex !important; gap: clamp(14px, 1.8vw, 28px) !important; }
          .desktop-header-controls { display: flex !important; }
          .apple-mobile-header-actions { display: none !important; }
        }
        @media (max-width: 1039px) {
          .desktop-nav { display: none !important; }
          .desktop-header-controls { display: none !important; }
          .apple-mobile-header-actions { display: flex !important; }
        }
        @keyframes dropdownFade {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </header>

    {/* PORTAL OVERLAYS: Rendered directly into document.body to avoid containing-block clipping */}
    {mounted && typeof document !== 'undefined' && createPortal(
      <>
        {/* Apple Expanding Search Bar Overlay */}
        <div className={`apple-expanding-search-wrap ${isSearchExpanded ? 'expanded' : ''}`}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (config?.hasSearch) {
                setSearchExpanded(false);
              } else if (globalSearchQuery.trim()) {
                onNavigate(`/blog?search=${encodeURIComponent(globalSearchQuery.trim())}`);
                setSearchExpanded(false);
              }
            }}
            className="apple-search-input-box"
            style={{ width: '100%', display: 'flex', alignItems: 'center' }}
          >
            <Search size={17} className="apple-search-field-icon" />
            <input
              ref={searchInputRef}
              type="text"
              className="apple-search-field"
              value={config?.hasSearch ? (config.searchQuery || '') : globalSearchQuery}
              onChange={(e) => {
                if (config?.hasSearch) {
                  config.onSearchChange?.(e.target.value);
                } else {
                  setGlobalSearchQuery(e.target.value);
                }
              }}
              placeholder={
                config?.searchPlaceholder ||
                'Search articles, remedies, transits, Vastu...'
              }
            />
            {((config?.hasSearch && config.searchQuery) || (!config?.hasSearch && globalSearchQuery)) && (
              <button
                type="button"
                className="apple-search-clear-btn"
                onClick={() => {
                  if (config?.hasSearch) {
                    config.onSearchChange?.('');
                  } else {
                    setGlobalSearchQuery('');
                  }
                }}
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </form>
          <button
            type="button"
            className="apple-search-cancel-btn"
            onClick={() => setSearchExpanded(false)}
          >
            Cancel
          </button>
        </div>

        {/* Apple Fullscreen Curtain Menu (Universal Navigation & Category Picker) */}
        <div className={`apple-curtain-container ${isOptionsDrawerOpen ? 'open' : ''}`}>
          <div className="apple-curtain-content">
            <div className="apple-curtain-top-bar">
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#86868B' }}>
                {config?.options && config.options.length > 0 
                  ? (config.optionsTitle || 'Categories') 
                  : 'Explore Amit Astro'}
              </span>
              <button
                type="button"
                onClick={() => setOptionsDrawerOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: '#3A3A6E',
                  cursor: 'pointer',
                  padding: '4px 8px'
                }}
              >
                Done
              </button>
            </div>

            {/* Page-Specific Category / Tab Options Only */}
            <div className="apple-curtain-items-list">
              {config?.options && config.options.length > 0 ? (
                config.options.map((opt, idx) => {
                  const isActive = opt.id === config.activeOptionId;
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        config.onSelectOption?.(opt.id);
                        setOptionsDrawerOpen(false);
                      }}
                      className={`apple-curtain-item-row ${isActive ? 'active' : ''}`}
                      style={{ animationDelay: `${idx * 25}ms` }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        {Icon && <Icon size={22} color={isActive ? '#3A3A6E' : '#6E6E73'} />}
                        <span className="apple-curtain-item-title">{opt.label}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {opt.badge && (
                          <span className="sidebar-nav-item-badge" style={{ fontSize: 12 }}>
                            {opt.badge}
                          </span>
                        )}
                        {isActive && <Check size={20} color="#3A3A6E" />}
                      </div>
                    </button>
                  );
                })
              ) : null}
            </div>
          </div>
        </div>
      </>,
      document.body
    )}
  </>
  );
};
