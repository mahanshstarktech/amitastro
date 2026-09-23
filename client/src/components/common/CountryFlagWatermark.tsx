import React from 'react';
import { type CountryInfo } from '../../utils/countryPricing';

interface CountryFlagWatermarkProps {
  countryInfo: CountryInfo;
  onOpenSelector?: () => void;
}

export const CountryFlagWatermark: React.FC<CountryFlagWatermarkProps> = ({
  countryInfo,
  onOpenSelector
}) => {
  const code = countryInfo.code.toLowerCase();
  const c1 = countryInfo.flagColors[0];
  const c2 = countryInfo.flagColors[1];
  const c3 = countryInfo.flagColors[2];

  return (
    <div className="trust-flag-ambient-container">
      {/* Dynamic Ambient National Colors Radial Glow */}
      <div
        className="trust-flag-glow"
        style={{
          background: `radial-gradient(ellipse 65% 55% at 50% 25%, ${c1}26 0%, ${c2}15 45%, ${c3}22 80%, transparent 100%)`
        }}
      />

      {/* Faded Watermark Flag Graphic */}
      <div className="trust-flag-watermark-wrap">
        <img
          src={`https://flagcdn.com/w640/${code === 'eu' ? 'eu' : code}.png`}
          alt={`${countryInfo.name} flag`}
          className="trust-flag-watermark-img"
          onError={(e) => {
            // If offline or blocked, fallback gracefully
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
        {/* Soft feather overlay */}
        <div className="trust-flag-feather-overlay" />
      </div>

      {/* Sleek Pill Header directly above metrics */}
      <div className="trust-flag-pill-wrap">
        <button
          type="button"
          onClick={onOpenSelector}
          className="country-indicator-pill"
          title="Click to change your detected country / currency"
        >
          <span className="country-pill-flag">{countryInfo.flagEmoji}</span>
          <span className="country-pill-text">
            Consultations for seekers in <strong>{countryInfo.name}</strong> · {countryInfo.currency} Pricing Active
          </span>
          <span className="country-pill-action">Change</span>
        </button>
      </div>
    </div>
  );
};
