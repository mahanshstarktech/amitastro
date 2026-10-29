import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookingModal } from '../../components/booking/BookingModal';
import { CountryProvider } from '../../context/CountryContext';
import { NotificationProvider } from '../../context/NotificationContext';

let mockIsAuthenticated = true;
let mockProfiles = [
  { id: 'bp-1', user_id: 'usr-123', full_name: 'Mahansh Gaur', dob: '2004-03-15', tob: '10:30', pob: 'Jaipur, India', relation: 'self' }
];

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'usr-123',
      name: 'Mahansh Gaur',
      email: 'mahansh@example.com',
      phone: '+919876543210',
      isFamilySubscriber: false,
      role: 'customer'
    },
    isAuthenticated: mockIsAuthenticated,
    profiles: mockProfiles,
    addProfile: vi.fn().mockResolvedValue({ id: 'bp-new', full_name: 'Priya Gaur', relation: 'spouse' })
  })
}));

vi.mock('../../utils/api', () => ({
  apiRequest: vi.fn().mockImplementation((url: string) => {
    if (url === '/packages') {
      return Promise.resolve({
        packages: [
          { id: 'pkg-quick', slug: 'quick-consult', name: 'Quick Consult', duration_minutes: 15, followupDays: 0, price: 1100, is_trial: 0 },
          { id: 'pkg-standard', slug: 'standard', name: 'Standard Consult', duration_minutes: 30, followupDays: 3, price: 2100, is_trial: 0 },
          { id: 'pkg-premium', slug: 'premium', name: 'Premium Deep Consult', duration_minutes: 60, followupDays: 7, price: 5100, is_popular: 1, is_trial: 0 },
          { id: 'pkg-family-360', slug: 'family-360', name: 'Family 360 Plan', duration_minutes: 60, followupDays: 365, price: 100000, is_trial: 0 }
        ]
      });
    }
    if (url === '/availability') {
      return Promise.resolve({ blackoutDates: [] });
    }
    if (url === '/payments/config') {
      return Promise.resolve({ upi: { vpa: 'amitastro@upi' } });
    }
    return Promise.resolve({});
  })
}));

