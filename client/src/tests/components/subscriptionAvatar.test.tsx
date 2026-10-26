import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { SubscriptionAvatar, getSubscriptionRingConfig } from '../../components/common/SubscriptionAvatar';

describe('SubscriptionAvatar Component (Google-style Profile Rings)', () => {
  it('applies dedicated green ring for Free(Trial)', () => {
    const config = getSubscriptionRingConfig('Free(Trial)', false);
    expect(config.tierKey).toBe('free-trial');
    expect(config.ringGradient).toContain('#10B981');
    expect(config.label).toBe('Free(Trial)');

    render(
      <SubscriptionAvatar
        name="Amit Seeker"
        planBadge="Free(Trial)"
        size={38}
      />
    );

    const ring = screen.getByLabelText(/Amit Seeker \(Free\(Trial\)\)/i);
    expect(ring).toBeInTheDocument();
    expect(ring).toHaveClass('subscription-ring-free-trial');
    expect(ring).toHaveTextContent('A');
  });

  it('applies dedicated sapphire blue ring for Plus', () => {
    const config = getSubscriptionRingConfig('Plus', false);
    expect(config.tierKey).toBe('plus');
    expect(config.ringGradient).toContain('#3B82F6');

    render(
      <SubscriptionAvatar
        name="Rohit Verma"
        planBadge="Plus"
        size={38}
      />
    );

    const ring = screen.getByLabelText(/Rohit Verma \(Plus\)/i);
    expect(ring).toHaveClass('subscription-ring-plus');
  });

  it('applies dedicated amber gold ring for Pro', () => {
    const config = getSubscriptionRingConfig('Pro', false);
    expect(config.tierKey).toBe('pro');
    expect(config.ringGradient).toContain('#F59E0B');

    render(
      <SubscriptionAvatar
        name="Sunita Rao"
        planBadge="Pro"
        size={38}
      />
    );

    const ring = screen.getByLabelText(/Sunita Rao \(Pro\)/i);
    expect(ring).toHaveClass('subscription-ring-pro');
  });

  it('applies dedicated royal purple-magenta gradient ring for Family 360', () => {
    const config = getSubscriptionRingConfig('Family', false);
    expect(config.tierKey).toBe('family');
    expect(config.ringGradient).toContain('#7928CA');
    expect(config.ringGradient).toContain('#FF0080');

    render(
      <SubscriptionAvatar
        name="Kapoor Family"
        planBadge="Family"
        size={38}
      />
    );

    const ring = screen.getByLabelText(/Kapoor Family \(Family 360\)/i);
    expect(ring).toHaveClass('subscription-ring-family');
  });

  it('applies dedicated imperial gold ring for Admin', () => {
    const config = getSubscriptionRingConfig(undefined, true);
    expect(config.tierKey).toBe('admin');
    expect(config.ringGradient).toContain('#C9A24B');

    render(
      <SubscriptionAvatar
        name="Amit Soni"
        isAdmin={true}
        size={38}
      />
    );

    const ring = screen.getByLabelText(/Amit Soni \(Admin\)/i);
    expect(ring).toHaveClass('subscription-ring-admin');
  });

  it('renders photoURL when available inside the inner halo gap', () => {
    render(
      <SubscriptionAvatar
        name="Mahansh Gaur"
        photoURL="https://example.com/avatar.jpg"
        planBadge="Free(Trial)"
        size={38}
      />
    );

    const img = screen.getByRole('img', { name: /Mahansh Gaur/i });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
  });
});
