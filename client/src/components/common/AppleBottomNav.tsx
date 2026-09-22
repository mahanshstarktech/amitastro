import React from 'react';
import { Compass, Calendar, BookOpen, Settings as SettingsIcon, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

interface AppleBottomNavProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenBooking: () => void;
  onOpenTrial?: () => void;
  onOpenAuth: () => void;
  onOpenSettings: () => void;
}

export const AppleBottomNav: React.FC<AppleBottomNavProps> = ({
  currentPath,
  onNavigate,
  onOpenBooking,
  onOpenTrial,
  onOpenAuth,
  onOpenSettings
}) => {
  const { isAuthenticated, isAdmin, user } = useAuth();
  const { t } = useLanguage();

  const isHome = currentPath === '/';
  const isArticles = currentPath.startsWith('/blog');
  const isPortal = currentPath.startsWith('/app') || currentPath.startsWith('/admin');

  return (
    <nav
      className="apple-bottom-nav"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(251, 251, 253, 0.92)',
        backdropFilter: 'blur(25px) saturate(180%)',
        WebkitBackdropFilter: 'blur(25px) saturate(180%)',
        borderTop: '1px solid #E5E5EA',
        paddingTop: 8,
        paddingBottom: 'max(10px, env(safe-area-inset-bottom, 12px))',
        display: 'none', // Shown on screens <= 1039px (phone & tablets) via CSS
        justifyContent: 'space-around',
        alignItems: 'center',
        boxShadow: '0 -2px 16px rgba(0, 0, 0, 0.04)'
      }}
    >
      {/* 1. Home Tab */}
      <button
        onClick={() => onNavigate('/')}
        className="nav-tab-btn"
        style={{
          background: 'none',
          border: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          cursor: 'pointer',
          color: isHome ? '#3A3A6E' : '#8E8E93',
          transition: 'transform 0.15s ease, color 0.15s ease',
          flex: 1
        }}
      >
        <Compass size={21} strokeWidth={isHome ? 2.2 : 1.7} />
        <span style={{ fontSize: 10.5, fontWeight: isHome ? 600 : 500, letterSpacing: '-0.01em' }}>
          {t('nav.home', 'Home')}
        </span>
      </button>

      {/* 2. Articles / Blog Tab */}
      <button
        onClick={() => onNavigate('/blog')}
        className="nav-tab-btn"
        style={{
          background: 'none',
          border: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          cursor: 'pointer',
          color: isArticles ? '#3A3A6E' : '#8E8E93',
          transition: 'transform 0.15s ease, color 0.15s ease',
          flex: 1
        }}
      >
        <BookOpen size={21} strokeWidth={isArticles ? 2.2 : 1.7} />
        <span style={{ fontSize: 10.5, fontWeight: isArticles ? 600 : 500, letterSpacing: '-0.01em' }}>
          {t('nav.blog', 'Articles')}
        </span>
      </button>

      {/* 3. Consult / Book (Center Highlight CTA) */}
      <button
        onClick={onOpenBooking}
        className="nav-tab-btn"
        style={{
          background: 'none',
          border: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          cursor: 'pointer',
          flex: 1
        }}
      >
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #3A3A6E, #282850)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            boxShadow: '0 4px 14px rgba(58, 58, 110, 0.35)',
            marginTop: -16
          }}
        >
          <Calendar size={19} strokeWidth={2} />
        </div>
        <span style={{ fontSize: 10.5, fontWeight: 600, color: '#3A3A6E', marginTop: -2 }}>
          {t('nav.book_now', 'Consult')}
        </span>
      </button>

      {/* 4. Settings (Mobile Language Switcher inside Settings) */}
      <button
        onClick={onOpenSettings}
        className="nav-tab-btn"
        style={{
          background: 'none',
          border: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          cursor: 'pointer',
          color: '#8E8E93',
          flex: 1
        }}
        title="Settings & Language"
      >
        <SettingsIcon size={21} strokeWidth={1.8} />
        <span style={{ fontSize: 10.5, fontWeight: 500, letterSpacing: '-0.01em' }}>
          {t('nav.settings', 'Settings')}
        </span>
      </button>

      {/* 5. My Portal / Account */}
      <button
        onClick={() => {
          if (isAuthenticated) {
            onNavigate(isAdmin ? '/admin' : '/app');
          } else {
            onOpenAuth();
          }
        }}
        className="nav-tab-btn"
        style={{
          background: 'none',
          border: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          cursor: 'pointer',
          color: isPortal ? '#3A3A6E' : '#8E8E93',
          flex: 1
        }}
      >
        {isAdmin ? (
          <ShieldCheck size={21} strokeWidth={isPortal ? 2.2 : 1.7} />
        ) : (
          <User size={21} strokeWidth={isPortal ? 2.2 : 1.7} />
        )}
        <span style={{ fontSize: 10.5, fontWeight: isPortal ? 600 : 500, letterSpacing: '-0.01em' }}>
          {isAuthenticated ? (isAdmin ? t('nav.admin', 'Admin') : t('nav.portal', 'Portal')) : t('nav.signin', 'Sign In')}
        </span>
      </button>

      <style>{`
        @media (max-width: 1039px) {
          .apple-bottom-nav {
            display: flex !important;
          }
        }
        .nav-tab-btn:active {
          transform: scale(0.92);
        }
      `}</style>
    </nav>
  );
};
