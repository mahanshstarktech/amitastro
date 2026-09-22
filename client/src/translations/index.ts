export type Language = 'en' | 'hi';

export interface TranslationDictionary {
  [key: string]: string;
}

export const translations: Record<Language, TranslationDictionary> = {
  en: {
    // Brand & Astrologer
    'brand.name': 'Amit Astro',
    'brand.tagline': 'Vedic Astrology & Vastu Consultation',
    'brand.astrologer': 'Amit · Vedic Astrologer',
    'brand.astrologer_name': 'Amit',
    'brand.consultation_with': 'Consultation with Amit',

    // Navigation
    'nav.home': 'Home',
    'nav.blog': 'Articles',
    'nav.about': 'About Amit',
    'nav.pricing': 'Pricing & Packages',
    'nav.contact': 'Contact',
    'nav.signin': 'Sign In',
    'nav.signout': 'Sign Out',
    'nav.portal': 'Portal',
    'nav.admin': 'Admin',
    'nav.book_now': 'Book Consultation',
    'nav.trial': '5-Min Trial',
    'nav.install': 'Install App',
    'nav.settings': 'Settings',
    'nav.language': 'Language',

    // Hero Section
    'hero.badge': 'Trusted Vedic Wisdom for Clarity & Direction',
    'hero.title_part1': 'Navigate Life’s Pivots with',
    'hero.title_part2': 'Authentic Vedic Astrology',
    'hero.subtitle': 'Clear, calm, and actionable Kundli analysis, career direction, marriage compatibility, and Vastu remedies by Amit. No superstition — only timeless mathematical precision.',
    'hero.cta_primary': 'Book Paid Consultation',
    'hero.cta_trial': 'Start Free 5-Min Discovery Call',
    'hero.guarantee_title': '100% Confidential',
    'hero.guarantee_desc': 'Direct 1-on-1 private consultation with Amit',
    'hero.stat_experience': 'Years of Vedic Mastery',
    'hero.stat_consultations': 'Satisfied Consultations',
    'hero.stat_accuracy': 'Predictive Accuracy Rating',

    // Services
    'services.title': 'Holistic Vedic Guidance',
    'services.subtitle': 'Tailored sessions addressing every dimension of your life blueprint',
    'services.kundli_title': 'Complete Kundli Breakdown',
    'services.kundli_desc': 'In-depth analysis of your Janma Kundli, planetary strengths (Shadbala), and Dasha timing.',
    'services.career_title': 'Career & Wealth Timing',
    'services.career_desc': 'Pinpoint optimal periods for business launches, job transitions, and wealth accumulation.',
    'services.relationship_title': 'Matchmaking & Marriage',
    'services.relationship_desc': 'Ashtakoota Milan, Manglik dosha resolution, and deep relationship compatibility.',
    'services.vastu_title': 'Vastu Shastra Remedies',
    'services.vastu_desc': 'Harmonize the energy currents of your home or office space without structural destruction.',

    // Pricing & Packages
    'pricing.title': 'Transparent & Purposeful Pricing',
    'pricing.subtitle': 'Choose the session that best aligns with your questions and life stage',
    'pricing.popular': 'Most Popular',
    'pricing.mins': 'mins',
    'pricing.book_btn': 'Book Consultation',
    'pricing.free_badge': 'Free for New Clients',
    'pricing.followup_badge': 'Day Free WhatsApp Follow-up Included',
    'pricing.includes': 'Session Includes:',

    // Booking Modal
    'booking.title': 'Book Your Session with Amit',
    'booking.step1': 'Select Package',
    'booking.step2': 'Birth Details',
    'booking.step3': 'Date & Time',
    'booking.step4': 'Payment Confirmation',
    'booking.full_name': 'Full Name',
    'booking.dob': 'Date of Birth',
    'booking.tob': 'Time of Birth',
    'booking.tob_uncertain': 'Exact time is uncertain',
    'booking.pob': 'Place of Birth (City, State)',
    'booking.notes': 'Key Concerns / Questions for Amit',
    'booking.select_date': 'Select Preferred Date',
    'booking.select_time': 'Select Time Window',
    'booking.proceed_payment': 'Proceed to Payment',
    'booking.upi_title': 'Scan & Pay via UPI',
    'booking.utr_placeholder': 'Enter 12-Digit UPI / UTR Reference',
    'booking.submit_booking': 'Submit & Confirm Booking',

    // Trial Modal
    'trial.title': '5-Minute Complimentary Discovery Call',
    'trial.subtitle': 'Experience authentic astrological clarity with Amit with zero upfront commitment.',
    'trial.start_btn': 'Start 5-Minute Call Now',
    'trial.notice': 'Available exclusively once for first-time visitors.',

    // Settings (Mobile & Desktop)
    'settings.title': 'Settings',
    'settings.language_title': 'Language (भाषा)',
    'settings.language_desc': 'Choose your preferred display language',
    'settings.lang_en': 'English',
    'settings.lang_hi': 'हिन्दी (Hindi)',
    'settings.account': 'Account & Profile',
    'settings.verified': 'Verified',
    'settings.unverified': 'Pending Verification',
    'settings.app_version': 'Amit Astro Web App v1.2',

    // Footer
    'footer.disclaimer': 'Astrological consultations and Vastu guidance are spiritual advisory practices. They empower personal decision-making and are not a replacement for certified medical, legal, or financial professionals.',
    'footer.rights': 'All rights reserved.',
    'footer.privacy': 'Privacy Policy',
    'footer.terms': 'Terms of Service',
    'footer.refunds': 'Refund Policy'
  },
  hi: {
    // Brand & Astrologer
    'brand.name': 'अमित एस्ट्रो',
    'brand.tagline': 'वैदिक ज्योतिष एवं वास्तु परामर्श',
    'brand.astrologer': 'अमित · वैदिक ज्योतिषी',
    'brand.astrologer_name': 'अमित',
    'brand.consultation_with': 'अमित से परामर्श लें',

    // Navigation
    'nav.home': 'होम',
    'nav.blog': 'लेख',
    'nav.about': 'अमित के बारे में',
    'nav.pricing': 'परामर्श शुल्क',
    'nav.contact': 'संपर्क',
    'nav.signin': 'लॉग इन',
    'nav.signout': 'लॉग आउट',
    'nav.portal': 'ग्राहक पोर्टल',
    'nav.admin': 'व्यवस्थापक',
    'nav.book_now': 'परामर्श बुक करें',
    'nav.trial': '5 मिनट निःशुल्क',
    'nav.install': 'ऐप इंस्टॉल करें',
    'nav.settings': 'सेटिंग्स',
    'nav.language': 'भाषा',

    // Hero Section
    'hero.badge': 'सटीक वैदिक ज्ञान — स्पष्टता और सही मार्गदर्शन',
    'hero.title_part1': 'जीवन के हर मोड़ पर पाएँ',
    'hero.title_part2': 'सटीक वैदिक ज्योतिषीय समाधान',
    'hero.subtitle': 'अमित द्वारा कुंडली विश्लेषण, करियर दिशा, विवाह मिलान और सरल वास्तु उपाय। अंधविश्वास नहीं — केवल वेदों का कालजयी गणितीय ज्ञान।',
    'hero.cta_primary': 'परामर्श बुक करें',
    'hero.cta_trial': '5 मिनट निःशुल्क परामर्श शुरू करें',
    'hero.guarantee_title': '100% गोपनीय एवं सुरक्षित',
    'hero.guarantee_desc': 'अमित के साथ सीधी व्यक्तिगत परामर्श चर्चा',
    'hero.stat_experience': 'वर्षों का वैदिक अनुभव',
    'hero.stat_consultations': 'संतुष्ट परामर्शदाता',
    'hero.stat_accuracy': 'भविष्यवाणी सटीकता रेटिंग',

    // Services
    'services.title': 'संपूर्ण वैदिक मार्गदर्शन',
    'services.subtitle': 'आपके जीवन के प्रत्येक पहलू के लिए व्यक्तिगत परामर्श',
    'services.kundli_title': 'संपूर्ण जन्म कुंडली विश्लेषण',
    'services.kundli_desc': 'आपकी लग्न कुंडली, नवमांश, षोडशवर्ग, ग्रह बल और दशा चक्र का गहन विश्लेषण।',
    'services.career_title': 'करियर, व्यापार एवं धन योग',
    'services.career_desc': 'व्यापार शुरू करने, नौकरी परिवर्तन एवं धन संचय के लिए सबसे शुभ समय का निर्धारण।',
    'services.relationship_title': 'विवाह एवं कुंडली मिलान',
    'services.relationship_desc': 'अष्टकूट गुण मिलान, मांगलिक दोष निवारण और वैवाहिक सामंजस्य का सटीक विश्लेषण।',
    'services.vastu_title': 'सरल वास्तु शास्त्र उपाय',
    'services.vastu_desc': 'बिना किसी तोड़-फोड़ के अपने घर और कार्यक्षेत्र की सकारात्मक ऊर्जा को संतुलित करें।',

    // Pricing & Packages
    'pricing.title': 'पारदर्शी एवं स्पष्ट परामर्श शुल्क',
    'pricing.subtitle': 'अपनी आवश्यकता और प्रश्नों के अनुसार उपयुक्त सत्र का चयन करें',
    'pricing.popular': 'सर्वाधिक लोकप्रिय',
    'pricing.mins': 'मिनट',
    'pricing.book_btn': 'सत्र बुक करें',
    'pricing.free_badge': 'नए ग्राहकों के लिए निःशुल्क',
    'pricing.followup_badge': 'दिन का निःशुल्क व्हाट्सएप फॉलो-अप शामिल',
    'pricing.includes': 'सत्र में शामिल है:',

    // Booking Modal
    'booking.title': 'अमित के साथ परामर्श बुक करें',
    'booking.step1': 'पैकेज चुनें',
    'booking.step2': 'जन्म विवरण',
    'booking.step3': 'दिनांक एवं समय',
    'booking.step4': 'भुगतान एवं पुष्टि',
    'booking.full_name': 'पूरा नाम',
    'booking.dob': 'जन्म तिथि',
    'booking.tob': 'जन्म समय',
    'booking.tob_uncertain': 'सटीक जन्म समय ज्ञात नहीं है',
    'booking.pob': 'जन्म स्थान (शहर, राज्य)',
    'booking.notes': 'अमित से पूछे जाने वाले मुख्य प्रश्न / समस्या',
    'booking.select_date': 'पसंदीदा तिथि चुनें',
    'booking.select_time': 'समय चुनें',
    'booking.proceed_payment': 'भुगतान के लिए आगे बढ़ें',
    'booking.upi_title': 'UPI QR स्कैन करके भुगतान करें',
    'booking.utr_placeholder': '12-अंकों का UPI / UTR नंबर दर्ज करें',
    'booking.submit_booking': 'बुकिंग सबमिट और कन्फर्म करें',

    // Trial Modal
    'trial.title': '5 मिनट का निःशुल्क परामर्श',
    'trial.subtitle': 'अमित के साथ वैदिक ज्योतिषीय स्पष्टता का अनुभव करें — बिना किसी अग्रिम शुल्क के।',
    'trial.start_btn': 'अभी 5 मिनट का कॉल शुरू करें',
    'trial.notice': 'यह सुविधा केवल नए उपयोगकर्ताओं के लिए एक बार उपलब्ध है।',

    // Settings (Mobile & Desktop)
    'settings.title': 'सेटिंग्स',
    'settings.language_title': 'भाषा (Language)',
    'settings.language_desc': 'अपनी पसंदीदा भाषा का चयन करें',
    'settings.lang_en': 'English (अंग्रेज़ी)',
    'settings.lang_hi': 'हिन्दी (Hindi)',
    'settings.account': 'खाता एवं प्रोफ़ाइल',
    'settings.verified': 'सत्यापित (Verified)',
    'settings.unverified': 'सत्यापन शेष',
    'settings.app_version': 'अमित एस्ट्रो वेब ऐप v1.2',

    // Footer
    'footer.disclaimer': 'ज्योतिषीय एवं वास्तु परामर्श व्यक्तिगत निर्णय लेने में सहायक आध्यात्मिक मार्गदर्शक हैं। यह किसी प्रमाणित चिकित्सा, कानूनी या वित्तीय विशेषज्ञ का विकल्प नहीं हैं।',
    'footer.rights': 'सर्वाधिकार सुरक्षित।',
    'footer.privacy': 'गोपनीयता नीति (Privacy Policy)',
    'footer.terms': 'नियम एवं शर्तें (Terms)',
    'footer.refunds': 'रिफंड नीति (Refund Policy)'
  }
};
