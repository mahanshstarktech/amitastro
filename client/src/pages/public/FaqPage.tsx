import React, { useState, useMemo } from 'react';
import { 
  HelpCircle, 
  Search, 
  ChevronDown, 
  Sparkles, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  Compass, 
  FileText, 
  CreditCard, 
  MessageCircle, 
  Phone,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface FaqItem {
  id: string;
  category: 'birth_data' | 'prep' | 'vastu' | 'reports' | 'payments' | 'general';
  categoryLabel: string;
  question: string;
  answer: string;
}

const FAQ_DATABASE: FaqItem[] = [
  // 1. Birth Details & Kundli
  {
    id: 'birth-exact-time',
    category: 'birth_data',
    categoryLabel: 'Birth Details & Kundli',
    question: 'What if I do not know my exact time of birth?',
    answer: 'If you have an approximate time (e.g., between 2:00 PM and 3:00 PM), Amit uses classical Birth Time Rectification (BTR, or Tattva Shodhana). By cross-referencing significant past milestones in your life—such as educational graduations, major injuries, marriage date, child birth, or career promotions—the precise ascendant degree (Lagna) and Navamsha chart (D9) can be reverse-engineered mathematically. Alternatively, for pressing specific queries, Prashna Kundli (Horary astrology cast for the exact moment of your inquiry) provides startlingly accurate answers without any birth time.'
  },
  {
    id: 'birth-approximate',
    category: 'birth_data',
    categoryLabel: 'Birth Details & Kundli',
    question: 'Can a birth time variance of 5–10 minutes alter the reading?',
    answer: 'In the primary Janma Kundli (D1 chart), the ascendant (Lagna) changes approximately once every two hours. A 5-minute variance rarely changes the main houses. However, fine-grained divisional charts like the Navamsha (D9 - marriage & fortune) and Dashamsha (D10 - career pinnacle) shift more rapidly. Amit verifies past life tendencies during the opening 5 minutes of your session to ensure the chart is perfectly calibrated before delivering predictions.'
  },
  {
    id: 'ayanamsha-system',
    category: 'birth_data',
    categoryLabel: 'Birth Details & Kundli',
    question: 'Which astrological system, ephemeris, and Ayanamsha does Amit use?',
    answer: 'Amit strictly employs the time-honored Vedic Parashari and Jaimini systems using the classical Lahiri (Chitrapaksha) Ayanamsha—the authoritative standard recognized by the Government of India and the Indian Astronomical Ephemeris. We do not use tropical (Western) zodiacs, as Vedic sidereal astrology measures true, physical astronomical planetary alignments.'
  },
  {
    id: 'family-charts',
    category: 'birth_data',
    categoryLabel: 'Birth Details & Kundli',
    question: 'Can I analyze horoscopes for my family members, spouse, or children?',
    answer: 'Yes! Depending on your booked package (such as the Detailed Life Blueprint or Matchmaking Consultation), you can discuss up to 2–3 family horoscopes. When booking, simply add their birth timestamps and relationship to you in the intake notes.'
  },

  // 2. Preparing for Consultation
  {
    id: 'prep-before-call',
    category: 'prep',
    categoryLabel: 'Consultation Preparation',
    question: 'How should I prepare before joining my consultation with Amit?',
    answer: 'We recommend being seated in a quiet, undisturbed room with a stable internet connection. Prepare a written list of your top 3 to 5 most urgent questions or decisions (e.g., career pivot, relocation abroad, relationship compatibility, health vulnerabilities). Keep a notebook and pen handy. Amit begins with a holistic overview of your running Vimshottari Mahadasha and Antardasha before opening the floor to your personal inquiries.'
  },
  {
    id: 'languages-spoken',
    category: 'prep',
    categoryLabel: 'Consultation Preparation',
    question: 'What languages does Astrologer Amit consult in?',
    answer: 'Amit conducts consultations fluently in both English and Hindi (हिंदी). You are free to speak whichever language feels most comfortable and natural for your deepest personal thoughts.'
  },
  {
    id: 'recording-allowed',
    category: 'prep',
    categoryLabel: 'Consultation Preparation',
    question: 'Am I allowed to record the video or phone consultation?',
    answer: 'Absolutely. You are warmly encouraged to record your consultation for personal spiritual reflection. Because Vedic consultations are packed with dates, transit windows, and remedial nuances, listening back months later often unlocks fresh clarity.'
  },
  {
    id: 'joint-calls',
    category: 'prep',
    categoryLabel: 'Consultation Preparation',
    question: 'Can my spouse, parent, or business partner join the meeting?',
    answer: 'Yes. For relationship consultations, Kundli Milan, or commercial business partnerships, having both partners present on the Google Meet or phone bridge creates alignment and mutual clarity.'
  },

  // 3. Vastu Shastra
  {
    id: 'vastu-no-demolition',
    category: 'vastu',
    categoryLabel: 'Vastu Shastra Consultations',
    question: 'Do Amit’s Vastu remedies require demolishing walls or breaking structures?',
    answer: 'Never. Amit is a staunch advocate of "Zero-Demolition Vastu" (Non-destructive spatial harmony). Classical Vastu Shastra teaches that elemental imbalances (Earth, Water, Fire, Air, Space) can be corrected using elemental metals (brass, copper, lead wires), spatial color balancing, sacred geometric yantras, reflective mirrors, and correct room function alignment without breaking a single brick.'
  },
  {
    id: 'vastu-blueprints',
    category: 'vastu',
    categoryLabel: 'Vastu Shastra Consultations',
    question: 'What materials do I need to share for a residential or commercial Vastu assessment?',
    answer: 'A simple floor plan or architectural layout of your property showing the main entrance, kitchen, master bedroom, and restrooms, along with an accurate compass degree reading of the main entrance door taken with any smartphone compass app. You can upload these drawings directly to your Customer Portal or send them via WhatsApp.'
  },

  // 4. Reports & Delivery
  {
    id: 'report-turnaround',
    category: 'reports',
    categoryLabel: 'Written Reports & Delivery',
    question: 'When will I receive my written Kundli or Vastu PDF report?',
    answer: 'For packages that include written deliverables, your personalized, hand-annotated PDF report is delivered within 24 to 48 business hours after your live consultation. It is sent as an encrypted email attachment and also saved permanently under your Customer Portal.'
  },
  {
    id: 'follow-up-chat',
    category: 'reports',
    categoryLabel: 'Written Reports & Delivery',
    question: 'How does the 30-Day Follow-Up Chat window work?',
    answer: 'After your consultation, we provide a complimentary 30-day text portal window. If you forget to ask a question during the call, need guidance on performing a recommended mantra, or need clarification on a gemstone, you can message Amit directly through your Customer Portal dashboard.'
  },

  // 5. Payments & Security
  {
    id: 'payment-methods',
    category: 'payments',
    categoryLabel: 'Payments & Invoicing',
    question: 'What payment modes are accepted? Can international clients pay?',
    answer: 'We support all major domestic and international payment gateways. Within India, we accept UPI (Google Pay, PhonePe, Paytm, BHIM), Net Banking across 50+ banks, and all Credit/Debit cards (Visa, MasterCard, RuPay). International seekers (USA, UK, Canada, Australia, UAE, Europe, etc.) can pay seamlessly in USD, GBP, EUR, or AUD using international credit cards via our Stripe & Razorpay global gateways.'
  },
  {
    id: 'gst-invoices',
    category: 'payments',
    categoryLabel: 'Payments & Invoicing',
    question: 'Do you provide formal GST invoices for business consultations?',
    answer: 'Yes. Commercial Vastu audits and corporate astrology consultations are eligible for formal GST tax invoices. Simply enter your company name and GSTIN during checkout or email billing@amitastro.com.'
  },

  // 6. General & Philosophy
  {
    id: 'ethical-fearless',
    category: 'general',
    categoryLabel: 'Our Philosophy & Ethics',
    question: 'How is Amit Astro different from other online astrology platforms?',
    answer: 'Three core principles set Amit apart: 1) Absolute Zero Fear-Mongering: We never frighten seekers with Manglik doshas or Sade Sati to sell expensive pujas; 2) No Commercial Superstition: We prioritize self-effort (Purushartha), meditation, and ethical lifestyle remedies; 3) Unhurried Personal Mastery: You speak directly with Astrologer Amit, not an untrained junior apprentice or automated chat bot.'
  },
  {
    id: 'free-discovery-call',
    category: 'general',
    categoryLabel: 'Our Philosophy & Ethics',
    question: 'How does the 5-Minute Free Discovery Call work?',
    answer: 'If you are a first-time seeker uncertain about which package suits your needs, you can book a complimentary 5-minute introductory audio call with Amit. He will examine your primary birth chart coordinates and outline the key planetary areas that warrant deeper exploration.'
  }
];

interface FaqPageProps {
  onNavigate: (path: string) => void;
  onOpenBooking: (pkgId?: string) => void;
  onOpenTrial: () => void;
}

export const FaqPage: React.FC<FaqPageProps> = ({ onNavigate, onOpenBooking, onOpenTrial }) => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>('birth-exact-time');

  const categories = [
    { id: 'all', label: 'All Questions' },
    { id: 'birth_data', label: 'Birth Details & Kundli' },
    { id: 'prep', label: 'Preparation & Call Format' },
    { id: 'vastu', label: 'Vastu Consultations' },
    { id: 'reports', label: 'Reports & 30-Day Chat' },
    { id: 'payments', label: 'Payments & Invoicing' },
    { id: 'general', label: 'Philosophy & Ethics' },
  ];

  const filteredFaqs = useMemo(() => {
    return FAQ_DATABASE.filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        item.question.toLowerCase().includes(q) || 
        item.answer.toLowerCase().includes(q) ||
        item.categoryLabel.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 96, backgroundColor: '#FAFAFC' }}>
      {/* Hero Header */}
      <section style={{ backgroundColor: '#F5F5F7', padding: '64px 0 44px', borderBottom: '1px solid #E5E5EA', textAlign: 'center' }}>
        <div className="container">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} className="apple-badge-primary">
            <HelpCircle size={14} color="#3A3A6E" />
            <span>Help Center & Knowledge Base</span>
          </div>
          <h1 className="text-display" style={{ fontSize: 40, marginTop: 12, marginBottom: 10, letterSpacing: '-0.02em' }}>
            Frequently Asked Questions
          </h1>
          <p className="text-body-large" style={{ maxWidth: 640, margin: '0 auto', color: '#6E6E73', fontSize: 16 }}>
            Everything you need to know about birth chart casting, preparation, non-destructive Vastu, and ethical Vedic consultations with Amit.
          </p>

          {/* Search Input Bar */}
          <div style={{ maxWidth: 540, margin: '28px auto 0', position: 'relative' }}>
            <Search 
              size={18} 
              color="#86868B" 
              style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} 
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions (e.g., birth time, Vastu, recordings, refund)..."
              className="apple-input"
              style={{
                width: '100%',
                padding: '14px 18px 14px 44px',
                fontSize: 15,
                borderRadius: 9999,
                backgroundColor: '#FFFFFF',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
                border: '1px solid #D2D2D7'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  fontSize: 12,
                  color: '#86868B',
                  cursor: 'pointer'
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="container" style={{ maxWidth: 940, marginTop: 40 }}>
        {/* Category Pills */}
        <div 
          style={{ 
            display: 'flex', 
            gap: 8, 
            overflowX: 'auto', 
            paddingBottom: 12, 
            marginBottom: 36,
            scrollbarWidth: 'thin',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {categories.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '9px 18px',
                  borderRadius: 9999,
                  border: active ? '1px solid #3A3A6E' : '1px solid #E5E5EA',
                  backgroundColor: active ? '#3A3A6E' : '#FFFFFF',
                  color: active ? '#FFFFFF' : '#1D1D1F',
                  fontSize: 13.5,
                  fontWeight: active ? 600 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: active ? '0 2px 8px rgba(58, 58, 110, 0.2)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Results Count & Items */}
        <div style={{ marginBottom: 20, fontSize: 13.5, color: '#86868B' }}>
          Showing {filteredFaqs.length} {filteredFaqs.length === 1 ? 'question' : 'questions'}
          {searchQuery && ` matching "${searchQuery}"`}
        </div>

        {filteredFaqs.length === 0 ? (
          <div 
            className="apple-card" 
            style={{ 
              padding: '60px 24px', 
              textAlign: 'center', 
              backgroundColor: '#FFFFFF',
              borderRadius: 20
            }}
          >
            <HelpCircle size={40} color="#86868B" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: 20, fontWeight: 600, color: '#1D1D1F', marginBottom: 8 }}>
              No matching answers found
            </h3>
            <p style={{ color: '#6E6E73', maxWidth: 440, margin: '0 auto 24px', fontSize: 14.5 }}>
              Try searching with a different term, or reach out to our team directly via WhatsApp or Email.
            </p>
            <a
              href="https://wa.me/919876543210?text=Namaste%20Amit%20ji,%20I%20have%20a%20question%20regarding%20consultations."
              target="_blank"
              rel="noreferrer"
              className="apple-btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', textDecoration: 'none' }}
            >
              <MessageCircle size={16} /> Chat on WhatsApp
            </a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredFaqs.map((faq) => {
              const isOpen = expandedId === faq.id;
              return (
                <div
                  key={faq.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 16,
                    border: isOpen ? '1px solid #3A3A6E' : '1px solid #E5E5EA',
                    boxShadow: isOpen ? '0 4px 16px rgba(58, 58, 110, 0.08)' : '0 1px 4px rgba(0,0,0,0.02)',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    overflow: 'hidden'
                  }}
                >
                  <button
                    onClick={() => setExpandedId(isOpen ? null : faq.id)}
                    style={{
                      width: '100%',
                      padding: '20px 24px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      gap: 16
                    }}
                  >
                    <div>
                      <span 
                        style={{ 
                          fontSize: 11.5, 
                          fontWeight: 600, 
                          color: '#3A3A6E', 
                          textTransform: 'uppercase', 
                          letterSpacing: '0.04em',
                          display: 'block',
                          marginBottom: 4
                        }}
                      >
                        {faq.categoryLabel}
                      </span>
                      <span style={{ fontSize: 16.5, fontWeight: 600, color: '#1D1D1F', lineHeight: 1.4 }}>
                        {faq.question}
                      </span>
                    </div>

                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 9999,
                        backgroundColor: isOpen ? '#3A3A6E' : '#F5F5F7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isOpen ? '#FFFFFF' : '#1D1D1F',
                        flexShrink: 0,
                        transition: 'transform 0.25s ease, background-color 0.2s ease',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                      }}
                    >
                      <ChevronDown size={18} />
                    </div>
                  </button>

                  {isOpen && (
                    <div 
                      style={{ 
                        padding: '0 24px 24px', 
                        color: '#424245', 
                        fontSize: 15, 
                        lineHeight: 1.75,
                        borderTop: '1px solid #F5F5F7',
                        paddingTop: 16
                      }}
                    >
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Quick Help Card Banner */}
        <div 
          className="apple-card" 
          style={{ 
            marginTop: 48, 
            padding: '36px 32px', 
            backgroundColor: '#F5F5F7', 
            borderRadius: 24,
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 24
          }}
        >
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#3A3A6E' }}>
              Direct Personal Guidance
            </span>
            <h3 style={{ fontSize: 22, fontWeight: 700, color: '#1D1D1F', marginTop: 4, marginBottom: 6 }}>
              Have a Specific or Sensitive Inquiry?
            </h3>
            <p style={{ color: '#6E6E73', fontSize: 14.5, maxWidth: 480, margin: 0 }}>
              Speak directly with Amit’s scheduling coordinator for emergency slots, custom family horoscopes, or corporate Vastu visits.
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <a
              href="https://wa.me/919876543210?text=Namaste%20Amit%20ji,%20I%20would%20like%20to%20inquire%20about%20a%20consultation."
              target="_blank"
              rel="noreferrer"
              className="apple-btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '12px 20px', textDecoration: 'none', fontSize: 14 }}
            >
              <MessageCircle size={16} color="#2FA84F" /> WhatsApp
            </a>

            <button
              onClick={() => onOpenBooking()}
              className="apple-btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '12px 22px', fontSize: 14 }}
            >
              Book Consultation <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
