import React, { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CityAutocompleteInput } from '../../components/common/CityAutocompleteInput';
import { CountryCodeSelector } from '../../components/common/CountryCodeSelector';
import { ALL_COUNTRY_DIAL_CODES, getCountryDialInfo } from '../../utils/countryCodes';
import { detectRealCountry } from '../../utils/countryPricing';

describe('CityAutocompleteInput', () => {
  it('renders with label "Place of Birth (City / Town / Country)"', () => {
    const Component = () => {
      const [val, setVal] = useState('');
      return <CityAutocompleteInput value={val} onChange={setVal} />;
    };
    render(<Component />);
    expect(screen.getByText(/Place of Birth \(City \/ Town \/ Country\)/i)).toBeInTheDocument();
  });

  it('provides instant suggestions starting with J when typing "J"', async () => {
    const Component = () => {
      const [val, setVal] = useState('');
      return <CityAutocompleteInput value={val} onChange={setVal} placeholder="e.g. Jaipur, Rajasthan, India" />;
    };
    render(<Component />);
    const input = screen.getByPlaceholderText(/e\.g\. Jaipur, Rajasthan, India/i);

    fireEvent.change(input, { target: { value: 'J' } });

    // Should immediately show suggestions popover
    expect(await screen.findByText(/Suggested Places/i)).toBeInTheDocument();
    expect(screen.getByText('Jaipur')).toBeInTheDocument();
    expect(screen.getAllByText(/Rajasthan, India/i).length).toBeGreaterThan(0);
    expect(screen.getByText('Jaisalmer')).toBeInTheDocument();
    expect(screen.getByText('Jodhpur')).toBeInTheDocument();
  });

  it('selects a suggestion and fills City, State, Country format', async () => {
    let selected = '';
    const Component = () => {
      const [val, setVal] = useState('');
      return (
        <CityAutocompleteInput
          value={val}
          onChange={(v) => {
            setVal(v);
            selected = v;
          }}
        />
      );
    };
    render(<Component />);
    const input = screen.getByPlaceholderText(/e\.g\. Jaipur, Rajasthan, India/i);

    fireEvent.change(input, { target: { value: 'Jaipur' } });
    const suggestionItem = await screen.findByText('Jaipur');
    fireEvent.click(suggestionItem);

    expect(selected).toBe('Jaipur, Rajasthan, India');
  });
});

describe('CountryCodeSelector', () => {
  it('is alphabetically ordered', () => {
    const names = ALL_COUNTRY_DIAL_CODES.map((c) => c.name);
    const sorted = [...names].sort((a, b) => a.localeCompare(b));
    expect(names).toEqual(sorted);
  });

  it('renders selected country code and opens search dropdown on click', () => {
    const onChange = vi.fn();
    render(<CountryCodeSelector value="+91" onChange={onChange} />);

    expect(screen.getByText('+91')).toBeInTheDocument();
    expect(screen.getByText('🇮🇳')).toBeInTheDocument();

    // Click trigger button
    fireEvent.click(screen.getByRole('button', { name: /Select Country Calling Code/i }));

    // Search input should appear
    const searchInput = screen.getByPlaceholderText(/Search country or code\.\.\./i);
    expect(searchInput).toBeInTheDocument();

    // Filter by United States
    fireEvent.change(searchInput, { target: { value: 'United States' } });
    expect(screen.getByText('United States')).toBeInTheDocument();

    // Select United States
    fireEvent.click(screen.getByText('United States'));
    expect(onChange).toHaveBeenCalledWith('+1', expect.objectContaining({ code: 'US', dialCode: '+1' }));
  });
});

describe('Hardware Country Detection & Security Anti-Tampering', () => {
  it('defaults or inspects hardware timezone correctly', () => {
    const country = detectRealCountry();
    expect(['IN', 'US', 'GB', 'DE', 'AE', 'AU', 'CA', 'RU', 'EU']).toContain(country);
  });

  it('resolves correct dial code for detected country', () => {
    expect(getCountryDialInfo('IN').dialCode).toBe('+91');
    expect(getCountryDialInfo('US').dialCode).toBe('+1');
    expect(getCountryDialInfo('GB').dialCode).toBe('+44');
    expect(getCountryDialInfo('AE').dialCode).toBe('+971');
    expect(getCountryDialInfo('DE').dialCode).toBe('+49');
  });
});
