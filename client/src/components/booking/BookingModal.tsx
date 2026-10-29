import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  User as UserIcon,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ChevronRight,
  Plus,
  Crown,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { apiRequest } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useCountry } from '../../context/CountryContext';
import { CityAutocompleteInput } from '../common/CityAutocompleteInput';
import { CountryCodeSelector } from '../common/CountryCodeSelector';
import { getCountryDialInfo } from '../../utils/countryCodes';
import { buildBookingWhatsAppMessage, WHATSAPP_PHONE_NUMBER } from '../../utils/whatsapp';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedPackageId?: string;
  onNavigateToApp?: () => void;
  onOpenAuth?: () => void;
  initialStep?: number;
}

const DEFAULT_PACKAGES = [
  { id: 'pkg-quick', slug: 'quick-consult', name: 'Quick Consult', duration_minutes: 15, followupDays: 0, is_popular: 0, is_trial: 0, price: 1100 },
  { id: 'pkg-standard', slug: 'standard', name: 'Standard Consult', duration_minutes: 30, followupDays: 3, is_popular: 0, is_trial: 0, price: 2100 },
  { id: 'pkg-premium', slug: 'premium', name: 'Premium Deep Consult', duration_minutes: 60, followupDays: 7, is_popular: 1, is_trial: 0, price: 5100 },
  { id: 'pkg-family-360', slug: 'family-360', name: 'Family 360 Plan', duration_minutes: 60, followupDays: 365, is_popular: 0, is_trial: 0, price: 100000 }
];

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  preselectedPackageId,
  onNavigateToApp,
  onOpenAuth,
  initialStep = 1
}) => {
  const { user, profiles, addProfile, isAuthenticated } = useAuth();
  const { showToast } = useNotification();
  const { country, countryInfo } = useCountry();

  const getPackageFormattedPrice = (pkg: any) => {
    if (!pkg) return '';
    if (user?.isFamilySubscriber) return 'Included (₹0 / $0)';
    if (pkg.id === 'pkg-family-360') return countryInfo.prices.family?.formatted || '₹1,00,000 / yr';
    if (pkg.id === 'pkg-quick') return countryInfo.prices.quick.formatted;
    if (pkg.id === 'pkg-standard') return countryInfo.prices.standard.formatted;
    if (pkg.id === 'pkg-premium') return countryInfo.prices.premium.formatted;
    return `${countryInfo.currencySymbol}${pkg.price}`;
  };

  const getPackageAmount = (pkg: any) => {
    if (!pkg) return 0;
    if (user?.isFamilySubscriber) return 0;
    if (pkg.id === 'pkg-family-360') return countryInfo.prices.family?.amount || 100000;
    if (pkg.id === 'pkg-quick') return countryInfo.prices.quick.amount;
    if (pkg.id === 'pkg-standard') return countryInfo.prices.standard.amount;
    if (pkg.id === 'pkg-premium') return countryInfo.prices.premium.amount;
    return pkg.price;
  };

  const defaultDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  })();

  const [step, setStep] = useState<'details' | 'payment' | 'success'>('details');
  const [wizardStep, setWizardStep] = useState<number>(initialStep || 1);
  const [packages, setPackages] = useState<any[]>(DEFAULT_PACKAGES);
  const [selectedPkgId, setSelectedPkgId] = useState<string>(preselectedPackageId || 'pkg-premium');
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(defaultDate);
  const [selectedWindow, setSelectedWindow] = useState<string>('11:00 AM - 01:00 PM');
  const [customerNotes, setCustomerNotes] = useState<string>('');
  const [userTimezone, setUserTimezone] = useState<string>('Asia/Kolkata');
  const [blackoutDates, setBlackoutDates] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [createdAppt, setCreatedAppt] = useState<any>(null);

  // Authenticated inline add-profile form
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [newProfile, setNewProfile] = useState({ fullName: '', dob: '', tob: '12:00', pob: '', relation: 'self', tobUncertain: false });
  const [addingProfile, setAddingProfile] = useState(false);

  // Unauthenticated / Guest profile state
  const [guestProfile, setGuestProfile] = useState({
    fullName: '',
    phone: '',
    dob: '',
    tob: '12:00',
    pob: '',
    tobUncertain: false
  });
  const [guestPhoneCode, setGuestPhoneCode] = useState(() => getCountryDialInfo(country).dialCode);
  const [isGuestProfileExpanded, setIsGuestProfileExpanded] = useState(false);

  // Payment proof form
  const [utr, setUtr] = useState('');
  const [paymentConfig, setPaymentConfig] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Computed step number across wizard details (1-3) and payment (4)
  const currentStepNumber = step === 'payment' ? 4 : wizardStep;

  // Auto-scroll to top smoothly whenever step advances or changes
  useEffect(() => {
    if (scrollRef.current) {
      if (typeof scrollRef.current.scrollTo === 'function') {
        scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        scrollRef.current.scrollTop = 0;
      }
    }
  }, [wizardStep, step]);

  // Sync dial code if country changes
  useEffect(() => {
    if (!guestProfile.phone) {
      setGuestPhoneCode(getCountryDialInfo(country).dialCode);
    }
  }, [country]);

  useEffect(() => {
    if (isOpen) {
      // Reset state
      setStep('details');
      setWizardStep(initialStep || 1);
      setUtr('');
      setCreatedAppt(null);
      setShowAddProfile(false);

      // Detect browser timezone
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        setUserTimezone(tz || 'Asia/Kolkata');
      } catch {
        setUserTimezone('Asia/Kolkata');
      }

      // Fetch packages & availability
      apiRequest<{ packages: any[] }>('/packages')
        .then((res) => {
          let list = res.packages || [];
          // Ensure pkg-family-360 is always present in packages
          if (!list.some((p) => p.id === 'pkg-family-360')) {
            const familyPkg = DEFAULT_PACKAGES.find((p) => p.id === 'pkg-family-360');
            if (familyPkg) list.push(familyPkg);
          }
          setPackages(list);
          if (preselectedPackageId) {
            setSelectedPkgId(preselectedPackageId);
          }
        })
        .catch(() => {
          setPackages(DEFAULT_PACKAGES);
        });

      apiRequest<{ blackoutDates: string[] }>('/availability')
        .then((res) => setBlackoutDates(res.blackoutDates || []))
        .catch(() => {});

      apiRequest('/payments/config')
        .then((res) => setPaymentConfig(res))
        .catch(() => {});
    }
  }, [isOpen, preselectedPackageId]);

  // Auto-select first profile when profiles become available
  useEffect(() => {
    if (profiles && profiles.length > 0 && !selectedProfileId) {
      setSelectedProfileId(profiles[0].id);
    }
  }, [profiles, selectedProfileId]);

  if (!isOpen) return null;

  // Safe-guard: currentPkg with fallback
  const currentPkg = packages.find((p) => p.id === selectedPkgId) || packages.find((p) => !p.is_trial) || packages[0];

  const timeWindows = [
    { label: '09:00 AM - 11:00 AM (Morning IST)', value: '09:00 AM - 11:00 AM' },
    { label: '11:00 AM - 01:00 PM (Midday IST)', value: '11:00 AM - 01:00 PM' },
    { label: '02:00 PM - 04:00 PM (Afternoon IST)', value: '02:00 PM - 04:00 PM' },
    { label: '04:00 PM - 05:00 PM (Late Afternoon IST)', value: '04:00 PM - 05:00 PM' },
    { label: '08:00 PM - 10:00 PM (Evening IST)', value: '08:00 PM - 10:00 PM' },
    { label: '10:00 PM - 12:00 AM (Night IST)', value: '10:00 PM - 12:00 AM' }
  ];

  const todayStr = new Date().toISOString().split('T')[0];
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 42);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  // Handler for clicking "+ Add another family member"
  const handleAddFamilyMemberClick = () => {
    if (selectedPkgId !== 'pkg-family-360') {
      setSelectedPkgId('pkg-family-360');
      showToast('Switched package to Family 360 Plan to add family members', 'info');
    }
    setShowAddProfile(true);
    setNewProfile((prev) => ({
      ...prev,
      relation: prev.relation === 'self' ? 'spouse' : prev.relation
    }));
  };

  const handleAddInlineProfile = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newProfile.fullName || !newProfile.dob || !newProfile.pob) {
      showToast('Please fill in name, date of birth, and place of birth', 'error');
      return;
    }

    // Adding non-self requires Family 360
    if (newProfile.relation !== 'self' && selectedPkgId !== 'pkg-family-360' && !user?.isFamilySubscriber && user?.role !== 'admin') {
      setSelectedPkgId('pkg-family-360');
      showToast('Switched to Family 360 Plan to add family member', 'info');
    }

    setAddingProfile(true);
    try {
      const created = await addProfile(newProfile);
      setSelectedProfileId(created.id);
      setShowAddProfile(false);
      setNewProfile({ fullName: '', dob: '', tob: '12:00', pob: '', relation: 'self', tobUncertain: false });
      showToast('Birth profile saved!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to save profile', 'error');
    } finally {
      setAddingProfile(false);
    }
  };

  // WhatsApp redirection with step-aware dynamic details
  const handleConsultOnWhatsApp = () => {
    const profile = isAuthenticated ? profiles.find((p) => p.id === selectedProfileId) : null;
    const formattedPrice = currentPkg ? getPackageFormattedPrice(currentPkg) : undefined;

    const message = buildBookingWhatsAppMessage({
      step,
      wizardStep,
      currentPkg,
      formattedPrice,
      user,
      profile,
      guestProfile: {
        ...guestProfile,
        phone: guestProfile.phone?.trim() ? `${guestPhoneCode} ${guestProfile.phone.trim()}` : ''
      },
      newProfile,
      showAddProfile,
      selectedDate,
      selectedWindow,
      customerNotes,
      utr,
      createdApptId: createdAppt?.id
    });

    // Use api.whatsapp.com/send directly to avoid wa.me 302 redirect which corrupts 4-byte UTF-8 emojis (like 🙏 and 📋)
    const waUrl = `https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE_NUMBER}&text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleNextToStep2 = () => {
    if (!currentPkg) {
      showToast('Please select a consultation package to proceed', 'warning');
      return;
    }
    setWizardStep(2);
  };

  const handleNextToStep3 = () => {
    if (isAuthenticated) {
      if (!selectedProfileId && (!profiles || profiles.length === 0)) {
        showToast('Please add or select a birth profile for chart analysis', 'warning');
        setShowAddProfile(true);
        return;
      }
      setWizardStep(3);
      return;
    }

    if (!guestProfile.fullName.trim() || !guestProfile.dob || !guestProfile.pob.trim()) {
      setIsGuestProfileExpanded(true);
      if (!guestProfile.fullName.trim()) {
        showToast('Please enter your full name as per Kundli / birth record', 'warning');
      } else if (!guestProfile.dob) {
        showToast('Please select your date of birth', 'warning');
      } else {
        showToast('Please enter your place of birth (city, state, country)', 'warning');
      }
      return;
    }
    setWizardStep(3);
  };

  const handlePrevStep = () => {
    if (step === 'payment') {
      setStep('details');
      setWizardStep(3);
    } else if (wizardStep > 1) {
      setWizardStep((prev) => prev - 1);
    }
  };

  const renderWhatsAppButton = () => (
    <button
      type="button"
      aria-label="Consult on WhatsApp (+91 9983353533)"
      onClick={handleConsultOnWhatsApp}
      style={{
        padding: '13px 18px',
        fontSize: 14.5,
        fontWeight: 600,
        width: '100%',
        backgroundColor: '#25D366',
        color: '#FFFFFF',
        border: 'none',
        borderRadius: 14,
        boxShadow: '0 4px 14px rgba(37, 211, 102, 0.28)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 9,
        transition: 'all 0.15s ease'
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#20BA5A')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#25D366')}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.63C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.04 20.15C10.56 20.15 9.11 19.76 7.85 19.01L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.8 7.37 7.5 3.67 12.04 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15ZM16.56 14.41C16.31 14.29 15.09 13.69 14.86 13.61C14.64 13.52 14.47 13.48 14.31 13.73C14.14 13.97 13.67 14.53 13.52 14.7C13.38 14.86 13.23 14.88 12.98 14.76C12.74 14.64 11.94 14.37 11 13.53C10.26 12.88 9.77 12.07 9.62 11.82C9.48 11.58 9.61 11.44 9.73 11.32C9.84 11.21 9.98 11.03 10.1 10.89C10.22 10.74 10.27 10.64 10.35 10.48C10.43 10.31 10.39 10.17 10.33 10.05C10.27 9.92 9.77 8.7 9.57 8.2C9.37 7.72 9.16 7.78 9.01 7.77C8.87 7.77 8.7 7.76 8.54 7.76C8.37 7.76 8.11 7.82 7.88 8.07C7.65 8.32 7.02 8.91 7.02 10.13C7.02 11.34 7.9 12.51 8.03 12.67C8.15 12.84 9.77 15.34 12.24 16.41C12.83 16.66 13.29 16.82 13.64 16.93C14.23 17.12 14.77 17.09 15.2 17.03C15.67 16.96 16.66 16.43 16.86 15.86C17.07 15.28 17.07 14.79 17.01 14.69C16.95 14.58 16.8 14.52 16.56 14.41Z"
        fill="currentColor"
      />
    </svg>
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        columnGap: 6,
        rowGap: 2,
        textAlign: 'center'
      }}
    >
      <span style={{ whiteSpace: 'nowrap' }}>Consult on WhatsApp</span>
      <span style={{ whiteSpace: 'nowrap' }}> (+91 9983353533)</span>
    </div>
  </button>
  );

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPkg) {
      showToast('Please select a consultation package', 'error');
      return;
    }

    if (blackoutDates.includes(selectedDate)) {
      showToast('Amit is unavailable on this selected date. Please choose another date.', 'warning');
      return;
    }

    let payload: any = {
      packageId: selectedPkgId,
      consultationType: 'call',
      requestedDate: selectedDate,
      requestedTimeWindow: selectedWindow,
      timezoneUser: userTimezone,
      customerNotes
    };

    if (isAuthenticated) {
      if (!selectedProfileId) {
        showToast('Please add or select a birth profile for chart analysis', 'error');
        setWizardStep(2);
        setShowAddProfile(true);
        return;
      }
      payload.birthProfileId = selectedProfileId;
    } else {
      // Guest booking validation
      if (!guestProfile.fullName.trim() || !guestProfile.dob) {
        setWizardStep(2);
        setIsGuestProfileExpanded(true);
        showToast('Please fill in your name and date of birth in your birth profile', 'error');
        return;
      }
      payload.guestProfile = {
        fullName: guestProfile.fullName.trim(),
        phone: guestProfile.phone?.trim() ? `${guestPhoneCode} ${guestProfile.phone.trim()}` : undefined,
        dob: guestProfile.dob,
        tob: guestProfile.tobUncertain ? '12:00' : guestProfile.tob,
        tobUncertain: guestProfile.tobUncertain,
        pob: guestProfile.pob.trim() || 'India'
      };
    }

    setIsLoading(true);
    try {
      let res: any;
      try {
        res = await apiRequest<{ appointment: any }>('/appointments', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      } catch (err: any) {
        // Resilient fallback: if backend requires an auth token (e.g. legacy endpoint instance before redeploy)
        if (err.message && err.message.toLowerCase().includes('authentication token required')) {
          const guestEmail = `guest_${Date.now()}_${Math.floor(Math.random() * 10000)}@amitastro.internal`;
          const guestPhone = guestProfile.phone?.trim()
            ? `${guestPhoneCode} ${guestProfile.phone.trim()}`
            : `+91${Math.floor(6000000000 + Math.random() * 3999999999)}`;

          const authRes = await apiRequest<{ token: string; user: any }>('/auth/google', {
            method: 'POST',
            body: JSON.stringify({
              email: guestEmail,
              name: guestProfile.fullName?.trim() || 'Consultation Client',
              phone: guestPhone
            })
          });

          if (authRes?.token) {
            localStorage.setItem('amitastro_token', authRes.token);

            // Create birth profile on the authenticated session
            try {
              const profRes = await apiRequest<{ profile: any }>('/profiles', {
                method: 'POST',
                headers: { Authorization: `Bearer ${authRes.token}` },
                body: JSON.stringify({
                  fullName: guestProfile.fullName?.trim() || 'Consultation Client',
                  dob: guestProfile.dob || '2000-01-01',
                  tob: guestProfile.tobUncertain ? '12:00' : guestProfile.tob || '12:00',
                  tobUncertain: guestProfile.tobUncertain ? 1 : 0,
                  pob: guestProfile.pob?.trim() || 'India',
                  relation: 'self'
                })
              });

              if (profRes?.profile?.id) {
                payload.birthProfileId = profRes.profile.id;
              }
            } catch {
              // Proceed with payload as is
            }

            // Retry appointment creation with provisioned token
            res = await apiRequest<{ appointment: any }>('/appointments', {
              method: 'POST',
              headers: { Authorization: `Bearer ${authRes.token}` },
              body: JSON.stringify(payload)
            });
          } else {
            throw err;
          }
        } else {
          throw err;
        }
      }

      setCreatedAppt(res.appointment);
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });

      // Family 360 members get consultations 100% complimentary ($0) & auto-confirmed
      if (currentPkg && currentPkg.price > 0 && !user?.isFamilySubscriber) {
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
    if (!utr || utr.length < 6) {
      showToast('Please enter the UTR reference number from your UPI app', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await apiRequest('/payments/proof', {
        method: 'POST',
        body: JSON.stringify({
          appointmentId: createdAppt.id,
          utrReference: utr,
          amount: getPackageAmount(currentPkg),
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
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px 12px',
        overflowY: 'auto'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={scrollRef}
        className="apple-card"
        style={{
          width: '100%',
          maxWidth: 630,
          backgroundColor: '#FFFFFF',
          borderRadius: 24,
          padding: '28px 24px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.16)',
          position: 'relative',
          maxHeight: '92vh',
          overflowY: 'auto'
        }}
      >
        {/* Top Header Bar: Back Button (left), Centered Badge, Close Button (right) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, minHeight: 34 }}>
          <div style={{ width: 34 }}>
            {currentStepNumber > 1 && step !== 'success' && (
              <button
                type="button"
                onClick={handlePrevStep}
                aria-label="Go to previous step"
                style={{
                  background: '#F5F5F7',
                  border: 'none',
                  borderRadius: '50%',
                  width: 34,
                  height: 34,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#1D1D1F',
                  transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#E5E5EA')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#F5F5F7')}
              >
                <ArrowLeft size={17} />
              </button>
            )}
          </div>

          <span className="apple-badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <Sparkles size={12} /> Vedic Consultation Booking
          </span>

          <div style={{ width: 34, display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close booking modal"
              style={{
                background: '#F5F5F7',
                border: 'none',
                borderRadius: '50%',
                width: 34,
                height: 34,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#6E6E73',
                transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#E5E5EA')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#F5F5F7')}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Apple-style Segmented Progress Bar */}
        {step !== 'success' && (
          <div style={{ marginBottom: 20 }}>
            <div
              role="tablist"
              aria-label="Booking steps"
              style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 10 }}
            >
              {[
                { step: 1, label: 'Package' },
                { step: 2, label: 'Profile' },
                { step: 3, label: 'Schedule' },
                { step: 4, label: 'Payment' }
              ].map((s) => {
                const isDone = currentStepNumber > s.step;
                const isCurrent = currentStepNumber === s.step;
                const canClick = s.step < currentStepNumber;

                return (
                  <button
                    key={s.step}
                    type="button"
                    role="tab"
                    aria-selected={isCurrent}
                    aria-label={`Step ${s.step}: ${s.label}`}
                    disabled={!canClick}
                    onClick={() => {
                      if (canClick) {
                        if (step === 'payment') setStep('details');
                        setWizardStep(s.step);
                      }
                    }}
                    style={{
                      flex: 1,
                      height: 5,
                      padding: 0,
                      border: 'none',
                      borderRadius: 9999,
                      backgroundColor: isCurrent ? '#3A3A6E' : isDone ? '#505080' : '#E5E5EA',
                      cursor: canClick ? 'pointer' : 'default',
                      outline: 'none',
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                    title={canClick ? `Return to Step ${s.step}: ${s.label}` : `Step ${s.step}: ${s.label}`}
                  />
                );
              })}
            </div>

            {/* Step Subheader & Current Package Status */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                flexWrap: 'wrap',
                minHeight: 22
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#3A3A6E',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    whiteSpace: 'nowrap'
                  }}
                >
                  Step {currentStepNumber} of 4
                </span>
                <span style={{ color: '#C7C7CC', fontSize: 12 }}>•</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1D1D1F', whiteSpace: 'nowrap' }}>
                  {currentStepNumber === 1 && 'Select Package'}
                  {currentStepNumber === 2 && 'Birth Profile'}
                  {currentStepNumber === 3 && 'Schedule & Questions'}
                  {currentStepNumber === 4 && 'Payment Verification'}
                </span>
              </div>

              {/* Only show selected package badge on subsequent steps (2 & 3) */}
              {currentPkg && currentStepNumber > 1 && currentStepNumber < 4 && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: 'rgba(58, 58, 110, 0.06)',
                    border: '1px solid rgba(58, 58, 110, 0.12)',
                    padding: '3px 10px',
                    borderRadius: 9999,
                    fontSize: 11.5,
                    color: '#3A3A6E'
                  }}
                >
                  <span style={{ fontWeight: 600, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {currentPkg.name}
                  </span>
                  <span style={{ color: '#86868B' }}>•</span>
                  <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {getPackageFormattedPrice(currentPkg)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 1: SELECT CONSULTATION PACKAGE */}
        {step === 'details' && wizardStep === 1 && (
          <div className="fade-in">
            <div style={{ marginBottom: 16 }}>
              <h2 className="text-h2" style={{ fontSize: 22, marginTop: 0, marginBottom: 4 }}>
                Select Consultation Package
              </h2>
              <p className="text-body" style={{ fontSize: 13, color: '#6E6E73' }}>
                Detected timezone: <strong>{userTimezone}</strong> (Internal schedule managed in IST).
              </p>
            </div>

            {user?.isFamilySubscriber && (
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(201, 162, 75, 0.14), rgba(201, 162, 75, 0.04))',
                  border: '1.5px solid rgba(201, 162, 75, 0.4)',
                  borderRadius: 14,
                  padding: '12px 16px',
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    backgroundColor: '#C9A24B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFF',
                    flexShrink: 0
                  }}
                >
                  <Crown size={18} />
                </div>
                <div style={{ fontSize: 13, color: '#1D1D1F' }}>
                  <strong>Family 360 Plan Active:</strong> Consultations for you and your family are <strong>100% complimentary ($0 / ₹0)</strong> with instant auto-confirmation under your annual subscription.
                </div>
              </div>
            )}

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#1D1D1F' }}>
                  Choose a Consultation Package
                </label>
                <span style={{ fontSize: 11.5, color: '#86868B' }}>4 consultation options</span>
              </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(125px, 1fr))',
                    gap: 10
                  }}
                >
                  {packages
                    .filter((pkg) => !pkg.is_trial)
                    .map((pkg) => {
                      const isSelected = selectedPkgId === pkg.id;
                      const isFamily = pkg.id === 'pkg-family-360';
                      return (
                        <div
                          key={pkg.id}
                          onClick={() => setSelectedPkgId(pkg.id)}
                          style={{
                            border: isSelected ? '2px solid #3A3A6E' : '1px solid #E5E5EA',
                            borderRadius: 14,
                            padding: '12px 10px',
                            cursor: 'pointer',
                            backgroundColor: isSelected ? 'rgba(58, 58, 110, 0.05)' : '#FFFFFF',
                            transition: 'all 0.15s ease',
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            minHeight: 108
                          }}
                        >
                          {pkg.is_popular ? (
                            <div
                              style={{
                                position: 'absolute',
                                top: -8,
                                right: 6,
                                backgroundColor: '#C9A24B',
                                color: '#FFFFFF',
                                fontSize: 8.5,
                                fontWeight: 700,
                                padding: '2px 6px',
                                borderRadius: 9999,
                                textTransform: 'uppercase',
                                letterSpacing: 0.3
                              }}
                            >
                              Most Popular
                            </div>
                          ) : isFamily ? (
                            <div
                              style={{
                                position: 'absolute',
                                top: -8,
                                right: 6,
                                backgroundColor: '#1D1D1F',
                                color: '#C9A24B',
                                fontSize: 8.5,
                                fontWeight: 700,
                                padding: '2px 6px',
                                borderRadius: 9999,
                                textTransform: 'uppercase',
                                letterSpacing: 0.3,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 3
                              }}
                            >
                              <Crown size={9} /> VIP Annual
                            </div>
                          ) : null}

                          <div>
                            <div style={{ fontWeight: 600, fontSize: 12.5, color: '#1D1D1F', lineHeight: 1.25 }}>
                              {pkg.name}
                            </div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: '#3A3A6E', margin: '4px 0 2px', whiteSpace: 'nowrap' }}>
                              {getPackageFormattedPrice(pkg)}
                            </div>
                          </div>

                          <div>
                            <div style={{ fontSize: 11, color: '#6E6E73' }}>
                              {isFamily ? '1-Year Unlimited' : `${pkg.duration_minutes} Min`}
                            </div>
                            {pkg.followupDays > 0 && (
                              <div style={{ fontSize: 9.5, color: '#2FA84F', marginTop: 2, fontWeight: 500 }}>
                                + {pkg.followupDays === 365 ? '365-day' : `${pkg.followupDays}-day`} follow-up chat
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Step 1 Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 22 }}>
                <button
                  type="button"
                  onClick={handleNextToStep2}
                  className="apple-btn-primary"
                  style={{
                    padding: '14px',
                    fontSize: 15,
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    borderRadius: 14
                  }}
                >
                  <span>Continue to Birth Profile</span>
                  <ChevronRight size={18} />
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '2px 0' }}>
                  <div style={{ flex: 1, height: 1, backgroundColor: '#E5E5EA' }} />
                  <span style={{ fontSize: 11.5, color: '#86868B', textTransform: 'uppercase', letterSpacing: 0.5 }}>or</span>
                  <div style={{ flex: 1, height: 1, backgroundColor: '#E5E5EA' }} />
                </div>

                {renderWhatsAppButton()}
              </div>
            </div>
          )}

          {/* STEP 2: BIRTH PROFILE DETAILS */}
          {step === 'details' && wizardStep === 2 && (
            <div className="fade-in">
              <div style={{ marginBottom: 16 }}>
                <h2 className="text-h2" style={{ fontSize: 22, marginTop: 0, marginBottom: 4 }}>
                  Birth Profile Details
                </h2>
                <p className="text-body" style={{ fontSize: 13, color: '#6E6E73' }}>
                  Provide exact birth details for Vedic planetary calculation and horoscope analysis.
                </p>
              </div>

              {/* BIRTH PROFILE SELECTION / ENTRY */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1D1D1F', marginBottom: 8 }}>
                  Select or Enter Birth Details
                </label>

                {/* Case A: User is Logged In */}
                {isAuthenticated ? (
                  profiles && profiles.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <select
                        value={selectedProfileId}
                        onChange={(e) => setSelectedProfileId(e.target.value)}
                        className="apple-input"
                        style={{ fontSize: 13.5 }}
                      >
                        {profiles.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.full_name} ({p.relation.toUpperCase()}) — Born {p.dob} in {p.pob}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={handleAddFamilyMemberClick}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#3A3A6E',
                          fontSize: 12.5,
                          fontWeight: 600,
                          cursor: 'pointer',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '2px 0'
                        }}
                      >
                        <Plus size={14} /> + Add another family member
                      </button>

                      {/* Warning notice if on non-family pack and trying to view family profiles */}
                      {selectedPkgId !== 'pkg-family-360' && !user?.isFamilySubscriber && (
                        <div style={{ fontSize: 11.5, color: '#86868B', marginTop: 2 }}>
                          Note: Adding or analyzing additional family members switches to the Family 360 Plan.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div
                        style={{
                          padding: '10px 14px',
                          backgroundColor: '#FFF3CD',
                          borderRadius: 12,
                          fontSize: 13,
                          color: '#856404',
                          marginBottom: 10,
                          border: '1px solid #FFD60A'
                        }}
                      >
                        ⚠️ No birth profiles saved yet. Add one below to proceed with booking.
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAddProfile(true)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          background: 'none',
                          border: '1.5px dashed #3A3A6E',
                          borderRadius: 12,
                          padding: '10px 14px',
                          color: '#3A3A6E',
                          fontWeight: 600,
                          fontSize: 13,
                          cursor: 'pointer',
                          width: '100%',
                          justifyContent: 'center'
                        }}
                      >
                        <Plus size={15} /> Add Birth Profile
                      </button>
                    </div>
                  )
                ) : (
                  /* Case B: User is NOT Logged In (Guest Experience) */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {/* Apple-style clean notice banner that they are not signed in */}
                    <div
                      style={{
                        padding: '11px 14px',
                        backgroundColor: '#F8F8FA',
                        borderRadius: 14,
                        border: '1px solid #E8E8ED',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 8,
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #E5E5EA',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#3A3A6E',
                            flexShrink: 0,
                            boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                          }}
                        >
                          <UserIcon size={15} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 600, color: '#1D1D1F', lineHeight: 1.25 }}>
                            You are currently not signed in
                          </div>
                          <div style={{ fontSize: 11, color: '#86868B', lineHeight: 1.3, marginTop: 2 }}>
                            Sign in to access your saved birth profiles, or enter your birth details below.
                          </div>
                        </div>
                      </div>
                      {onOpenAuth && (
                        <button
                          type="button"
                          onClick={onOpenAuth}
                          style={{
                            background: '#FFFFFF',
                            color: '#3A3A6E',
                            border: '1px solid #D1D1D6',
                            borderRadius: 20,
                            padding: '6px 13px',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#F2F2F7';
                            e.currentTarget.style.borderColor = '#3A3A6E';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#FFFFFF';
                            e.currentTarget.style.borderColor = '#D1D1D6';
                          }}
                        >
                          Sign In / Sign Up
                        </button>
                      )}
                    </div>

                    {/* Expandable "Add your birth profile" Card / Selector */}
                    <div
                      onClick={() => setIsGuestProfileExpanded(!isGuestProfileExpanded)}
                      style={{
                        border: isGuestProfileExpanded ? '2px solid #3A3A6E' : '1px solid #D1D1D6',
                        borderRadius: 14,
                        padding: '12px 14px',
                        backgroundColor: '#FFFFFF',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 9,
                            backgroundColor: 'rgba(58, 58, 110, 0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#3A3A6E',
                            flexShrink: 0
                          }}
                        >
                          <UserIcon size={16} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: 13.5, fontWeight: 600, color: '#1D1D1F', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {guestProfile.fullName
                              ? `${guestProfile.fullName} ${guestProfile.dob ? `(Born ${guestProfile.dob})` : ''}`
                              : 'Add your birth profile'}
                          </span>
                          <span style={{ fontSize: 11.5, color: '#86868B', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {isGuestProfileExpanded
                              ? 'Fill birth details below'
                              : guestProfile.fullName
                              ? guestProfile.pob
                                ? `Birth Place: ${guestProfile.pob}`
                                : 'Click to expand / edit birth details'
                              : 'Click to enter birth details manually'}
                          </span>
                        </div>
                      </div>
                      <div style={{ color: '#6E6E73', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                        <span style={{ fontSize: 12, fontWeight: 500 }}>
                          {isGuestProfileExpanded ? 'Hide' : 'Enter Details'}
                        </span>
                        {isGuestProfileExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>

                    {/* Expanded Guest Birth Profile Inputs */}
                    {isGuestProfileExpanded && (
                      <div
                        style={{
                          padding: '16px',
                          backgroundColor: '#FAFAFC',
                          borderRadius: 16,
                          border: '1px solid #E5E5EA',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 12
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1D1D1F' }}>
                          Birth Profile Details for Horoscope Analysis
                        </div>

                        {/* Full Name */}
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 500, color: '#1D1D1F', display: 'block', marginBottom: 4 }}>
                            Full Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={guestProfile.fullName}
                            onChange={(e) => setGuestProfile((p) => ({ ...p, fullName: e.target.value }))}
                            placeholder="As per Kundli / Birth record"
                            className="apple-input"
                            style={{ fontSize: 13.5, padding: '9px 12px' }}
                          />
                        </div>

                        {/* Mobile Phone with Country Code Selector */}
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 500, color: '#1D1D1F', display: 'block', marginBottom: 4 }}>
                            Mobile Number (for Consultation Call & WhatsApp updates)
                          </label>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <CountryCodeSelector value={guestPhoneCode} onChange={setGuestPhoneCode} />
                            <input
                              type="tel"
                              value={guestProfile.phone}
                              onChange={(e) => setGuestProfile((p) => ({ ...p, phone: e.target.value }))}
                              placeholder="98765 43210"
                              className="apple-input"
                              style={{ fontSize: 13.5, padding: '9px 12px', flex: 1 }}
                            />
                          </div>
                        </div>

                        {/* Date & Time of Birth */}
                        <div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <div>
                              <label style={{ fontSize: 12, fontWeight: 500, color: '#1D1D1F', display: 'block', marginBottom: 4 }}>
                                Date of Birth *
                              </label>
                              <input
                                type="date"
                                required
                                value={guestProfile.dob}
                                onChange={(e) => setGuestProfile((p) => ({ ...p, dob: e.target.value }))}
                                className="apple-input"
                                style={{ fontSize: 13.5, padding: '9px 12px', width: '100%' }}
                              />
                            </div>

                            <div>
                              <label style={{ fontSize: 12, fontWeight: 500, color: '#1D1D1F', display: 'block', marginBottom: 4 }}>
                                Time of Birth
                              </label>
                              <input
                                type="time"
                                disabled={guestProfile.tobUncertain}
                                value={guestProfile.tob}
                                onChange={(e) => setGuestProfile((p) => ({ ...p, tob: e.target.value }))}
                                className="apple-input"
                                style={{ fontSize: 13.5, padding: '9px 12px', opacity: guestProfile.tobUncertain ? 0.5 : 1, width: '100%' }}
                              />
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                            <input
                              type="checkbox"
                              id="guestTobUncertain"
                              checked={guestProfile.tobUncertain}
                              onChange={(e) => setGuestProfile((p) => ({ ...p, tobUncertain: e.target.checked }))}
                              style={{ width: 14, height: 14, accentColor: '#3A3A6E', cursor: 'pointer' }}
                            />
                            <label htmlFor="guestTobUncertain" style={{ fontSize: 11.5, color: '#6E6E73', cursor: 'pointer', userSelect: 'none' }}>
                              Time of birth is approximate / uncertain
                            </label>
                          </div>
                        </div>

                        {/* Place of Birth with City Autocomplete */}
                        <div>
                          <CityAutocompleteInput
                            value={guestProfile.pob}
                            onChange={(val) => setGuestProfile((p) => ({ ...p, pob: val }))}
                            label="Place of Birth (City / Town / Country)"
                            placeholder="e.g. Jaipur, Rajasthan, India"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Inline Add Profile Section for Logged In Users */}
                {isAuthenticated && showAddProfile && (
                  <div
                    style={{
                      marginTop: 12,
                      padding: '16px 14px',
                      backgroundColor: '#F5F5F7',
                      borderRadius: 14,
                      border: '1px solid #E5E5EA',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: '#1D1D1F' }}>
                        {selectedPkgId === 'pkg-family-360' ? 'Add Family Member Profile (Family 360)' : 'Add Birth Profile'}
                      </span>
                      {selectedPkgId !== 'pkg-family-360' && !user?.isFamilySubscriber && (
                        <span style={{ fontSize: 11, color: '#C9A24B', fontWeight: 600 }}>
                          Family 360 Plan Required for Family Members
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div>
                        <label style={{ fontSize: 11, color: '#86868B', display: 'block', marginBottom: 3 }}>Relation</label>
                        <select
                          value={newProfile.relation}
                          onChange={(e) => {
                            const rel = e.target.value;
                            if (rel !== 'self' && selectedPkgId !== 'pkg-family-360' && !user?.isFamilySubscriber) {
                              setSelectedPkgId('pkg-family-360');
                              showToast('Switched to Family 360 Plan to add family members', 'info');
                            }
                            setNewProfile((p) => ({ ...p, relation: rel }));
                          }}
                          className="apple-input"
                          style={{ fontSize: 13, padding: '7px 10px' }}
                        >
                          <option value="self">Self</option>
                          <option value="spouse">Spouse (Family 360)</option>
                          <option value="child">Child (Family 360)</option>
                          <option value="parent">Parent (Family 360)</option>
                          <option value="sibling">Sibling (Family 360)</option>
                          <option value="other">Other (Family 360)</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: '#86868B', display: 'block', marginBottom: 3 }}>Full Name *</label>
                        <input
                          required
                          type="text"
                          value={newProfile.fullName}
                          onChange={(e) => setNewProfile((p) => ({ ...p, fullName: e.target.value }))}
                          className="apple-input"
                          style={{ fontSize: 13, padding: '7px 10px' }}
                          placeholder="As per Kundli"
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div>
                        <label style={{ fontSize: 11, color: '#86868B', display: 'block', marginBottom: 3 }}>Date of Birth *</label>
                        <input
                          required
                          type="date"
                          value={newProfile.dob}
                          onChange={(e) => setNewProfile((p) => ({ ...p, dob: e.target.value }))}
                          className="apple-input"
                          style={{ fontSize: 13, padding: '7px 10px' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: '#86868B', display: 'block', marginBottom: 3 }}>Time of Birth</label>
                        <input
                          type="time"
                          value={newProfile.tob}
                          onChange={(e) => setNewProfile((p) => ({ ...p, tob: e.target.value }))}
                          className="apple-input"
                          style={{ fontSize: 13, padding: '7px 10px' }}
                        />
                      </div>
                    </div>

                    <div style={{ marginTop: 2 }}>
                      <CityAutocompleteInput
                        required
                        value={newProfile.pob}
                        onChange={(val) => setNewProfile((p) => ({ ...p, pob: val }))}
                        label="Place of Birth (City / Town / Country)"
                        placeholder="e.g. Jaipur, Rajasthan, India"
                      />
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        onClick={handleAddInlineProfile}
                        disabled={addingProfile}
                        className="apple-btn-primary"
                        style={{ fontSize: 12.5, padding: '8px 14px', flex: 1 }}
                      >
                        {addingProfile ? 'Saving...' : 'Save Profile'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddProfile(false)}
                        className="apple-btn-secondary"
                        style={{ fontSize: 12.5, padding: '8px 12px' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2 Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 22 }}>
                <button
                  type="button"
                  onClick={handleNextToStep3}
                  className="apple-btn-primary"
                  style={{
                    padding: '14px',
                    fontSize: 15,
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    borderRadius: 14
                  }}
                >
                  <span>Continue to Schedule & Questions</span>
                  <ChevronRight size={18} />
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '2px 0' }}>
                  <div style={{ flex: 1, height: 1, backgroundColor: '#E5E5EA' }} />
                  <span style={{ fontSize: 11.5, color: '#86868B', textTransform: 'uppercase', letterSpacing: 0.5 }}>or</span>
                  <div style={{ flex: 1, height: 1, backgroundColor: '#E5E5EA' }} />
                </div>

                {renderWhatsAppButton()}
              </div>
            </div>
          )}

          {/* STEP 3: SCHEDULE & QUESTIONS */}
          {step === 'details' && wizardStep === 3 && (
            <form onSubmit={handleSubmitRequest} className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <h2 className="text-h2" style={{ fontSize: 22, marginTop: 0, marginBottom: 4 }}>
                  Choose Date & Time Window
                </h2>
                <p className="text-body" style={{ fontSize: 13, color: '#6E6E73' }}>
                  Select your preferred consultation slot and share questions or topics for Amit.
                </p>
              </div>

              {/* 3. DATE & PREFERRED TIME WINDOW */}
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
                      Amit is unavailable on this date.
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

              {/* 4. TOPICS OR QUESTIONS FOR DISCUSSION (Renumbered after consultation mode removal) */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1D1D1F', marginBottom: 6 }}>
                  4. Topics or Questions for Discussion
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

              {/* Selected package summary strip */}
              {currentPkg && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    backgroundColor: 'rgba(58, 58, 110, 0.04)',
                    borderRadius: 14,
                    border: '1px solid rgba(58, 58, 110, 0.12)',
                    gap: 12
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#1D1D1F', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {currentPkg.name}
                    </div>
                    <div style={{ fontSize: 12, color: '#6E6E73', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {currentPkg.id === 'pkg-family-360' ? '1-Year Unlimited' : `${currentPkg.duration_minutes} min`}
                      {currentPkg.followupDays > 0 ? ` · ${currentPkg.followupDays === 365 ? '365-day' : `${currentPkg.followupDays}-day`} follow-up chat included` : ''}
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 18, color: '#3A3A6E', flexShrink: 0, whiteSpace: 'nowrap', textAlign: 'right' }}>
                    {getPackageFormattedPrice(currentPkg)}
                  </div>
                </div>
              )}

              {/* Action Buttons: Proceed to Payment + Consult on WhatsApp */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                <button
                  type="submit"
                  disabled={isLoading || !currentPkg}
                  className="apple-btn-primary"
                  style={{ padding: '14px', fontSize: 15, width: '100%' }}
                >
                  {isLoading
                    ? 'Scheduling...'
                    : !currentPkg
                    ? 'Loading...'
                    : currentPkg.price === 0 || user?.isFamilySubscriber
                    ? 'Confirm Complimentary Consultation'
                    : `Proceed to Payment (${getPackageFormattedPrice(currentPkg)})`}
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '2px 0' }}>
                  <div style={{ flex: 1, height: 1, backgroundColor: '#E5E5EA' }} />
                  <span style={{ fontSize: 11.5, color: '#86868B', textTransform: 'uppercase', letterSpacing: 0.5 }}>or</span>
                  <div style={{ flex: 1, height: 1, backgroundColor: '#E5E5EA' }} />
                </div>

                {renderWhatsAppButton()}
              </div>
            </form>
          )}

        {/* STEP 4: MANUAL UPI PAYMENT */}
        {step === 'payment' && currentPkg && (
          <div className="fade-in">
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <span className="apple-badge-gold">Step 4 of 4: Manual UPI Verification</span>
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
              <div style={{ textAlign: 'center', flex: '0 0 140px', margin: '0 auto' }}>
                <img
                  src={
                    paymentConfig?.upi?.qrImage ||
                    `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=${paymentConfig?.upi?.vpa || 'amitastro@upi'}&pn=Amit%20Astro&am=${getPackageAmount(currentPkg)}`
                  }
                  alt="UPI QR Code"
                  style={{ width: 130, height: 130, borderRadius: 12, border: '1px solid #E5E5EA', backgroundColor: '#FFF' }}
                />
                <div style={{ fontSize: 11, color: '#6E6E73', marginTop: 4 }}>
                  Amount: <strong>{getPackageFormattedPrice(currentPkg)}</strong>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 200, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div>
                  <div style={{ color: '#86868B', fontSize: 11, textTransform: 'uppercase' }}>UPI ID (VPA)</div>
                  <strong style={{ color: '#1D1D1F', fontSize: 14 }}>{paymentConfig?.upi?.vpa || 'amitastro@upi'}</strong>
                </div>
                <div>
                  <div style={{ color: '#86868B', fontSize: 11, textTransform: 'uppercase' }}>Bank Account</div>
                  <div style={{ color: '#1D1D1F' }}>{paymentConfig?.bank?.bankName || 'HDFC Bank'}</div>
                  <div style={{ color: '#1D1D1F' }}>A/C: {paymentConfig?.bank?.accountNumber || '50100492817291'}</div>
                  <div style={{ color: '#1D1D1F' }}>IFSC: {paymentConfig?.bank?.ifscCode || 'HDFC0001234'}</div>
                </div>
              </div>
            </div>

            {paymentConfig?.upi?.intentUrl && (
              <a
                href={`${paymentConfig.upi.intentUrl}&am=${getPackageAmount(currentPkg)}`}
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

            <form onSubmit={handleSubmitPaymentProof} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1D1D1F', marginBottom: 4 }}>
                  Enter UPI UTR / Transaction Reference Number
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

              <button type="submit" disabled={isLoading} className="apple-btn-gold" style={{ padding: 14, width: '100%', fontSize: 15 }}>
                {isLoading ? 'Submitting...' : 'Submit Payment Proof'}
              </button>

              <button
                type="button"
                onClick={handleConsultOnWhatsApp}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#25D366',
                  fontSize: 13.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                Need assistance? Chat on WhatsApp (+91 9983353533)
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
            <p className="text-body" style={{ fontSize: 14.5, marginBottom: 20, maxWidth: 460, margin: '0 auto 24px' }}>
              Amit has received your birth details and preferred window for{' '}
              <strong>{selectedDate} ({selectedWindow})</strong>. Your slot will be confirmed shortly.
            </p>

            {currentPkg && currentPkg.followupDays > 0 && (
              <div
                style={{
                  backgroundColor: 'rgba(47, 168, 79, 0.06)',
                  border: '1px solid rgba(47, 168, 79, 0.2)',
                  borderRadius: 14,
                  padding: '12px 16px',
                  marginBottom: 20,
                  fontSize: 13.5,
                  color: '#1D6B35',
                  textAlign: 'left'
                }}
              >
                ✅ <strong>{currentPkg.followupDays === 365 ? '365-day' : `${currentPkg.followupDays}-day`} follow-up chat</strong> included with your package.
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {isAuthenticated ? (
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
              ) : (
                <button
                  onClick={handleConsultOnWhatsApp}
                  style={{
                    padding: '13px 18px',
                    fontSize: 14.5,
                    fontWeight: 600,
                    width: '100%',
                    backgroundColor: '#25D366',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 14,
                    boxShadow: '0 4px 14px rgba(37, 211, 102, 0.28)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8
                  }}
                >
                  <span>Chat on WhatsApp (+91 9983353533)</span>
                </button>
              )}

              <button onClick={onClose} className="apple-btn-secondary" style={{ padding: 12, width: '100%', fontSize: 14 }}>
                Return to Site
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
