import React, { useState } from 'react';
import { X, Phone, Mail, Lock, User as UserIcon, ShieldCheck, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onSuccess
}) => {
  const { login, sendOtp, verifyOtp, addProfile, user } = useAuth();
  const { showToast } = useNotification();

  const [mode, setMode] = useState<'login' | 'signup' | 'otp' | 'profile'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [simulatedCode, setSimulatedCode] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Progressive profiling state
  const [profileName, setProfileName] = useState('');
  const [dob, setDob] = useState('');
  const [tob, setTob] = useState('12:00');
  const [tobUncertain, setTobUncertain] = useState(false);
  const [pob, setPob] = useState('');

  if (!isOpen) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      showToast('Please enter your mobile phone number', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const res = await sendOtp(phone);
      if (res.simulatedCode) {
        setSimulatedCode(res.simulatedCode);
        setOtpCode(res.simulatedCode); // Pre-fill for instant test convenience
      }
      setCooldown(res.cooldownSeconds || 60);
      setMode('otp');
      showToast('Verification OTP dispatched to your phone', 'success');

      // Countdown interval
      const timer = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) {
      showToast('Please enter the 6-digit OTP', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await verifyOtp({
        phone,
        code: otpCode,
        name: name || undefined,
        email: email || undefined,
        password: password || undefined
      });

      showToast('Phone verified successfully!', 'success');

      // Check if user needs progressive birth profiling
      setProfileName(name || 'Myself');
      setMode('profile');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      showToast('Welcome back to Nakshaktram', 'success');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName || !dob || !pob) {
      showToast('Please fill in your birth date and place of birth', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await addProfile({
        relation: 'self',
        fullName: profileName,
        dob,
        tob: tobUncertain ? '12:00' : tob,
        tobUncertain,
        pob,
        pobTimezone: 'Asia/Kolkata'
      });
      showToast('Birth profile saved for chart calculations', 'success');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Demo 1-click logins
  const handleQuickDemoLogin = async (asAdmin: boolean) => {
    setIsLoading(true);
    try {
      if (asAdmin) {
        await login('admin@nakshaktram.com', 'Nakshaktram@2026');
        showToast('Signed in as Astrologer Amit Soni', 'success');
      } else {
        await login('priya.sharma@example.com', 'Customer@123');
        showToast('Signed in as Demo Customer (Priya Sharma)', 'success');
      }
      onClose();
      if (onSuccess) onSuccess();
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
        padding: 20,
        animation: 'modalBackdrop 0.25s ease'
      }}
    >
      <div
        className="apple-card"
        style={{
          width: '100%',
          maxWidth: 440,
          backgroundColor: '#FFFFFF',
          borderRadius: 22,
          padding: '32px 28px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.12)',
          position: 'relative'
        }}
      >
        {/* Close button */}
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

        {/* 1. Mode: LOGIN */}
        {mode === 'login' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: 'rgba(58, 58, 110, 0.08)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12
                }}
              >
                <Lock size={22} color="#3A3A6E" />
              </div>
              <h2 className="text-h2" style={{ fontSize: 24, marginBottom: 6 }}>
                Sign In to Nakshaktram
              </h2>
              <p className="text-body" style={{ fontSize: 14 }}>
                Access your consultation slots, birth charts, and direct chat.
              </p>
            </div>

            <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#1D1D1F', marginBottom: 6 }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="#A1A1A6" style={{ position: 'absolute', left: 14, top: 14 }} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="apple-input"
                    style={{ paddingLeft: 40 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#1D1D1F', marginBottom: 6 }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="#A1A1A6" style={{ position: 'absolute', left: 14, top: 14 }} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="apple-input"
                    style={{ paddingLeft: 40 }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="apple-btn-primary"
                style={{ marginTop: 8, padding: 13, width: '100%', fontSize: 15 }}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            <div style={{ margin: '18px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: 1, backgroundColor: '#E5E5EA' }} />
              <span style={{ fontSize: 12, color: '#A1A1A6' }}>or instant demo</span>
              <div style={{ flex: 1, height: 1, backgroundColor: '#E5E5EA' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin(false)}
                className="apple-btn-secondary"
                style={{ fontSize: 12.5, padding: '8px 10px' }}
              >
                Demo Customer
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin(true)}
                className="apple-btn-secondary"
                style={{ fontSize: 12.5, padding: '8px 10px', color: '#3A3A6E', borderColor: '#3A3A6E' }}
              >
                Demo Astrologer
              </button>
            </div>

            <div style={{ marginTop: 22, textAlign: 'center', fontSize: 13.5, color: '#6E6E73' }}>
              Don't have an account?{' '}
              <span
                onClick={() => setMode('signup')}
                style={{ color: '#3A3A6E', fontWeight: 600, cursor: 'pointer' }}
              >
                Sign Up with Phone OTP
              </span>
            </div>
          </div>
        )}

        {/* 2. Mode: SIGN UP WITH PHONE */}
        {mode === 'signup' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: 'rgba(58, 58, 110, 0.08)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12
                }}
              >
                <Phone size={22} color="#3A3A6E" />
              </div>
              <h2 className="text-h2" style={{ fontSize: 24, marginBottom: 6 }}>
                Verify Mobile Number
              </h2>
              <p className="text-body" style={{ fontSize: 14 }}>
                Per Section 7, verified mobile numbers ensure trial eligibility and appointment coordination.
              </p>
            </div>

            <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#1D1D1F', marginBottom: 6 }}>
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="apple-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#1D1D1F', marginBottom: 6 }}>
                  Mobile Phone Number
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: 13, color: '#1D1D1F', fontWeight: 500, fontSize: 15 }}>
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    value={phone.replace('+91', '')}
                    onChange={(e) => setPhone('+91' + e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="98765 43210"
                    maxLength={10}
                    className="apple-input"
                    style={{ paddingLeft: 52 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#1D1D1F', marginBottom: 6 }}>
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="apple-input"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="apple-btn-primary"
                style={{ marginTop: 8, padding: 13, width: '100%', fontSize: 15 }}
              >
                {isLoading ? 'Sending SMS OTP...' : 'Send 6-Digit OTP'}
              </button>
            </form>

            <div style={{ marginTop: 22, textAlign: 'center', fontSize: 13.5, color: '#6E6E73' }}>
              Already have an account?{' '}
              <span
                onClick={() => setMode('login')}
                style={{ color: '#3A3A6E', fontWeight: 600, cursor: 'pointer' }}
              >
                Sign In with Password
              </span>
            </div>
          </div>
        )}

        {/* 3. Mode: ENTER OTP */}
        {mode === 'otp' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: 'rgba(47, 168, 79, 0.1)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12
                }}
              >
                <ShieldCheck size={24} color="#2FA84F" />
              </div>
              <h2 className="text-h2" style={{ fontSize: 24, marginBottom: 6 }}>
                Enter SMS Code
              </h2>
              <p className="text-body" style={{ fontSize: 14 }}>
                Sent to <strong>{phone}</strong>
              </p>
            </div>

            {/* Simulated OTP notice for dev ease */}
            {simulatedCode && (
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: 'rgba(201, 162, 75, 0.1)',
                  borderRadius: 12,
                  border: '1px solid rgba(201, 162, 75, 0.3)',
                  marginBottom: 16,
                  fontSize: 13,
                  color: '#8E6A1C',
                  textAlign: 'center'
                }}
              >
                💡 <strong>Dev Simulated SMS:</strong> Your code is <strong>{simulatedCode}</strong>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="• • • • • •"
                  style={{
                    width: '100%',
                    textAlign: 'center',
                    letterSpacing: '0.5em',
                    fontSize: 28,
                    fontWeight: 600,
                    padding: '12px 16px',
                    borderRadius: 14,
                    border: '1px solid #E5E5EA',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                <span style={{ color: '#6E6E73' }}>
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Did not receive?'}
                </span>
                {cooldown === 0 && (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    style={{ background: 'none', border: 'none', color: '#3A3A6E', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Resend Code
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="apple-btn-primary"
                style={{ marginTop: 8, padding: 13, width: '100%', fontSize: 15 }}
              >
                {isLoading ? 'Verifying...' : 'Verify & Continue'}
              </button>
            </form>
          </div>
        )}

        {/* 4. Mode: PROGRESSIVE BIRTH PROFILING (Section 7) */}
        {mode === 'profile' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: 'rgba(201, 162, 75, 0.12)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 10
                }}
              >
                <CheckCircle2 size={24} color="#C9A24B" />
              </div>
              <h2 className="text-h2" style={{ fontSize: 22, marginBottom: 4 }}>
                Birth Chart Details
              </h2>
              <p className="text-body" style={{ fontSize: 13.5 }}>
                Used by Amit Soni for your Kundli and planetary dasha analysis.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#1D1D1F', marginBottom: 4 }}>
                  Profile Name
                </label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Full Name"
                  className="apple-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#1D1D1F', marginBottom: 4 }}>
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="apple-input"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#1D1D1F', marginBottom: 4 }}>
                    Time of Birth
                  </label>
                  <input
                    type="time"
                    disabled={tobUncertain}
                    value={tob}
                    onChange={(e) => setTob(e.target.value)}
                    className="apple-input"
                    style={{ opacity: tobUncertain ? 0.4 : 1 }}
                  />
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#6E6E73', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={tobUncertain}
                  onChange={(e) => setTobUncertain(e.target.checked)}
                />
                Exact time of birth is approximate / not sure
              </label>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#1D1D1F', marginBottom: 4 }}>
                  Place of Birth (City, State)
                </label>
                <input
                  type="text"
                  required
                  value={pob}
                  onChange={(e) => setPob(e.target.value)}
                  placeholder="e.g. Jaipur, Rajasthan"
                  className="apple-input"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="apple-btn-gold"
                style={{ marginTop: 6, padding: 13, width: '100%', fontSize: 15 }}
              >
                {isLoading ? 'Saving...' : 'Save & Enter Platform'}
              </button>
            </form>
          </div>
        )}
      </div>

      <style>{`
        @keyframes modalBackdrop {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};
