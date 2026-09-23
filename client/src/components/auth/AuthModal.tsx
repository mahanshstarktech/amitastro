import React, { useState } from 'react';
import { X, Phone, Mail, Lock, User as UserIcon, ShieldCheck, ArrowRight, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { isFirebaseConfigured, sendFirebaseSms, signInWithFirebaseGoogle } from '../../services/firebase';

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
  const { login, loginWithGoogle, sendOtp, sendDualOtp, verifyOtp, verifyDualOtp, addProfile, user } = useAuth();
  const { showToast } = useNotification();

  const [mode, setMode] = useState<'login' | 'signup' | 'otp' | 'dual_otp' | 'profile'>(initialMode);
  const [channel, setChannel] = useState<'phone' | 'email'>('phone');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneSimulatedCode, setPhoneSimulatedCode] = useState<string | null>(null);
  const [emailSimulatedCode, setEmailSimulatedCode] = useState<string | null>(null);
  const [firebaseConfirmation, setFirebaseConfirmation] = useState<any>(null);
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

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      if (!isFirebaseConfigured()) {
        showToast('Google authentication is not yet configured for this domain.', 'warning');
        return;
      }

      try {
        const googleData = await signInWithFirebaseGoogle();
        const res = await loginWithGoogle(googleData);
        showToast(`Welcome ${googleData.name}! Signed in with Google.`, 'success');

        // If new seeker without a birth chart profile yet, prompt for birth details
        if (!res.profiles || res.profiles.length === 0) {
          setProfileName(googleData.name || '');
          setMode('profile');
        } else {
          onClose();
          if (onSuccess) onSuccess();
        }
      } catch (fbErr: any) {
        if (fbErr.code === 'auth/operation-not-allowed') {
          showToast('Google Sign-In needs to be enabled in Firebase Console: Authentication > Sign-in method > Google (switch to Enable).', 'warning');
          return;
        } else if (fbErr.code === 'auth/unauthorized-domain') {
          showToast(`Domain not authorized: Please add "${window.location.hostname}" to Firebase Console > Authentication > Settings > Authorized domains.`, 'warning');
          return;
        } else if (fbErr.code === 'auth/popup-closed-by-user') {
          // User intentionally closed the Google popup window
          return;
        } else if (fbErr.code === 'auth/popup-blocked') {
          showToast('Google sign-in popup was blocked by browser. Please allow popups for this site.', 'warning');
          return;
        }
        console.warn('[Firebase Google Sign-In]:', fbErr);
        showToast(fbErr.message || 'Google sign in could not be completed.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Google sign in failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (channel === 'phone' && !phone) {
      showToast('Please enter your mobile phone number', 'error');
      return;
    }
    if (channel === 'email' && !email) {
      showToast('Please enter your email address', 'error');
      return;
    }

    const destination = channel === 'phone' ? phone : email;
    setIsLoading(true);
    try {
      const res = await sendOtp(destination, channel);
      if (res.simulatedCode) {
        setSimulatedCode(res.simulatedCode);
        setOtpCode(res.simulatedCode); // Pre-fill for instant test convenience
      }
      setCooldown(res.cooldownSeconds || 60);
      setMode('otp');
      showToast(`Verification code dispatched to your ${channel === 'phone' ? 'phone' : 'email'}`, 'success');

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
      showToast('Please enter the 6-digit verification code', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await verifyOtp({
        phone: channel === 'phone' ? phone : undefined,
        email: channel === 'email' ? email : undefined,
        code: otpCode,
        name: name || undefined,
        password: password || undefined
      });

      showToast(`${channel === 'phone' ? 'Phone' : 'Email'} verified successfully!`, 'success');

      // Check if user needs progressive birth profiling
      setProfileName(name || 'Myself');
      setMode('profile');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendDualOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Please enter your full name', 'error');
      return;
    }
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      showToast('Please enter a valid 10-digit mobile number', 'error');
      return;
    }
    if (!email || !email.includes('@')) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const fullPhone = '+91' + cleanPhone.slice(-10);

      if (isFirebaseConfigured()) {
        try {
          const confirmation = await sendFirebaseSms(fullPhone, 'recaptcha-container');
          setFirebaseConfirmation(confirmation);
          showToast('Real SMS verification sent via Firebase!', 'success');
        } catch (firebaseErr: any) {
          console.warn('[Firebase SMS fallback]:', firebaseErr.message);
        }
      }

      const res = await sendDualOtp(fullPhone, email.trim().toLowerCase());
      if (res.phoneSimulatedCode) {
        setPhoneSimulatedCode(res.phoneSimulatedCode);
        setPhoneOtp(res.phoneSimulatedCode);
      }
      if (res.emailSimulatedCode) {
        setEmailSimulatedCode(res.emailSimulatedCode);
        setEmailOtp(res.emailSimulatedCode);
      }
      setCooldown(res.cooldownSeconds || 60);
      setMode('dual_otp');
      showToast('Verification codes dispatched to Phone (SMS) and Email', 'success');

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

  const handleVerifyDualOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneOtp || phoneOtp.length < 6) {
      showToast('Please enter the 6-digit Mobile SMS verification code', 'error');
      return;
    }
    if (!emailOtp || emailOtp.length < 6) {
      showToast('Please enter the 6-digit Email verification code', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const fullPhone = '+91' + phone.replace(/[^0-9]/g, '').slice(-10);
      let firebaseVerified = false;

      if (firebaseConfirmation) {
        try {
          await firebaseConfirmation.confirm(phoneOtp);
          firebaseVerified = true;
        } catch (fbErr: any) {
          console.warn('Firebase confirmation warning:', fbErr.message);
        }
      }

      await verifyDualOtp({
        phone: fullPhone,
        email: email.trim().toLowerCase(),
        phoneCode: phoneOtp,
        emailCode: emailOtp,
        firebaseVerified,
        name: name.trim(),
        password: password || undefined
      });

      showToast('Both Phone & Email verified successfully!', 'success');
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
      showToast('Welcome back to Amit Astro', 'success');
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

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
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
          maxWidth: 450,
          backgroundColor: '#FFFFFF',
          borderRadius: 22,
          padding: '32px 28px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.14)',
          position: 'relative',
          maxHeight: '94vh',
          overflowY: 'auto'
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
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: 'rgba(58, 58, 110, 0.08)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 10
                }}
              >
                <Lock size={22} color="#3A3A6E" />
              </div>
              <h2 className="text-h2" style={{ fontSize: 22, marginBottom: 4 }}>
                Sign In to Amit Astro
              </h2>
              <p className="text-body" style={{ fontSize: 13.5 }}>
                Access consultation slots, birth charts, and private astrologer chat.
              </p>
            </div>

            {/* 1-Click Continue with Google Button (100% Free OAuth) */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="apple-btn-secondary"
              style={{
                width: '100%',
                padding: '11px 16px',
                fontSize: 14,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                backgroundColor: '#FFFFFF',
                borderColor: '#E5E5EA',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                marginBottom: 16
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              Continue with Google
            </button>

            <div style={{ margin: '14px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, height: 1, backgroundColor: '#E5E5EA' }} />
              <span style={{ fontSize: 11.5, color: '#A1A1A6' }}>or with email & password</span>
              <div style={{ flex: 1, height: 1, backgroundColor: '#E5E5EA' }} />
            </div>

            <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: '#1D1D1F', marginBottom: 4 }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="#A1A1A6" style={{ position: 'absolute', left: 14, top: 12 }} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="apple-input"
                    style={{ paddingLeft: 38 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: '#1D1D1F', marginBottom: 4 }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="#A1A1A6" style={{ position: 'absolute', left: 14, top: 12 }} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="apple-input"
                    style={{ paddingLeft: 38 }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="apple-btn-primary"
                style={{ marginTop: 6, padding: 12, width: '100%', fontSize: 14.5 }}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            <div style={{ marginTop: 18, textAlign: 'center', fontSize: 13, color: '#6E6E73' }}>
              Don't have an account?{' '}
              <span
                onClick={() => setMode('signup')}
                style={{ color: '#3A3A6E', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
              >
                Sign Up with OTP
              </span>
            </div>
          </div>
        )}

        {/* 2. Mode: SIGN UP WITH PHONE OR EMAIL OTP */}
        {mode === 'signup' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 18 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: 'rgba(58, 58, 110, 0.08)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 10
                }}
              >
                <Sparkles size={22} color="#3A3A6E" />
              </div>
              <h2 className="text-h2" style={{ fontSize: 22, marginBottom: 4 }}>
                Create Your Account
              </h2>
              <p className="text-body" style={{ fontSize: 13 }}>
                Get 5-min complimentary consultation eligibility and store your family Kundli charts.
              </p>
            </div>

            {/* Google Sign-Up 1-Click */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="apple-btn-secondary"
              style={{
                width: '100%',
                padding: '11px 16px',
                fontSize: 14,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                backgroundColor: '#FFFFFF',
                borderColor: '#E5E5EA',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                marginBottom: 16
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              Sign Up with Google
            </button>

            <div style={{ margin: '14px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, height: 1, backgroundColor: '#E5E5EA' }} />
              <span style={{ fontSize: 11.5, color: '#A1A1A6' }}>or register with OTP</span>
              <div style={{ flex: 1, height: 1, backgroundColor: '#E5E5EA' }} />
            </div>

            {/* Mandatory Dual Verification Notice */}
            <div
              style={{
                backgroundColor: 'rgba(58, 58, 110, 0.06)',
                border: '1px solid rgba(58, 58, 110, 0.14)',
                borderRadius: 12,
                padding: '12px 14px',
                marginBottom: 16,
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start'
              }}
            >
              <ShieldCheck size={18} color="#3A3A6E" style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: 12, color: '#3A3A6E', lineHeight: 1.45 }}>
                <strong>Mandatory Dual Verification:</strong> Both Phone (SMS) and Email OTP verification are required to confirm your client profile and unlock consultations.
              </div>
            </div>

            <form onSubmit={handleSendDualOtp} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: '#1D1D1F', marginBottom: 4 }}>
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
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: '#1D1D1F', marginBottom: 4 }}>
                  Mobile Phone Number (SMS OTP)
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: 12, color: '#1D1D1F', fontWeight: 500, fontSize: 14 }}>
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
                    style={{ paddingLeft: 50 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: '#1D1D1F', marginBottom: 4 }}>
                  Email Address (Email OTP)
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="#A1A1A6" style={{ position: 'absolute', left: 14, top: 12 }} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="apple-input"
                    style={{ paddingLeft: 38 }}
                  />
                </div>
              </div>

              <div id="recaptcha-container"></div>

              <button
                type="submit"
                disabled={isLoading}
                className="apple-btn-primary"
                style={{ marginTop: 6, padding: 12, width: '100%', fontSize: 14.5 }}
              >
                {isLoading ? 'Dispatching Verification Codes...' : 'Send Codes to Phone & Email'}
              </button>
            </form>

            <div style={{ marginTop: 18, textAlign: 'center', fontSize: 13, color: '#6E6E73' }}>
              Already have an account?{' '}
              <span
                onClick={() => setMode('login')}
                style={{ color: '#3A3A6E', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
              >
                Sign In with Password
              </span>
            </div>
          </div>
        )}

        {/* 3. Mode: MANDATORY DUAL OTP VERIFICATION */}
        {mode === 'dual_otp' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 18 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: 'rgba(47, 168, 79, 0.1)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 10
                }}
              >
                <ShieldCheck size={24} color="#2FA84F" />
              </div>
              <h2 className="text-h2" style={{ fontSize: 21, marginBottom: 4 }}>
                Verify Phone & Email
              </h2>
              <p className="text-body" style={{ fontSize: 12.5 }}>
                Enter the verification codes sent to both destinations below.
              </p>
            </div>

            {/* Simulated Code Indicator if in dev/simulated mode */}
            {(phoneSimulatedCode || emailSimulatedCode) && (
              <div
                style={{
                  backgroundColor: '#FFF8E6',
                  border: '1px solid #C9A24B',
                  borderRadius: 10,
                  padding: '9px 12px',
                  marginBottom: 14,
                  fontSize: 12,
                  color: '#6A531C',
                  textAlign: 'center'
                }}
              >
                {phoneSimulatedCode && <div>📱 Mobile Dev Code: <strong>{phoneSimulatedCode}</strong></div>}
                {emailSimulatedCode && <div>✉️ Email Dev Code: <strong>{emailSimulatedCode}</strong></div>}
              </div>
            )}

            <form onSubmit={handleVerifyDualOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Phone OTP Input */}
              <div style={{ backgroundColor: '#F5F5F7', padding: '12px 14px', borderRadius: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: '#1D1D1F', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Phone size={14} color="#3A3A6E" /> 1. Mobile SMS Code
                  </span>
                  <span style={{ fontSize: 11.5, color: '#6E6E73' }}>
                    +91 {phone.replace(/[^0-9]/g, '').slice(-10)}
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={phoneOtp}
                  onChange={(e) => setPhoneOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  placeholder="• • • • • •"
                  maxLength={6}
                  className="apple-input"
                  style={{ textAlign: 'center', fontSize: 20, letterSpacing: 6, fontWeight: 700, backgroundColor: '#FFFFFF' }}
                  autoFocus
                />
              </div>

              {/* Email OTP Input */}
              <div style={{ backgroundColor: '#F5F5F7', padding: '12px 14px', borderRadius: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: '#1D1D1F', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Mail size={14} color="#3A3A6E" /> 2. Email OTP Code
                  </span>
                  <span style={{ fontSize: 11.5, color: '#6E6E73' }}>
                    {email}
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={emailOtp}
                  onChange={(e) => setEmailOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  placeholder="• • • • • •"
                  maxLength={6}
                  className="apple-input"
                  style={{ textAlign: 'center', fontSize: 20, letterSpacing: 6, fontWeight: 700, backgroundColor: '#FFFFFF' }}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || phoneOtp.length < 6 || emailOtp.length < 6}
                className="apple-btn-primary"
                style={{
                  padding: 12,
                  width: '100%',
                  fontSize: 14.5,
                  opacity: (phoneOtp.length < 6 || emailOtp.length < 6) ? 0.6 : 1
                }}
              >
                {isLoading ? 'Verifying Credentials...' : 'Verify Both & Continue'}
              </button>
            </form>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, fontSize: 12, color: '#6E6E73' }}>
              <button
                type="button"
                onClick={() => setMode('signup')}
                style={{ background: 'none', border: 'none', color: '#3A3A6E', cursor: 'pointer', fontSize: 12 }}
              >
                ← Edit phone/email
              </button>

              {cooldown > 0 ? (
                <span>Resend in {cooldown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendDualOtp}
                  style={{ background: 'none', border: 'none', color: '#3A3A6E', fontWeight: 600, cursor: 'pointer', fontSize: 12 }}
                >
                  Resend Both Codes
                </button>
              )}
            </div>
          </div>
        )}

        {/* 3b. Mode: SINGLE OTP (Fallback / Login) */}
        {mode === 'otp' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: 'rgba(47, 168, 79, 0.1)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 10
                }}
              >
                <ShieldCheck size={24} color="#2FA84F" />
              </div>
              <h2 className="text-h2" style={{ fontSize: 22, marginBottom: 4 }}>
                Enter Verification Code
              </h2>
              <p className="text-body" style={{ fontSize: 13 }}>
                Sent to <strong>{channel === 'phone' ? phone : email}</strong>
              </p>
            </div>

            {/* Simulated OTP notice for local development */}
            {simulatedCode && (
              <div
                style={{
                  backgroundColor: '#FFF8E6',
                  border: '1px solid #C9A24B',
                  borderRadius: 10,
                  padding: '10px 14px',
                  marginBottom: 16,
                  fontSize: 12.5,
                  color: '#6A531C',
                  textAlign: 'center'
                }}
              >
                Dev Code Auto-Detected: <strong>{simulatedCode}</strong>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: '#1D1D1F', marginBottom: 6 }}>
                  6-Digit OTP Code
                </label>
                <input
                  type="text"
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  placeholder="• • • • • •"
                  maxLength={6}
                  className="apple-input"
                  style={{ textAlign: 'center', fontSize: 24, letterSpacing: 8, fontWeight: 700 }}
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || otpCode.length < 6}
                className="apple-btn-primary"
                style={{ padding: 12, width: '100%', fontSize: 14.5, opacity: otpCode.length < 6 ? 0.6 : 1 }}
              >
                {isLoading ? 'Verifying...' : 'Verify & Continue'}
              </button>
            </form>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, fontSize: 12.5, color: '#6E6E73' }}>
              <button
                type="button"
                onClick={() => setMode('signup')}
                style={{ background: 'none', border: 'none', color: '#3A3A6E', cursor: 'pointer', fontSize: 12.5 }}
              >
                ← Change destination
              </button>

              {cooldown > 0 ? (
                <span>Resend in {cooldown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  style={{ background: 'none', border: 'none', color: '#3A3A6E', fontWeight: 600, cursor: 'pointer', fontSize: 12.5 }}
                >
                  Resend Code
                </button>
              )}
            </div>
          </div>
        )}

        {/* 4. Mode: PROGRESSIVE BIRTH PROFILE SETUP */}
        {mode === 'profile' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: 'rgba(201, 162, 75, 0.1)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 10
                }}
              >
                <Sparkles size={22} color="#C9A24B" />
              </div>
              <h2 className="text-h2" style={{ fontSize: 22, marginBottom: 4 }}>
                Cast Your Kundli
              </h2>
              <p className="text-body" style={{ fontSize: 13 }}>
                Enter your birth details for authentic planetary calculations by Amit.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: '#1D1D1F', marginBottom: 4 }}>
                  Full Name on Chart
                </label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="apple-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: '#1D1D1F', marginBottom: 4 }}>
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
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: '#1D1D1F', marginBottom: 4 }}>
                    Time of Birth
                  </label>
                  <input
                    type="time"
                    required={!tobUncertain}
                    disabled={tobUncertain}
                    value={tob}
                    onChange={(e) => setTob(e.target.value)}
                    className="apple-input"
                    style={{ opacity: tobUncertain ? 0.5 : 1 }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: -2 }}>
                <input
                  type="checkbox"
                  id="modalTobUncertain"
                  checked={tobUncertain}
                  onChange={(e) => setTobUncertain(e.target.checked)}
                  style={{ width: 15, height: 15, accentColor: '#3A3A6E', cursor: 'pointer' }}
                />
                <label htmlFor="modalTobUncertain" style={{ fontSize: 12.5, color: '#6E6E73', cursor: 'pointer' }}>
                  Exact birth time is uncertain (Amit will use Prashna / palm analysis)
                </label>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: '#1D1D1F', marginBottom: 4 }}>
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
                className="apple-btn-primary"
                style={{ marginTop: 6, padding: 12, width: '100%', fontSize: 14.5 }}
              >
                {isLoading ? 'Saving Chart...' : 'Save & Enter Portal'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
