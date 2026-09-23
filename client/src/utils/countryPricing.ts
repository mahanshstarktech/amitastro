export interface CountryPackagePrices {
  quick: {
    amount: number;
    formatted: string;
    costPerMin: string;
    label: string;
  };
  standard: {
    amount: number;
    formatted: string;
    costPerMin: string;
    label: string;
  };
  premium: {
    amount: number;
    formatted: string;
    costPerMin: string;
    label: string;
  };
}

export interface CountryInfo {
  code: string;
  name: string;
  currency: string;
  currencySymbol: string;
  flagEmoji: string;
  flagImage: string; // Path to 3D waving satin silk flag
  flagColors: [string, string, string]; // Top, middle, bottom for ambient glow
  prices: CountryPackagePrices;
}

export const COUNTRIES: Record<string, CountryInfo> = {
  IN: {
    code: 'IN',
    name: 'India',
    currency: 'INR',
    currencySymbol: '₹',
    flagEmoji: '🇮🇳',
    flagImage: '/flags/in.jpg',
    flagColors: ['#FF9933', '#FFFFFF', '#138808'],
    prices: {
      quick: {
        amount: 1100,
        formatted: '₹1,100',
        costPerMin: '₹73.33/min',
        label: '15-Minute Focused Phone Call'
      },
      standard: {
        amount: 2100,
        formatted: '₹2,100',
        costPerMin: '₹70.00/min',
        label: '30-Minute Comprehensive Call'
      },
      premium: {
        amount: 5100,
        formatted: '₹5,100',
        costPerMin: '₹85.00/min',
        label: '45–60 min in-depth call'
      }
    }
  },
  DE: {
    code: 'DE',
    name: 'Germany',
    currency: 'EUR',
    currencySymbol: '€',
    flagEmoji: '🇩🇪',
    flagImage: '/flags/de.jpg',
    flagColors: ['#000000', '#FF0000', '#FFCC00'],
    prices: {
      quick: {
        amount: 55,
        formatted: '€55',
        costPerMin: '€3.67/min',
        label: '15-Minute Direct Consultation'
      },
      standard: {
        amount: 115,
        formatted: '€115',
        costPerMin: '€3.83/min',
        label: '30-Minute Comprehensive Call'
      },
      premium: {
        amount: 219,
        formatted: '€219',
        costPerMin: '€3.65/min',
        label: '45–60 min in-depth call'
      }
    }
  },
  GB: {
    code: 'GB',
    name: 'United Kingdom',
    currency: 'GBP',
    currencySymbol: '£',
    flagEmoji: '🇬🇧',
    flagImage: '/flags/gb.jpg',
    flagColors: ['#012169', '#FFFFFF', '#C8102E'],
    prices: {
      quick: {
        amount: 49,
        formatted: '£49',
        costPerMin: '£3.27/min',
        label: '15-Minute Direct Consultation'
      },
      standard: {
        amount: 99,
        formatted: '£99',
        costPerMin: '£3.30/min',
        label: '30-Minute Comprehensive Call'
      },
      premium: {
        amount: 189,
        formatted: '£189',
        costPerMin: '£3.15/min (Highest Value)',
        label: '45–60 min in-depth call'
      }
    }
  },
  AE: {
    code: 'AE',
    name: 'Dubai / UAE',
    currency: 'AED',
    currencySymbol: 'AED ',
    flagEmoji: '🇦🇪',
    flagImage: '/flags/ae.jpg',
    flagColors: ['#00732F', '#FFFFFF', '#000000'],
    prices: {
      quick: {
        amount: 100,
        formatted: '100 AED',
        costPerMin: '6.67 AED/min',
        label: '15-Minute Dedicated Call'
      },
      standard: {
        amount: 250,
        formatted: '250 AED',
        costPerMin: '8.33 AED/min',
        label: '30-Minute Comprehensive Call'
      },
      premium: {
        amount: 500,
        formatted: '500 AED',
        costPerMin: '8.33 AED/min',
        label: '45–60 min in-depth call'
      }
    }
  },
  US: {
    code: 'US',
    name: 'United States',
    currency: 'USD',
    currencySymbol: '$',
    flagEmoji: '🇺🇸',
    flagImage: '/flags/us.jpg',
    flagColors: ['#B22234', '#FFFFFF', '#3C3B6E'],
    prices: {
      quick: {
        amount: 59,
        formatted: '$59',
        costPerMin: '$3.93/min',
        label: '15-Minute Direct Consultation'
      },
      standard: {
        amount: 129,
        formatted: '$129',
        costPerMin: '$4.30/min',
        label: '30-Minute Comprehensive Call'
      },
      premium: {
        amount: 239,
        formatted: '$239',
        costPerMin: '$3.98/min (Highest Value)',
        label: '45–60 min in-depth call'
      }
    }
  },
  AU: {
    code: 'AU',
    name: 'Australia',
    currency: 'AUD',
    currencySymbol: 'A$',
    flagEmoji: '🇦🇺',
    flagImage: '/flags/au.jpg',
    flagColors: ['#00008B', '#FFFFFF', '#FF0000'],
    prices: {
      quick: {
        amount: 89,
        formatted: 'A$89',
        costPerMin: 'A$5.93/min',
        label: '15-Minute Direct Consultation'
      },
      standard: {
        amount: 189,
        formatted: 'A$189',
        costPerMin: 'A$6.30/min',
        label: '30-Minute Comprehensive Call'
      },
      premium: {
        amount: 359,
        formatted: 'A$359',
        costPerMin: 'A$5.98/min',
        label: '45–60 min in-depth call'
      }
    }
  },
  CA: {
    code: 'CA',
    name: 'Canada',
    currency: 'CAD',
    currencySymbol: 'C$',
    flagEmoji: '🇨🇦',
    flagImage: '/flags/ca.jpg',
    flagColors: ['#FF0000', '#FFFFFF', '#FF0000'],
    prices: {
      quick: {
        amount: 79,
        formatted: 'C$79',
        costPerMin: 'C$5.27/min',
        label: '15-Minute Direct Consultation'
      },
      standard: {
        amount: 169,
        formatted: 'C$169',
        costPerMin: 'C$5.63/min',
        label: '30-Minute Comprehensive Call'
      },
      premium: {
        amount: 329,
        formatted: 'C$329',
        costPerMin: 'C$5.48/min',
        label: '45–60 min in-depth call'
      }
    }
  },
  EU: {
    code: 'EU',
    name: 'Europe',
    currency: 'EUR',
    currencySymbol: '€',
    flagEmoji: '🇪🇺',
    flagImage: '/flags/eu.jpg',
    flagColors: ['#003399', '#FFCC00', '#003399'],
    prices: {
      quick: {
        amount: 55,
        formatted: '€55',
        costPerMin: '€3.67/min',
        label: '15-Minute Direct Consultation'
      },
      standard: {
        amount: 115,
        formatted: '€115',
        costPerMin: '€3.83/min',
        label: '30-Minute Comprehensive Call'
      },
      premium: {
        amount: 219,
        formatted: '€219',
        costPerMin: '€3.65/min',
        label: '45–60 min in-depth call'
      }
    }
  },
  RU: {
    code: 'RU',
    name: 'Russia',
    currency: 'RUB',
    currencySymbol: '₽',
    flagEmoji: '🇷🇺',
    flagImage: '/flags/ru.jpg',
    flagColors: ['#FFFFFF', '#0039A6', '#D52B1E'],
    prices: {
      quick: {
        amount: 5400,
        formatted: '₽5,400',
        costPerMin: '₽360/min',
        label: '15-Minute Direct Consultation'
      },
      standard: {
        amount: 11500,
        formatted: '₽11,500',
        costPerMin: '₽383/min',
        label: '30-Minute Comprehensive Call'
      },
      premium: {
        amount: 22000,
        formatted: '₽22,000',
        costPerMin: '₽366/min',
        label: '45–60 min in-depth call'
      }
    }
  }
};

