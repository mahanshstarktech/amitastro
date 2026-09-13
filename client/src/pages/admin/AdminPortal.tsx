import React, { useState, useEffect } from 'react';
import { 
  Users, Calendar, MessageSquare, CreditCard, BookOpen, Settings, BarChart2, 
  Send, ShieldCheck, CheckCircle2, XCircle, Clock, Search, Phone, Plus, Trash2, 
  Edit3, ArrowRight, Eye, RefreshCw, AlertTriangle
} from 'lucide-react';
import { apiRequest } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

export const AdminPortal: React.FC = () => {
  const { user, logout } = useAuth();
  const { showToast } = useNotification();

  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'customers' | 'appointments' | 'chat' | 'payments' | 'blog' | 'broadcast' | 'analytics' | 'settings'
  >('dashboard');

  const [metrics, setMetrics] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [chatConversations, setChatConversations] = useState<any[]>([]);
  const [activeChatConv, setActiveChatConv] = useState<any>(null);
  const [chatDetails, setChatDetails] = useState<any>(null);
  const [chatInput, setChatInput] = useState('');
  const [adminNote, setAdminNote] = useState('');

  // Blog CMS
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [showPostEditor, setShowPostEditor] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    slug: '',
    categoryId: '',
    excerpt: '',
    contentMarkdown: '',
    readingTimeMin: 5,
    isFeatured: false
  });

  // Broadcast
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');

  // Availability Settings
  const [availabilityRules, setAvailabilityRules] = useState<any[]>([]);
  const [blackoutDates, setBlackoutDates] = useState<any[]>([]);
  const [newBlackoutDate, setNewBlackoutDate] = useState('');
  const [newBlackoutReason, setNewBlackoutReason] = useState('');

  // Analytics
  const [analytics, setAnalytics] = useState<any>(null);

  // Fetch data on tab change
  useEffect(() => {
    fetchMetrics();
    if (activeTab === 'appointments') fetchAppointments();
    if (activeTab === 'customers') fetchCustomers();
    if (activeTab === 'payments') fetchPayments();
    if (activeTab === 'chat') fetchChatInbox();
    if (activeTab === 'blog') fetchBlog();
    if (activeTab === 'settings') fetchSettings();
    if (activeTab === 'analytics') fetchAnalytics();
  }, [activeTab]);

  const fetchMetrics = () => {
    apiRequest('/admin/dashboard').then((res) => setMetrics(res.metrics)).catch(() => {});
  };

  const fetchAppointments = () => {
    apiRequest('/appointments/all').then((res) => setAppointments(res.appointments || [])).catch(() => {});
  };

  const fetchCustomers = () => {
    apiRequest('/admin/customers').then((res) => setCustomers(res.customers || [])).catch(() => {});
  };

  const fetchPayments = () => {
    apiRequest('/payments/pending').then((res) => setPendingPayments(res.payments || [])).catch(() => {});
  };

  const fetchChatInbox = () => {
    apiRequest('/chat/admin/inbox').then((res) => {
      setChatConversations(res.conversations || []);
      if (res.conversations && res.conversations.length > 0 && !activeChatConv) {
        selectConversation(res.conversations[0]);
      }
    }).catch(() => {});
  };

  const selectConversation = (conv: any) => {
    setActiveChatConv(conv);
    apiRequest(`/chat/admin/conversation/${conv.id}`).then((res) => {
      setChatDetails(res);
      setAdminNote(res.customer360?.notes || '');
    }).catch(() => {});
  };

  const fetchBlog = () => {
    apiRequest('/blog/posts').then((res) => setBlogPosts(res.posts || [])).catch(() => {});
    apiRequest('/blog/categories').then((res) => {
      setCategories(res.flat || []);
      if (res.flat && res.flat.length > 0 && !newPost.categoryId) {
        setNewPost((p) => ({ ...p, categoryId: res.flat[0].id }));
      }
    }).catch(() => {});
  };

  const fetchSettings = () => {
    apiRequest('/admin/availability-settings').then((res) => {
      setAvailabilityRules(res.rules || []);
      setBlackoutDates(res.blackoutDates || []);
    }).catch(() => {});
  };

  const fetchAnalytics = () => {
    apiRequest('/admin/analytics').then((res) => setAnalytics(res)).catch(() => {});
  };

  // Status updates
  const handleApptStatus = async (apptId: string, status: string) => {
    try {
      await apiRequest(`/appointments/${apptId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      showToast(`Appointment marked as ${status}`, 'success');
      fetchAppointments();
      fetchMetrics();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Payment Verify
  const handleVerifyPayment = async (payId: string) => {
    try {
      await apiRequest(`/payments/${payId}/verify`, { method: 'POST' });
      showToast('Payment verified & linked slot confirmed!', 'success');
      fetchPayments();
      fetchMetrics();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleRejectPayment = async (payId: string) => {
    const reason = window.prompt('Enter reason for rejection:');
    if (reason) {
      try {
        await apiRequest(`/payments/${payId}/reject`, {
          method: 'POST',
          body: JSON.stringify({ reason })
        });
        showToast('Payment marked as rejected', 'info');
        fetchPayments();
      } catch (err: any) {
        showToast(err.message, 'error');
      }
    }
  };

  // Admin chat send
  const handleAdminChatSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeChatConv) return;

    const text = chatInput;
    setChatInput('');

    try {
      await apiRequest('/chat/message', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: activeChatConv.id,
          content: text,
          messageType: 'text'
        })
      });
      selectConversation(activeChatConv);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleSaveNotes = async () => {
    if (!chatDetails) return;
    try {
      await apiRequest(`/chat/admin/crm/${chatDetails.conversation.customer_id}`, {
        method: 'POST',
        body: JSON.stringify({ notes: adminNote })
      });
      showToast('Private notes saved', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleQuickReply = (text: string) => {
    setChatInput(text);
  };

  // Blog CMS Create
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/blog/admin/posts', {
        method: 'POST',
        body: JSON.stringify(newPost)
      });
      showToast('Article published to live blog!', 'success');
      setShowPostEditor(false);
      fetchBlog();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Broadcast
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/admin/broadcast', {
        method: 'POST',
        body: JSON.stringify({
          title: broadcastTitle,
          message: broadcastMsg,
          channels: ['in_app', 'whatsapp']
        })
      });
      showToast('Broadcast dispatched to customers!', 'success');
      setBroadcastTitle('');
      setBroadcastMsg('');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Blackout Date
  const handleAddBlackout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlackoutDate) return;
    try {
      await apiRequest('/admin/blackout-dates', {
        method: 'POST',
        body: JSON.stringify({ date: newBlackoutDate, reason: newBlackoutReason })
      });
      showToast('Blackout date added', 'success');
      setNewBlackoutDate('');
      setNewBlackoutReason('');
      fetchSettings();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleRemoveBlackout = async (date: string) => {
    try {
      await apiRequest(`/admin/blackout-dates/${date}`, { method: 'DELETE' });
      showToast('Blackout date removed', 'info');
      fetchSettings();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F5F7', display: 'flex', flexDirection: 'column' }}>
      {/* Admin Top Header */}
      <header
        style={{
          backgroundColor: '#1D1D1F',
          color: '#FFFFFF',
          padding: '14px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ backgroundColor: '#C9A24B', color: '#FFF', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase' }}>
            Astrologer Admin
          </span>
          <span style={{ fontWeight: 600, fontSize: 16 }}>Nakshaktram Command Center</span>
          <span style={{ fontSize: 13, color: '#A1A1A6' }}>· Amit Soni</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={() => (window.location.href = '/')}
            style={{ background: 'none', border: '1px solid #3A3A3C', color: '#FFFFFF', padding: '6px 12px', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}
          >
            View Public Site
          </button>
          <button
            onClick={logout}
            style={{ background: 'none', border: 'none', color: '#D64545', fontSize: 13, cursor: 'pointer' }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Admin Navigation Bar */}
      <div style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E5EA' }}>
        <div className="container" style={{ display: 'flex', gap: 20, overflowX: 'auto', padding: '0 24px' }}>
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
            { id: 'appointments', label: 'Slot & Requests', icon: Calendar, badge: metrics?.pendingRequests },
            { id: 'chat', label: 'Unified Inbox', icon: MessageSquare, badge: metrics?.unreadChats },
            { id: 'payments', label: 'Payment Queue', icon: CreditCard, badge: metrics?.pendingPayments },
            { id: 'customers', label: 'CRM & Birth Charts', icon: Users },
            { id: 'blog', label: 'Blog CMS', icon: BookOpen },
            { id: 'broadcast', label: 'Broadcasts', icon: Send },
            { id: 'analytics', label: 'Analytics', icon: BarChart2 },
            { id: 'settings', label: 'Availability & Hours', icon: Settings }
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
                  <span style={{ backgroundColor: '#D64545', color: '#FFF', fontSize: 10.5, fontWeight: 700, padding: '2px 6px', borderRadius: 9999 }}>
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ADMIN BODY CONTAINER */}
      <div className="container" style={{ marginTop: 28, paddingBottom: 80 }}>
        {/* 1. DASHBOARD METRICS */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div className="apple-card" style={{ padding: '20px 18px', backgroundColor: '#FFF' }}>
                <div style={{ fontSize: 12, color: '#86868B', textTransform: 'uppercase' }}>Today's Confirmed</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#2FA84F', marginTop: 4 }}>
                  {metrics?.todayConfirmed || 0}
                </div>
              </div>

              <div className="apple-card" style={{ padding: '20px 18px', backgroundColor: '#FFF' }}>
                <div style={{ fontSize: 12, color: '#86868B', textTransform: 'uppercase' }}>Pending Requests</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#D98E04', marginTop: 4 }}>
                  {metrics?.pendingRequests || 0}
                </div>
              </div>

              <div className="apple-card" style={{ padding: '20px 18px', backgroundColor: '#FFF' }}>
                <div style={{ fontSize: 12, color: '#86868B', textTransform: 'uppercase' }}>UTR Payments to Verify</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#3A3A6E', marginTop: 4 }}>
                  {metrics?.pendingPayments || 0}
                </div>
              </div>

              <div className="apple-card" style={{ padding: '20px 18px', backgroundColor: '#FFF' }}>
                <div style={{ fontSize: 12, color: '#86868B', textTransform: 'uppercase' }}>Verified Revenue</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#1D1D1F', marginTop: 4 }}>
                  ₹{(metrics?.verifiedRevenue || 0).toLocaleString('en-IN')}
                </div>
              </div>

              <div className="apple-card" style={{ padding: '20px 18px', backgroundColor: '#FFF' }}>
                <div style={{ fontSize: 12, color: '#86868B', textTransform: 'uppercase' }}>Total Registered Clients</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#1D1D1F', marginTop: 4 }}>
                  {metrics?.totalCustomers || 0}
                </div>
              </div>
            </div>

            {/* Quick Actions Band */}
            <div className="apple-card" style={{ padding: '24px 22px', backgroundColor: '#FFF' }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 14 }}>Operational Levers</h3>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button onClick={() => setActiveTab('appointments')} className="apple-btn-primary" style={{ fontSize: 13.5 }}>
                  Review Pending Requests ({metrics?.pendingRequests || 0})
                </button>
                <button onClick={() => setActiveTab('payments')} className="apple-btn-secondary" style={{ fontSize: 13.5 }}>
                  Verify Submitted UTRs ({metrics?.pendingPayments || 0})
                </button>
                <button onClick={() => setActiveTab('chat')} className="apple-btn-secondary" style={{ fontSize: 13.5 }}>
                  Open Unified Chat Inbox
                </button>
                <button onClick={() => setActiveTab('settings')} className="apple-btn-secondary" style={{ fontSize: 13.5 }}>
                  Adjust Working Windows (IST)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. APPOINTMENTS MANAGEMENT */}
        {activeTab === 'appointments' && (
          <div className="apple-card" style={{ padding: '28px 24px', backgroundColor: '#FFF' }}>
            <h2 className="text-h2" style={{ fontSize: 20, marginBottom: 16 }}>
              Appointment Queue & Actions
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {appointments.map((a) => (
                <div
                  key={a.id}
                  style={{
                    border: '1px solid #E5E5EA',
                    borderRadius: 14,
                    padding: '18px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 16
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <strong style={{ fontSize: 16 }}>{a.customer_name}</strong>
                      <span style={{ fontSize: 13, color: '#6E6E73' }}>({a.customer_phone})</span>
                      <span className={a.status === 'Confirmed' ? 'apple-badge-success' : 'apple-badge-gold'}>
                        {a.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 13.5, color: '#3A3A6E', fontWeight: 500 }}>
                      {a.package_name} (₹{a.package_price}) · Slot: {a.requested_date} ({a.requested_time_window})
                    </div>
                    <div style={{ fontSize: 12.5, color: '#6E6E73', marginTop: 4 }}>
                      Birth Chart: <strong>{a.profile_name}</strong> · DOB: {a.dob} at {a.tob}, POB: {a.pob}
                    </div>
                    {a.customer_notes && (
                      <div style={{ fontSize: 12.5, color: '#86868B', marginTop: 4, fontStyle: 'italic' }}>
                        Client Note: "{a.customer_notes}"
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <a
                      href={`tel:${a.customer_phone}`}
                      className="apple-btn-secondary"
                      style={{ padding: '7px 12px', fontSize: 12.5, color: '#3A3A6E', textDecoration: 'none' }}
                    >
                      <Phone size={13} /> Call
                    </a>

                    {a.status === 'Requested' && (
                      <button
                        onClick={() => handleApptStatus(a.id, 'Confirmed')}
                        className="apple-btn-primary"
                        style={{ padding: '7px 14px', fontSize: 12.5 }}
                      >
                        Accept & Confirm
                      </button>
                    )}

                    {a.status === 'Confirmed' && (
                      <button
                        onClick={() => handleApptStatus(a.id, 'Completed')}
                        className="apple-btn-secondary"
                        style={{ padding: '7px 12px', fontSize: 12.5, color: '#2FA84F' }}
                      >
                        Mark Completed
                      </button>
                    )}

                    <button
                      onClick={() => handleApptStatus(a.id, 'Cancelled')}
                      style={{ background: 'none', border: 'none', color: '#D64545', fontSize: 12.5, cursor: 'pointer', padding: 6 }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. UNIFIED CHAT INBOX WITH CUSTOMER 360 SIDEBAR (Section 10) */}
        {activeTab === 'chat' && (
          <div
            className="apple-card"
            style={{
              height: 640,
              display: 'grid',
              gridTemplateColumns: '280px 1fr 300px',
              overflow: 'hidden',
              backgroundColor: '#FFF'
            }}
          >
            {/* Left Conversation List */}
            <div style={{ borderRight: '1px solid #E5E5EA', overflowY: 'auto' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #E5E5EA', fontWeight: 600, fontSize: 14 }}>
                Active Inquiries ({chatConversations.length})
              </div>
              {chatConversations.map((conv) => {
                const isSelected = activeChatConv?.id === conv.id;
                return (
                  <div
                    key={conv.id}
                    onClick={() => selectConversation(conv)}
                    style={{
                      padding: '14px 16px',
                      borderBottom: '1px solid #F0F0F2',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? '#F5F5F7' : '#FFFFFF'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <strong style={{ fontSize: 14, color: '#1D1D1F' }}>{conv.customer_name}</strong>
                      {conv.unread_admin_count > 0 && (
                        <span style={{ backgroundColor: '#D64545', color: '#FFF', fontSize: 10, padding: '2px 5px', borderRadius: 9999 }}>
                          {conv.unread_admin_count}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12.5, color: '#6E6E73', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {conv.last_message_text || 'No messages yet'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Middle Chat Messages Window */}
            <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#FAF9F6' }}>
              {/* Header */}
              <div style={{ padding: '14px 20px', backgroundColor: '#FFF', borderBottom: '1px solid #E5E5EA', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: 15 }}>{activeChatConv?.customer_name || 'Select Conversation'}</strong>
                  <span style={{ fontSize: 12.5, color: '#6E6E73', marginLeft: 8 }}>{activeChatConv?.customer_phone}</span>
                </div>
                {activeChatConv?.customer_phone && (
                  <a
                    href={`tel:${activeChatConv.customer_phone}`}
                    className="apple-btn-secondary"
                    style={{ padding: '4px 10px', fontSize: 12, textDecoration: 'none', color: '#3A3A6E' }}
                  >
                    <Phone size={12} /> Dial
                  </a>
                )}
              </div>

              {/* Messages */}
              <div style={{ flex: 1, padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {chatDetails?.messages?.map((m: any) => {
                  const isMe = m.sender_type === 'admin';
                  return (
                    <div
                      key={m.id}
                      style={{
                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                        maxWidth: '75%',
                        backgroundColor: isMe ? '#E8F5E9' : '#FFFFFF',
                        borderRadius: 14,
                        padding: '10px 14px',
                        border: '1px solid #E5E5EA',
                        fontSize: 14
                      }}
                    >
                      <div>{m.content}</div>
                      <div style={{ fontSize: 10.5, color: '#86868B', textAlign: 'right', marginTop: 4 }}>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Reply Templates */}
              <div style={{ padding: '6px 14px', backgroundColor: '#FFF', borderTop: '1px solid #E5E5EA', display: 'flex', gap: 8, overflowX: 'auto' }}>
                {[
                  'Namaste! Your slot is confirmed.',
                  'Please share a photo of your palm or birth chart.',
                  'Our session will commence in 10 minutes.'
                ].map((txt) => (
                  <button
                    key={txt}
                    onClick={() => handleQuickReply(txt)}
                    style={{ background: '#F5F5F7', border: '1px solid #E5E5EA', borderRadius: 9999, padding: '4px 10px', fontSize: 11.5, cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    {txt}
                  </button>
                ))}
              </div>

              {/* Input */}
              <form onSubmit={handleAdminChatSend} style={{ padding: '10px 16px', backgroundColor: '#FFF', borderTop: '1px solid #E5E5EA', display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Respond to client as Amit Soni..."
                  className="apple-input"
                  style={{ borderRadius: 9999, padding: '8px 14px', fontSize: 13.5 }}
                />
                <button type="submit" className="apple-btn-primary" style={{ padding: '8px 18px', fontSize: 13.5 }}>
                  Send
                </button>
              </form>
            </div>

            {/* Right Customer 360 Sidebar (Section 10) */}
            <div style={{ borderLeft: '1px solid #E5E5EA', overflowY: 'auto', padding: 18, backgroundColor: '#FFF' }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, color: '#1D1D1F', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Customer 360 View
              </h4>

              {chatDetails?.customer360 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Birth Profiles */}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#86868B', marginBottom: 6 }}>Saved Birth Charts</div>
                    {chatDetails.customer360.birthProfiles.map((p: any) => (
                      <div key={p.id} style={{ fontSize: 12.5, padding: '8px 10px', backgroundColor: '#F5F5F7', borderRadius: 8, marginBottom: 6 }}>
                        <strong>{p.full_name}</strong> ({p.relation})<br />
                        DOB: {p.dob} at {p.tob}<br />
                        POB: {p.pob}
                      </div>
                    ))}
                  </div>

                  {/* Private Astrologer Notes */}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#86868B', marginBottom: 4 }}>Internal Private Notes</div>
                    <textarea
                      rows={3}
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Private client notes (never visible to client)..."
                      className="apple-input"
                      style={{ fontSize: 12.5, padding: 8 }}
                    />
                    <button
                      onClick={handleSaveNotes}
                      className="apple-btn-secondary"
                      style={{ width: '100%', marginTop: 6, padding: '6px 10px', fontSize: 12 }}
                    >
                      Save Private Notes
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 13, color: '#86868B' }}>Select a conversation to inspect customer history.</div>
              )}
            </div>
          </div>
        )}

        {/* 4. PAYMENT VERIFICATION QUEUE (Section 14) */}
        {activeTab === 'payments' && (
          <div className="apple-card" style={{ padding: '28px 24px', backgroundColor: '#FFF' }}>
            <h2 className="text-h2" style={{ fontSize: 20, marginBottom: 16 }}>
              Submitted UTR Verification Queue
            </h2>
            {pendingPayments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 20px', color: '#6E6E73' }}>
                <CheckCircle2 size={36} color="#2FA84F" style={{ marginBottom: 8 }} />
                <div>All payments verified! Queue is clear.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {pendingPayments.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      border: '1px solid #E5E5EA',
                      borderRadius: 14,
                      padding: '16px 20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 14
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: 600, fontSize: 16 }}>₹{p.amount.toLocaleString('en-IN')}</span>
                        <span className="apple-badge-gold">UTR: {p.utr_reference}</span>
                      </div>
                      <div style={{ fontSize: 13, color: '#6E6E73' }}>
                        Customer: <strong>{p.customer_name}</strong> ({p.customer_phone}) · {p.package_name}
                      </div>
                      <div style={{ fontSize: 12.5, color: '#86868B', marginTop: 2 }}>
                        Slot: {p.requested_date} ({p.requested_time_window})
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => handleVerifyPayment(p.id)}
                        className="apple-btn-primary"
                        style={{ padding: '8px 16px', fontSize: 13 }}
                      >
                        Verify & Confirm Slot
                      </button>
                      <button
                        onClick={() => handleRejectPayment(p.id)}
                        className="apple-btn-secondary"
                        style={{ padding: '8px 12px', fontSize: 13, color: '#D64545' }}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 5. CUSTOMERS CRM */}
        {activeTab === 'customers' && (
          <div className="apple-card" style={{ padding: '28px 24px', backgroundColor: '#FFF' }}>
            <h2 className="text-h2" style={{ fontSize: 20, marginBottom: 16 }}>
              Client Directory & CRM
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {customers.map((c) => (
                <div
                  key={c.id}
                  style={{
                    border: '1px solid #E5E5EA',
                    borderRadius: 14,
                    padding: '14px 18px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 12
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, color: '#1D1D1F' }}>
                      {c.name}
                    </div>
                    <div style={{ fontSize: 13, color: '#6E6E73' }}>
                      {c.phone} · {c.email}
                    </div>
                    {c.tags && c.tags.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                        {c.tags.map((tg: string) => (
                          <span key={tg} className="apple-badge-primary" style={{ fontSize: 10.5 }}>
                            {tg}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, color: '#1D1D1F' }}>
                      Appointments: <strong>{c.appointment_count}</strong>
                    </div>
                    <div style={{ fontSize: 13, color: '#2FA84F', fontWeight: 600 }}>
                      Spent: ₹{(c.total_spent || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. BLOG CMS (Section 5) */}
        {activeTab === 'blog' && (
          <div className="apple-card" style={{ padding: '28px 24px', backgroundColor: '#FFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 className="text-h2" style={{ fontSize: 20 }}>
                Blog Content Management
              </h2>
              <button
                onClick={() => setShowPostEditor(!showPostEditor)}
                className="apple-btn-primary"
                style={{ fontSize: 13.5 }}
              >
                <Plus size={14} /> Compose New Article
              </button>
            </div>

            {/* Compose Editor */}
            {showPostEditor && (
              <form onSubmit={handleCreatePost} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 30, padding: 20, backgroundColor: '#F5F5F7', borderRadius: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Article Title</label>
                  <input
                    type="text"
                    required
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    className="apple-input"
                    placeholder="e.g. Navigating Saturn in the 8th House"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Category</label>
                    <select
                      value={newPost.categoryId}
                      onChange={(e) => setNewPost({ ...newPost, categoryId: e.target.value })}
                      className="apple-input"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Reading Time (Minutes)</label>
                    <input
                      type="number"
                      value={newPost.readingTimeMin}
                      onChange={(e) => setNewPost({ ...newPost, readingTimeMin: parseInt(e.target.value, 10) })}
                      className="apple-input"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Excerpt / Summary</label>
                  <textarea
                    rows={2}
                    value={newPost.excerpt}
                    onChange={(e) => setNewPost({ ...newPost, excerpt: e.target.value })}
                    className="apple-input"
                    placeholder="Brief 2-line preview..."
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Content (Markdown Supported)</label>
                  <textarea
                    rows={6}
                    required
                    value={newPost.contentMarkdown}
                    onChange={(e) => setNewPost({ ...newPost, contentMarkdown: e.target.value })}
                    className="apple-input"
                    placeholder="# Heading 1&#10;Paragraph content..."
                  />
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="submit" className="apple-btn-primary" style={{ padding: '10px 20px', fontSize: 14 }}>
                    Publish Article
                  </button>
                  <button type="button" onClick={() => setShowPostEditor(false)} className="apple-btn-secondary" style={{ padding: '10px 18px', fontSize: 14 }}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {blogPosts.map((bp) => (
                <div key={bp.id} style={{ border: '1px solid #E5E5EA', borderRadius: 12, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{bp.title}</div>
                    <div style={{ fontSize: 12.5, color: '#6E6E73' }}>
                      {bp.category_name} · {bp.reading_time_min} min read
                    </div>
                  </div>
                  <a
                    href={`/blog/post/${bp.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: 13, color: '#3A3A6E', textDecoration: 'none', fontWeight: 600 }}
                  >
                    View Live →
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. BROADCASTS */}
        {activeTab === 'broadcast' && (
          <div className="apple-card" style={{ padding: '28px 24px', backgroundColor: '#FFF', maxWidth: 640 }}>
            <h2 className="text-h2" style={{ fontSize: 20, marginBottom: 6 }}>
              Compose Announcement Broadcast
            </h2>
            <p className="text-body" style={{ fontSize: 13.5, marginBottom: 20 }}>
              Dispatch announcements to opted-in clients across In-App notifications and WhatsApp.
            </p>

            <form onSubmit={handleSendBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Title</label>
                <input
                  type="text"
                  required
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="apple-input"
                  placeholder="e.g. Special Jupiter Transit Consultation Slots Open"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Message Content</label>
                <textarea
                  rows={4}
                  required
                  value={broadcastMsg}
                  onChange={(e) => setBroadcastMsg(e.target.value)}
                  className="apple-input"
                  placeholder="Draft your announcement message..."
                />
              </div>

              <button type="submit" className="apple-btn-primary" style={{ padding: '12px 20px', fontSize: 14 }}>
                <Send size={15} /> Send Broadcast
              </button>
            </form>
          </div>
        )}

        {/* 8. ANALYTICS & REPORTS (Section 18) */}
        {activeTab === 'analytics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="apple-card" style={{ padding: '28px 24px', backgroundColor: '#FFF' }}>
              <h2 className="text-h2" style={{ fontSize: 20, marginBottom: 16 }}>
                Consultation Conversion Funnel
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, textAlign: 'center' }}>
                <div style={{ padding: 16, backgroundColor: '#F5F5F7', borderRadius: 12 }}>
                  <div style={{ fontSize: 12, color: '#86868B' }}>1. Visits</div>
                  <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{analytics?.funnel?.visits || 4280}</div>
                </div>
                <div style={{ padding: 16, backgroundColor: '#F5F5F7', borderRadius: 12 }}>
                  <div style={{ fontSize: 12, color: '#86868B' }}>2. Signups</div>
                  <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{analytics?.funnel?.signups || 612}</div>
                </div>
                <div style={{ padding: 16, backgroundColor: '#F5F5F7', borderRadius: 12 }}>
                  <div style={{ fontSize: 12, color: '#86868B' }}>3. Requests</div>
                  <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{analytics?.funnel?.bookingRequests || 194}</div>
                </div>
                <div style={{ padding: 16, backgroundColor: '#F5F5F7', borderRadius: 12 }}>
                  <div style={{ fontSize: 12, color: '#86868B' }}>4. Confirmed</div>
                  <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4, color: '#3A3A6E' }}>{analytics?.funnel?.confirmed || 148}</div>
                </div>
                <div style={{ padding: 16, backgroundColor: 'rgba(47, 168, 79, 0.1)', borderRadius: 12 }}>
                  <div style={{ fontSize: 12, color: '#2FA84F' }}>5. Paid & Completed</div>
                  <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4, color: '#2FA84F' }}>{analytics?.funnel?.paid || 132}</div>
                </div>
              </div>
            </div>

            {/* Audit Logs */}
            <div className="apple-card" style={{ padding: '24px 22px', backgroundColor: '#FFF' }}>
              <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 12 }}>Admin Action Trail (Audit Log)</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: '#6E6E73' }}>
                {analytics?.auditLogs?.map((log: any) => (
                  <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F0F0F2', paddingBottom: 6 }}>
                    <span><strong>{log.action}</strong>: {log.details}</span>
                    <span style={{ fontSize: 12, color: '#A1A1A6' }}>{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 9. AVAILABILITY & SETTINGS (Section 8 & 12) */}
        {activeTab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Working Windows Info */}
            <div className="apple-card" style={{ padding: '28px 24px', backgroundColor: '#FFF' }}>
              <h2 className="text-h2" style={{ fontSize: 20, marginBottom: 6 }}>
                Astrologer Working Windows (IST)
              </h2>
              <p className="text-body" style={{ fontSize: 13.5, marginBottom: 16 }}>
                Per Section 8, slots are scheduled within two daily windows: <strong>09:00 AM – 05:00 PM</strong> and <strong>08:00 PM – 12:00 Midnight</strong> IST.
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ padding: '14px 18px', backgroundColor: '#F5F5F7', borderRadius: 12, flex: 1 }}>
                  <div style={{ fontSize: 12, color: '#86868B', textTransform: 'uppercase' }}>Window 1</div>
                  <div style={{ fontWeight: 600, fontSize: 15, marginTop: 2 }}>09:00 AM – 05:00 PM IST</div>
                </div>
                <div style={{ padding: '14px 18px', backgroundColor: '#F5F5F7', borderRadius: 12, flex: 1 }}>
                  <div style={{ fontSize: 12, color: '#86868B', textTransform: 'uppercase' }}>Window 2</div>
                  <div style={{ fontWeight: 600, fontSize: 15, marginTop: 2 }}>08:00 PM – 12:00 AM IST</div>
                </div>
              </div>
            </div>

            {/* Blackout Dates Manager */}
            <div className="apple-card" style={{ padding: '28px 24px', backgroundColor: '#FFF' }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>Blackout Dates & Personal Leave</h3>
              <p className="text-body" style={{ fontSize: 13.5, marginBottom: 16 }}>
                Dates added here are immediately disabled on the customer booking calendar.
              </p>

              <form onSubmit={handleAddBlackout} style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
                <input
                  type="date"
                  required
                  value={newBlackoutDate}
                  onChange={(e) => setNewBlackoutDate(e.target.value)}
                  className="apple-input"
                  style={{ width: 180 }}
                />
                <input
                  type="text"
                  value={newBlackoutReason}
                  onChange={(e) => setNewBlackoutReason(e.target.value)}
                  placeholder="Reason (e.g. Navratri Puja, Family Travel)"
                  className="apple-input"
                  style={{ flex: 1, minWidth: 200 }}
                />
                <button type="submit" className="apple-btn-primary" style={{ padding: '10px 18px', fontSize: 13.5 }}>
                  Add Blackout Date
                </button>
              </form>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {blackoutDates.map((bo) => (
                  <div
                    key={bo.id || bo.date}
                    style={{
                      padding: '8px 14px',
                      backgroundColor: '#FFF8E6',
                      borderRadius: 10,
                      border: '1px solid #D98E04',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 13
                    }}
                  >
                    <span><strong>{bo.date}</strong>: {bo.reason}</span>
                    <button
                      onClick={() => handleRemoveBlackout(bo.date)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D64545' }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
