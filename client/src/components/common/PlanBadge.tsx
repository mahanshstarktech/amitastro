import React from 'react';
import { ShieldCheck, Crown, Sparkles, Zap, Gift, MessageCircle } from 'lucide-react';

export type PlanBadgeType = 'Free(Trial)' | 'Lite' | 'Plus' | 'Pro' | 'Family' | 'Admin';

interface PlanBadgeProps {
  badge?: PlanBadgeType | string;
  size?: 'micro' | 'sm' | 'md' | 'lg';
  isAvatarOverlay?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const PlanBadge: React.FC<PlanBadgeProps> = ({
  badge = 'Free(Trial)',
  size = 'sm',
  isAvatarOverlay = false,
  className = '',
  style = {}
}) => {
  // Normalize badge string
  const cleanBadge = (badge || 'Free(Trial)').trim() as PlanBadgeType;

  // Configuration for each badge tier
  let label = cleanBadge;
  let gradient = 'linear-gradient(135deg, #10B981, #059669)';
  let borderColor = 'rgba(16, 185, 129, 0.4)';
  let textColor = '#FFFFFF';
  let IconComponent: React.ComponentType<{ size: number; color?: string; style?: React.CSSProperties }> = Gift;
  let shadow = '0 2px 6px rgba(16, 185, 129, 0.35)';

  if (cleanBadge === 'Admin') {
    label = 'Admin';
    gradient = 'linear-gradient(135deg, #3A3A6E, #1F1F3D)';
    borderColor = '#C9A24B';
    textColor = '#FCD34D';
    IconComponent = ShieldCheck;
    shadow = '0 2px 8px rgba(58, 58, 110, 0.45)';
  } else if (cleanBadge === 'Family') {
    label = 'Family';
    gradient = 'linear-gradient(135deg, #7928CA, #FF0080)';
    borderColor = 'rgba(255, 215, 0, 0.7)';
    textColor = '#FFFFFF';
    IconComponent = Crown;
    shadow = '0 2px 10px rgba(255, 0, 128, 0.45)';
  } else if (cleanBadge === 'Pro') {
    label = 'Pro';
    gradient = 'linear-gradient(135deg, #D97706, #B45309)';
    borderColor = 'rgba(251, 191, 36, 0.6)';
    textColor = '#FFFFFF';
    IconComponent = Crown;
    shadow = '0 2px 6px rgba(217, 119, 6, 0.35)';
  } else if (cleanBadge === 'Plus') {
    label = 'Plus';
    gradient = 'linear-gradient(135deg, #2563EB, #1D4ED8)';
    borderColor = 'rgba(147, 197, 253, 0.5)';
    textColor = '#FFFFFF';
    IconComponent = Zap;
    shadow = '0 2px 6px rgba(37, 99, 235, 0.35)';
  } else if (cleanBadge === 'Lite') {
    label = 'Lite';
    gradient = 'linear-gradient(135deg, #EA580C, #C2410C)';
    borderColor = 'rgba(253, 186, 116, 0.5)';
    textColor = '#FFFFFF';
    IconComponent = MessageCircle;
    shadow = '0 2px 6px rgba(234, 88, 12, 0.35)';
  } else {
    label = 'Free(Trial)';
    gradient = 'linear-gradient(135deg, #10B981, #059669)';
    borderColor = 'rgba(110, 231, 183, 0.5)';
    textColor = '#FFFFFF';
    IconComponent = Gift;
    shadow = '0 2px 6px rgba(16, 185, 129, 0.35)';
  }

  // Size specifications
  let fontSize = 11;
  let iconSize = 10;
  let padding = '2px 7px';
  let borderRadius = 999;
  let letterSpacing = '0.02em';

  if (size === 'micro') {
    fontSize = 9.5;
    iconSize = 8.5;
    padding = '1px 5px';
    letterSpacing = '-0.01em';
  } else if (size === 'md') {
    fontSize = 12.5;
    iconSize = 12;
    padding = '3px 10px';
  } else if (size === 'lg') {
    fontSize = 14;
    iconSize = 14;
    padding = '5px 14px';
  }

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: size === 'micro' ? 2.5 : 4,
    background: gradient,
    color: textColor,
    fontSize,
    fontWeight: 700,
    letterSpacing,
    lineHeight: 1.2,
    padding,
    borderRadius,
    border: `1px solid ${borderColor}`,
    boxShadow: shadow,
    textTransform: 'none',
    whiteSpace: 'nowrap',
    userSelect: 'none',
    flexShrink: 0,
    ...(isAvatarOverlay
      ? {
          position: 'absolute',
          bottom: -4,
          right: -6,
          zIndex: 3,
          border: '1.5px solid #FFFFFF'
        }
      : {}),
    ...style
  };

  return (
    <span className={`plan-badge plan-badge-${label.toLowerCase().replace(/[^a-z]/g, '')} ${className}`} style={baseStyle}>
      <IconComponent size={iconSize} style={{ flexShrink: 0 }} />
      <span>{label}</span>
    </span>
  );
};