/**
 * Detect real country bypassing VPNs by inspecting device OS timezone & locale
 */
export function detectRealCountry(): string {
  // Check user manual override in localStorage first
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('amit_country_override');
    if (saved && COUNTRIES[saved]) {
      return saved;
    }
  }

  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const lowerTz = tz.toLowerCase();

    // 1. INDIA: Kolkata, Calcutta, Asia/Calcutta, IST
    if (lowerTz.includes('calcutta') || lowerTz.includes('kolkata') || lowerTz.includes('india')) {
      return 'IN';
    }

    // 2. GERMANY: Berlin, Busingen, Germany
    if (lowerTz.includes('berlin') || lowerTz.includes('busingen') || lowerTz.includes('germany')) {
      return 'DE';
    }

    // 3. DUBAI / UAE: Dubai, Muscat, Abu_Dhabi
    if (lowerTz.includes('dubai') || lowerTz.includes('muscat') || lowerTz.includes('abu_dhabi')) {
      return 'AE';
    }

    // 4. UNITED KINGDOM: London, Belfast, Isle_of_Man, Jersey, Guernsey
    if (lowerTz.includes('london') || lowerTz.includes('belfast') || lowerTz.includes('isle_of_man') || lowerTz.includes('jersey') || lowerTz.includes('guernsey')) {
      return 'GB';
    }

    // 5. UNITED STATES: America/* except Toronto, Montreal, Vancouver, etc.
    if (
      lowerTz.includes('new_york') || lowerTz.includes('chicago') || lowerTz.includes('los_angeles') ||
      lowerTz.includes('denver') || lowerTz.includes('phoenix') || lowerTz.includes('detroit') ||
      lowerTz.includes('indiana') || lowerTz.includes('boise') || lowerTz.includes('anchorage') ||
      lowerTz.includes('honolulu') || lowerTz.includes('central') || lowerTz.includes('eastern') ||
      lowerTz.includes('pacific') || lowerTz.includes('mountain')
    ) {
      return 'US';
    }

    // 6. AUSTRALIA: Sydney, Melbourne, Brisbane, Perth, Adelaide, Hobart, Darwin
    if (
      lowerTz.includes('sydney') || lowerTz.includes('melbourne') || lowerTz.includes('brisbane') ||
      lowerTz.includes('perth') || lowerTz.includes('adelaide') || lowerTz.includes('hobart') ||
      lowerTz.includes('darwin') || lowerTz.includes('canberra') || lowerTz.includes('australia')
    ) {
      return 'AU';
    }

    // 7. CANADA: Toronto, Vancouver, Montreal, Edmonton, Winnipeg, Halifax, St_Johns
    if (
      lowerTz.includes('toronto') || lowerTz.includes('vancouver') || lowerTz.includes('montreal') ||
      lowerTz.includes('edmonton') || lowerTz.includes('winnipeg') || lowerTz.includes('halifax') ||
      lowerTz.includes('canada')
    ) {
      return 'CA';
    }

    // 8. RUSSIA: Moscow, Samara, Yekaterinburg, Omsk, Krasnoyarsk, Irkutsk, Vladivostok
    if (
      lowerTz.includes('moscow') || lowerTz.includes('samara') || lowerTz.includes('yekaterinburg') ||
      lowerTz.includes('omsk') || lowerTz.includes('krasnoyarsk') || lowerTz.includes('irkutsk') ||
      lowerTz.includes('vladivostok') || lowerTz.includes('russia')
    ) {
      return 'RU';
    }

    // 9. EUROPE: Paris, Madrid, Rome, Amsterdam, Brussels, Vienna, Zurich, Stockholm, Warsaw
    if (
      lowerTz.includes('paris') || lowerTz.includes('madrid') ||
      lowerTz.includes('rome') || lowerTz.includes('amsterdam') || lowerTz.includes('brussels') ||
      lowerTz.includes('vienna') || lowerTz.includes('zurich') || lowerTz.includes('stockholm') ||
      lowerTz.includes('warsaw') || lowerTz.includes('prague') || lowerTz.includes('copenhagen') ||
      lowerTz.includes('oslo') || lowerTz.includes('helsinki') || lowerTz.includes('dublin') ||
      lowerTz.includes('lisbon') || lowerTz.includes('athens') || lowerTz.includes('budapest')
    ) {
      return 'EU';
    }

    // Secondary check: navigator languages
    if (typeof navigator !== 'undefined') {
      const langs = navigator.languages || [navigator.language || ''];
      const langStr = langs.join(',').toLowerCase();
      if (langStr.includes('-in') || langStr.includes('hi')) return 'IN';
      if (langStr.includes('-de') || langStr.startsWith('de')) return 'DE';
      if (langStr.includes('-ae') || langStr.includes('ar')) return 'AE';
      if (langStr.includes('-gb')) return 'GB';
      if (langStr.includes('-au')) return 'AU';
      if (langStr.includes('-ca')) return 'CA';
      if (langStr.includes('-ru')) return 'RU';
      if (langStr.includes('-fr') || langStr.includes('-it') || langStr.includes('-es')) return 'EU';
      if (langStr.includes('-us')) return 'US';
    }
  } catch {
    // Fallback
  }

  // Default to India if in doubt, as it's the home Vedic practice
  return 'IN';
}

/**
 * Get country info by code, with safe fallback to India
 */
export function getCountryInfo(code: string): CountryInfo {
  return COUNTRIES[code] || COUNTRIES.IN;
}
