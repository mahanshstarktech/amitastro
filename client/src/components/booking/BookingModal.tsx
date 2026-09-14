import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Clock, User as UserIcon, MessageSquare, CheckCircle2, QrCode, ArrowRight, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { apiRequest } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedPackageId?: string;
  onNavigateToApp?: () => void;
  onOpenAuth?: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  preselectedPackageId,
  onNavigateToApp,
  onOpenAuth
}) => {
  const { user, profiles, isAuthenticated } = useAuth();
  const { showToast } = useNotification();

  const [step, setStep] = useState<'details' | 'payment' | 'success'>('details');
  const [packages, setPackages] = useState<any[]>([]);
  const [selectedPkgId, setSelectedPkgId] = useState<string>(preselectedPackageId || 'pkg-premium');
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedWindow, setSelectedWindow] = useState<string>('11:00 AM - 01:00 PM');
  const [consultType, setConsultType] = useState<'call' | 'chat' | 'both'>('call');
  const [customerNotes, setCustomerNotes] = useState<string>('');
  const [userTimezone, setUserTimezone] = useState<string>('Asia/Kolkata');
  const [blackoutDates, setBlackoutDates] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [createdAppt, setCreatedAppt] = useState<any>(null);

  // Payment proof form
  const [utr, setUtr] = useState('');
  const [paymentConfig, setPaymentConfig] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      // Detect browser timezone
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        setUserTimezone(tz || 'Asia/Kolkata');
      } catch {
        setUserTimezone('Asia/Kolkata');
      }

      // Default date: tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setSelectedDate(tomorrow.toISOString().split('T')[0]);

      // Fetch packages & availability
      apiRequest<{ packages: any[] }>('/packages')
        .then((res) => {
          setPackages(res.packages);
          if (preselectedPackageId) {
            setSelectedPkgId(preselectedPackageId);
          }
        })
        .catch(() => {});

      apiRequest<{ blackoutDates: string[] }>('/availability')
        .then((res) => {
          setBlackoutDates(res.blackoutDates || []);
        })
        .catch(() => {});

      apiRequest('/payments/config')
        .then((res) => setPaymentConfig(res))
        .catch(() => {});
    }
  }, [isOpen, preselectedPackageId]);

  useEffect(() => {
    if (profiles && profiles.length > 0 && !selectedProfileId) {
      setSelectedProfileId(profiles[0].id);
    }
  }, [profiles]);

  if (!isOpen) return null;

  // Selected package details
  const currentPkg = packages.find((p) => p.id === selectedPkgId) || packages[0];

  const timeWindows = [
    { label: '09:00 AM - 11:00 AM (Morning IST)', value: '09:00 AM - 11:00 AM' },
    { label: '11:00 AM - 01:00 PM (Midday IST)', value: '11:00 AM - 01:00 PM' },
    { label: '02:00 PM - 04:00 PM (Afternoon IST)', value: '02:00 PM - 04:00 PM' },
    { label: '04:00 PM - 05:00 PM (Late Afternoon IST)', value: '04:00 PM - 05:00 PM' },
    { label: '08:00 PM - 10:00 PM (Evening IST)', value: '08:00 PM - 10:00 PM' },
    { label: '10:00 PM - 12:00 AM (Night IST)', value: '10:00 PM - 12:00 AM' }
  ];

  // Min date: today, Max date: 6 weeks from today (rolling window per spec)
  const todayStr = new Date().toISOString().split('T')[0];
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 42); // 6 weeks
  const maxDateStr = maxDate.toISOString().split('T')[0];

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      showToast('Please sign in or verify your mobile number to confirm your booking', 'info');
      if (onOpenAuth) onOpenAuth();
      return;
    }

    if (!selectedProfileId) {
      showToast('Please select or create a birth profile for chart analysis', 'error');
      return;
    }

    if (blackoutDates.includes(selectedDate)) {
      showToast('Amit Soni is unavailable on this selected date. Please choose another date.', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiRequest<{ appointment: any }>('/appointments', {
        method: 'POST',
        body: JSON.stringify({
          birthProfileId: selectedProfileId,
          packageId: selectedPkgId,
          consultationType: consultType,
          requestedDate: selectedDate,
          requestedTimeWindow: selectedWindow,
          timezoneUser: userTimezone,
          customerNotes
        })
      });

      setCreatedAppt(res.appointment);

      // Trigger celebration confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      // If package is paid, move to payment step
      if (currentPkg && currentPkg.price > 0) {
        setStep('payment');
      } else {
        setStep('success');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitPaymentProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utr) {
      showToast('Please enter the 12-digit UTR reference number from your UPI app', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await apiRequest('/payments/proof', {
        method: 'POST',
        body: JSON.stringify({
          appointmentId: createdAppt.id,
          utrReference: utr,
          amount: currentPkg.price,
          paymentMethod: 'upi_qr'
        })
      });

      showToast('Payment proof submitted! Verification will take place shortly.', 'success');
      setStep('success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
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
        padding: 16,
        overflowY: 'auto'
      }}
    >
      <div
        className="apple-card"
        style={{
          width: '100%',
          maxWidth: 620,
          backgroundColor: '#FFFFFF',
          borderRadius: 24,
          padding: '32px 28px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.12)',
          position: 'relative',
          maxHeight: '92vh',
          overflowY: 'auto'
        }}
      >
        <button
          onClick={onClose}
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
            color: '#6E6E73'
          }}
        >
          <X size={18} />
        </button>

        {/* STEP 1: APPOINTMENT DETAILS */}
        {step === 'details' && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <span className="apple-badge-primary" style={{ marginBottom: 8 }}>
                Vedic Consultation Booking
              </span>
              <h2 className="text-h2" style={{ fontSize: 24, marginTop: 4, marginBottom: 4 }}>
                Reserve Your Session with Amit Soni
              </h2>
              <p className="text-body" style={{ fontSize: 14 }}>
                Detected timezone: <strong>{userTimezone}</strong> (Internal schedule managed in IST).
              </p>
            </div>

            <form onSubmit={handleSubmitRequest} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Package selector */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1D1D1F', marginBottom: 8 }}>
                  1. Select Consultation Package
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                  {packages.map((pkg) => {
                    const isSelected = selectedPkgId === pkg.id;
                    return (
                      <div
                        key={pkg.id}
                        onClick={() => setSelectedPkgId(pkg.id)}
                        style={{
                          border: isSelected ? '2px solid #3A3A6E' : '1px solid #E5E5EA',
                          borderRadius: 14,
                          padding: '12px 10px',
                          cursor: 'pointer',
                          backgroundColor: isSelected ? 'rgba(58, 58, 110, 0.04)' : '#FFFFFF',
                          transition: 'all 0.15s ease',
                          position: 'relative'
                        }}
                      >
                        {pkg.is_popular ? (
                          <div
                            style={{
                              position: 'absolute',
                              top: -8,
                              right: 8,
                              backgroundColor: '#C9A24B',
                              color: '#FFFFFF',
                              fontSize: 9,
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: 9999,
                              textTransform: 'uppercase'
                            }}
                          >
                            Most Popular
                          </div>
                        ) : null}
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#1D1D1F' }}>
                          {pkg.name}
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#3A3A6E', margin: '4px 0 2px' }}>
                          {pkg.price === 0 ? 'Free' : `₹${pkg.price.toLocaleString('en-IN')}`}
                        </div>
                        <div style={{ fontSize: 11, color: '#6E6E73' }}>
                          {pkg.duration_minutes} Minutes
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Birth Profile Picker */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1D1D1F', marginBottom: 8 }}>
                  2. Birth Profile to Analyze
                </label>
                {profiles && profiles.length > 0 ? (
                  <select
                    value={selectedProfileId}
                    onChange={(e) => setSelectedProfileId(e.target.value)}
                    className="apple-input"
                    style={{ fontSize: 14 }}
                  >
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name} ({p.relation.toUpperCase()}) — Born {p.dob} in {p.pob}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div
                    style={{
                      padding: '12px 14px',
                      backgroundColor: '#F5F5F7',
                      borderRadius: 12,
                      fontSize: 13,
                      color: '#6E6E73',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>No birth profiles saved yet.</span>
                    <button
                      type="button"
                      onClick={onOpenAuth}
                      style={{ background: 'none', border: 'none', color: '#3A3A6E', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Add Details First
                    </button>
                  </div>
                )}
              </div>

              {/* Date & Time Window */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1D1D1F', marginBottom: 6 }}>
                    3. Date (Next 6 Weeks)
                  </label>
                  <input
                    type="date"
                    required
                    min={todayStr}
                    max={maxDateStr}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="apple-input"
                    style={{ fontSize: 14 }}
                  />
                  {blackoutDates.includes(selectedDate) && (
                    <span style={{ fontSize: 11.5, color: '#D64545', marginTop: 4, display: 'block' }}>
                      Amit Soni is unavailable on this date.
                    </span>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1D1D1F', marginBottom: 6 }}>
                    Preferred Time Window
                  </label>
                  <select
                    value={selectedWindow}
                    onChange={(e) => setSelectedWindow(e.target.value)}
                    className="apple-input"
                    style={{ fontSize: 14 }}
                  >
                    {timeWindows.map((tw) => (
                      <option key={tw.value} value={tw.value}>
                        {tw.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Consultation Type */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1D1D1F', marginBottom: 6 }}>
                  4. Consultation Mode
                </label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setConsultType('call')}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: 12,
                      border: consultType === 'call' ? '2px solid #3A3A6E' : '1px solid #E5E5EA',
                      backgroundColor: consultType === 'call' ? 'rgba(58, 58, 110, 0.05)' : '#FFFFFF',
                      fontSize: 13.5,
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    Direct Phone Call
                  </button>
                  <button
                    type="button"
                    onClick={() => setConsultType('chat')}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: 12,
                      border: consultType === 'chat' ? '2px solid #3A3A6E' : '1px solid #E5E5EA',
                      backgroundColor: consultType === 'chat' ? 'rgba(58, 58, 110, 0.05)' : '#FFFFFF',
                      fontSize: 13.5,
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    In-App Chat
                  </button>
                  <button
                    type="button"
                    onClick={() => setConsultType('both')}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: 12,
                      border: consultType === 'both' ? '2px solid #3A3A6E' : '1px solid #E5E5EA',
                      backgroundColor: consultType === 'both' ? 'rgba(58, 58, 110, 0.05)' : '#FFFFFF',
                      fontSize: 13.5,
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    Both (Call + Chat)
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1D1D1F', marginBottom: 6 }}>
                  5. Topics or Questions for Discussion
                </label>
                <textarea
                  rows={3}
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="e.g. Seeking clarity on career growth, upcoming Mahadasha transit, and home bedroom Vastu alignment..."
                  className="apple-input"
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="apple-btn-primary"
                style={{ padding: '14px', fontSize: 15, width: '100%' }}
              >
                {isLoading
                  ? 'Scheduling...'
                  : currentPkg.price === 0
                  ? 'Confirm Complimentary Trial Request'
                  : `Proceed to Payment Confirmation (₹${currentPkg.price.toLocaleString('en-IN')})`}
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: MANUAL UPI PAYMENT (Section 14) */}
        {step === 'payment' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <span className="apple-badge-gold">Step 2 of 2: Manual UPI Verification</span>
              <h2 className="text-h2" style={{ fontSize: 22, marginTop: 6, marginBottom: 4 }}>
                Complete Consultation Payment
              </h2>
              <p className="text-body" style={{ fontSize: 13.5 }}>
                Scan the QR with any UPI app (GPay, PhonePe, Paytm) or transfer to the account below.
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 20,
                backgroundColor: '#F5F5F7',
                borderRadius: 18,
                padding: '18px 20px',
                marginBottom: 20,
                border: '1px solid #E5E5EA'
              }}
            >
              {/* QR Code */}
              <div style={{ textAlign: 'center', flex: '0 0 140px', margin: '0 auto' }}>
                <img
                  src={paymentConfig?.upi?.qrImage || 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=nakshaktram@upi&pn=Amit%20Soni%20Nakshaktram'}
                  alt="UPI QR Code"
                  style={{ width: 130, height: 130, borderRadius: 12, border: '1px solid #E5E5EA', backgroundColor: '#FFF' }}
                />
                <div style={{ fontSize: 11, color: '#6E6E73', marginTop: 4 }}>
                  Amount: <strong>₹{currentPkg.price.toLocaleString('en-IN')}</strong>
                </div>
              </div>

              {/* Bank Details */}
              <div style={{ flex: 1, minWidth: 200, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div>
                  <div style={{ color: '#86868B', fontSize: 11, textTransform: 'uppercase' }}>UPI ID (VPA)</div>
                  <strong style={{ color: '#1D1D1F', fontSize: 14 }}>{paymentConfig?.upi?.vpa || 'nakshaktram@upi'}</strong>
                </div>
                <div>
                  <div style={{ color: '#86868B', fontSize: 11, textTransform: 'uppercase' }}>Bank Account</div>
                  <div style={{ color: '#1D1D1F' }}>{paymentConfig?.bank?.bankName || 'HDFC Bank'}</div>
                  <div style={{ color: '#1D1D1F' }}>A/C: {paymentConfig?.bank?.accountNumber || '50100492817291'}</div>
                  <div style={{ color: '#1D1D1F' }}>IFSC: {paymentConfig?.bank?.ifscCode || 'HDFC0001234'}</div>
                </div>
              </div>
            </div>

            {/* 1-Tap Mobile UPI Intent Launcher */}
            {paymentConfig?.upi?.intentUrl && (
              <a
                href={paymentConfig.upi.intentUrl}
                className="apple-btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '12px 18px',
                  marginBottom: 16,
                  textDecoration: 'none',
                  fontSize: 14.5,
                  borderRadius: 14,
                  backgroundColor: '#2FA84F',
                  boxShadow: '0 4px 14px rgba(47, 168, 79, 0.25)'
                }}
              >
                📱 Open Installed UPI App (GPay / PhonePe / Paytm)
              </a>
            )}

            {/* UTR Form */}
            <form onSubmit={handleSubmitPaymentProof} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1D1D1F', marginBottom: 4 }}>
                  Enter UPI 12-Digit UTR / Transaction Reference Number
                </label>
                <input
                  type="text"
                  required
                  value={utr}
                  onChange={(e) => setUtr(e.target.value.replace(/[^0-9A-Za-z]/g, ''))}
                  placeholder="e.g. 425981029384"
                  maxLength={16}
                  className="apple-input"
                />
                <span style={{ fontSize: 12, color: '#86868B', marginTop: 4, display: 'block' }}>
                  Available in your payment receipt on GPay, PhonePe, or Paytm.
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="apple-btn-gold"
                style={{ padding: 14, width: '100%', fontSize: 15 }}
              >
                {isLoading ? 'Submitting...' : 'Submit Payment Proof'}
              </button>
            </form>
          </div>
        )}

        {/* STEP 3: SUCCESS CONFIRMATION */}
        {step === 'success' && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                backgroundColor: 'rgba(47, 168, 79, 0.12)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16
              }}
            >
              <CheckCircle2 size={32} color="#2FA84F" />
            </div>

            <h2 className="text-h2" style={{ fontSize: 24, marginBottom: 8 }}>
              Consultation Request Received!
            </h2>
            <p className="text-body" style={{ fontSize: 14.5, marginBottom: 20, maxWidth: 440, margin: '0 auto 24px' }}>
              Amit Soni has received your birth details and preferred window for{' '}
              <strong>{selectedDate} ({selectedWindow})</strong>. We will confirm your final slot via in-app chat and WhatsApp.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={() => {
                  onClose();
                  if (onNavigateToApp) onNavigateToApp();
                }}
                className="apple-btn-primary"
                style={{ padding: 13, width: '100%', fontSize: 14.5 }}
              >
                Go to My Dashboard & Chat <ArrowRight size={15} />
              </button>

              <button
                onClick={onClose}
                className="apple-btn-secondary"
                style={{ padding: 12, width: '100%', fontSize: 14 }}
              >
                Return to Site
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
