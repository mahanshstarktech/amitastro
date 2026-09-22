import React from 'react';
import { X, Globe, Check, ShieldCheck, User as UserIcon, Sparkles } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

interface MobileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth?: () => void;
}

export const MobileSettingsModal: React.FC<MobileSettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenAuth
}) => {
  const { language, setLanguage, t } = useLanguage();
  const { user, isAuthenticated } = useAuth();

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2500,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        animation: 'modalBackdrop 0.2s ease'
      }}
      onClick={onClose}
    >
      <div
        className="apple-card"
        style={{
          width: '100%',
          maxWidth: 500,
          backgroundColor: '#FFFFFF',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          padding: '24px 20px 36px',
          boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.15)',
          animation: 'slideUpSheet 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          maxHeight: '85vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab Handle */}
        <div
          style={{
            width: 36,
            height: 4,
            backgroundColor: '#D1D1D6',
            borderRadius: 2,
            margin: '0 auto 16px'
          }}
        />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                background: 'rgba(58, 58, 110, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Globe size={18} color="#3A3A6E" />
            </div>
            <h3 style={{ fontSize: 19, fontWeight: 700, color: '#1D1D1F', margin: 0 }}>
              {t('settings.title', 'Settings')}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#F5F5F7',
              border: 'none',
              borderRadius: '50%',
              width: 30,
              height: 30,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6E6E73',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Section: Language Selection (Under Settings) */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
            {t('settings.language_title', 'Language (भाषा)')}
          </div>
          <p style={{ fontSize: 13, color: '#6E6E73', marginTop: 0, marginBottom: 12 }}>
            {t('settings.language_desc', 'Choose your preferred display language')}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* English Option */}
            <div
              onClick={() => setLanguage('en')}
              style={{
                padding: '14px 16px',
                borderRadius: 14,
                border: language === 'en' ? '2px solid #3A3A6E' : '1px solid #E5E5EA',
                backgroundColor: language === 'en' ? 'rgba(58, 58, 110, 0.04)' : '#FBFBFD',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div>
                <div style={{ fontSize: 15, fontWeight: language === 'en' ? 700 : 500, color: '#1D1D1F' }}>
                  English
                </div>
                <div style={{ fontSize: 12, color: '#8E8E93' }}>
                  Default language for Amit Astro
                </div>
              </div>
              {language === 'en' && (
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    backgroundColor: '#3A3A6E',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF'
                  }}
                >
                  <Check size={14} strokeWidth={2.5} />
                </div>
              )}
            </div>

            {/* Hindi Option */}
            <div
              onClick={() => setLanguage('hi')}
              style={{
                padding: '14px 16px',
                borderRadius: 14,
                border: language === 'hi' ? '2px solid #3A3A6E' : '1px solid #E5E5EA',
                backgroundColor: language === 'hi' ? 'rgba(58, 58, 110, 0.04)' : '#FBFBFD',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div>
                <div style={{ fontSize: 15, fontWeight: language === 'hi' ? 700 : 500, color: '#1D1D1F' }}>
                  हिन्दी (Hindi)
                </div>
                <div style={{ fontSize: 12, color: '#8E8E93' }}>
                  अमित एस्ट्रो की संपूर्ण सामग्री हिन्दी में
                </div>
              </div>
              {language === 'hi' && (
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    backgroundColor: '#3A3A6E',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF'
                  }}
                >
                  <Check size={14} strokeWidth={2.5} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section: Account Summary */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
            {t('settings.account', 'Account')}
          </div>
          {isAuthenticated && user ? (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 14,
                backgroundColor: '#F5F5F7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    backgroundColor: '#E5E5EA',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <UserIcon size={18} color="#1D1D1F" />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1D1D1F' }}>
                    {user.name}
                  </div>
                  <div style={{ fontSize: 12, color: '#6E6E73' }}>
                    {user.email || user.phone}
                  </div>
                </div>
              </div>
              <span className="apple-badge-gold" style={{ fontSize: 11 }}>
                <ShieldCheck size={12} /> {t('settings.verified', 'Verified')}
              </span>
            </div>
          ) : (
            <button
              onClick={() => {
                onClose();
                if (onOpenAuth) onOpenAuth();
              }}
              className="apple-btn-secondary"
              style={{ width: '100%', padding: '12px', fontSize: 14, justifyContent: 'center' }}
            >
              {t('nav.signin', 'Sign In / Register')}
            </button>
          )}
        </div>

        {/* App Info Footer */}
        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: '#A1A1A6' }}>
          <img
            src="/icons/logo-mark.png"
            alt="Amit Astro"
            style={{ width: 32, height: 32, objectFit: 'contain', margin: '0 auto 8px', display: 'block' }}
          />
          <div style={{ color: '#1D1D1F', fontWeight: 600 }}>Amit Astro · Consultation by Amit</div>
          <div style={{ marginTop: 2 }}>{t('settings.app_version', 'Amit Astro Web App v1.2')}</div>
        </div>
      </div>

      <style>{`
        @keyframes slideUpSheet {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
