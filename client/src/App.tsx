import React, { useState, useEffect } from 'react';
import { AppleHeader } from './components/common/AppleHeader';
import { AppleFooter } from './components/common/AppleFooter';
import { AppleBottomNav } from './components/common/AppleBottomNav';
import { HomePage } from './pages/public/HomePage';
import { BlogPage } from './pages/public/BlogPage';
import { BlogPostPage } from './pages/public/BlogPostPage';
import { AboutPage } from './pages/public/AboutPage';
import { PricingPage } from './pages/public/PricingPage';
import { ContactPage } from './pages/public/ContactPage';
import { LegalPage } from './pages/public/LegalPage';
import { CustomerPortal } from './pages/customer/CustomerPortal';
import { AdminPortal } from './pages/admin/AdminPortal';
import { AuthModal } from './components/auth/AuthModal';
import { BookingModal } from './components/booking/BookingModal';
import { TrialCutoffModal } from './components/trial/TrialCutoffModal';
import { useAuth } from './context/AuthContext';

export const App: React.FC = () => {
  const { isAuthenticated, isAdmin, user } = useAuth();

  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname || '/');
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [bookingModalOpen, setBookingModalOpen] = useState<boolean>(false);
  const [selectedPkgId, setSelectedPkgId] = useState<string>('pkg-premium');
  const [trialModalOpen, setTrialModalOpen] = useState<boolean>(false);

  // Trial eligibility: must be authenticated, new customer, and trial not yet used
  const isTrialEligible = isAuthenticated && !!user?.isNewCustomer && !user?.trialUsed;

  // Sync browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAuth = (mode: 'login' | 'signup' = 'login') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleOpenBooking = (pkgId?: string) => {
    if (pkgId) setSelectedPkgId(pkgId);
    setBookingModalOpen(true);
  };

  const handleOpenTrial = () => {
    if (!isAuthenticated) {
      handleOpenAuth('signup');
      return;
    }
    if (!user?.isNewCustomer) {
      // Returning/old client — show toast and redirect to booking
      setBookingModalOpen(true);
      return;
    }
    if (user?.trialUsed) {
      setBookingModalOpen(true);
      return;
    }
    setTrialModalOpen(true);
  };


  // Route matching logic
  const renderRoute = () => {
    // Admin route check
    if (currentPath.startsWith('/admin')) {
      if (!isAuthenticated || !isAdmin) {
        return (
          <div className="container" style={{ padding: '100px 24px', textAlign: 'center' }}>
            <h2 className="text-h2" style={{ marginBottom: 12 }}>Astrologer Access Required</h2>
            <p className="text-body" style={{ marginBottom: 24 }}>Please sign in with administrator credentials.</p>
            <button onClick={() => handleOpenAuth('login')} className="apple-btn-primary">
              Sign In to Admin Portal
            </button>
          </div>
        );
      }
      return <AdminPortal />;
    }

    // Customer App route check
    if (currentPath.startsWith('/app')) {
      if (!isAuthenticated) {
        return (
          <div className="container" style={{ padding: '100px 24px', textAlign: 'center' }}>
            <h2 className="text-h2" style={{ marginBottom: 12 }}>Sign In to Access Your Portal</h2>
            <p className="text-body" style={{ marginBottom: 24 }}>Access your birth charts, scheduled slots, and private chat.</p>
            <button onClick={() => handleOpenAuth('login')} className="apple-btn-primary">
              Sign In to Account
            </button>
          </div>
        );
      }
      return (
        <CustomerPortal
          onOpenBooking={() => handleOpenBooking()}
          onOpenTrial={handleOpenTrial}
        />
      );
    }

    // Single Blog Post
    if (currentPath.startsWith('/blog/post/')) {
      const slug = currentPath.replace('/blog/post/', '');
      return (
        <BlogPostPage
          slug={slug}
          onNavigate={navigateTo}
          onOpenBooking={() => handleOpenBooking()}
        />
      );
    }

    // Blog Category or List
    if (currentPath.startsWith('/blog')) {
      const categorySlug = currentPath.replace('/blog/', '').replace('/blog', '') || undefined;
      return (
        <BlogPage
          categorySlug={categorySlug}
          onNavigate={navigateTo}
          onOpenBooking={() => handleOpenBooking()}
        />
      );
    }

    // About Page
    if (currentPath === '/about') {
      return (
        <AboutPage
          onOpenBooking={() => handleOpenBooking()}
          onNavigate={navigateTo}
        />
      );
    }

    // Pricing Page
    if (currentPath === '/pricing') {
      return (
        <PricingPage
          onOpenBooking={handleOpenBooking}
          onOpenTrial={handleOpenTrial}
        />
      );
    }

    // Contact Page
    if (currentPath === '/contact') {
      return <ContactPage />;
    }

    // Legal Pages
    if (currentPath === '/legal/privacy') {
      return <LegalPage initialTab="privacy" />;
    }
    if (currentPath === '/legal/terms') {
      return <LegalPage initialTab="terms" />;
    }
    if (currentPath === '/legal/refund-policy') {
      return <LegalPage initialTab="refund" />;
    }

    // Default: Home Page
    return (
      <HomePage
        onOpenBooking={handleOpenBooking}
        onOpenTrial={handleOpenTrial}
        onNavigate={navigateTo}
      />
    );
  };

  const isPortalView = currentPath.startsWith('/admin') || currentPath.startsWith('/app');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#FBFBFD' }}>
      {/* Apple Header */}
      {!currentPath.startsWith('/admin') && (
        <AppleHeader
          onOpenAuth={handleOpenAuth}
          onOpenBooking={() => handleOpenBooking()}
          currentPage={currentPath === '/' ? 'home' : currentPath.substring(1)}
          onNavigate={navigateTo}
        />
      )}

      {/* Main Content Area */}
      <main style={{ flex: 1 }}>{renderRoute()}</main>

      {/* iOS Mobile Bottom Navigation Bar */}
      <AppleBottomNav
        currentPath={currentPath}
        onNavigate={navigateTo}
        onOpenBooking={() => handleOpenBooking()}
        onOpenTrial={handleOpenTrial}
        onOpenAuth={() => handleOpenAuth('login')}
      />

      {/* Apple Footer (hidden in admin views for focused dashboarding) */}
      {!currentPath.startsWith('/admin') && <AppleFooter onNavigate={navigateTo} />}

      {/* Global Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
        onSuccess={() => {
          if (window.location.pathname.startsWith('/admin')) {
            navigateTo('/admin');
          }
        }}
      />

      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        preselectedPackageId={selectedPkgId}
        onNavigateToApp={() => navigateTo('/app')}
        onOpenAuth={() => handleOpenAuth('signup')}
      />

      <TrialCutoffModal
        isOpen={trialModalOpen}
        onClose={() => setTrialModalOpen(false)}
        onUpgradeClick={() => {
          setTrialModalOpen(false);
          handleOpenBooking('pkg-premium');
        }}
      />
    </div>
  );
};
