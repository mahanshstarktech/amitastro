import React from 'react';
import { Compass, Calendar, Sparkles, BookOpen, User, ShieldCheck, Tag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AppleBottomNavProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenBooking: () => void;
  onOpenTrial: () => void;
  onOpenAuth: () => void;
}

export const AppleBottomNav: React.FC<AppleBottomNavProps> = ({
  currentPath,
  onNavigate,
  onOpenBooking,
  onOpenTrial,
  onOpenAuth
}) => {
  const { isAuthenticated, isAdmin, user } = useAuth();

  const isHome = currentPath === '/';
  const isBlog = currentPath.startsWith('/blog');
  const isPricing = currentPath === '/pricing';
  const isPortal = currentPath.startsWith('/app') || currentPath.startsWith('/admin');

  // 5-min trial is shown ONLY to new users or unauthenticated visitors
  const showTrialCTA = !isAuthenticated || (!!user?.isNewCustomer && !user?.trialUsed);

  return (
    <nav
      className="apple-bottom-nav"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(251, 251, 253, 0.90)',
        backdropFilter: 'blur(25px) saturate(180%)',
        WebkitBackdropFilter: 'blur(25px) saturate(180%)',
        borderTop: '1px solid #E5E5EA',
        paddingTop: 8,
        paddingBottom: 'max(10px, env(safe-area-inset-bottom, 12px))',
        display: 'none', // Managed by media query
        justifyContent: 'space-around',
        alignItems: 'center',
        boxShadow: '0 -2px 16px rgba(0, 0, 0, 0.03)'
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
          gap: 4,
          cursor: 'pointer',
          color: isHome ? '#3A3A6E' : '#8E8E93',
          transition: 'transform 0.15s ease, color 0.15s ease',
          flex: 1
        }}
      >
        <Compass size={22} strokeWidth={isHome ? 2.2 : 1.7} />
        <span style={{ fontSize: 10.5, fontWeight: isHome ? 600 : 500, letterSpacing: '-0.01em' }}>
          Home
        </span>
      </button>

      {/* 2. Free Trial Tab (only for new/unauthenticated users) OR Plans Tab */}
      {showTrialCTA ? (
        <button
          onClick={onOpenTrial}
          className="nav-tab-btn"
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            cursor: 'pointer',
            color: '#8E8E93',
            position: 'relative',
            flex: 1
          }}
        >
          <div style={{ position: 'relative' }}>
            <Sparkles size={22} color="#C9A24B" strokeWidth={1.8} />
            <span
              style={{
                position: 'absolute',
                top: -6,
                right: -14,
                backgroundColor: '#C9A24B',
                color: '#FFFFFF',
                fontSize: 8.5,
                fontWeight: 700,
                padding: '1px 4px',
                borderRadius: 4,
                textTransform: 'uppercase'
              }}
            >
              Free
            </span>
          </div>
          <span style={{ fontSize: 10.5, fontWeight: 500, color: '#C9A24B', letterSpacing: '-0.01em' }}>
            5-Min Trial
          </span>
        </button>
      ) : (
        <button
          onClick={() => onNavigate('/pricing')}
          className="nav-tab-btn"
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            cursor: 'pointer',
            color: isPricing ? '#3A3A6E' : '#8E8E93',
            flex: 1
          }}
        >
          <Tag size={22} strokeWidth={isPricing ? 2.2 : 1.7} />
          <span style={{ fontSize: 10.5, fontWeight: isPricing ? 600 : 500, letterSpacing: '-0.01em' }}>
            Plans
          </span>
        </button>
      )}

      {/* 3. Consult / Book (Center Action) */}
      <button
        onClick={onOpenBooking}
        className="nav-tab-btn"
        style={{
          background: 'none',
          border: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          cursor: 'pointer',
          flex: 1
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
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
          <Calendar size={20} strokeWidth={2} />
        </div>
        <span style={{ fontSize: 10.5, fontWeight: 600, color: '#3A3A6E', marginTop: -2 }}>
          Consult
        </span>
      </button>

      {/* 4. Blog / Guidance */}
      <button
        onClick={() => onNavigate('/blog')}
        className="nav-tab-btn"
        style={{
          background: 'none',
          border: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          cursor: 'pointer',
          color: isBlog ? '#3A3A6E' : '#8E8E93',
          flex: 1
        }}
      >
        <BookOpen size={22} strokeWidth={isBlog ? 2.2 : 1.7} />
        <span style={{ fontSize: 10.5, fontWeight: isBlog ? 600 : 500, letterSpacing: '-0.01em' }}>
          Articles
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
          gap: 4,
          cursor: 'pointer',
          color: isPortal ? '#3A3A6E' : '#8E8E93',
          flex: 1
        }}
      >
        {isAdmin ? (
          <ShieldCheck size={22} strokeWidth={isPortal ? 2.2 : 1.7} />
        ) : (
          <User size={22} strokeWidth={isPortal ? 2.2 : 1.7} />
        )}
        <span style={{ fontSize: 10.5, fontWeight: isPortal ? 600 : 500, letterSpacing: '-0.01em' }}>
          {isAuthenticated ? (isAdmin ? 'Admin' : 'Portal') : 'Sign In'}
        </span>
      </button>

      <style>{`
        @media (max-width: 768px) {
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
