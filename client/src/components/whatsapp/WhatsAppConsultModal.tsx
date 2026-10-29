import React, { useState } from 'react';
import { X, Sparkles, UserCheck, ExternalLink, ChevronDown, ChevronUp, LogIn } from 'lucide-react';
import { WhatsAppIcon } from '../common/WhatsAppIcon';
import type { User, BirthProfile } from '../../context/AuthContext';
import {
  WHATSAPP_DISPLAY_PHONE,
  buildWhatsAppConsultMessage,
  openWhatsAppConsult
} from '../../utils/whatsapp';

interface WhatsAppConsultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth: (mode?: 'login' | 'signup') => void;
  user?: User | null;
  profile?: BirthProfile | null;
}

export const WhatsAppConsultModal: React.FC<WhatsAppConsultModalProps> = ({
  isOpen,
  onClose,
  onOpenAuth,
  user,
  profile
}) => {
  const [showPreview, setShowPreview] = useState(false);

  if (!isOpen) return null;

  const isAuthenticated = !!user;
  const guestMessage = buildWhatsAppConsultMessage({ user: null });
  const previewMessage = buildWhatsAppConsultMessage({ user, profile });

  const handleContinueAnyway = () => {
    openWhatsAppConsult({ user, profile });
    onClose();
  };

  const handleLoginClick = () => {
    onClose();
    onOpenAuth('login');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="whatsapp-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="apple-card"
        style={{
          width: '100%',
          maxWidth: 520,
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          padding: '28px 26px',
          boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.22), 0 0 1px rgba(0, 0, 0, 0.1)',
          position: 'relative',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close dialog"
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: '#F5F5F7',
            border: 'none',
            borderRadius: '50%',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#6E6E73',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#E5E5EA';
            e.currentTarget.style.color = '#1D1D1F';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#F5F5F7';
            e.currentTarget.style.color = '#6E6E73';
          }}
        >
          <X size={17} />
        </button>

        {/* WhatsApp Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              backgroundColor: '#25D366',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 4px 14px rgba(37, 211, 102, 0.35)',
              flexShrink: 0
            }}
          >
            <WhatsAppIcon size={26} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2
                id="whatsapp-modal-title"
                style={{
                  margin: 0,
                  fontSize: 20,
                  fontWeight: 700,
                  color: '#1D1D1F',
                  letterSpacing: '-0.015em'
                }}
              >
                Consult on WhatsApp
              </h2>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  backgroundColor: 'rgba(37, 211, 102, 0.12)',
                  color: '#1B8A43',
                  padding: '2px 8px',
                  borderRadius: 999
                }}
              >
                Official
              </span>
            </div>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6E6E73' }}>
              Direct line with Astrologer Amit · {WHATSAPP_DISPLAY_PHONE}
            </p>
          </div>
        </div>

        {/* Informational / Login Benefit Callout */}
        {!isAuthenticated ? (
          <div
            style={{
              backgroundColor: '#F5F5F7',
              borderRadius: 16,
              padding: '16px 18px',
              marginBottom: 20,
              border: '1px solid #E5E5EA'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  backgroundColor: 'rgba(58, 58, 110, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#3A3A6E',
                  flexShrink: 0,
                  marginTop: 2
                }}
              >
                <Sparkles size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: '#1D1D1F', marginBottom: 4 }}>
                  Connect faster by signing in
                </div>
                <p style={{ margin: 0, fontSize: 13, color: '#515154', lineHeight: 1.55 }}>
                  By logging in, your details and birth coordinates will be automatically included in your WhatsApp message. This helps us understand your chart better, talk with you more effectively, and makes the entire consultation effortless for you.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              backgroundColor: 'rgba(37, 211, 102, 0.08)',
              borderRadius: 16,
              padding: '14px 18px',
              marginBottom: 20,
              border: '1px solid rgba(37, 211, 102, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                backgroundColor: 'rgba(37, 211, 102, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1B8A43',
                flexShrink: 0
              }}
            >
              <UserCheck size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1D1D1F' }}>
                Signed in as {user?.name || user?.email}
              </div>
              <div style={{ fontSize: 12.5, color: '#515154' }}>
                Your details will be pre-filled automatically in your consultation message.
              </div>
            </div>
          </div>
        )}

        {/* Prebuilt Message Preview Accordion */}
        <div style={{ marginBottom: 22 }}>
          <button
            type="button"
            onClick={() => setShowPreview((prev) => !prev)}
            style={{
              background: 'none',
              border: 'none',
              padding: '6px 0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12.5,
              fontWeight: 600,
              color: '#3A3A6E'
            }}
          >
            {showPreview ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            <span>{showPreview ? 'Hide prebuilt message preview' : 'Preview message to be sent'}</span>
          </button>

          {showPreview && (
            <div
              style={{
                marginTop: 8,
                backgroundColor: '#EFEAE2', // Authentic WhatsApp chat background color
                backgroundImage: 'radial-gradient(#DFD7CA 1px, transparent 1px)',
                backgroundSize: '16px 16px',
                borderRadius: 14,
                padding: '14px',
                fontSize: 12.5,
                lineHeight: 1.5,
                color: '#111B21',
                maxHeight: 180,
                overflowY: 'auto',
                border: '1px solid #D1D7DB'
              }}
            >
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '10px 10px 10px 2px',
                  padding: '10px 12px',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                  whiteSpace: 'pre-wrap',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
                }}
              >
                {previewMessage}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {!isAuthenticated ? (
            <>
              {/* Option 1: Log in first */}
              <button
                type="button"
                onClick={handleLoginClick}
                className="apple-btn-primary"
                style={{
                  padding: '13px 20px',
                  fontSize: 15,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  width: '100%'
                }}
              >
                <LogIn size={16} /> Log In to Auto-Fill Details
              </button>

              {/* Option 2: Continue anyway (Guest) */}
              <button
                type="button"
                onClick={handleContinueAnyway}
                style={{
                  padding: '13px 20px',
                  fontSize: 15,
                  fontWeight: 600,
                  backgroundColor: '#25D366',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(37, 211, 102, 0.28)',
                  transition: 'background-color 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#20BA5A')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#25D366')}
              >
                <WhatsAppIcon size={18} color="#FFFFFF" /> Continue to WhatsApp Anyway
              </button>
            </>
          ) : (
            /* Authenticated user single clear CTA */
            <button
              type="button"
              onClick={handleContinueAnyway}
              style={{
                padding: '14px 20px',
                fontSize: 15.5,
                fontWeight: 600,
                backgroundColor: '#25D366',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 9,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(37, 211, 102, 0.32)',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#20BA5A')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#25D366')}
            >
              <WhatsAppIcon size={19} color="#FFFFFF" /> Open WhatsApp with My Details <ExternalLink size={15} />
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 16px',
              fontSize: 13.5,
              fontWeight: 500,
              color: '#86868B',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              marginTop: 4
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
