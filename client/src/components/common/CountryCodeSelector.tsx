import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';
import { ALL_COUNTRY_DIAL_CODES, type CountryDialInfo } from '../../utils/countryCodes';

interface CountryCodeSelectorProps {
  value: string; // E.g. '+91', '+1', '+44'
  onChange: (dialCode: string, countryInfo: CountryDialInfo) => void;
  disabled?: boolean;
  className?: string;
}

export const CountryCodeSelector: React.FC<CountryCodeSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Find currently selected country info based on dialCode
  const selectedInfo = useMemo(() => {
    // Exact dial code match
    const found = ALL_COUNTRY_DIAL_CODES.find((c) => c.dialCode === value);
    if (found) return found;
    // Default fallback to India (+91)
    return { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳' };
  }, [value]);

  // Filter countries alphabetically based on user search query
  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return ALL_COUNTRY_DIAL_CODES;
    const q = searchQuery.toLowerCase().trim();
    return ALL_COUNTRY_DIAL_CODES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Auto focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelect = (country: CountryDialInfo) => {
    onChange(country.dialCode, country);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }} className={className}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '0 10px',
          height: 44,
          backgroundColor: '#F5F5F7',
          borderRadius: 12,
          border: '1px solid #E5E5EA',
          fontSize: 13.5,
          fontWeight: 600,
          color: '#1D1D1F',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.15s ease',
          outline: 'none',
          whiteSpace: 'nowrap',
          userSelect: 'none'
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Select Country Calling Code"
        title="Select Country Calling Code"
      >
        <span style={{ fontSize: 16 }}>{selectedInfo.flag}</span>
        <span>{selectedInfo.dialCode}</span>
        <ChevronDown
          size={13}
          style={{
            color: '#86868B',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 9999,
            width: 310,
            maxHeight: 360,
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            border: '1px solid rgba(0, 0, 0, 0.12)',
            borderRadius: 16,
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.16), 0 2px 6px rgba(0, 0, 0, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'appleDropdownFadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* Search Box Header */}
          <div
            style={{
              padding: '10px 12px',
              borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
              backgroundColor: '#FAFAFC',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <Search size={15} color="#86868B" style={{ flexShrink: 0 }} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search country or code..."
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: 13,
                color: '#1D1D1F'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  border: 'none',
                  background: 'transparent',
                  padding: 2,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  color: '#86868B'
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Alphabetical List */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              maxHeight: 280,
              padding: '4px 0'
            }}
            role="listbox"
          >
            {filteredCountries.length === 0 ? (
              <div
                style={{
                  padding: '24px 16px',
                  textAlign: 'center',
                  fontSize: 13,
                  color: '#86868B'
                }}
              >
                No country found matching "{searchQuery}"
              </div>
            ) : (
              filteredCountries.map((c) => {
                const isSelected = c.code === selectedInfo.code && c.dialCode === selectedInfo.dialCode;
                return (
                  <div
                    key={`${c.code}-${c.dialCode}`}
                    onClick={() => handleSelect(c)}
                    role="option"
                    aria-selected={isSelected}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 14px',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? 'rgba(58, 58, 110, 0.08)' : 'transparent',
                      transition: 'background-color 0.1s ease',
                      gap: 8
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = '#F5F5F7';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>{c.flag}</span>
                      <span
                        style={{
                          fontSize: 13,
                          color: '#1D1D1F',
                          fontWeight: isSelected ? 600 : 400,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {c.name}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <span
                        style={{
                          fontSize: 12.5,
                          fontWeight: 500,
                          color: '#6E6E73'
                        }}
                      >
                        {c.dialCode}
                      </span>
                      {isSelected && <Check size={14} color="#3A3A6E" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
