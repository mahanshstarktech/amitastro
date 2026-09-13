import React, { useState } from 'react';
import { Phone, Mail, MapPin, MessageCircle, Clock, Send, CheckCircle2 } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

export const ContactPage: React.FC = () => {
  const { showToast } = useNotification();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    showToast('Message sent! Amit Soni’s team will respond within a few hours.', 'success');
  };

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 96 }}>
      <section style={{ backgroundColor: '#F5F5F7', padding: '64px 0 48px', borderBottom: '1px solid #E5E5EA', textAlign: 'center' }}>
        <div className="container">
          <span className="apple-badge-primary">Direct Inquiries</span>
          <h1 className="text-display" style={{ fontSize: 44, marginTop: 10, marginBottom: 12 }}>
            Get in Touch with Amit Soni
          </h1>
          <p className="text-body-large" style={{ maxWidth: 600, margin: '0 auto' }}>
            Have a question regarding consultations, slot availability, or Vastu assessments? Connect with us directly.
          </p>
        </div>
      </section>

      <div className="container" style={{ maxWidth: 960, marginTop: 54 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32 }}>
          {/* Contact Details Card */}
          <div className="apple-card" style={{ padding: '36px 30px' }}>
            <h2 className="text-h2" style={{ fontSize: 22, marginBottom: 20 }}>
              Direct Channels
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 32 }}>
              <div style={{ display: 'flex', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2FA84F' }}>
                  <MessageCircle size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#1D1D1F' }}>WhatsApp Assistant</div>
                  <a
                    href="https://wa.me/919876543210?text=Namaste%20Amit%20ji,%20I%20would%20like%20to%20inquire%20about%20a%20consultation."
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#2FA84F', textDecoration: 'none', fontSize: 14 }}
                  >
                    +91 98765 43210 (Tap to Chat)
                  </a>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(58, 58, 110, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3A3A6E' }}>
                  <Phone size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#1D1D1F' }}>Phone Inquiries</div>
                  <div style={{ color: '#6E6E73', fontSize: 14 }}>+91 98765 43210</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(58, 58, 110, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3A3A6E' }}>
                  <Mail size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#1D1D1F' }}>Email</div>
                  <div style={{ color: '#6E6E73', fontSize: 14 }}>consultations@nakshaktram.com</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(201, 162, 75, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C9A24B' }}>
                  <Clock size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#1D1D1F' }}>Consultation Windows (IST)</div>
                  <div style={{ color: '#6E6E73', fontSize: 13.5 }}>
                    Morning: 09:00 AM – 05:00 PM<br />
                    Night: 08:00 PM – 12:00 AM
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="apple-card" style={{ padding: '36px 30px' }}>
            <h2 className="text-h2" style={{ fontSize: 22, marginBottom: 6 }}>
              Send an Inquiry
            </h2>
            <p className="text-body" style={{ fontSize: 14, marginBottom: 24 }}>
              Fill in your query and Amit Soni's office will reach back.
            </p>

            {submitted ? (
              <div style={{ padding: '32px 20px', textAlign: 'center' }}>
                <CheckCircle2 size={40} color="#2FA84F" style={{ marginBottom: 12 }} />
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>Inquiry Submitted</h3>
                <p style={{ color: '#6E6E73', fontSize: 14 }}>
                  Thank you for writing to us. We will get back to your WhatsApp / email shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="apple-input"
                    placeholder="Your Name"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                      Phone / WhatsApp
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="apple-input"
                      placeholder="+91 98765 43210"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="apple-input"
                      placeholder="name@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                    Your Inquiry or Topic
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="apple-input"
                    placeholder="Describe your inquiry..."
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <button
                  type="submit"
                  className="apple-btn-primary"
                  style={{ padding: 13, fontSize: 15 }}
                >
                  <Send size={15} /> Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
