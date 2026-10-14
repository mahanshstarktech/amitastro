import { describe, it, expect } from 'vitest';
import { translations } from '../../translations';

describe('Unit: Translation Dictionary Completeness', () => {
  const enKeys = Object.keys(translations.en);
  const hiKeys = Object.keys(translations.hi);

  it('has non-empty translations for all English keys', () => {
    expect(enKeys.length).toBeGreaterThan(30);

    for (const key of enKeys) {
      const val = translations.en[key];
      expect(typeof val).toBe('string');
      expect(val.trim().length).toBeGreaterThan(0);
    }
  });

  it('every English translation key has an exact corresponding Hindi key', () => {
    const missingInHindi: string[] = [];

    for (const key of enKeys) {
      if (!translations.hi[key]) {
        missingInHindi.push(key);
      }
    }

    expect(missingInHindi).toEqual([]);
  });

  it('all Hindi translations contain valid non-empty strings and Devanagari characters for common UI labels', () => {
    for (const key of hiKeys) {
      const val = translations.hi[key];
      expect(typeof val).toBe('string');
      expect(val.trim().length).toBeGreaterThan(0);
    }

    // Key UI terms must contain Devanagari script (Unicode range \u0900-\u097F)
    const sampleDevanagariKeys = ['nav.home', 'nav.signin', 'nav.pricing', 'brand.tagline'];
    for (const k of sampleDevanagariKeys) {
      const val = translations.hi[k];
      expect(/[\u0900-\u097F]/.test(val)).toBe(true);
    }
  });
});
