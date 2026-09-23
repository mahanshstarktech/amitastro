import React from 'react';
import { X, Check } from 'lucide-react';
import { useCountry } from '../../context/CountryContext';

interface CountrySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CountrySelectorModal: React.FC<CountrySelectorModalProps> = ({
  isOpen,
  onClose
}) => {
  const { country, setCountry, availableCountries } = useCountry();

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 24,
          maxWidth: 480,
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.18)',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          animation: 'appleModalIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid #E5E5EA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <h3 style={{ fontSize: 19, fontWeight: 700, color: '#1D1D1F', margin: 0 }}>
              Select Country & Currency
            </h3>
            <p style={{ fontSize: 13, color: '#6E6E73', margin: '4px 0 0' }}>
              Prices and consultation times adapt to your local region.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: '#F5F5F7',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#1D1D1F',
              transition: 'background-color 0.15s ease'
            }}
          >
            <X size={17} />
          </button>
        </div>

        {/* List of Countries */}
        <div
          style={{
            padding: '12px 16px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 8
          }}
        >
          {availableCountries.map((c) => {
            const isSelected = country === c.code;
            return (
              <div
                key={c.code}
                onClick={() => {
                  setCountry(c.code);
                  onClose();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: 16,
                  border: isSelected ? '2px solid #3A3A6E' : '1px solid #E5E5EA',
                  backgroundColor: isSelected ? 'rgba(58, 58, 110, 0.04)' : '#FFFFFF',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ fontSize: 28, lineHeight: 1 }}>{c.flagEmoji}</span>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#1D1D1F' }}>
                      {c.name}
                    </div>
                    <div style={{ fontSize: 12.5, color: '#6E6E73', marginTop: 2 }}>
                      Currency: <strong>{c.currency}</strong> ({c.currencySymbol.trim()}) · Quick: {c.prices.quick.formatted}
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      backgroundColor: '#3A3A6E',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Check size={14} strokeWidth={2.5} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div
          style={{
            padding: '14px 20px',
            backgroundColor: '#F5F5F7',
            borderTop: '1px solid #E5E5EA',
            fontSize: 12,
            color: '#86868B',
            textAlign: 'center'
          }}
        >
          🔒 Detection automatically verifies real device locale and timezone.
        </div>
      </div>
    </div>
  );
};
