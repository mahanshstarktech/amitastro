import React from 'react';
import { Compass, Home, Calendar, HelpCircle, ArrowLeft, BookOpen } from 'lucide-react';

interface NotFoundPageProps {
  onNavigate: (path: string) => void;
  onOpenBooking: () => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onNavigate, onOpenBooking }) => {
  return (
    <div 
      style={{ 
        minHeight: '80vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '60px 24px',
        backgroundColor: '#FBFBFD'
      }}
    >
      <div 
        className="apple-card" 
        style={{ 
          maxWidth: 620, 
          width: '100%', 
          padding: '56px 40px', 
          textAlign: 'center',
          backgroundColor: '#FFFFFF',
          borderRadius: 28,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)',
          border: '1px solid #E5E5EA'
        }}
      >
        {/* Celestial Icon */}
        <div 
          style={{ 
            width: 72, 
            height: 72, 
            borderRadius: 22, 
            backgroundColor: 'rgba(58, 58, 110, 0.08)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 24px',
            color: '#3A3A6E'
          }}
        >
          <Compass size={36} />
        </div>

        <span className="apple-badge-primary" style={{ marginBottom: 12 }}>
          Cosmic Navigation Notice
        </span>

        <h1 className="text-display" style={{ fontSize: 36, marginTop: 8, marginBottom: 12, letterSpacing: '-0.02em' }}>
          Coordinate Not Found (404)
        </h1>

        <p className="text-body-large" style={{ color: '#6E6E73', fontSize: 16, lineHeight: 1.6, marginBottom: 32 }}>
          The planetary path or celestial page you are looking for has either shifted its transit or never existed. Allow us to gently guide you back to clarity.
        </p>

        {/* Quick Route Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 32 }}>
          <button
            onClick={() => onNavigate('/')}
            className="apple-btn-secondary"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 18px', fontSize: 14 }}
          >
            <Home size={16} /> Return to Home
          </button>

          <button
            onClick={() => onNavigate('/pricing')}
            className="apple-btn-secondary"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 18px', fontSize: 14 }}
          >
            <Calendar size={16} /> Consultation Packages
          </button>

          <button
            onClick={() => onNavigate('/blog')}
            className="apple-btn-secondary"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 18px', fontSize: 14 }}
          >
            <BookOpen size={16} /> Articles & Insights
          </button>

          <button
            onClick={() => onNavigate('/faq')}
            className="apple-btn-secondary"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 18px', fontSize: 14 }}
          >
            <HelpCircle size={16} /> Help Center & FAQ
          </button>
        </div>

        <div>
          <button
            onClick={() => onOpenBooking()}
            className="apple-btn-primary"
            style={{ padding: '14px 28px', fontSize: 15 }}
          >
            Book a Consultation with Amit
          </button>
        </div>
      </div>
    </div>
  );
};