describe('BookingModal Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAuthenticated = true;
    mockProfiles = [
      { id: 'bp-1', user_id: 'usr-123', full_name: 'Mahansh Gaur', dob: '2004-03-15', tob: '10:30', pob: 'Jaipur, India', relation: 'self' }
    ];
  });

  it('renders all 4 package cards including Family 360 Plan', async () => {
    render(
      <CountryProvider>
        <NotificationProvider>
          <BookingModal isOpen={true} onClose={vi.fn()} initialStep={3} />
        </NotificationProvider>
      </CountryProvider>
    );

    expect(screen.getByText('Quick Consult')).toBeInTheDocument();
    expect(screen.getByText('Standard Consult')).toBeInTheDocument();
    expect(screen.getAllByText('Premium Deep Consult').length).toBeGreaterThan(0);
    expect(screen.getByText('Family 360 Plan')).toBeInTheDocument();
  });

  it('does NOT render Consultation Mode (point 4 removed completely)', () => {
    render(
      <CountryProvider>
        <NotificationProvider>
          <BookingModal isOpen={true} onClose={vi.fn()} initialStep={2} />
        </NotificationProvider>
      </CountryProvider>
    );

    expect(screen.queryByText(/4\. Consultation Mode/i)).toBeNull();
    expect(screen.queryByText('Phone Call')).toBeNull();
    expect(screen.queryByText('In-App Chat')).toBeNull();
    // Verify point 4 is now Topics or Questions for Discussion
    expect(screen.getByText(/Topics or Questions for Discussion/i)).toBeInTheDocument();
  });

  it('automatically switches package to Family 360 when clicking "+ Add another family member"', async () => {
    const user = userEvent.setup();
    render(
      <CountryProvider>
        <NotificationProvider>
          <BookingModal isOpen={true} onClose={vi.fn()} preselectedPackageId="pkg-quick" initialStep={1} />
        </NotificationProvider>
      </CountryProvider>
    );

    const addFamilyBtn = screen.getByText(/Add another family member/i);
    expect(addFamilyBtn).toBeInTheDocument();

    await user.click(addFamilyBtn);

    // After clicking, the Family 360 plan is selected and add profile form opens
    expect(screen.getByText(/Add Family Member Profile \(Family 360\)/i)).toBeInTheDocument();
  });

  it('renders "Consult on WhatsApp (+91 9983353533)" button', () => {
    render(
      <CountryProvider>
        <NotificationProvider>
          <BookingModal isOpen={true} onClose={vi.fn()} />
        </NotificationProvider>
      </CountryProvider>
    );

    const waBtn = screen.getByRole('button', { name: /Consult on WhatsApp \(\+91 9983353533\)/i });
    expect(waBtn).toBeInTheDocument();
  });

  it('redirects to WhatsApp on +91 9983353533 with curated details when clicked', async () => {
    const user = userEvent.setup();
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(
      <CountryProvider>
        <NotificationProvider>
          <BookingModal isOpen={true} onClose={vi.fn()} />
        </NotificationProvider>
      </CountryProvider>
    );

    const waBtn = screen.getByRole('button', { name: /Consult on WhatsApp \(\+91 9983353533\)/i });
    await user.click(waBtn);

    expect(windowOpenSpy).toHaveBeenCalled();
    const targetUrl = windowOpenSpy.mock.calls[0][0] as string;
    expect(targetUrl).toContain('https://api.whatsapp.com/send?phone=919983353533');
    expect(decodeURIComponent(targetUrl)).toContain('Namaste Amit Ji');
    expect(decodeURIComponent(targetUrl)).toContain('Mahansh Gaur');
    // Forwards birth chart coordinates & package details
    expect(decodeURIComponent(targetUrl)).toContain('Birth Chart Coordinates');
    expect(decodeURIComponent(targetUrl)).toContain('Consultation Package');
    // At Step 1, unreached step 2 schedule fields are omitted
    expect(decodeURIComponent(targetUrl)).not.toContain('Preferred Date');
    expect(decodeURIComponent(targetUrl)).not.toContain('Topics / Questions for Discussion');
  });

  it('Step 2: omits "Questions / Topics" line when customer notes are left blank', async () => {
    const user = userEvent.setup();
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(
      <CountryProvider>
        <NotificationProvider>
          <BookingModal isOpen={true} onClose={vi.fn()} initialStep={2} />
        </NotificationProvider>
      </CountryProvider>
    );

    const waBtn = screen.getByRole('button', { name: /Consult on WhatsApp \(\+91 9983353533\)/i });
    await user.click(waBtn);

    expect(windowOpenSpy).toHaveBeenCalled();
    const targetUrl = windowOpenSpy.mock.calls[0][0] as string;
    const decoded = decodeURIComponent(targetUrl);
    expect(decoded).toContain('Preferred Date');
    expect(decoded).not.toContain('Topics / Questions for Discussion');
  });

  it('Step 2: includes "Questions / Topics" line when customer notes are provided', async () => {
    const user = userEvent.setup();
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(
      <CountryProvider>
        <NotificationProvider>
          <BookingModal isOpen={true} onClose={vi.fn()} initialStep={2} />
        </NotificationProvider>
      </CountryProvider>
    );

    // Enter notes in Step 2 textarea
    const notesInput = screen.getByPlaceholderText(/Seeking clarity on career growth/i);
    await user.type(notesInput, 'Career promotion and overseas travel timeline');

    const waBtn = screen.getByRole('button', { name: /Consult on WhatsApp \(\+91 9983353533\)/i });
    await user.click(waBtn);

    expect(windowOpenSpy).toHaveBeenCalled();
    const targetUrl = windowOpenSpy.mock.calls[0][0] as string;
    const decoded = decodeURIComponent(targetUrl);
    expect(decoded).toContain('Preferred Date');
    expect(decoded).toContain('Career promotion and overseas travel timeline');
  });

  it('supports unauthenticated guest booking and renders "Add your birth profile"', async () => {
    const user = userEvent.setup();
    mockIsAuthenticated = false;

    render(
      <CountryProvider>
        <NotificationProvider>
          <BookingModal isOpen={true} onClose={vi.fn()} onOpenAuth={vi.fn()} initialStep={1} />
        </NotificationProvider>
      </CountryProvider>
    );

    // Shows polite sign in invitation without explicitly saying "not necessary"
    expect(screen.getByText(/You are currently not signed in/i)).toBeInTheDocument();
    expect(screen.queryByText(/not necessary/i)).toBeNull();

    // Renders "Add your birth profile"
    const addProfileTrigger = screen.getByText('Add your birth profile');
    expect(addProfileTrigger).toBeInTheDocument();

    // User expands to reveal inputs
    await user.click(addProfileTrigger);

    // Shows birth inputs (Full Name, Date of Birth, Time of Birth)
    expect(screen.getByPlaceholderText(/As per Kundli \/ Birth record/i)).toBeInTheDocument();
  });

  it('navigates through steps using Continue and returns via top-left Back button', async () => {
    const user = userEvent.setup();
    render(
      <CountryProvider>
        <NotificationProvider>
          <BookingModal isOpen={true} onClose={vi.fn()} />
        </NotificationProvider>
      </CountryProvider>
    );

    // Initial state: Step 1 (Birth Profile)
    expect(screen.getByText(/Step 1 of 4/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Birth Profile/i).length).toBeGreaterThan(0);
    expect(screen.queryByLabelText(/Go to previous step/i)).toBeNull();

    // Click Continue to Schedule & Questions
    const nextBtn = screen.getByRole('button', { name: /Continue to Schedule & Questions/i });
    await user.click(nextBtn);

    // Reaches Step 2 and displays Back button
    expect(screen.getByText(/Step 2 of 4/i)).toBeInTheDocument();
    expect(screen.getByText(/Schedule & Questions/i)).toBeInTheDocument();
    const backBtn = screen.getByLabelText(/Go to previous step/i);
    expect(backBtn).toBeInTheDocument();

    // Click Back button to return to Step 1
    await user.click(backBtn);
    expect(screen.getByText(/Step 1 of 4/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Birth Profile/i).length).toBeGreaterThan(0);
  });

  it('allows jumping back to completed steps via step progress bar tabs', async () => {
    const user = userEvent.setup();
    render(
      <CountryProvider>
        <NotificationProvider>
          <BookingModal isOpen={true} onClose={vi.fn()} initialStep={3} />
        </NotificationProvider>
      </CountryProvider>
    );

    expect(screen.getByText(/Step 3 of 4/i)).toBeInTheDocument();
    expect(screen.getByText(/Select Package/i)).toBeInTheDocument();

    // Step 1 tab is clickable since it is prior to current step
    const step1Tab = screen.getByRole('tab', { name: /Step 1: Profile/i });
    expect(step1Tab).not.toBeDisabled();

    await user.click(step1Tab);
    expect(screen.getByText(/Step 1 of 4/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Birth Profile/i).length).toBeGreaterThan(0);
  });
});
