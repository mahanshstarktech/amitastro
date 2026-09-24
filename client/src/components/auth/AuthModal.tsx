import React, { useState, useEffect } from 'react';
import {
  X,
  Phone,
  Mail,
  Lock,
  User as UserIcon,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  KeyRound,
  RotateCw
} from 'lucide-react';
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
  const {
    login,
    loginWithGoogle,
    completeGooglePhoneVerification,
    sendOtp,
    verifyEmailOtp,
    completeManualRegistration,
    addProfile
  } = useAuth();
  const { showToast } = useNotification();

  // Modal Flow Modes:
  // 'login' | 'signup' | 'email_otp' | 'manual_phone' | 'google_phone_verify' | 'profile'
  const [mode, setMode] = useState<'login' | 'signup' | 'email_otp' | 'manual_phone' | 'google_phone_verify' | 'profile'>(initialMode);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  // OTP inputs
  const [emailOtpCode, setEmailOtpCode] = useState('');
  const [phoneOtpCode, setPhoneOtpCode] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [manualPhoneOtpSent, setManualPhoneOtpSent] = useState(false);
  const [googlePhoneOtpSent, setGooglePhoneOtpSent] = useState(false);
  const [firebaseConfirmation, setFirebaseConfirmation] = useState<any>(null);

  // Simulated OTPs for dev testing
  const [simulatedOtp, setSimulatedOtp] = useState<{ email?: string; phone?: string } | null>(null);

  const handleChangePhoneNumber = () => {
    setGooglePhoneOtpSent(false);
    setManualPhoneOtpSent(false);
    setPhoneOtpCode('');
    setFirebaseConfirmation(null);
    setCooldown(0);
  };

  // Google Temp User state for mandatory phone registration
  const [googleTempUser, setGoogleTempUser] = useState<{
    email: string;
    name: string;
    googleId?: string;
    photoURL?: string;
  } | null>(null);

  // Error banners
  const [unauthorizedDomainAlert, setUnauthorizedDomainAlert] = useState<string | null>(null);

  // Cooldown & loading
  const [cooldown, setCooldown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Progressive profiling state
  const [profileName, setProfileName] = useState('');
  const [dob, setDob] = useState('');
  const [tob, setTob] = useState('12:00');
  const [tobUncertain, setTobUncertain] = useState(false);
  const [pob, setPob] = useState('');

  // Reset or initialize mode on open
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setUnauthorizedDomainAlert(null);
    }
  }, [isOpen, initialMode]);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  if (!isOpen) return null;

  // -------------------------------------------------------------
  // 1. Google Sign-In Flow
  // -------------------------------------------------------------
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setUnauthorizedDomainAlert(null);
    try {
      if (!isFirebaseConfigured()) {
        showToast('Google authentication is not yet configured for this domain.', 'warning');
        return;
      }

      try {
        const googleData = await signInWithFirebaseGoogle();
        const res = await loginWithGoogle(googleData);

        // Scenario A: First time registration OR phone not verified yet -> Mandatory Phone Verification
        if (res.needsPhoneVerification) {
          setGoogleTempUser({
            email: res.tempUser?.email || googleData.email,
            name: res.tempUser?.name || googleData.name,
            googleId: res.tempUser?.googleId || googleData.googleId,
            photoURL: res.tempUser?.photoURL || googleData.photoURL
          });
          setMode('google_phone_verify');
          showToast('Google verified! Please enter your mobile number to complete registration.', 'info');
          return;
        }

        // Scenario B: Existing user with verified phone -> Immediate Login
        showToast(`Welcome back, ${res.user?.name || googleData.name}!`, 'success');

        if (!res.profiles || res.profiles.length === 0) {
          setProfileName(googleData.name || '');
          setMode('profile');
        } else {
          onClose();
          if (onSuccess) onSuccess();
        }
      } catch (fbErr: any) {
        if (fbErr.code === 'auth/unauthorized-domain') {
          const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'amitastro.pages.dev';
          setUnauthorizedDomainAlert(currentHost);
          showToast(`Domain "${currentHost}" is not authorized in Firebase Console. See instructions below.`, 'error');
        } else if (fbErr.code === 'auth/operation-not-allowed') {
          showToast('Google Sign-In needs to be enabled in Firebase Console: Authentication > Sign-in method > Google.', 'warning');
        } else if (fbErr.code === 'auth/popup-closed-by-user') {
          // Intentional user close
        } else if (fbErr.code === 'auth/popup-blocked') {
          showToast('Google sign-in popup was blocked by browser. Please allow popups for this site.', 'warning');
        } else {
          console.warn('[Firebase Google Sign-In]:', fbErr);
          showToast(fbErr.message || 'Google sign-in could not be completed.', 'error');
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Google sign in failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Google Phone Verification: Send SMS OTP
  const handleSendGooglePhoneOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      showToast('Please enter a valid 10-digit mobile number', 'error');
      return;
    }
    const fullPhone = '+91' + cleanPhone.slice(-10);

    setIsLoading(true);
    let fbSuccess = false;

    if (isFirebaseConfigured()) {
      try {
        const confirmation = await sendFirebaseSms(fullPhone, 'recaptcha-container-google');
        setFirebaseConfirmation(confirmation);
        fbSuccess = true;
        showToast(`SMS OTP sent to ${fullPhone} via Google SMS`, 'success');
      } catch (fbErr: any) {
        console.warn('[Firebase SMS Error]:', fbErr);
        if (fbErr.code === 'auth/quota-exceeded') {
          showToast('Firebase daily SMS quota exceeded (10/day limit on free plan).', 'warning');
        } else if (fbErr.code === 'auth/captcha-check-failed') {
          showToast('reCAPTCHA verification failed. Please try again.', 'error');
        } else if (fbErr.code === 'auth/invalid-phone-number') {
          showToast('Invalid phone number format for SMS.', 'error');
        } else {
          showToast(fbErr.message || 'Firebase SMS delivery error.', 'warning');
        }
      }
    }

    try {
      const res = await sendOtp(fullPhone, 'phone');
      if (!fbSuccess) {
        showToast(`Verification code dispatched to ${fullPhone}`, 'success');
      }
      setCooldown(res.cooldownSeconds || 60);
      setGooglePhoneOtpSent(true);
    } catch (err: any) {
      if (!fbSuccess) {
        showToast(err.message || 'Failed to send SMS OTP', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Google Phone Verification: Complete registration
  const handleVerifyGooglePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleTempUser) return;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      showToast('Please enter a valid 10-digit mobile phone number', 'error');
      return;
    }
    if (!phoneOtpCode || phoneOtpCode.length < 6) {
      showToast('Please enter the 6-digit SMS verification code', 'error');
      return;
    }

    const fullPhone = '+91' + cleanPhone.slice(-10);
    setIsLoading(true);
    let firebaseVerified = false;

    if (firebaseConfirmation) {
      try {
        await firebaseConfirmation.confirm(phoneOtpCode);
        firebaseVerified = true;
      } catch (fbErr: any) {
        console.warn('[Firebase Confirm Error]:', fbErr);
        showToast(fbErr.message || 'Invalid SMS verification code. Please check and try again.', 'error');
        setIsLoading(false);
        return;
      }
    }

    try {
      const res = await completeGooglePhoneVerification({
        email: googleTempUser.email,
        name: googleTempUser.name,
        googleId: googleTempUser.googleId,
        photoURL: googleTempUser.photoURL,
        phone: fullPhone,
        phoneCode: phoneOtpCode,
        firebaseVerified
      });

      showToast(`Welcome ${res.user.name}! Your account is now active.`, 'success');
      if (!res.profiles || res.profiles.length === 0) {
        setProfileName(googleTempUser.name || '');
        setMode('profile');
      } else {
        onClose();
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      showToast(err.message || 'Phone verification failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 2. Manual Registration Flow
  // Step 1: User enters details -> Sends Email OTP
  // Step 2: User verifies Email OTP -> Email verified
  // Step 3: Mandatory Mobile Phone Number -> Sends SMS OTP -> Verifies SMS OTP -> Logged In!
  // -------------------------------------------------------------
  const handleStartManualSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Please enter your full name', 'error');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      showToast('Please enter a valid email address', 'error');
      return;
    }
    if (!password || password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const res = await sendOtp(email.trim().toLowerCase(), 'email');
      if (res.simulatedCode) {
        setSimulatedOtp((prev) => ({ ...prev, email: res.simulatedCode }));
        setEmailOtpCode(res.simulatedCode);
      }
      setCooldown(res.cooldownSeconds || 60);
      setMode('email_otp');
      showToast(`6-digit code sent to ${email}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to dispatch email verification code', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOtpCode || emailOtpCode.length < 6) {
      showToast('Please enter the 6-digit email verification code', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await verifyEmailOtp(email.trim().toLowerCase(), emailOtpCode);
      setEmailVerified(true);
      setMode('manual_phone');
      showToast('Email verified successfully! Now complete mandatory phone verification.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Invalid or expired email OTP', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendManualPhoneOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      showToast('Please enter a valid 10-digit mobile number', 'error');
      return;
    }
    const fullPhone = '+91' + cleanPhone.slice(-10);

    setIsLoading(true);
    let fbSuccess = false;

    if (isFirebaseConfigured()) {
      try {
        const confirmation = await sendFirebaseSms(fullPhone, 'recaptcha-container-manual');
        setFirebaseConfirmation(confirmation);
        fbSuccess = true;
        showToast(`SMS OTP sent to ${fullPhone} via Google SMS`, 'success');
      } catch (fbErr: any) {
        console.warn('[Firebase SMS Error]:', fbErr);
        if (fbErr.code === 'auth/quota-exceeded') {
          showToast('Firebase daily SMS quota exceeded (10/day limit on free plan).', 'warning');
        } else if (fbErr.code === 'auth/captcha-check-failed') {
          showToast('reCAPTCHA verification failed. Please try again.', 'error');
        } else if (fbErr.code === 'auth/invalid-phone-number') {
          showToast('Invalid phone number format for SMS.', 'error');
        } else {
          showToast(fbErr.message || 'Firebase SMS delivery error.', 'warning');
        }
      }
    }

    try {
      const res = await sendOtp(fullPhone, 'phone');
      if (!fbSuccess) {
        showToast(`Verification code dispatched to ${fullPhone}`, 'success');
      }
      setCooldown(res.cooldownSeconds || 60);
      setManualPhoneOtpSent(true);
    } catch (err: any) {
      if (!fbSuccess) {
        showToast(err.message || 'Failed to send SMS OTP', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteManualRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      showToast('Please enter a valid 10-digit mobile number', 'error');
      return;
    }
    if (!phoneOtpCode || phoneOtpCode.length < 6) {
      showToast('Please enter the 6-digit SMS verification code', 'error');
      return;
    }

    const fullPhone = '+91' + cleanPhone.slice(-10);
    setIsLoading(true);
    let firebaseVerified = false;

    if (firebaseConfirmation) {
      try {
        await firebaseConfirmation.confirm(phoneOtpCode);
        firebaseVerified = true;
      } catch (fbErr: any) {
        console.warn('[Firebase Confirm Error]:', fbErr);
        showToast(fbErr.message || 'Invalid SMS verification code. Please check and try again.', 'error');
        setIsLoading(false);
        return;
      }
    }

    try {
      const res = await completeManualRegistration({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: fullPhone,
        phoneCode: phoneOtpCode,
        firebaseVerified
      });

      showToast(`Registration complete! Welcome ${res.user.name}.`, 'success');
      if (!res.profiles || res.profiles.length === 0) {
        setProfileName(name || '');
        setMode('profile');
      } else {
        onClose();
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      showToast(err.message || 'Registration failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 3. Regular Email + Password Login
  // -------------------------------------------------------------
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      showToast('Welcome back to Amit Astro', 'success');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      showToast(err.message || 'Login failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 4. Save Progressive Birth Profile
  // -------------------------------------------------------------
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
          maxWidth: 440,
          backgroundColor: '#FFFFFF',
          borderRadius: 22,
          padding: '30px 26px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.14)',
          position: 'relative',
          maxHeight: '94vh',
          overflowY: 'auto'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 18,
            right: 18,
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

        {/* Firebase Unauthorized Domain Error Banner */}
        {unauthorizedDomainAlert && (
          <div
            style={{
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: 14,
              padding: '14px 16px',
              marginBottom: 18,
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <AlertCircle size={20} color="#DC2626" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#991B1B', marginBottom: 4 }}>
                  Firebase Domain Authorization Required
                </div>
                <p style={{ fontSize: 12, color: '#7F1D1D', margin: 0, lineHeight: 1.45 }}>
                  The domain <strong>{unauthorizedDomainAlert}</strong> has not yet been added to your Firebase project's authorized domains.
                </p>
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #FCA5A5',
                    borderRadius: 8,
                    padding: '8px 10px',
                    margin: '8px 0',
                    fontSize: 11.5,
                    color: '#7F1D1D',
                    lineHeight: 1.4
                  }}
                >
                  <strong>Quick 30-Second Fix:</strong>
                  <ol style={{ margin: '4px 0 0 16px', padding: 0 }}>
                    <li>Open <strong>Firebase Console &gt; amitastro</strong></li>
                    <li>Go to <strong>Authentication &gt; Settings &gt; Authorized domains</strong></li>
                    <li>Click <strong>Add domain</strong> and enter <code>{unauthorizedDomainAlert}</code></li>
                  </ol>
                </div>
                <div style={{ fontSize: 11, color: '#991B1B' }}>
                  Once added in Firebase, Google sign-in works immediately for all users!
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODE 1: LOGIN                                            */}
        {/* ======================================================== */}
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
              <p className="text-body" style={{ fontSize: 13 }}>
                Access consultation slots, birth charts, and private astrologer guidance.
              </p>
            </div>

            {/* Google Sign-In */}
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
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
              </svg>
              Continue with Google
            </button>

            <div style={{ margin: '14px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, height: 1, backgroundColor: '#E5E5EA' }} />
              <span style={{ fontSize: 11.5, color: '#A1A1A6' }}>or sign in with password</span>
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
              First time at Amit Astro?{' '}
              <span
                onClick={() => setMode('signup')}
                style={{ color: '#3A3A6E', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
              >
                Create Account
              </span>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODE 2: SIGNUP (MANUAL REGISTRATION STEP 1)              */}
        {/* ======================================================== */}
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
                Sequential OTP verification: Verify Email first, followed by mandatory Mobile Number.
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
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
              </svg>
              Sign Up with Google
            </button>

            <div style={{ margin: '14px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, height: 1, backgroundColor: '#E5E5EA' }} />
              <span style={{ fontSize: 11.5, color: '#A1A1A6' }}>or register manually with OTP</span>
              <div style={{ flex: 1, height: 1, backgroundColor: '#E5E5EA' }} />
            </div>

            <form onSubmit={handleStartManualSignup} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: '#1D1D1F', marginBottom: 4 }}>
                  Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <UserIcon size={16} color="#A1A1A6" style={{ position: 'absolute', left: 14, top: 12 }} />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="apple-input"
                    style={{ paddingLeft: 38 }}
                  />
                </div>
              </div>

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
                  Set Account Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="#A1A1A6" style={{ position: 'absolute', left: 14, top: 12 }} />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
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
                {isLoading ? 'Sending Email OTP...' : 'Continue & Verify Email (Step 1 of 2) →'}
              </button>
            </form>

            <div style={{ marginTop: 18, textAlign: 'center', fontSize: 13, color: '#6E6E73' }}>
              Already registered?{' '}
              <span
                onClick={() => setMode('login')}
                style={{ color: '#3A3A6E', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
              >
                Sign In
              </span>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODE 3: EMAIL OTP VERIFICATION (STEP 1)                  */}
        {/* ======================================================== */}
        {mode === 'email_otp' && (
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
                <Mail size={22} color="#3A3A6E" />
              </div>
              <h2 className="text-h2" style={{ fontSize: 21, marginBottom: 4 }}>
                Verify Your Email
              </h2>
              <p className="text-body" style={{ fontSize: 12.5 }}>
                Step 1 of 2: We sent a 6-digit verification code to <strong>{email}</strong>
              </p>
            </div>

            {/* Dev mode auto-code banner */}
            {simulatedOtp?.email && (
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
                ✉️ Email Dev Code: <strong>{simulatedOtp.email}</strong>
              </div>
            )}

            <form onSubmit={handleVerifyEmailOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: '#1D1D1F', marginBottom: 6 }}>
                  Enter 6-Digit Email Code
                </label>
                <input
                  type="text"
                  required
                  value={emailOtpCode}
                  onChange={(e) => setEmailOtpCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  placeholder="• • • • • •"
                  maxLength={6}
                  className="apple-input"
                  style={{ textAlign: 'center', fontSize: 22, letterSpacing: 8, fontWeight: 700 }}
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || emailOtpCode.length < 6}
                className="apple-btn-primary"
                style={{
                  padding: 12,
                  width: '100%',
                  fontSize: 14.5,
                  opacity: emailOtpCode.length < 6 ? 0.6 : 1
                }}
              >
                {isLoading ? 'Verifying Email...' : 'Verify Email & Proceed to Phone →'}
              </button>
            </form>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, fontSize: 12, color: '#6E6E73' }}>
              <button
                type="button"
                onClick={() => setMode('signup')}
                style={{ background: 'none', border: 'none', color: '#3A3A6E', cursor: 'pointer', fontSize: 12 }}
              >
                ← Edit details
              </button>

              {cooldown > 0 ? (
                <span>Resend in {cooldown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={async () => {
                    const res = await sendOtp(email.trim().toLowerCase(), 'email');
                    if (res.simulatedCode) {
                      setSimulatedOtp((prev) => ({ ...prev, email: res.simulatedCode }));
                      setEmailOtpCode(res.simulatedCode);
                    }
                    setCooldown(res.cooldownSeconds || 60);
                    showToast('New verification code sent to your email', 'success');
                  }}
                  style={{ background: 'none', border: 'none', color: '#3A3A6E', fontWeight: 600, cursor: 'pointer', fontSize: 12 }}
                >
                  Resend Code
                </button>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODE 4: MANUAL PHONE VERIFICATION (STEP 2 - MANDATORY)    */}
        {/* ======================================================== */}
        {mode === 'manual_phone' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
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
                <Phone size={22} color="#2FA84F" />
              </div>
              <h2 className="text-h2" style={{ fontSize: 21, marginBottom: 4 }}>
                Verify Mobile Number
              </h2>
              <p className="text-body" style={{ fontSize: 12.5 }}>
                Step 2 of 2: Mobile number is mandatory for consultation audio appointments and reminders.
              </p>
            </div>

            {/* Email Verified Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 12px',
                backgroundColor: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: 12,
                marginBottom: 16
              }}
            >
              <CheckCircle2 size={16} color="#16A34A" />
              <span style={{ fontSize: 12.5, color: '#15803D', fontWeight: 500 }}>
                Email Verified: <strong>{email}</strong>
              </span>
            </div>

            <div id="recaptcha-container-manual"></div>

            <form onSubmit={handleCompleteManualRegistration} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 500, color: '#1D1D1F' }}>
                    Mobile Phone Number
                  </label>
                  {manualPhoneOtpSent && (
                    <button
                      type="button"
                      onClick={handleChangePhoneNumber}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#3A3A6E',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      ✎ Change Phone Number
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0 12px',
                      backgroundColor: '#F5F5F7',
                      borderRadius: 12,
                      fontSize: 13.5,
                      fontWeight: 600,
                      color: '#1D1D1F',
                      border: '1px solid #E5E5EA'
                    }}
                  >
                    +91
                  </div>
                  <input
                    type="tel"
                    required
                    disabled={manualPhoneOtpSent}
                    value={phone.replace('+91', '')}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="98765 43210"
                    maxLength={10}
                    className="apple-input"
                    style={{ flex: 1, opacity: manualPhoneOtpSent ? 0.75 : 1 }}
                    autoFocus
                  />
                  {!manualPhoneOtpSent && (
                    <button
                      type="button"
                      onClick={handleSendManualPhoneOtp}
                      disabled={isLoading || phone.replace(/[^0-9]/g, '').length < 10}
                      className="apple-btn-secondary"
                      style={{
                        padding: '0 14px',
                        fontSize: 13,
                        fontWeight: 600,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {isLoading ? 'Sending...' : 'Send OTP'}
                    </button>
                  )}
                </div>
              </div>

              {manualPhoneOtpSent && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label style={{ fontSize: 12.5, fontWeight: 500, color: '#1D1D1F' }}>
                      6-Digit SMS Verification Code
                    </label>
                    {cooldown > 0 ? (
                      <span style={{ fontSize: 11.5, color: '#6E6E73' }}>Resend in {cooldown}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendManualPhoneOtp}
                        style={{ background: 'none', border: 'none', color: '#3A3A6E', fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}
                      >
                        Resend SMS
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    value={phoneOtpCode}
                    onChange={(e) => setPhoneOtpCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                    placeholder="• • • • • •"
                    maxLength={6}
                    className="apple-input"
                    style={{ textAlign: 'center', fontSize: 22, letterSpacing: 8, fontWeight: 700 }}
                  />
                </div>
              )}

              {manualPhoneOtpSent ? (
                <button
                  type="submit"
                  disabled={isLoading || phoneOtpCode.length < 6}
                  className="apple-btn-primary"
                  style={{
                    padding: 12,
                    width: '100%',
                    fontSize: 14.5,
                    opacity: phoneOtpCode.length < 6 ? 0.6 : 1
                  }}
                >
                  {isLoading ? 'Activating Account...' : 'Complete Registration & Sign In'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSendManualPhoneOtp}
                  disabled={isLoading || phone.replace(/[^0-9]/g, '').length < 10}
                  className="apple-btn-primary"
                  style={{
                    padding: 12,
                    width: '100%',
                    fontSize: 14.5
                  }}
                >
                  {isLoading ? 'Sending SMS OTP...' : 'Send SMS Verification Code'}
                </button>
              )}
            </form>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODE 5: GOOGLE MANDATORY PHONE VERIFICATION              */}
        {/* ======================================================== */}
        {mode === 'google_phone_verify' && googleTempUser && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
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
                <ShieldCheck size={24} color="#3A3A6E" />
              </div>
              <h2 className="text-h2" style={{ fontSize: 21, marginBottom: 4 }}>
                Verify Phone Number
              </h2>
              <p className="text-body" style={{ fontSize: 12.5 }}>
                Final step: Link and verify your mobile number to complete registration.
              </p>
            </div>

            {/* Google Profile Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                backgroundColor: '#F5F5F7',
                borderRadius: 14,
                marginBottom: 16
              }}
            >
              {googleTempUser.photoURL ? (
                <img
                  src={googleTempUser.photoURL}
                  alt={googleTempUser.name}
                  style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    backgroundColor: '#3A3A6E',
                    color: '#FFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    fontSize: 14
                  }}
                >
                  {googleTempUser.name?.charAt(0) || 'G'}
                </div>
              )}
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1D1D1F' }}>
                  {googleTempUser.name}
                </div>
                <div style={{ fontSize: 11.5, color: '#6E6E73', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {googleTempUser.email}
                </div>
              </div>
              <span
                style={{
                  fontSize: 11,
                  backgroundColor: '#E8F5E9',
                  color: '#2E7D32',
                  padding: '4px 8px',
                  borderRadius: 6,
                  fontWeight: 600
                }}
              >
                Google ✓
              </span>
            </div>

            <div id="recaptcha-container-google"></div>

            <form onSubmit={handleVerifyGooglePhone} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 500, color: '#1D1D1F' }}>
                    Mobile Phone Number
                  </label>
                  {googlePhoneOtpSent && (
                    <button
                      type="button"
                      onClick={handleChangePhoneNumber}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#3A3A6E',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      ✎ Change Phone Number
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0 12px',
                      backgroundColor: '#F5F5F7',
                      borderRadius: 12,
                      fontSize: 13.5,
                      fontWeight: 600,
                      color: '#1D1D1F',
                      border: '1px solid #E5E5EA'
                    }}
                  >
                    +91
                  </div>
                  <input
                    type="tel"
                    required
                    disabled={googlePhoneOtpSent}
                    value={phone.replace('+91', '')}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="98765 43210"
                    maxLength={10}
                    className="apple-input"
                    style={{ flex: 1, opacity: googlePhoneOtpSent ? 0.75 : 1 }}
                    autoFocus
                  />
                  {!googlePhoneOtpSent && (
                    <button
                      type="button"
                      onClick={handleSendGooglePhoneOtp}
                      disabled={isLoading || phone.replace(/[^0-9]/g, '').length < 10}
                      className="apple-btn-secondary"
                      style={{
                        padding: '0 14px',
                        fontSize: 13,
                        fontWeight: 600,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {isLoading ? 'Sending...' : 'Send OTP'}
                    </button>
                  )}
                </div>
              </div>

              {googlePhoneOtpSent && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label style={{ fontSize: 12.5, fontWeight: 500, color: '#1D1D1F' }}>
                      6-Digit SMS Verification Code
                    </label>
                    {cooldown > 0 ? (
                      <span style={{ fontSize: 11.5, color: '#6E6E73' }}>Resend in {cooldown}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendGooglePhoneOtp}
                        style={{ background: 'none', border: 'none', color: '#3A3A6E', fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}
                      >
                        Resend SMS
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    value={phoneOtpCode}
                    onChange={(e) => setPhoneOtpCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                    placeholder="• • • • • •"
                    maxLength={6}
                    className="apple-input"
                    style={{ textAlign: 'center', fontSize: 22, letterSpacing: 8, fontWeight: 700 }}
                  />
                </div>
              )}

              {googlePhoneOtpSent ? (
                <button
                  type="submit"
                  disabled={isLoading || phoneOtpCode.length < 6}
                  className="apple-btn-primary"
                  style={{
                    padding: 12,
                    width: '100%',
                    fontSize: 14.5,
                    opacity: phoneOtpCode.length < 6 ? 0.6 : 1
                  }}
                >
                  {isLoading ? 'Verifying & Activating...' : 'Verify Phone & Complete Registration'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSendGooglePhoneOtp}
                  disabled={isLoading || phone.replace(/[^0-9]/g, '').length < 10}
                  className="apple-btn-primary"
                  style={{
                    padding: 12,
                    width: '100%',
                    fontSize: 14.5
                  }}
                >
                  {isLoading ? 'Sending SMS OTP...' : 'Send SMS Verification Code'}
                </button>
              )}
            </form>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODE 6: PROGRESSIVE BIRTH PROFILE SETUP                  */}
        {/* ======================================================== */}
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
