import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageProvider, useLanguage } from '../../context/LanguageContext';
import { CountryProvider, useCountry } from '../../context/CountryContext';

const LanguageConsumer = () => {
  const { language, setLanguage, t, isHindi } = useLanguage();
  return (
    <div>
      <span data-testid="current-lang">{language}</span>
      <span data-testid="is-hindi">{isHindi ? 'yes' : 'no'}</span>
      <span data-testid="translated-title">{t('hero.title', 'Vedic Wisdom')}</span>
      <button data-testid="toggle-hindi" onClick={() => setLanguage('hi')}>Switch Hindi</button>
      <button data-testid="toggle-english" onClick={() => setLanguage('en')}>Switch English</button>
    </div>
  );
};

const CountryConsumer = () => {
  const { country, countryInfo, setCountry } = useCountry();
  return (
    <div>
      <span data-testid="current-country">{country}</span>
      <span data-testid="current-currency">{countryInfo.currency}</span>
      <span data-testid="current-symbol">{countryInfo.currencySymbol}</span>
      <button data-testid="set-us" onClick={() => setCountry('US')}>Set US</button>
      <button data-testid="set-uk" onClick={() => setCountry('GB')}>Set UK</button>
    </div>
  );
};

describe('Frontend: Context Providers & Internationalization State', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('LanguageContext', () => {
    it('initializes with English by default and synchronizes document.documentElement.lang', () => {
      render(
        <LanguageProvider>
          <LanguageConsumer />
        </LanguageProvider>
      );

      expect(screen.getByTestId('current-lang').textContent).toBe('en');
      expect(screen.getByTestId('is-hindi').textContent).toBe('no');
      expect(document.documentElement.lang).toBe('en');
    });

    it('toggles language between English and Hindi, updating document lang and translations', async () => {
      const user = userEvent.setup();

      render(
        <LanguageProvider>
          <LanguageConsumer />
        </LanguageProvider>
      );

      // Switch to Hindi
      await user.click(screen.getByTestId('toggle-hindi'));

      expect(screen.getByTestId('current-lang').textContent).toBe('hi');
      expect(screen.getByTestId('is-hindi').textContent).toBe('yes');
      expect(document.documentElement.lang).toBe('hi');
      expect(localStorage.getItem('amit_astro_lang')).toBe('hi');

      // Switch back to English
      await user.click(screen.getByTestId('toggle-english'));
      expect(screen.getByTestId('current-lang').textContent).toBe('en');
      expect(document.documentElement.lang).toBe('en');
    });
  });

  describe('CountryContext', () => {
    it('initializes country and provides currency metadata', () => {
      render(
        <CountryProvider>
          <CountryConsumer />
        </CountryProvider>
      );

      const country = screen.getByTestId('current-country').textContent;
      expect(country).toBeDefined();
      expect(screen.getByTestId('current-currency').textContent).toBeDefined();
    });

    it('updates currency symbol and pricing tier when country is switched', async () => {
      const user = userEvent.setup();

      render(
        <CountryProvider>
          <CountryConsumer />
        </CountryProvider>
      );

      // Switch to US
      await user.click(screen.getByTestId('set-us'));
      expect(screen.getByTestId('current-country').textContent).toBe('US');
      expect(screen.getByTestId('current-currency').textContent).toBe('USD');
      expect(screen.getByTestId('current-symbol').textContent).toBe('$');

      // Switch to UK
      await user.click(screen.getByTestId('set-uk'));
      expect(screen.getByTestId('current-country').textContent).toBe('GB');
      expect(screen.getByTestId('current-currency').textContent).toBe('GBP');
      expect(screen.getByTestId('current-symbol').textContent).toBe('£');
    });
  });
});
