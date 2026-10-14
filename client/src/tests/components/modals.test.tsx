import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FamilyUpgradeModal } from '../../components/subscription/FamilyUpgradeModal';
import { TrialCutoffModal } from '../../components/trial/TrialCutoffModal';
import { CountryProvider } from '../../context/CountryContext';
import { NotificationProvider } from '../../context/NotificationContext';

// Mock useAuth
const mockUser = {
  id: 'usr-123',
  name: 'Priya Sharma',
  email: 'priya@example.com',
  phone: '+919876543210',
  role: 'customer' as const,
  isPhoneVerified: true,
  isNewCustomer: true,
  trialUsed: false,
  trialSecondsRemaining: 300,
  plan: 'free' as const,
  planBadge: 'Free(Trial)' as const,
  isFamilySubscriber: false
};

const mockRefreshMe = vi.fn();

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    refreshMe: mockRefreshMe,
    token: 'mock-token',
    isAuthenticated: true,
    isLoading: false,
    isAdmin: false,
    profiles: []
  })
}));

// Mock apiRequest
vi.mock('../../utils/api', () => ({
  apiRequest: vi.fn().mockImplementation((url: string) => {
    if (url === '/trial/status') {
      return Promise.resolve({ isEligible: true, trialUsed: false, secondsRemaining: 300 });
    }
    if (url === '/subscription/config') {
      return Promise.resolve({ planId: 'family-360', annualAmount: 100000, currency: 'INR' });
    }
    return Promise.resolve({});
  })
}));

describe('Frontend: Component Tests for Subscription & Discovery Modals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('FamilyUpgradeModal Component', () => {
    it('does not render into DOM when isOpen is false', () => {
      const { container } = render(
        <CountryProvider>
          <FamilyUpgradeModal isOpen={false} onClose={vi.fn()} />
        </CountryProvider>
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders Family 360 Plan modal with features and pricing when isOpen is true', () => {
      render(
        <CountryProvider>
          <FamilyUpgradeModal isOpen={true} onClose={vi.fn()} />
        </CountryProvider>
      );

      expect(screen.getByText(/Family 360 Plan/i)).toBeTruthy();
      expect(screen.getByText(/Flagship Annual Membership/i)).toBeTruthy();
      expect(screen.getAllByText(/Add up to 4 Family Members/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Unlimited Consultations/i).length).toBeGreaterThan(0);
    });

    it('triggers onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const onCloseMock = vi.fn();

      render(
        <CountryProvider>
          <FamilyUpgradeModal isOpen={true} onClose={onCloseMock} />
        </CountryProvider>
      );

      const closeButtons = screen.getAllByRole('button');
      await user.click(closeButtons[0]);
      expect(onCloseMock).toHaveBeenCalled();
    });

    it('transitions from details step to payment verification step upon clicking CTA', async () => {
      const user = userEvent.setup();

      render(
        <CountryProvider>
          <FamilyUpgradeModal isOpen={true} onClose={vi.fn()} />
        </CountryProvider>
      );

      const proceedButton = screen.getByRole('button', { name: /Continue to Secure Autopay Setup/i });
      await user.click(proceedButton);

      // Now on payment step: should display payment details
      expect(screen.getByText(/Complete Family 360 Activation/i)).toBeTruthy();
    });
  });

  describe('TrialCutoffModal Component', () => {
    it('does not render when isOpen is false', () => {
      render(
        <NotificationProvider>
          <TrialCutoffModal isOpen={false} onClose={vi.fn()} onUpgradeClick={vi.fn()} />
        </NotificationProvider>
      );
      expect(screen.queryByText(/5-Minute Discovery Session/i)).toBeNull();
    });

    it('renders trial modal with countdown and call actions when isOpen is true', async () => {
      render(
        <NotificationProvider>
          <TrialCutoffModal isOpen={true} onClose={vi.fn()} onUpgradeClick={vi.fn()} />
        </NotificationProvider>
      );

      expect(screen.getByText(/5-Minute Discovery Session/i)).toBeTruthy();
      expect(screen.getByRole('button', { name: /Start 5-Minute Call/i })).toBeTruthy();
      expect(screen.getByRole('button', { name: /Cancel/i })).toBeTruthy();
    });

    it('calls onClose when Cancel is clicked', async () => {
      const user = userEvent.setup();
      const onCloseMock = vi.fn();

      render(
        <NotificationProvider>
          <TrialCutoffModal isOpen={true} onClose={onCloseMock} onUpgradeClick={vi.fn()} />
        </NotificationProvider>
      );

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      await user.click(cancelButton);

      expect(onCloseMock).toHaveBeenCalled();
    });
  });
});
