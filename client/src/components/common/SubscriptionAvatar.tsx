import React from 'react';
import { User as UserIcon, ShieldCheck } from 'lucide-react';
import { PlanBadgeType } from './PlanBadge';

export interface SubscriptionAvatarProps {
  photoURL?: string | null;
  name?: string | null;
  planBadge?: PlanBadgeType | string;
  isAdmin?: boolean;
  size?: number; // Outer diameter in px
  showRing?: boolean;
  className?: string;
  style?: React.CSSProperties;
  fallbackIcon?: React.ReactNode;
}

export interface RingConfig {
  ringGradient: string;
  glowColor: string;
  borderColor: string;
  label: string;
  tierKey: string;
}

/**
 * Returns Google One-style subscription ring configurations
 * - Free(Trial): Vibrant Emerald Green
 * - Plus: Sapphire Electric Blue
 * - Pro: Imperial Amber / Gold
 * - Family: Royal Purple-Magenta gradient
 * - Lite: Radiant Tangerine / Coral
 * - Admin: Imperial Vedic Gold with soft glow
 */
export function getSubscriptionRingConfig(
  badge?: PlanBadgeType | string,
  isAdmin?: boolean
): RingConfig {
  if (isAdmin || badge === 'Admin') {
    return {
      ringGradient: 'linear-gradient(135deg, #D4AF37 0%, #C9A24B 50%, #B8860B 100%)',
      glowColor: 'rgba(201, 162, 75, 0.45)',
      borderColor: '#C9A24B',
      label: 'Admin',
      tierKey: 'admin'
    };
  }

  const clean = (badge || 'Free(Trial)').trim();

  switch (clean) {
    case 'Family':
      return {
        ringGradient: 'linear-gradient(135deg, #7928CA 0%, #FF0080 100%)',
        glowColor: 'rgba(255, 0, 128, 0.35)',
        borderColor: '#7928CA',
        label: 'Family 360',
        tierKey: 'family'
      };
    case 'Pro':
      return {
        ringGradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
        glowColor: 'rgba(217, 119, 6, 0.35)',
        borderColor: '#D97706',
        label: 'Pro',
        tierKey: 'pro'
      };
    case 'Plus':
      return {
        ringGradient: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
        glowColor: 'rgba(37, 99, 235, 0.35)',
        borderColor: '#2563EB',
        label: 'Plus',
        tierKey: 'plus'
      };
    case 'Lite':
      return {
        ringGradient: 'linear-gradient(135deg, #FB923C 0%, #EA580C 100%)',
        glowColor: 'rgba(234, 88, 12, 0.35)',
        borderColor: '#EA580C',
        label: 'Lite',
        tierKey: 'lite'
      };
    case 'Free(Trial)':
    default:
      return {
        // Free Trial: Dedicated Green Ring (Google One inspired)
        ringGradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        glowColor: 'rgba(16, 185, 129, 0.4)',
        borderColor: '#10B981',
        label: 'Free(Trial)',
        tierKey: 'free-trial'
      };
  }
}

export const SubscriptionAvatar: React.FC<SubscriptionAvatarProps> = ({
  photoURL,
  name,
  planBadge = 'Free(Trial)',
  isAdmin = false,
  size = 38,
  showRing = true,
  className = '',
  style = {},
  fallbackIcon
}) => {
  const ringConfig = getSubscriptionRingConfig(planBadge, isAdmin);

  // Proportional ring and white halo gap thicknesses based on avatar size
  const ringThickness = size >= 36 ? 2.5 : 2;
  const gapThickness = size >= 36 ? 1.5 : 1.25;

  if (!showRing) {
    return (
      <div
        className={`subscription-avatar no-ring ${className}`}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          overflow: 'hidden',
          backgroundColor: '#3A3A6E',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          ...style
        }}
      >
        {photoURL ? (
          <img
            src={photoURL}
            alt={name || 'User'}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: Math.round(size * 0.4)
            }}
          >
            {name ? name.charAt(0).toUpperCase() : fallbackIcon || <UserIcon size={Math.round(size * 0.5)} />}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`subscription-avatar-ring subscription-ring-${ringConfig.tierKey} ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        padding: ringThickness,
        background: ringConfig.ringGradient,
        boxShadow: `0 0 0 1px ${ringConfig.borderColor}26, 0 2px 8px ${ringConfig.glowColor}`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        flexShrink: 0,
        boxSizing: 'border-box',
        transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease',
        ...style
      }}
      title={`${name || 'User'} · ${ringConfig.label}`}
      aria-label={`${name || 'User'} (${ringConfig.label})`}
    >
      {/* Crisp White Halo / Gap Ring (Google One Aesthetic) */}
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          backgroundColor: '#FFFFFF',
          padding: gapThickness,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}
      >
        {photoURL ? (
          <img
            src={photoURL}
            alt={name || 'User'}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              objectFit: 'cover',
              display: 'block'
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              backgroundColor: isAdmin ? '#1F1F3D' : '#3A3A6E',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: Math.round(size * 0.38)
            }}
          >
            {name ? (
              name.charAt(0).toUpperCase()
            ) : isAdmin ? (
              <ShieldCheck size={Math.round(size * 0.45)} color="#C9A24B" />
            ) : (
              fallbackIcon || <UserIcon size={Math.round(size * 0.45)} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
