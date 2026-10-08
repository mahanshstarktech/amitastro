import React, { useState } from 'react';
import { 
  X, 
  Crown, 
  Check, 
  ShieldCheck, 
  Users, 
  Calendar, 
  PhoneCall, 
  FileText, 
  Zap, 
  QrCode, 
  Building, 
  Lock,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCountry } from '../../context/CountryContext';
import { apiRequest } from '../../utils/api';

interface FamilyUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const FamilyUpgradeModal: React.FC<FamilyUpgradeModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user, refreshMe } = useAuth();
  const { countryInfo } = useCountry();

  const [step, setStep] = useState<'details' | 'payment'>('details');
  const [utrReference, setUtrReference] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'upi_autopay' | 'bank_transfer'>('upi_autopay');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  // Resolve annual price
  const familyPricing = countryInfo.prices.family || {
    amount: 100000,
    formatted: '₹1,00,000 / yr',
    label: '1-Year Unlimited Family 360 Plan'
  };

  const handleSubscribeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utrReference.trim()) {
      setErrorMessage('Please enter the UTR or Transaction Reference number.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await apiRequest<{ success: boolean; message: string }>('/subscription/subscribe', {
        method: 'POST',
        body: JSON.stringify({
          countryCode: countryInfo.code,
          utrReference: utrReference.trim(),
          paymentMethod,
          screenshotUrl: screenshotUrl.trim() || undefined
        })
      });

      setSuccessMessage(res.message || 'Subscription registered successfully!');
      await refreshMe();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit subscription order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div
        className="apple-card"
        style={{
          width: '100%',
          maxWidth: 620,
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: '#FFFFFF',
          borderRadius: 24,
          padding: '28px 24px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.25)',
          border: '1px solid #E5E5EA',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
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
            color: '#1D1D1F'
          }}
        >
          <X size={18} />
        </button>

        {successMessage ? (
          <div style={{ textAlign: 'center', padding: '36px 16px' }}>
            <div
              style={{
                width: 68,
                height: 68,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10B981, #059669)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)'
              }}
            >
              <Check size={36} strokeWidth={2.8} />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1D1D1F', marginBottom: 8 }}>
              Subscription Order Received!
            </h2>
            <p style={{ fontSize: 14.5, color: '#6E6E73', maxWidth: 440, margin: '0 auto 24px', lineHeight: 1.5 }}>
              {successMessage} Amit Soni's office has been alerted via Telegram and your 1-Year Family 360 Pass will activate promptly.
            </p>
            <button
              onClick={() => {
                onClose();
                window.location.reload();
              }}
              className="apple-btn-primary"
              style={{ padding: '12px 28px', fontSize: 15 }}
            >
              Go to Portal Dashboard
            </button>
          </div>
        ) : step === 'details' ? (
          <div>
            {/* Header Badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg, #7928CA, #FF0080)', color: '#FFFFFF', padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, marginBottom: 14 }}>
              <Crown size={13} /> Flagship Annual Membership
            </div>

            <h2 style={{ fontSize: 26, fontWeight: 800, color: '#1D1D1F', letterSpacing: '-0.02em', marginBottom: 6 }}>
              Family 360 Plan (Autopay)
            </h2>
            <p style={{ fontSize: 14.5, color: '#6E6E73', lineHeight: 1.45, marginBottom: 20 }}>
              The all-inclusive royal pass for your entire household. Add up to 4 family members and consult with Amit Soni anytime for a full 365 days.
            </p>

            {/* Price Box */}
            <div
              style={{
                background: 'linear-gradient(135deg, #FAF5FF, #F3E8FF)',
                border: '1.5px solid #D8B4FE',
                borderRadius: 18,
                padding: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 22,
                flexWrap: 'wrap',
                gap: 12
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#7928CA' }}>
                  ANNUAL MEMBERSHIP · AUTOPAY
                </div>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#1D1D1F', letterSpacing: '-0.02em' }}>
                  {familyPricing.formatted}
                </div>
                <div style={{ fontSize: 12, color: '#6B21A8' }}>
                  Converted for {countryInfo.name} ({countryInfo.currency}) · 1 Full Year
                </div>
              </div>
              <div
                style={{
                  background: '#FFFFFF',
                  padding: '8px 14px',
                  borderRadius: 12,
                  border: '1px solid #E9D5FF',
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: '#7928CA',
                  boxShadow: '0 2px 8px rgba(121, 40, 202, 0.08)'
                }}
              >
                Unlimited Consultations
              </div>
            </div>

            {/* Feature Checklist */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 11, marginBottom: 26 }}>
              {[
                { icon: Users, text: 'Add up to 4 Family Members (Spouse, Children, Parents) under one account' },
                { icon: Calendar, text: 'Unlimited Video & Phone Consultations for 1 complete year' },
                { icon: FileText, text: 'Complete Kundli & Dasha birth charts for every household member' },
                { icon: PhoneCall, text: 'VIP Priority Direct Hotline to Amit Soni without waiting queues' },
                { icon: Zap, text: 'Full Annual Vastu, Gemstone & Astro-Remedies roadmap' },
                { icon: ShieldCheck, text: 'Netflix-Style Autopay with 1-click pause or cancellation anytime' }
              ].map((feat, idx) => {
                const Icon = feat.icon;
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: '#333336' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', backgroundColor: '#E9D5FF', color: '#7928CA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check size={13} strokeWidth={2.8} />
                    </div>
                    <span>{feat.text}</span>
                  </div>
                );
              })}
            </div>

            {/* Action Button */}
            <button
              onClick={() => setStep('payment')}
              className="apple-btn-primary"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: 15.5,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #7928CA, #FF0080)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 18px rgba(121, 40, 202, 0.35)'
              }}
            >
              <span>Continue to Secure Autopay Setup</span>
              <ArrowRight size={17} />
            </button>
          </div>
        ) : (
          <div>
            {/* Payment Step */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <button
                onClick={() => setStep('details')}
                style={{ background: 'none', border: 'none', color: '#7928CA', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: 0 }}
              >
                ← Back to Overview
              </button>
            </div>

            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1D1D1F', marginBottom: 4 }}>
              Complete Family 360 Activation
            </h2>
            <p style={{ fontSize: 13.5, color: '#6E6E73', marginBottom: 18 }}>
              Amount: <strong>{familyPricing.formatted}</strong> for 1 Year Unlimited Pass.
            </p>

            {/* Payment Method Selector */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
              <button
                type="button"
                onClick={() => setPaymentMethod('upi_autopay')}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 14,
                  border: paymentMethod === 'upi_autopay' ? '2px solid #7928CA' : '1px solid #E5E5EA',
                  backgroundColor: paymentMethod === 'upi_autopay' ? '#FAF5FF' : '#FFFFFF',
                  color: paymentMethod === 'upi_autopay' ? '#7928CA' : '#1D1D1F',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                <QrCode size={16} /> UPI Autopay / QR
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('bank_transfer')}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 14,
                  border: paymentMethod === 'bank_transfer' ? '2px solid #7928CA' : '1px solid #E5E5EA',
                  backgroundColor: paymentMethod === 'bank_transfer' ? '#FAF5FF' : '#FFFFFF',
                  color: paymentMethod === 'bank_transfer' ? '#7928CA' : '#1D1D1F',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                <Building size={16} /> Direct Bank Wire
              </button>
            </div>

            {/* Payment Details Container */}
            <div
              style={{
                backgroundColor: '#F9F9FB',
                border: '1px solid #E5E5EA',
                borderRadius: 16,
                padding: '16px',
                marginBottom: 18
              }}
            >
              {paymentMethod === 'upi_autopay' ? (
                <div style={{ fontSize: 13.5, color: '#1D1D1F' }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>UPI Mandate ID:</div>
                  <div style={{ fontFamily: 'monospace', backgroundColor: '#FFFFFF', padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E5EA', fontWeight: 700, color: '#3A3A6E', marginBottom: 8 }}>
                    amitastro@upi
                  </div>
                  <div style={{ fontSize: 12, color: '#6E6E73' }}>
                    Open Google Pay, PhonePe, or Paytm and set up auto-pay or one-time payment for {familyPricing.formatted}.
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 13, color: '#1D1D1F', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div>Bank: <strong>HDFC Bank</strong></div>
                  <div>Account Name: <strong>Amit</strong></div>
                  <div>Account Number: <strong>50100492817291</strong></div>
                  <div>IFSC Code: <strong>HDFC0001234</strong></div>
                </div>
              )}
            </div>

            {/* UTR Form */}
            <form onSubmit={handleSubscribeSubmit}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1D1D1F', marginBottom: 6 }}>
                  Transaction UTR / Reference Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 429381920194 or Bank Ref ID"
                  value={utrReference}
                  onChange={(e) => setUtrReference(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: '1.5px solid #E5E5EA',
                    fontSize: 14,
                    outline: 'none',
                    backgroundColor: '#FFFFFF'
                  }}
                />
              </div>

              {errorMessage && (
                <div style={{ color: '#E11D48', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                  {errorMessage}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6E6E73', marginBottom: 18 }}>
                <Lock size={13} color="#10B981" />
                <span>SSL Encrypted & Protected by Zoho Accounts IAM Security Standard</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="apple-btn-primary"
                style={{
                  width: '100%',
                  padding: '14px',
                  fontSize: 15.5,
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #7928CA, #FF0080)',
                  border: 'none',
                  cursor: isSubmitting ? 'wait' : 'pointer'
                }}
              >
                {isSubmitting ? 'Securing & Registering Subscription...' : `Activate 1-Year Pass (${familyPricing.formatted})`}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
