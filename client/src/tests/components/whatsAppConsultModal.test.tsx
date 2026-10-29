import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WhatsAppConsultModal } from '../../components/whatsapp/WhatsAppConsultModal';
import {
  buildWhatsAppConsultMessage,
  buildBookingWhatsAppMessage,
  getWhatsAppSendUrl,
  WHATSAPP_PHONE_NUMBER
} from '../../utils/whatsapp';
import type { User, BirthProfile } from '../../context/AuthContext';

describe('WhatsApp Consult Utility & Modal Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('open', vi.fn());
  });

  describe('WhatsApp Message Builder', () => {
    it('creates a polite, structured guest message when user is not logged in', () => {
      const msg = buildWhatsAppConsultMessage({ user: null });
      expect(msg).toContain('Namaste Amit ji!');
      expect(msg).toContain('amitastro.com');
      expect(msg).toContain('quick quote and consult');
    });

    it('creates a rich, detailed message including name, contact, and birth profile when logged in', () => {
      const mockUser: User = {
        id: 'u-123',
        name: 'Rohan Sharma',
        email: 'rohan@example.com',
        phone: '9876543210',
        role: 'customer',
        isPhoneVerified: true,
        isNewCustomer: false,
        trialUsed: false,
        trialSecondsRemaining: 300
      };

      const mockProfile: BirthProfile = {
        id: 'bp-1',
        user_id: 'u-123',
        relation: 'self',
        full_name: 'Rohan Sharma',
        dob: '1992-05-18',
        tob: '07:45 AM',
        tob_uncertain: 0,
        pob: 'Jaipur, Rajasthan, India'
      };

      const msg = buildWhatsAppConsultMessage({ user: mockUser, profile: mockProfile });
      expect(msg).toContain('Namaste Amit ji!');
      expect(msg).toContain('• *Name:* Rohan Sharma');
      expect(msg).toContain('• *Phone:* +91 9876543210');
      expect(msg).toContain('• *Email:* rohan@example.com');
      expect(msg).toContain('• *Date of Birth:* 1992-05-18');
      expect(msg).toContain('• *Time of Birth:* 07:45 AM');
      expect(msg).toContain('• *Place of Birth:* Jaipur, Rajasthan, India');
    });

    it('generates the direct api.whatsapp.com URL with phone 919983353533', () => {
      const url = getWhatsAppSendUrl({ user: null });
      expect(url).toContain(`https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE_NUMBER}`);
      expect(url).toContain('Namaste');
    });
  });

  describe('Step-Aware Booking WhatsApp Message Builder (Forwarding Maximum Info & Dynamic Append)', () => {
    const samplePackage = {
      id: 'pkg-premium',
      name: 'Premium Deep Consult',
      price: 5100,
      durationMinutes: 60
    };

    it('Step 1 (Logged-in): carries forward all available account details, birth coordinates, and package', () => {
      const msg = buildBookingWhatsAppMessage({
        step: 'details',
        wizardStep: 1,
        currentPkg: samplePackage,
        formattedPrice: '₹5,100',
        user: { id: 'u1', name: 'Aarav Gupta', phone: '9876500000', email: 'aarav@example.com' } as any,
        profile: {
          id: 'p1',
          full_name: 'Aarav Gupta',
          dob: '1990-05-12',
          tob: '08:30 AM',
          pob: 'Jaipur, Rajasthan, India'
        } as any
      });

      expect(msg).toContain('Namaste Amit Ji');
      // Forwards Account Details
      expect(msg).toContain('• *Name:* Aarav Gupta');
      expect(msg).toContain('• *Phone:* +91 9876500000');
      expect(msg).toContain('• *Email:* aarav@example.com');
      // Forwards Birth Chart Coordinates
      expect(msg).toContain('• *Date of Birth:* 1990-05-12');
      expect(msg).toContain('• *Time of Birth:* 08:30 AM');
      expect(msg).toContain('• *Place of Birth:* Jaipur, Rajasthan, India');
      // Forwards Package
      expect(msg).toContain('• *Selected Package:* Premium Deep Consult (₹5,100)');
      // Schedule not yet selected at Step 1
      expect(msg).not.toContain('Preferred Date');
      expect(msg).not.toContain('Topics / Questions');
    });

    it('Step 1 (Guest): forwards whatever guest birth details entered so far + package', () => {
      const msg = buildBookingWhatsAppMessage({
        step: 'details',
        wizardStep: 1,
        currentPkg: samplePackage,
        formattedPrice: '₹5,100',
        guestProfile: {
          fullName: 'Kavita Roy',
          dob: '1996-08-20',
          pob: 'Varanasi, UP, India'
        }
      });

      expect(msg).toContain('• *Selected Package:* Premium Deep Consult (₹5,100)');
      expect(msg).toContain('• *Full Name:* Kavita Roy');
      expect(msg).toContain('• *Date of Birth:* 1996-08-20');
      expect(msg).toContain('• *Place of Birth:* Varanasi, UP, India');
      // Unfilled coordinates should not appear
      expect(msg).not.toContain('Time of Birth');
      expect(msg).not.toContain('Preferred Date');
    });

    it('Step 2 (Schedule): appends schedule and DOES NOT add "Topics or Questions" if user left it blank', () => {
      const msg = buildBookingWhatsAppMessage({
        step: 'details',
        wizardStep: 2,
        currentPkg: samplePackage,
        formattedPrice: '₹5,100',
        profile: {
          id: 'p1',
          full_name: 'Harsh Tenguriya',
          dob: '1995-10-15',
          tob: '10:30 AM',
          pob: 'Agra, UP, India'
        } as any,
        selectedDate: '2026-11-02',
        selectedWindow: '02:00 PM - 04:00 PM',
        customerNotes: '' // User did not fill discussion topics
      });

      expect(msg).toContain('• *Selected Package:* Premium Deep Consult (₹5,100)');
      expect(msg).toContain('• *Full Name:* Harsh Tenguriya');
      expect(msg).toContain('• *Date of Birth:* 1995-10-15');
      expect(msg).toContain('• *Preferred Date:* 2026-11-02');
      expect(msg).toContain('• *Preferred Time:* 02:00 PM - 04:00 PM');
      // Crucial requirement: omitted when empty!
      expect(msg).not.toContain('Topics / Questions for Discussion');
    });

    it('Step 2 (Schedule): appends "Topics / Questions" when user entered questions', () => {
      const msg = buildBookingWhatsAppMessage({
        step: 'details',
        wizardStep: 2,
        currentPkg: samplePackage,
        formattedPrice: '₹5,100',
        profile: {
          id: 'p1',
          full_name: 'Harsh Tenguriya',
          dob: '1995-10-15',
          tob: '10:30 AM',
          pob: 'Agra, UP, India'
        } as any,
        selectedDate: '2026-11-02',
        selectedWindow: '02:00 PM - 04:00 PM',
        customerNotes: 'Query regarding career switch and Rahu Mahadasha remedies.'
      });

      expect(msg).toContain('• *Preferred Date:* 2026-11-02');
      expect(msg).toContain('💬 *Topics / Questions for Discussion:*');
      expect(msg).toContain('Query regarding career switch and Rahu Mahadasha remedies.');
    });

    it('Step 3 (Package right before payment): forwards all previous details plus selected package', () => {
      const msg = buildBookingWhatsAppMessage({
        step: 'details',
        wizardStep: 3,
        currentPkg: samplePackage,
        formattedPrice: '₹5,100',
        user: { name: 'Harsh', phone: '9988776655' } as any,
        profile: {
          full_name: 'Harsh',
          dob: '1995-10-15'
        } as any,
        selectedDate: '2026-11-02',
        selectedWindow: '02:00 PM - 04:00 PM',
        customerNotes: 'Career questions'
      });

      expect(msg).toContain('• *Selected Package:* Premium Deep Consult (₹5,100)');
      expect(msg).toContain('• *Name:* Harsh');
      expect(msg).toContain('• *Date of Birth:* 1995-10-15');
      expect(msg).toContain('• *Preferred Date:* 2026-11-02');
      expect(msg).toContain('Career questions');
    });

    it('Step 4: includes payment reference / UTR when entered at payment step', () => {
      const msg = buildBookingWhatsAppMessage({
        step: 'payment',
        wizardStep: 3,
        currentPkg: samplePackage,
        formattedPrice: '₹5,100',
        user: { name: 'Harsh' } as any,
        selectedDate: '2026-11-02',
        selectedWindow: '02:00 PM - 04:00 PM',
        utr: 'UTR492817290192'
      });

      expect(msg).toContain('💳 *Payment Reference:*');
      expect(msg).toContain('• *UTR / Ref No:* UTR492817290192');
    });
  });

  describe('WhatsAppConsultModal Component', () => {
    it('does not render when isOpen is false', () => {
      render(
        <WhatsAppConsultModal
          isOpen={false}
          onClose={vi.fn()}
          onOpenAuth={vi.fn()}
        />
      );
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('renders guest login prompt with option to continue to WhatsApp anyway', () => {
      render(
        <WhatsAppConsultModal
          isOpen={true}
          onClose={vi.fn()}
          onOpenAuth={vi.fn()}
          user={null}
        />
      );

      expect(screen.getByRole('dialog')).toBeTruthy();
      expect(screen.getByText('Consult on WhatsApp')).toBeTruthy();
      // Verifies benefit of logging in is clearly explained
      expect(screen.getByText(/Connect faster by signing in/i)).toBeTruthy();
      expect(screen.getByText(/By logging in, your details and birth coordinates will be automatically included/i)).toBeTruthy();

      // Two core buttons present
      expect(screen.getByRole('button', { name: /Log In to Auto-Fill Details/i })).toBeTruthy();
      expect(screen.getByRole('button', { name: /Continue to WhatsApp Anyway/i })).toBeTruthy();
    });

    it('clicking "Log In to Auto-Fill Details" triggers onOpenAuth and closes modal', async () => {
      const user = userEvent.setup();
      const onCloseMock = vi.fn();
      const onOpenAuthMock = vi.fn();

      render(
        <WhatsAppConsultModal
          isOpen={true}
          onClose={onCloseMock}
          onOpenAuth={onOpenAuthMock}
          user={null}
        />
      );

      const loginBtn = screen.getByRole('button', { name: /Log In to Auto-Fill Details/i });
      await user.click(loginBtn);

      expect(onCloseMock).toHaveBeenCalled();
      expect(onOpenAuthMock).toHaveBeenCalledWith('login');
    });

    it('clicking "Continue to WhatsApp Anyway" opens WhatsApp without requiring login', async () => {
      const user = userEvent.setup();
      const onCloseMock = vi.fn();

      render(
        <WhatsAppConsultModal
          isOpen={true}
          onClose={onCloseMock}
          onOpenAuth={vi.fn()}
          user={null}
        />
      );

      const continueBtn = screen.getByRole('button', { name: /Continue to WhatsApp Anyway/i });
      await user.click(continueBtn);

      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('https://api.whatsapp.com/send?phone=919983353533'),
        '_blank',
        'noopener,noreferrer'
      );
      expect(onCloseMock).toHaveBeenCalled();
    });

    it('renders authenticated state when user is logged in', () => {
      const mockUser: User = {
        id: 'u-456',
        name: 'Priya Patel',
        email: 'priya@example.com',
        phone: '9123456789',
        role: 'customer',
        isPhoneVerified: true,
        isNewCustomer: false,
        trialUsed: true,
        trialSecondsRemaining: 0
      };

      render(
        <WhatsAppConsultModal
          isOpen={true}
          onClose={vi.fn()}
          onOpenAuth={vi.fn()}
          user={mockUser}
        />
      );

      expect(screen.getByText(/Signed in as Priya Patel/i)).toBeTruthy();
      expect(screen.getByRole('button', { name: /Open WhatsApp with My Details/i })).toBeTruthy();
    });
  });
});
