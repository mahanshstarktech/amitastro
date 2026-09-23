import React, { createContext, useContext, useState, useEffect } from 'react';
import { detectRealCountry, getCountryInfo, type CountryInfo, COUNTRIES } from '../utils/countryPricing';

interface CountryContextType {
  country: string;
  countryInfo: CountryInfo;
  setCountry: (code: string) => void;
  availableCountries: CountryInfo[];
}

const CountryContext = createContext<CountryContextType | undefined>(undefined);

export const CountryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [country, setCountryState] = useState<string>('IN');

  useEffect(() => {
    const detected = detectRealCountry();
    setCountryState(detected);

    // Optional background IP check if timezone was generic/UTC
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      if (!tz || tz.toLowerCase() === 'utc' || tz.toLowerCase() === 'gmt') {
        fetch('https://ipapi.co/json/')
          .then((res) => res.json())
          .then((data) => {
            if (data && data.country_code && COUNTRIES[data.country_code]) {
              const saved = localStorage.getItem('amit_country_override');
              if (!saved) {
                setCountryState(data.country_code);
              }
            }
          })
          .catch(() => {});
      }
    } catch {
      // Ignore background fetch error
    }
  }, []);

  const setCountry = (code: string) => {
    if (COUNTRIES[code]) {
      setCountryState(code);
      localStorage.setItem('amit_country_override', code);
    }
  };

  const countryInfo = getCountryInfo(country);
  const availableCountries = Object.values(COUNTRIES);

  return (
    <CountryContext.Provider
      value={{
        country,
        countryInfo,
        setCountry,
        availableCountries
      }}
    >
      {children}
    </CountryContext.Provider>
  );
};

export const useCountry = (): CountryContextType => {
  const context = useContext(CountryContext);
  if (!context) {
    throw new Error('useCountry must be used within a CountryProvider');
  }
  return context;
};
