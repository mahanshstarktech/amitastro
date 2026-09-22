import React, { useState, useEffect } from 'react';
import { 
  Calendar, MessageSquare, User, CreditCard, Clock, Plus, Trash2, Edit3, 
  CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, Sparkles, Send, Paperclip, X,
  Settings, Globe, Check
} from 'lucide-react';
import { useAuth, type BirthProfile } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useLanguage } from '../../context/LanguageContext';
import { apiRequest } from '../../utils/api';

interface CustomerPortalProps {
  onOpenBooking: () => void;
  onOpenTrial: () => void;
  initialTab?: 'dashboard' | 'appointments' | 'chat' | 'profile' | 'payments' | 'settings';
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({
  onOpenBooking,
  onOpenTrial,
  initialTab = 'dashboard'
}) => {
  const { user, profiles, addProfile, deleteProfile } = useAuth();
  const { showToast } = useNotification();
  const { language, setLanguage, t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'appointments' | 'chat' | 'profile' | 'payments' | 'settings'>(initialTab);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [conversation, setConversation] = useState<any>(null);
  const [msgInput, setMsgInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Follow-up appointment chat state
  const [activeFollowupAppt, setActiveFollowupAppt] = useState<any | null>(null);
  const [followupMessages, setFollowupMessages] = useState<any[]>([]);
  const [followupInput, setFollowupInput] = useState('');
  const [followupLoading, setFollowupLoading] = useState(false);
  const [followupExpiry, setFollowupExpiry] = useState<any>(null);

  const openFollowupModal = async (appt: any) => {
    setActiveFollowupAppt(appt);
    setFollowupLoading(true);
    try {
      const res = await apiRequest<any>(`/appointments/${appt.id}/followup`);
      setFollowupMessages(res.messages || []);
      setFollowupExpiry({
        expiresAt: res.expiresAt,
        isExpired: res.isExpired,
        daysRemaining: res.daysRemaining,
        hoursRemaining: res.hoursRemaining
      });
    } catch (err: any) {
      showToast(err.message || 'Failed to load follow-up thread', 'error');
    } finally {
      setFollowupLoading(false);
    }
  };

  const handleSendFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followupInput.trim() || !activeFollowupAppt) return;
    try {
      const res = await apiRequest<any>(`/appointments/${activeFollowupAppt.id}/followup`, 'POST', {
        content: followupInput.trim()
      });
      setFollowupMessages((prev) => [...prev, res.message]);
      setFollowupInput('');
      showToast('Follow-up message sent', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to send message', 'error');
    }
  };

  // New profile modal state
  const [showAddProfileModal, setShowAddProfileModal] = useState(false);
  const [newProfileData, setNewProfileData] = useState({
    relation: 'spouse',
    fullName: '',
    dob: '',
    tob: '12:00',
    tobUncertain: false,
    pob: ''
  });

  // Fetch appointments and chat data
  useEffect(() => {
    apiRequest<{ appointments: any[] }>('/appointments/my')
      .then((res) => setAppointments(res.appointments || []))
      .catch(() => {});

    apiRequest<{ conversation: any; messages: any[] }>('/chat/conversation')
      .then((res) => {
        setConversation(res.conversation);
        setChatMessages(res.messages || []);
      })
      .catch(() => {});
  }, [activeTab]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgInput.trim() || !conversation) return;

    const text = msgInput;
    setMsgInput('');

    try {
      const res = await apiRequest<{ message: any }>('/chat/message', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: conversation.id,
          content: text,
          messageType: 'text'
        })
      });
      setChatMessages((prev) => [...prev, res.message]);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileData.fullName || !newProfileData.dob || !newProfileData.pob) {
      showToast('Please fill all required birth fields', 'error');
      return;
    }

    try {
      await addProfile(newProfileData);
      showToast('Family member birth profile saved', 'success');
      setShowAddProfileModal(false);
      setNewProfileData({ relation: 'child', fullName: '', dob: '', tob: '12:00', tobUncertain: false, pob: '' });
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteProfile = async (id: string) => {
    if (window.confirm('Are you sure you want to remove this birth profile?')) {
      try {
        await deleteProfile(id);
        showToast('Profile removed', 'info');
      } catch (err: any) {
        showToast(err.message, 'error');
      }
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FBFBFD', paddingBottom: 80 }}>
      {/* Top Welcome Bar */}
      <div style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E5EA', padding: '24px 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <span className="apple-badge-gold" style={{ marginBottom: 6 }}>
              Seeker Portal
            </span>
            <h1 className="text-h1" style={{ fontSize: 26, color: '#1D1D1F', marginTop: 4 }}>
              Namaste, {user?.name || 'Seeker'}
            </h1>
            <p style={{ fontSize: 13.5, color: '#6E6E73' }}>
              Verified Mobile: {user?.phone} · Personal Charts & Consultations
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {(user?.isNewCustomer && !user?.trialUsed) && (
              <button
                onClick={onOpenTrial}
                className="apple-btn-secondary"
                style={{ padding: '10px 18px', fontSize: 14, color: '#3A3A6E', borderColor: '#3A3A6E' }}
              >
                <Clock size={15} /> 5-Min Free Trial
              </button>
            )}

            <button
              onClick={onOpenBooking}
              className="apple-btn-primary"
              style={{ padding: '10px 20px', fontSize: 14 }}
            >
              <Calendar size={15} /> Book a Consultation
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E5EA' }}>
        <div className="container" style={{ display: 'flex', gap: 24, overflowX: 'auto', padding: '0 24px' }}>
          {[
            { id: 'dashboard', label: 'Overview', icon: Sparkles },
            { id: 'appointments', label: 'My Appointments', icon: Calendar, badge: appointments.length },
            { id: 'chat', label: 'Consultation Chat', icon: MessageSquare },
            { id: 'profile', label: 'Birth Profiles (Family)', icon: User, badge: profiles.length },
            { id: 'payments', label: 'Payments & UPI', icon: CreditCard },
            { id: 'settings', label: t('nav.settings', 'Settings'), icon: Settings }
          ].map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: active ? '2px solid #3A3A6E' : '2px solid transparent',
                  padding: '16px 4px',
                  color: active ? '#1D1D1F' : '#6E6E73',
                  fontWeight: active ? 600 : 400,
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                <Icon size={16} color={active ? '#3A3A6E' : '#86868B'} />
                {t.label}
                {t.badge !== undefined && t.badge > 0 && (
                  <span
                    style={{
                      backgroundColor: active ? '#3A3A6E' : '#E5E5EA',
                      color: active ? '#FFF' : '#1D1D1F',
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: 9999
                    }}
                  >
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB CONTENT CONTAINER */}
      <div className="container" style={{ marginTop: 36 }}>
        {/* 1. OVERVIEW DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {/* Quick Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              {/* Upcoming Appointment Card */}
              <div className="apple-card" style={{ padding: '26px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span className="apple-badge-primary">Next Consultation</span>
                    <Calendar size={18} color="#3A3A6E" />
                  </div>

                  {appointments.length > 0 ? (
                    <div>
                      <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1D1D1F', marginBottom: 4 }}>
                        {appointments[0].package_name}
                      </h3>
                      <div style={{ fontSize: 14, color: '#3A3A6E', fontWeight: 500, marginBottom: 8 }}>
                        {appointments[0].requested_date} ({appointments[0].requested_time_window})
                      </div>
                      <div style={{ fontSize: 12.5, color: '#6E6E73' }}>
                        Profile: <strong>{appointments[0].profile_name}</strong>
                      </div>
                      <div style={{ marginTop: 12 }}>
                        <span
                          className={
                            appointments[0].status === 'Confirmed'
                              ? 'apple-badge-success'
                              : 'apple-badge-gold'
                          }
                        >
                          Status: {appointments[0].status}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1D1D1F', marginBottom: 6 }}>
                        No Upcoming Sessions
                      </h3>
                      <p style={{ fontSize: 13.5, color: '#6E6E73' }}>
                        Book a session with Amit to analyze your Dasha or Vastu.
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={onOpenBooking}
                  className="apple-btn-secondary"
                  style={{ width: '100%', marginTop: 20, fontSize: 13.5 }}
                >
                  Schedule Slot <ArrowRight size={14} />
                </button>
              </div>

              {/* Free Trial Banner Card */}
              <div
                className="apple-card"
                style={{
                  padding: '26px 24px',
                  backgroundColor: user?.trialUsed ? '#FFFFFF' : 'linear-gradient(135deg, #FFFFFF, #F5F5F7)',
                  border: user?.trialUsed ? '1px solid #E5E5EA' : '1px solid #C9A24B',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span className="apple-badge-gold">Complimentary Trial</span>
                    <Clock size={18} color="#C9A24B" />
                  </div>

                  <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1D1D1F', marginBottom: 6 }}>
                    {user?.trialUsed ? 'Trial Completed' : !user?.isNewCustomer ? 'Consultation Packages' : '5-Minute Discovery Call'}
                  </h3>
                  <p style={{ fontSize: 13.5, color: '#6E6E73', lineHeight: 1.5 }}>
                    {user?.trialUsed
                      ? 'You have already utilized your one-time trial. Upgrade to a consultation package for in-depth guidance.'
                      : !user?.isNewCustomer
                      ? 'Your account is configured for regular consultations. Book direct uninterrupted time with Amit.'
                      : 'Experience Amit’s calm, authoritative consultation style with a live 5-minute phone session.'}
                  </p>
                </div>

                {(!user?.isNewCustomer || user?.trialUsed) ? (
                  <button
                    onClick={onOpenBooking}
                    className="apple-btn-gold"
                    style={{ width: '100%', marginTop: 20, fontSize: 13.5 }}
                  >
                    View Packages & Book
                  </button>
                ) : (
                  <button
                    onClick={onOpenTrial}
                    className="apple-btn-primary"
                    style={{ width: '100%', marginTop: 20, fontSize: 13.5 }}
                  >
                    Start 5-Min Trial Call
                  </button>
                )}
              </div>

              {/* Saved Profiles Summary */}
              <div className="apple-card" style={{ padding: '26px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span className="apple-badge-primary">Family Profiles</span>
                    <User size={18} color="#3A3A6E" />
                  </div>

                  <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1D1D1F', marginBottom: 6 }}>
                    {profiles.length} Charts Cast
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                    {profiles.slice(0, 2).map((p) => (
                      <div key={p.id} style={{ fontSize: 13, color: '#6E6E73', display: 'flex', justifyContent: 'space-between' }}>
                        <span><strong>{p.full_name}</strong> ({p.relation})</span>
                        <span>{p.dob}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('profile')}
                  className="apple-btn-secondary"
                  style={{ width: '100%', marginTop: 20, fontSize: 13.5 }}
                >
                  Manage Family Charts <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* In-App Chat Quick Action Banner */}
            <div
              className="apple-card"
              style={{
                padding: '24px 28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2FA84F' }}>
                  <MessageSquare size={22} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 16, color: '#1D1D1F' }}>
                    Direct Chat Line with Amit
                  </div>
                  <div style={{ fontSize: 13.5, color: '#6E6E73' }}>
                    Send questions, share palm photos, or confirm upcoming consultation timings.
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('chat')}
                className="apple-btn-primary"
                style={{ padding: '10px 20px', fontSize: 14 }}
              >
                Open Conversation
              </button>
            </div>
          </div>
        )}

        {/* 2. APPOINTMENTS TAB */}
        {activeTab === 'appointments' && (
          <div className="apple-card" style={{ padding: '32px 28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 className="text-h2" style={{ fontSize: 22, marginBottom: 4 }}>
                  Consultation History & Slots
                </h2>
                <p className="text-body" style={{ fontSize: 14 }}>
                  All scheduled, confirmed, and previous sessions with Amit.
                </p>
              </div>

              <button onClick={onOpenBooking} className="apple-btn-primary" style={{ fontSize: 14 }}>
                <Plus size={15} /> Book New Session
              </button>
            </div>

            {appointments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6E6E73' }}>
                <Calendar size={40} color="#C9A24B" style={{ marginBottom: 12 }} />
                <h3 style={{ fontSize: 18, color: '#1D1D1F', marginBottom: 6 }}>No Appointments Yet</h3>
                <p style={{ fontSize: 14, maxWidth: 400, margin: '0 auto 20px' }}>
                  Reserve your first consultation session to receive detailed Kundli analysis.
                </p>
                <button onClick={onOpenBooking} className="apple-btn-primary">
                  Book a Consultation
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {appointments.map((appt) => (
                  <div
                    key={appt.id}
                    style={{
                      border: '1px solid #E5E5EA',
                      borderRadius: 16,
                      padding: '20px 22px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 16
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontWeight: 600, fontSize: 16, color: '#1D1D1F' }}>
                          {appt.package_name}
                        </span>
                        <span
                          className={
                            appt.status === 'Confirmed'
                              ? 'apple-badge-success'
                              : 'apple-badge-gold'
                          }
                        >
                          {appt.status}
                        </span>
                      </div>

                      <div style={{ fontSize: 14, color: '#3A3A6E', fontWeight: 500, marginBottom: 4 }}>
                        Date: {appt.requested_date} ({appt.requested_time_window})
                      </div>
                      <div style={{ fontSize: 13, color: '#6E6E73' }}>
                        Chart Profile: <strong>{appt.profile_name}</strong> (DOB: {appt.dob})
                      </div>
                      {appt.customer_notes && (
                        <div style={{ fontSize: 13, color: '#86868B', marginTop: 4, fontStyle: 'italic' }}>
                          "{appt.customer_notes}"
                        </div>
                      )}

                      {/* Follow-up Tracking Badge */}
                      {appt.followup_days > 0 && (
                        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontSize: 11.5,
                              padding: '3px 8px',
                              borderRadius: 6,
                              fontWeight: 600,
                              backgroundColor: appt.status === 'Confirmed' ? (appt.followup_active ? '#E8F5E9' : '#F5F5F7') : '#F5F5F7',
                              color: appt.status === 'Confirmed' ? (appt.followup_active ? '#2FA84F' : '#8E8E93') : '#8E8E93',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            <Sparkles size={12} color={appt.status === 'Confirmed' && appt.followup_active ? '#2FA84F' : '#8E8E93'} />
                            {appt.followup_days}-Day Follow-up {appt.status === 'Confirmed' ? (appt.followup_active ? '· Window Active' : '· Window Ended') : '· Unlocks Upon Confirmation'}
                          </span>
                          {appt.followup_chat_expires_at && appt.followup_active && (
                            <span style={{ fontSize: 11, color: '#86868B' }}>
                              Expires {new Date(appt.followup_chat_expires_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      {appt.payment_status === 'Pending' && (
                        <button
                          onClick={() => setActiveTab('payments')}
                          className="apple-badge-gold"
                          style={{ border: 'none', cursor: 'pointer', padding: '8px 12px' }}
                        >
                          UTR Pending · Submit Proof
                        </button>
                      )}

                      {appt.status === 'Confirmed' && appt.followup_days > 0 && (
                        <button
                          onClick={() => openFollowupModal(appt)}
                          className="apple-btn-secondary"
                          style={{ fontSize: 13, padding: '8px 14px', borderColor: '#3A3A6E', color: '#3A3A6E', fontWeight: 600 }}
                        >
                          <Sparkles size={14} color="#C9A24B" /> Follow-up Chat ({appt.followup_days}d)
                        </button>
                      )}

                      <button
                        onClick={() => setActiveTab('chat')}
                        className="apple-btn-secondary"
                        style={{ fontSize: 13, padding: '8px 14px' }}
                      >
                        <MessageSquare size={14} /> General Chat
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. WHATSAPP-STYLE IN-APP CHAT (Section 10) */}
        {activeTab === 'chat' && (
          <div
            className="apple-card"
            style={{
              height: 600,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              borderRadius: 20
            }}
          >
            {/* WhatsApp Header */}
            <div
              style={{
                backgroundColor: '#F5F5F7',
                borderBottom: '1px solid #E5E5EA',
                padding: '14px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E5EA',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 5,
                    overflow: 'hidden',
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)'
                  }}
                >
                  <img
                    src="/icons/logo-mark.png"
                    alt="Amit"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, color: '#1D1D1F' }}>
                    Amit (Astrologer)
                  </div>
                  <div style={{ fontSize: 12, color: '#2FA84F', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#2FA84F' }} />
                    Available on Desk
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 12.5, color: '#86868B' }}>
                End-to-End Private Consultation
              </div>
            </div>

            {/* Chat Messages Body */}
            <div
              style={{
                flex: 1,
                padding: '20px 24px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                backgroundColor: '#FAF9F6' // Warm subtle off-white
              }}
            >
              {chatMessages.map((m) => {
                const isMe = m.sender_type === 'customer';
                return (
                  <div
                    key={m.id}
                    style={{
                      alignSelf: isMe ? 'flex-end' : 'flex-start',
                      maxWidth: '75%',
                      backgroundColor: isMe ? '#E8F5E9' : '#FFFFFF',
                      borderRadius: 16,
                      borderBottomRightRadius: isMe ? 4 : 16,
                      borderBottomLeftRadius: isMe ? 16 : 4,
                      padding: '12px 16px',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                      border: '1px solid #E5E5EA'
                    }}
                  >
                    <div style={{ fontSize: 14.5, color: '#1D1D1F', lineHeight: 1.5 }}>
                      {m.content}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: '#86868B',
                        textAlign: 'right',
                        marginTop: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: 4
                      }}
                    >
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {isMe && <CheckCircle2 size={12} color="#2FA84F" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Chat Composer */}
            <form
              onSubmit={handleSendMessage}
              style={{
                backgroundColor: '#FFFFFF',
                borderTop: '1px solid #E5E5EA',
                padding: '12px 18px',
                display: 'flex',
                gap: 10,
                alignItems: 'center'
              }}
            >
              <input
                type="text"
                value={msgInput}
                onChange={(e) => setMsgInput(e.target.value)}
                placeholder="Type a message or question for Amit..."
                className="apple-input"
                style={{ borderRadius: 9999, padding: '10px 18px', fontSize: 14 }}
              />
              <button
                type="submit"
                className="apple-btn-primary"
                style={{ borderRadius: '50%', width: 42, height: 42, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        )}

        {/* 4. BIRTH PROFILES (FAMILY MEMBERS) (Section 7) */}
        {activeTab === 'profile' && (
          <div className="apple-card" style={{ padding: '32px 28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 className="text-h2" style={{ fontSize: 22, marginBottom: 4 }}>
                  Saved Family Birth Profiles
                </h2>
                <p className="text-body" style={{ fontSize: 14 }}>
                  Save birth details for yourself, spouse, children, or parents under one single account.
                </p>
              </div>

              <button
                onClick={() => setShowAddProfileModal(true)}
                className="apple-btn-primary"
                style={{ fontSize: 14 }}
              >
                <Plus size={15} /> Add Family Member
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {profiles.map((p) => (
                <div
                  key={p.id}
                  style={{
                    border: '1px solid #E5E5EA',
                    borderRadius: 16,
                    padding: '18px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    backgroundColor: '#F5F5F7'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span className="apple-badge-gold">{p.relation.toUpperCase()}</span>
                      {profiles.length > 1 && (
                        <button
                          onClick={() => handleDeleteProfile(p.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D64545' }}
                          title="Delete profile"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    <h3 style={{ fontSize: 17, fontWeight: 600, color: '#1D1D1F', marginBottom: 4 }}>
                      {p.full_name}
                    </h3>
                    <div style={{ fontSize: 13, color: '#6E6E73', display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <div>DOB: <strong>{p.dob}</strong></div>
                      <div>Time: <strong>{p.tob}</strong> {p.tob_uncertain ? '(Approximate)' : ''}</div>
                      <div>Place: <strong>{p.pob}</strong></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Profile Modal */}
            {showAddProfileModal && (
              <div
                style={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 3000,
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  backdropFilter: 'blur(8px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 16
                }}
              >
                <div
                  className="apple-card"
                  style={{
                    width: '100%',
                    maxWidth: 440,
                    backgroundColor: '#FFF',
                    padding: '28px 24px',
                    borderRadius: 20,
                    position: 'relative'
                  }}
                >
                  <h3 className="text-h2" style={{ fontSize: 20, marginBottom: 16 }}>
                    Add Family Birth Profile
                  </h3>

                  <form onSubmit={handleCreateProfile} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Relation</label>
                      <select
                        value={newProfileData.relation}
                        onChange={(e) => setNewProfileData({ ...newProfileData, relation: e.target.value })}
                        className="apple-input"
                      >
                        <option value="spouse">Spouse (Husband / Wife)</option>
                        <option value="child">Child (Son / Daughter)</option>
                        <option value="parent">Parent (Mother / Father)</option>
                        <option value="sibling">Sibling (Brother / Sister)</option>
                        <option value="other">Other Relative</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Full Name</label>
                      <input
                        type="text"
                        required
                        value={newProfileData.fullName}
                        onChange={(e) => setNewProfileData({ ...newProfileData, fullName: e.target.value })}
                        className="apple-input"
                        placeholder="e.g. Anjali Sharma"
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Date of Birth</label>
                        <input
                          type="date"
                          required
                          value={newProfileData.dob}
                          onChange={(e) => setNewProfileData({ ...newProfileData, dob: e.target.value })}
                          className="apple-input"
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Time of Birth</label>
                        <input
                          type="time"
                          value={newProfileData.tob}
                          onChange={(e) => setNewProfileData({ ...newProfileData, tob: e.target.value })}
                          className="apple-input"
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Place of Birth (City, State)</label>
                      <input
                        type="text"
                        required
                        value={newProfileData.pob}
                        onChange={(e) => setNewProfileData({ ...newProfileData, pob: e.target.value })}
                        className="apple-input"
                        placeholder="e.g. New Delhi, Delhi"
                      />
                    </div>

                    <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                      <button type="submit" className="apple-btn-primary" style={{ flex: 1, padding: 12 }}>
                        Save Profile
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddProfileModal(false)}
                        className="apple-btn-secondary"
                        style={{ flex: 1, padding: 12 }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5. PAYMENTS & UPI TAB (Section 14) */}
        {activeTab === 'payments' && (
          <div className="apple-card" style={{ padding: '32px 28px' }}>
            <h2 className="text-h2" style={{ fontSize: 22, marginBottom: 4 }}>
              Payments & Manual UPI Verification
            </h2>
            <p className="text-body" style={{ fontSize: 14, marginBottom: 28 }}>
              Per Section 14, pay seamlessly using standard UPI QR or Bank NEFT and submit your 12-digit UTR.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 24,
                backgroundColor: '#F5F5F7',
                borderRadius: 18,
                padding: '24px 22px',
                border: '1px solid #E5E5EA'
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <img
                  src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=amitastro@upi&pn=Amit%20Astro"
                  alt="UPI QR Code"
                  style={{ width: 140, height: 140, borderRadius: 12, border: '1px solid #E5E5EA', backgroundColor: '#FFF' }}
                />
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1D1D1F', marginTop: 8 }}>
                  amitastro@upi
                </div>
                <div style={{ fontSize: 12, color: '#6E6E73' }}>
                  Scan with GPay, PhonePe, Paytm, BHIM
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13.5 }}>
                <div style={{ fontWeight: 600, fontSize: 15, color: '#1D1D1F' }}>
                  Bank Transfer (NEFT / IMPS)
                </div>
                <div>Account Name: <strong>Amit</strong></div>
                <div>Bank: <strong>HDFC Bank</strong></div>
                <div>Account No: <strong>50100492817291</strong></div>
                <div>IFSC: <strong>HDFC0001234</strong></div>
                <div>Branch: <strong>Jaipur Central, Rajasthan</strong></div>
              </div>
            </div>
          </div>
        )}

        {/* 6. SETTINGS & LANGUAGE TAB */}
        {activeTab === 'settings' && (
          <div className="apple-card" style={{ padding: '32px 28px', maxWidth: 760 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: 'rgba(58, 58, 110, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#3A3A6E'
                }}
              >
                <Globe size={22} />
              </div>
              <div>
                <h3 className="text-h3" style={{ fontSize: 20, margin: 0 }}>
                  {t('settings.language_title', 'Language (भाषा)')}
                </h3>
                <p className="text-subheadline" style={{ margin: 0, marginTop: 4 }}>
                  {t('settings.language_desc', 'Choose your preferred display language')}
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 32 }}>
              {/* English Card */}
              <div
                onClick={() => {
                  setLanguage('en');
                  showToast('Language updated to English', 'success');
                }}
                style={{
                  padding: '20px',
                  borderRadius: 16,
                  border: language === 'en' ? '2px solid #3A3A6E' : '1px solid #E5E5EA',
                  backgroundColor: language === 'en' ? 'rgba(58, 58, 110, 0.04)' : '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#1D1D1F' }}>
                    English (Default)
                  </div>
                  <div style={{ fontSize: 13, color: '#6E6E73', marginTop: 4 }}>
                    Default display language for Amit Astro
                  </div>
                </div>
                {language === 'en' && (
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      backgroundColor: '#3A3A6E',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFF'
                    }}
                  >
                    <Check size={16} strokeWidth={2.5} />
                  </div>
                )}
              </div>

              {/* Hindi Card */}
              <div
                onClick={() => {
                  setLanguage('hi');
                  showToast('भाषा बदलकर हिन्दी कर दी गई है', 'success');
                }}
                style={{
                  padding: '20px',
                  borderRadius: 16,
                  border: language === 'hi' ? '2px solid #3A3A6E' : '1px solid #E5E5EA',
                  backgroundColor: language === 'hi' ? 'rgba(58, 58, 110, 0.04)' : '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#1D1D1F' }}>
                    हिन्दी (Hindi)
                  </div>
                  <div style={{ fontSize: 13, color: '#6E6E73', marginTop: 4 }}>
                    अमित एस्ट्रो की संपूर्ण सामग्री हिन्दी में
                  </div>
                </div>
                {language === 'hi' && (
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      backgroundColor: '#3A3A6E',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFF'
                    }}
                  >
                    <Check size={16} strokeWidth={2.5} />
                  </div>
                )}
              </div>
            </div>

            {/* Account Details */}
            <div style={{ borderTop: '1px solid #E5E5EA', paddingTop: 24 }}>
              <h4 style={{ fontSize: 16, fontWeight: 600, color: '#1D1D1F', marginBottom: 12 }}>
                {t('settings.account', 'Account Details')}
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                <div style={{ padding: '14px 16px', backgroundColor: '#F5F5F7', borderRadius: 14 }}>
                  <div style={{ fontSize: 12, color: '#8E8E93' }}>Name</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1D1D1F', marginTop: 2 }}>{user?.name || 'Client'}</div>
                </div>
                <div style={{ padding: '14px 16px', backgroundColor: '#F5F5F7', borderRadius: 14 }}>
                  <div style={{ fontSize: 12, color: '#8E8E93' }}>Phone</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1D1D1F', marginTop: 2 }}>{user?.phone || '—'}</div>
                </div>
                <div style={{ padding: '14px 16px', backgroundColor: '#F5F5F7', borderRadius: 14 }}>
                  <div style={{ fontSize: 12, color: '#8E8E93' }}>Email</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1D1D1F', marginTop: 2 }}>{user?.email || '—'}</div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 28, textAlign: 'center', fontSize: 12, color: '#8E8E93' }}>
              Amit Astro · Consultation by Amit
            </div>
          </div>
        )}
      </div>

      {/* Dedicated Follow-up Consultation Thread Modal */}
      {activeFollowupAppt && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 3000,
            backgroundColor: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
        >
          <div
            className="apple-card"
            style={{
              width: '100%',
              maxWidth: 640,
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#FFF',
              overflow: 'hidden',
              boxShadow: '0 24px 60px rgba(0,0,0,0.2)'
            }}
          >
            {/* Modal Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E5EA', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 style={{ fontSize: 17, fontWeight: 600, color: '#1D1D1F' }}>
                    Follow-up Consultation Thread
                  </h3>
                  <span className="apple-badge-gold" style={{ fontSize: 10 }}>
                    {activeFollowupAppt.followup_days}-Day Window
                  </span>
                </div>
                <p style={{ fontSize: 12.5, color: '#6E6E73', marginTop: 2 }}>
                  {activeFollowupAppt.package_name} · Chart: {activeFollowupAppt.profile_name}
                </p>
              </div>
              <button
                onClick={() => setActiveFollowupAppt(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#86868B', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Expiry Banner */}
            <div
              style={{
                padding: '10px 18px',
                fontSize: 12.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: followupExpiry?.isExpired ? '#FFF5F5' : '#F0F9F1',
                borderBottom: '1px solid #E5E5EA',
                color: followupExpiry?.isExpired ? '#D64545' : '#247D3B'
              }}
            >
              <span>
                {followupExpiry?.isExpired ? (
                  <><strong>Window Concluded:</strong> Follow-up questions for this session are now closed.</>
                ) : (
                  <><strong>Window Active:</strong> {followupExpiry?.daysRemaining}d {followupExpiry?.hoursRemaining}h remaining to ask questions</>
                )}
              </span>
              {followupExpiry?.expiresAt && (
                <span style={{ fontSize: 11, opacity: 0.85 }}>
                  Valid until {new Date(followupExpiry.expiresAt).toLocaleDateString()}
                </span>
              )}
            </div>

            {/* Messages Thread */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', minHeight: 280, maxHeight: 380, display: 'flex', flexDirection: 'column', gap: 10, backgroundColor: '#FAF9F6' }}>
              {followupLoading ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#8E8E93', fontSize: 13 }}>
                  Loading conversation history...
                </div>
              ) : followupMessages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px 20px', color: '#6E6E73' }}>
                  <Sparkles size={32} color="#C9A24B" style={{ marginBottom: 10 }} />
                  <div style={{ fontWeight: 600, fontSize: 15, color: '#1D1D1F', marginBottom: 4 }}>
                    Start Your Follow-up Questions
                  </div>
                  <p style={{ fontSize: 13, maxWidth: 360, margin: '0 auto' }}>
                    Ask any follow-up questions, clarification on remedies, or gemstones suggested by Amit during your session.
                  </p>
                </div>
              ) : (
                followupMessages.map((m: any) => {
                  const isMe = m.sender_type === 'customer';
                  return (
                    <div
                      key={m.id}
                      style={{
                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                        maxWidth: '80%',
                        backgroundColor: isMe ? '#E8F5E9' : '#FFFFFF',
                        border: '1px solid #E5E5EA',
                        borderRadius: 14,
                        padding: '10px 14px',
                        fontSize: 13.5
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 600, color: isMe ? '#247D3B' : '#C9A24B', marginBottom: 3 }}>
                        {isMe ? 'You' : 'Amit (Astrologer)'}
                      </div>
                      <div style={{ color: '#1D1D1F', lineHeight: 1.45 }}>{m.content}</div>
                      <div style={{ fontSize: 10, color: '#86868B', textAlign: 'right', marginTop: 4 }}>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input Form */}
            <form
              onSubmit={handleSendFollowup}
              style={{
                padding: '12px 18px',
                borderTop: '1px solid #E5E5EA',
                display: 'flex',
                gap: 10,
                backgroundColor: '#FFF'
              }}
            >
              <input
                type="text"
                value={followupInput}
                onChange={(e) => setFollowupInput(e.target.value)}
                placeholder={followupExpiry?.isExpired ? "Follow-up period closed for this appointment" : "Type your follow-up query for Amit..."}
                disabled={followupExpiry?.isExpired}
                className="apple-input"
                style={{ flex: 1, borderRadius: 9999, padding: '9px 16px', fontSize: 13.5 }}
              />
              <button
                type="submit"
                disabled={followupExpiry?.isExpired || !followupInput.trim()}
                className="apple-btn-primary"
                style={{ padding: '9px 18px', fontSize: 13.5, opacity: (followupExpiry?.isExpired || !followupInput.trim()) ? 0.5 : 1 }}
              >
                <Send size={14} /> Send
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
