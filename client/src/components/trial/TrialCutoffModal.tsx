import React, { useState, useEffect } from 'react';
import { Clock, Phone, PhoneOff, AlertTriangle, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { apiRequest } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

interface TrialCutoffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgradeClick: () => void;
}

export const TrialCutoffModal: React.FC<TrialCutoffModalProps> = ({
  isOpen,
  onClose,
  onUpgradeClick
}) => {
  const { user, refreshMe } = useAuth();
  const { showToast } = useNotification();

  const [isInCall, setIsInCall] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(user?.trialSecondsRemaining || 300);
  const [isCutoff, setIsCutoff] = useState<boolean>(false);
  const [warningOneMin, setWarningOneMin] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      // Check trial status from backend
      apiRequest<{ isEligible: boolean; trialUsed: boolean; secondsRemaining: number }>('/trial/status')
        .then((res) => {
          setSecondsRemaining(res.secondsRemaining);
          if (res.secondsRemaining <= 0 || res.trialUsed) {
            setIsCutoff(true);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // Live timer interval when call is active
  useEffect(() => {
    let interval: any = null;
    if (isInCall && secondsRemaining > 0 && !isCutoff) {
      interval = setInterval(async () => {
        try {
          const res = await apiRequest<{ isCutoff: boolean; secondsRemaining: number; warningOneMin: boolean }>('/trial/deduct', {
            method: 'POST',
            body: JSON.stringify({ secondsDeducted: 1 })
          });

          setSecondsRemaining(res.secondsRemaining);
          if (res.warningOneMin) {
            setWarningOneMin(true);
          }
          if (res.isCutoff) {
            setIsCutoff(true);
            setIsInCall(false);
            refreshMe();
            showToast('Your 5-minute complimentary trial has completed.', 'info', 'Trial Completed');
          }
        } catch {
          // fallback client-side decrement
          setSecondsRemaining((prev) => {
            if (prev <= 1) {
              setIsCutoff(true);
              setIsInCall(false);
              return 0;
            }
            if (prev <= 60) setWarningOneMin(true);
            return prev - 1;
          });
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isInCall, secondsRemaining, isCutoff, refreshMe, showToast]);

  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')}`;
  };

  const handleStartCall = () => {
    if (secondsRemaining <= 0 || isCutoff) {
      setIsCutoff(true);
      return;
    }
    setIsInCall(true);
    showToast('Connecting to Amit (Trial Discovery Line)...', 'info');
  };

  const handleEndCall = () => {
    setIsInCall(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
      }}
    >
      <div
        className="apple-card"
        style={{
          width: '100%',
          maxWidth: 480,
          backgroundColor: '#FFFFFF',
          borderRadius: 24,
          padding: '36px 32px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.12)',
          textAlign: 'center',
          position: 'relative'
        }}
      >
        {/* CUTOFF STATE */}
        {isCutoff ? (
          <div>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 18,
                background: 'rgba(201, 162, 75, 0.15)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16
              }}
            >
              <Sparkles size={28} color="#C9A24B" />
            </div>

            <h2 className="text-h2" style={{ fontSize: 24, marginBottom: 8 }}>
              Complimentary Trial Ended
            </h2>
            <p className="text-body" style={{ fontSize: 14.5, marginBottom: 24, lineHeight: 1.5 }}>
              Your 5-minute discovery consultation with Amit has completed. To explore your birth chart in depth with comprehensive remedies, book a consultation package.
            </p>

            <div
              style={{
                backgroundColor: '#F5F5F7',
                borderRadius: 14,
                padding: '16px 20px',
                marginBottom: 24,
                textAlign: 'left',
                border: '1px solid #E5E5EA'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontWeight: 600, fontSize: 15, color: '#1D1D1F' }}>
                  Recommended: Premium Deep Consult
                </span>
                <span className="apple-badge-gold">Best Value</span>
              </div>
              <div style={{ fontSize: 13, color: '#6E6E73' }}>
                45–60 Min Call · Written Remedies PDF · 7-Day Follow-up Chat · ₹1,799
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={() => {
                  onClose();
                  onUpgradeClick();
                }}
                className="apple-btn-gold"
                style={{ padding: 14, width: '100%', fontSize: 15 }}
              >
                View Consultation Packages <ArrowRight size={16} />
              </button>

              <button
                onClick={onClose}
                className="apple-btn-secondary"
                style={{ padding: 12, width: '100%', fontSize: 14 }}
              >
                Close Window
              </button>
            </div>
          </div>
        ) : (
          /* ACTIVE / READY TRIAL CALL STATE */
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 12px',
                borderRadius: 9999,
                backgroundColor: 'rgba(58, 58, 110, 0.08)',
                color: '#3A3A6E',
                fontSize: 12.5,
                fontWeight: 600,
                marginBottom: 16
              }}
            >
              <ShieldCheck size={14} /> 1-Time Free Trial (Verified Mobile)
            </div>

            <h2 className="text-h2" style={{ fontSize: 24, marginBottom: 8 }}>
              {isInCall ? 'Session in Progress' : '5-Minute Discovery Session'}
            </h2>
            <p className="text-body" style={{ fontSize: 14, marginBottom: 24 }}>
              Direct consultation with Amit. Enforced 5-minute window for first-time clients.
            </p>

            {/* Countdown Display */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 12,
                padding: '16px 28px',
                borderRadius: 20,
                backgroundColor: warningOneMin ? '#FFF8E6' : '#F5F5F7',
                border: warningOneMin ? '1px solid #D98E04' : '1px solid #E5E5EA',
                marginBottom: 20,
                transition: 'all 0.3s ease'
              }}
            >
              <Clock size={28} color={warningOneMin ? '#D98E04' : '#3A3A6E'} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#6E6E73', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Remaining Time
                </div>
                <div
                  style={{
                    fontSize: 32,
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    color: warningOneMin ? '#D98E04' : '#1D1D1F',
                    fontVariantNumeric: 'tabular-nums'
                  }}
                >
                  {formatTime(secondsRemaining)}
                </div>
              </div>
            </div>

            {/* 1-Minute Warning Banner (Section 9 & 11) */}
            {warningOneMin && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  backgroundColor: 'rgba(217, 142, 4, 0.1)',
                  borderRadius: 12,
                  padding: '10px 14px',
                  marginBottom: 20,
                  fontSize: 13,
                  color: '#9C6500',
                  textAlign: 'left'
                }}
              >
                <AlertTriangle size={18} />
                <span>
                  <strong>1 minute remaining:</strong> The trial session will auto-cutoff at 00:00.
                </span>
              </div>
            )}

            {/* Call Controls */}
            <div>
              {isInCall ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ fontSize: 13.5, color: '#2FA84F', fontWeight: 500 }}>
                    ● Connected with Amit (+91 98765 43210)
                  </div>
                  <button
                    onClick={handleEndCall}
                    className="apple-btn-secondary"
                    style={{
                      padding: 14,
                      width: '100%',
                      color: '#D64545',
                      borderColor: '#D64545',
                      fontSize: 15
                    }}
                  >
                    <PhoneOff size={16} /> End Trial Call Early
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button
                    onClick={handleStartCall}
                    className="apple-btn-primary"
                    style={{ padding: 14, width: '100%', fontSize: 15 }}
                  >
                    <Phone size={16} /> Start 5-Minute Call
                  </button>

                  <button
                    onClick={onClose}
                    className="apple-btn-secondary"
                    style={{ padding: 12, width: '100%', fontSize: 14 }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
