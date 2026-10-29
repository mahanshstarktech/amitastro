import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WhatsAppConsultModal } from '../../components/whatsapp/WhatsAppConsultModal';
import {
  buildWhatsAppConsultMessage,
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

    it('generates the direct api.whatsapp.com URL with phone 919983353633', () => {
      const url = getWhatsAppSendUrl({ user: null });
      expect(url).toContain(`https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE_NUMBER}`);
      expect(url).toContain('Namaste');
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
        expect.stringContaining('https://api.whatsapp.com/send?phone=919983353633'),
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
