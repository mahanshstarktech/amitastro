import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, Calendar, MessageSquare, CreditCard, BookOpen, Settings, BarChart2, 
  Send, ShieldCheck, CheckCircle2, XCircle, Clock, Search, Phone, Plus, Trash2, 
  Edit3, ArrowRight, Eye, RefreshCw, AlertTriangle, Copy, Check, ChevronDown, ChevronUp, Sparkles, Filter, X, PanelLeft
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
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [metrics, setMetrics] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [chatConversations, setChatConversations] = useState<any[]>([]);
  const [activeChatConv, setActiveChatConv] = useState<any>(null);
  const [chatDetails, setChatDetails] = useState<any>(null);
  const [customerFullContext, setCustomerFullContext] = useState<any>(null);
  const [copiedProfileId, setCopiedProfileId] = useState<string | null>(null);
  const [expandedProfileIds, setExpandedProfileIds] = useState<{ [id: string]: boolean }>({});
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerFilter, setCustomerFilter] = useState<'all' | 'new' | 'old'>('all');
  const [chatSearch, setChatSearch] = useState('');
  const [activeFollowupThread, setActiveFollowupThread] = useState<any | null>(null);
  const [followupThreadMessages, setFollowupThreadMessages] = useState<any[]>([]);
  const [adminFollowupInput, setAdminFollowupInput] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);
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
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }).catch(() => {});

    if (conv.customer_id) {
      apiRequest(`/admin/customers/${conv.customer_id}/full-context`).then((res) => {
        setCustomerFullContext(res);
      }).catch(() => {});
    }
  };

  const handleToggleNewCustomer = async (customerId: string, newStatus: boolean) => {
    try {
      await apiRequest(`/admin/customers/${customerId}/new-customer-status`, 'PATCH', {
        isNewCustomer: newStatus
      });
      showToast(newStatus ? 'Client marked as New (5-min trial enabled)' : 'Client marked as Established (Trial revoked)', 'success');
      setCustomers((prev) =>
        prev.map((c) => (c.id === customerId ? { ...c, is_new_customer: newStatus ? 1 : 0 } : c))
      );
      if (customerFullContext?.customer?.id === customerId) {
        setCustomerFullContext((prev: any) => ({
          ...prev,
          customer: { ...prev.customer, is_new_customer: newStatus ? 1 : 0, isNewCustomer: newStatus }
        }));
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update customer status', 'error');
    }
  };

  const handleCopyProfile = (profile: any) => {
    const text = `Kundli Chart Profile:
Name: ${profile.full_name}
Relation: ${profile.relation.toUpperCase()}
DOB: ${profile.dob}
Time: ${profile.tob}${profile.tob_uncertain ? ' (Approximate)' : ''}
Place: ${profile.pob}${profile.notes ? `\nNotes: ${profile.notes}` : ''}`;

    navigator.clipboard.writeText(text);
    setCopiedProfileId(profile.id);
    showToast(`Copied ${profile.full_name}'s birth details`, 'success');
    setTimeout(() => {
      setCopiedProfileId((curr) => (curr === profile.id ? null : curr));
    }, 2500);
  };

  const toggleExpandProfile = (profileId: string) => {
    setExpandedProfileIds((prev) => ({
      ...prev,
      [profileId]: !prev[profileId]
    }));
  };

  const openFollowupThread = async (appt: any) => {
    setActiveFollowupThread(appt);
    try {
      const res = await apiRequest<any>(`/appointments/${appt.id}/followup`);
      setFollowupThreadMessages(res.messages || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load follow-up messages', 'error');
    }
  };

  const handleSendAdminFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminFollowupInput.trim() || !activeFollowupThread) return;
    try {
      const res = await apiRequest<any>(`/appointments/${activeFollowupThread.id}/followup`, 'POST', {
        content: adminFollowupInput.trim()
      });
      setFollowupThreadMessages((prev) => [...prev, res.message]);
      setAdminFollowupInput('');
      showToast('Follow-up reply sent', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to send follow-up message', 'error');
    }
  };

  const openCustomerChatFromCrm = (customer: any) => {
    setActiveTab('chat');
    // Find conversation if exists, or select it
    const existingConv = chatConversations.find((c) => c.customer_id === customer.id);
    if (existingConv) {
      selectConversation(existingConv);
    } else {
      apiRequest(`/admin/customers/${customer.id}/full-context`).then((res) => {
        setCustomerFullContext(res);
      }).catch(() => {});
    }
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

  const filteredCustomers = customers.filter((c) => {
    const q = customerSearch.toLowerCase();
    const matchesSearch = !q || (c.name || '').toLowerCase().includes(q) || (c.phone || '').includes(q) || (c.email || '').toLowerCase().includes(q);
    if (!matchesSearch) return false;
    if (customerFilter === 'new') return !!c.is_new_customer && !c.trial_used;
    if (customerFilter === 'old') return !c.is_new_customer || !!c.trial_used;
    return true;
  });

  const filteredConversations = chatConversations.filter((conv) => {
    const q = chatSearch.toLowerCase();
    return !q || (conv.customer_name || '').toLowerCase().includes(q) || (conv.customer_phone || '').includes(q);
  });

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

  const adminTabs = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: BarChart2 },
    { id: 'appointments' as const, label: 'Slot & Requests', icon: Calendar, badge: metrics?.pendingRequests },
    { id: 'chat' as const, label: 'Unified Inbox', icon: MessageSquare, badge: metrics?.unreadChats },
    { id: 'payments' as const, label: 'Payment Queue', icon: CreditCard, badge: metrics?.pendingPayments },
    { id: 'customers' as const, label: 'CRM & Birth Charts', icon: Users },
    { id: 'blog' as const, label: 'Blog CMS', icon: BookOpen },
    { id: 'broadcast' as const, label: 'Broadcasts', icon: Send },
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart2 },
    { id: 'settings' as const, label: 'Availability & Hours', icon: Settings }
  ];

  const currentAdminTab = adminTabs.find((t) => t.id === activeTab) || adminTabs[0];

  const handleSelectAdminTab = (tabId: typeof activeTab) => {
    setActiveTab(tabId);
    setMobileDrawerOpen(false);
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
          <span style={{ fontWeight: 600, fontSize: 16 }}>Amit Astro Command Center</span>
          <span style={{ fontSize: 13, color: '#A1A1A6' }}>· Amit</span>
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

      {/* Mobile Sticky Control Bar with PanelLeft button */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E5E5EA',
          position: 'sticky',
          top: 0,
          zIndex: 90
        }}
        className="portal-mobile-bar"
      >
        <button
          onClick={() => setMobileDrawerOpen(true)}
          className="panel-toggle-btn"
          aria-label="Open admin navigation drawer"
        >
          <PanelLeft size={18} color="#3A3A6E" />
          <span>Admin Menu</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#6E6E73' }}>
          <span style={{ fontWeight: 600, color: '#1D1D1F' }}>
            {currentAdminTab.label}
          </span>
          {currentAdminTab.badge !== undefined && currentAdminTab.badge > 0 && (
            <span style={{ backgroundColor: '#D64545', color: '#FFF', fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 9999 }}>
              {currentAdminTab.badge}
            </span>
          )}
        </div>
      </div>

      {/* Mobile Sliding Drawer with Frosted Backdrop */}
      {mobileDrawerOpen && (
        <>
          <div
            className="mobile-drawer-backdrop"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="mobile-drawer">
            <div
              style={{
                padding: '20px 18px',
                borderBottom: '1px solid #E5E5EA',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#1D1D1F',
                color: '#FFFFFF'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <PanelLeft size={20} color="#C9A24B" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#FFFFFF' }}>
                    Command Center
                  </div>
                  <div style={{ fontSize: 12, color: '#A1A1A6' }}>
                    Astrologer Admin
                  </div>
                </div>
              </div>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 6,
                  cursor: 'pointer',
                  borderRadius: 8,
                  color: '#A1A1A6',
                  display: 'flex',
                  alignItems: 'center'
                }}
                aria-label="Close drawer"
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '16px 12px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {adminTabs.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectAdminTab(item.id)}
                    className={`sidebar-nav-item ${active ? 'active' : ''}`}
                  >
                    <div className="sidebar-nav-item-content">
                      <Icon size={18} color={active ? '#3A3A6E' : '#6E6E73'} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span style={{ backgroundColor: '#D64545', color: '#FFF', fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 9999 }}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div style={{ padding: 16, borderTop: '1px solid #E5E5EA', backgroundColor: '#FBFBFD', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => (window.location.href = '/')}
                style={{ background: 'none', border: 'none', color: '#3A3A6E', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Public Site
              </button>
              <button
                onClick={logout}
                style={{ background: 'none', border: 'none', color: '#D64545', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}

      {/* Main Layout Container (Desktop Sidebar + Admin Body) */}
      <div className="container" style={{ maxWidth: 1440, marginTop: 24, paddingBottom: 80 }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          {/* Desktop Left Sidebar */}
          <aside
            style={{
              width: sidebarCollapsed ? 72 : 280,
              flexShrink: 0,
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E5EA',
              borderRadius: 20,
              padding: sidebarCollapsed ? '16px 10px' : '20px 16px',
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.03)',
              position: 'sticky',
              top: 24,
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            className="portal-desktop-sidebar"
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: sidebarCollapsed ? 'center' : 'space-between',
                marginBottom: 16,
                paddingBottom: 12,
                borderBottom: '1px solid #E5E5EA'
              }}
            >
              {!sidebarCollapsed && (
                <span style={{ fontWeight: 700, fontSize: 15, color: '#1D1D1F', letterSpacing: '-0.01em' }}>
                  Admin Modules
                </span>
              )}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 6,
                  borderRadius: 8,
                  color: '#3A3A6E',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'background 0.15s ease'
                }}
                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <PanelLeft size={19} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {adminTabs.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectAdminTab(item.id)}
                    className={`sidebar-nav-item ${active ? 'active' : ''}`}
                    title={sidebarCollapsed ? item.label : undefined}
                    style={{
                      justifyContent: sidebarCollapsed ? 'center' : 'space-between',
                      padding: sidebarCollapsed ? '12px' : '10px 12px'
                    }}
                  >
                    <div className="sidebar-nav-item-content">
                      <Icon size={18} color={active ? '#3A3A6E' : '#6E6E73'} />
                      {!sidebarCollapsed && <span>{item.label}</span>}
                    </div>
                    {!sidebarCollapsed && item.badge !== undefined && item.badge > 0 && (
                      <span style={{ backgroundColor: '#D64545', color: '#FFF', fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 9999 }}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Right Main Content Area */}
          <main style={{ flex: 1, minWidth: 0 }}>
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

                    {/* Follow-up Tracking Badge */}
                    {a.followup_days > 0 && (
                      <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: 11,
                            padding: '2px 8px',
                            borderRadius: 6,
                            fontWeight: 600,
                            backgroundColor: a.status === 'Confirmed' ? (a.followup_active ? '#E8F5E9' : '#F5F5F7') : '#F5F5F7',
                            color: a.status === 'Confirmed' ? (a.followup_active ? '#2FA84F' : '#8E8E93') : '#8E8E93',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <Sparkles size={11} color={a.status === 'Confirmed' && a.followup_active ? '#2FA84F' : '#8E8E93'} />
                          {a.followup_days}-Day Follow-up {a.status === 'Confirmed' ? (a.followup_active ? '· Window Active' : '· Concluded') : '· Unlocks on Confirm'}
                        </span>
                        {a.followup_chat_expires_at && a.followup_active && (
                          <span style={{ fontSize: 11, color: '#86868B' }}>
                            Valid till {new Date(a.followup_chat_expires_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <a
                      href={`tel:${a.customer_phone}`}
                      className="apple-btn-secondary"
                      style={{ padding: '7px 12px', fontSize: 12.5, color: '#3A3A6E', textDecoration: 'none' }}
                    >
                      <Phone size={13} /> Call
                    </a>

                    {a.status === 'Confirmed' && a.followup_days > 0 && (
                      <button
                        onClick={() => openFollowupThread(a)}
                        className="apple-btn-secondary"
                        style={{ padding: '7px 12px', fontSize: 12.5, color: '#3A3A6E', borderColor: '#3A3A6E', fontWeight: 600 }}
                      >
                        <Sparkles size={13} color="#C9A24B" /> Follow-up Thread
                      </button>
                    )}

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

        {/* 3. UNIFIED CHAT INBOX WITH ADVANCED CUSTOMER 360 & FAMILY PANEL (Section 10) */}
        {activeTab === 'chat' && (
          <div
            className="apple-card"
            style={{
              height: 680,
              display: 'grid',
              gridTemplateColumns: '290px 1fr 340px',
              overflow: 'hidden',
              backgroundColor: '#FFF'
            }}
          >
            {/* Left Conversation List */}
            <div style={{ borderRight: '1px solid #E5E5EA', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #E5E5EA', fontWeight: 600, fontSize: 14 }}>
                Active Inquiries ({filteredConversations.length})
              </div>

              {/* Conversation search */}
              <div style={{ padding: '10px 12px', borderBottom: '1px solid #E5E5EA', backgroundColor: '#FAF9F6' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={14} color="#8E8E93" style={{ position: 'absolute', left: 10, top: 9 }} />
                  <input
                    type="text"
                    value={chatSearch}
                    onChange={(e) => setChatSearch(e.target.value)}
                    placeholder="Search client or phone..."
                    className="apple-input"
                    style={{ paddingLeft: 30, fontSize: 12.5, padding: '5px 8px 5px 30px', width: '100%', borderRadius: 8 }}
                  />
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto' }}>
                {filteredConversations.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', color: '#86868B', fontSize: 13 }}>
                    No conversations found.
                  </div>
                ) : (
                  filteredConversations.map((conv) => {
                    const isSelected = activeChatConv?.id === conv.id;
                    return (
                      <div
                        key={conv.id}
                        onClick={() => selectConversation(conv)}
                        style={{
                          padding: '12px 14px',
                          borderBottom: '1px solid #F0F0F2',
                          cursor: 'pointer',
                          backgroundColor: isSelected ? '#F5F5F7' : '#FFFFFF',
                          transition: 'background-color 0.15s'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <strong style={{ fontSize: 13.5, color: '#1D1D1F' }}>{conv.customer_name}</strong>
                          {conv.unread_admin_count > 0 && (
                            <span style={{ backgroundColor: '#D64545', color: '#FFF', fontSize: 10, padding: '2px 6px', borderRadius: 9999, fontWeight: 700 }}>
                              {conv.unread_admin_count}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: '#8E8E93', marginBottom: 2 }}>
                          {conv.customer_phone}
                        </div>
                        <div style={{ fontSize: 12, color: '#6E6E73', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {conv.last_message_text || 'No messages yet'}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Middle Chat Messages Window */}
            <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#FAF9F6', borderRight: '1px solid #E5E5EA' }}>
              {/* Header */}
              <div style={{ padding: '12px 18px', backgroundColor: '#FFF', borderBottom: '1px solid #E5E5EA', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <strong style={{ fontSize: 15, color: '#1D1D1F' }}>{activeChatConv?.customer_name || 'Select Inquiry'}</strong>
                    {customerFullContext?.customer && (
                      customerFullContext.customer.is_new_customer && !customerFullContext.customer.trial_used ? (
                        <span className="apple-badge-success" style={{ fontSize: 10 }}>New Client</span>
                      ) : customerFullContext.customer.trial_used ? (
                        <span style={{ fontSize: 10, backgroundColor: '#F2E7FE', color: '#6A1B9A', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>Trial Used</span>
                      ) : (
                        <span style={{ fontSize: 10, backgroundColor: '#F5F5F7', color: '#6E6E73', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>Old Client</span>
                      )
                    )}
                  </div>
                  <span style={{ fontSize: 12, color: '#6E6E73' }}>{activeChatConv?.customer_phone}</span>
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

              {/* Messages Scroll Area */}
              <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {chatDetails?.messages?.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#86868B', fontSize: 13 }}>
                    No consultation messages exchanged yet with this client.
                  </div>
                )}
                {chatDetails?.messages?.map((m: any) => {
                  const isMe = m.sender_type === 'admin';
                  return (
                    <div
                      key={m.id}
                      style={{
                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                        maxWidth: '78%',
                        backgroundColor: isMe ? '#E8F5E9' : '#FFFFFF',
                        borderRadius: 14,
                        padding: '10px 14px',
                        border: '1px solid #E5E5EA',
                        fontSize: 13.5
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 600, color: isMe ? '#247D3B' : '#3A3A6E', marginBottom: 2 }}>
                        {isMe ? 'Amit' : activeChatConv?.customer_name || 'Client'}
                      </div>
                      <div style={{ color: '#1D1D1F', lineHeight: 1.45 }}>{m.content}</div>
                      <div style={{ fontSize: 10, color: '#86868B', textAlign: 'right', marginTop: 4 }}>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  );
                })}
                <div ref={chatBottomRef} />
              </div>

              {/* Quick Reply Templates */}
              <div style={{ padding: '6px 14px', backgroundColor: '#FFF', borderTop: '1px solid #E5E5EA', display: 'flex', gap: 6, overflowX: 'auto' }}>
                {[
                  'Namaste! Your slot is confirmed.',
                  'Please send the birth time and birth city of your family member.',
                  'Kindly upload a photo of your palms for Rekha Vichar.',
                  'Our consultation will commence in 10 minutes.'
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
                  placeholder="Reply as Amit..."
                  className="apple-input"
                  style={{ borderRadius: 9999, padding: '8px 14px', fontSize: 13.5 }}
                />
                <button type="submit" className="apple-btn-primary" style={{ padding: '8px 18px', fontSize: 13.5 }}>
                  <Send size={14} /> Send
                </button>
              </form>
            </div>

            {/* Right Customer 360 Sidebar — WHOLE FAMILY DETAILS & CONTROLS */}
            <div style={{ overflowY: 'auto', padding: '16px 16px', backgroundColor: '#FFF', display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: '#1D1D1F', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Customer 360 View
                  </h4>
                  {customerFullContext?.customer && (
                    <span style={{ fontSize: 11, color: '#86868B' }}>
                      ID: {customerFullContext.customer.id.substring(0, 8)}
                    </span>
                  )}
                </div>

                {/* Customer Account Status & New Client Toggle */}
                {customerFullContext?.customer && (
                  <div style={{ backgroundColor: '#F8F8FA', padding: '12px 14px', borderRadius: 12, border: '1px solid #E5E5EA' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: '#6E6E73', fontWeight: 500 }}>Client Status</span>
                      {customerFullContext.customer.is_new_customer && !customerFullContext.customer.trial_used ? (
                        <span className="apple-badge-success" style={{ fontSize: 10.5 }}>New (Trial Enabled)</span>
                      ) : customerFullContext.customer.trial_used ? (
                        <span style={{ fontSize: 10.5, backgroundColor: '#F2E7FE', color: '#6A1B9A', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>Trial Used</span>
                      ) : (
                        <span style={{ fontSize: 10.5, backgroundColor: '#E5E5EA', color: '#48484A', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>Old (Trial Revoked)</span>
                      )}
                    </div>

                    {/* Admin Toggle button */}
                    <button
                      onClick={() => handleToggleNewCustomer(customerFullContext.customer.id, !customerFullContext.customer.is_new_customer)}
                      className="apple-btn-secondary"
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        fontSize: 11.5,
                        fontWeight: 600,
                        color: customerFullContext.customer.is_new_customer ? '#D64545' : '#2FA84F',
                        borderColor: customerFullContext.customer.is_new_customer ? '#F5C6CB' : '#C3E6CB'
                      }}
                    >
                      {customerFullContext.customer.is_new_customer
                        ? 'Revoke 5-Min Trial (Mark Old)'
                        : 'Grant 5-Min Trial (Mark New)'}
                    </button>
                  </div>
                )}
              </div>

              {/* WHOLE FAMILY DETAILS & BIRTH PROFILES PANEL */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: '#3A3A6E', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    Family Kundli Profiles ({customerFullContext?.birthProfiles?.length || 0})
                  </span>
                </div>

                {(!customerFullContext?.birthProfiles || customerFullContext.birthProfiles.length === 0) ? (
                  <div style={{ fontSize: 12.5, color: '#86868B', padding: '12px 10px', backgroundColor: '#F5F5F7', borderRadius: 10, textAlign: 'center' }}>
                    No family profiles added yet by client.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {customerFullContext.birthProfiles.map((p: any) => {
                      const rel = (p.relation || 'self').toLowerCase();
                      const relColor =
                        rel === 'self' ? '#3A3A6E' :
                        rel === 'spouse' ? '#C9A24B' :
                        ['son', 'daughter', 'child'].includes(rel) ? '#2FA84F' :
                        ['father', 'mother', 'parent'].includes(rel) ? '#8A4AF3' : '#007AFF';

                      const isExpanded = !!expandedProfileIds[p.id];

                      return (
                        <div
                          key={p.id}
                          style={{
                            border: '1px solid #E5E5EA',
                            borderRadius: 12,
                            padding: '10px 12px',
                            backgroundColor: '#FAFAFC',
                            transition: 'border-color 0.15s'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <span
                              style={{
                                fontSize: 10.5,
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                padding: '2px 7px',
                                borderRadius: 4,
                                backgroundColor: `${relColor}15`,
                                color: relColor
                              }}
                            >
                              {p.relation}
                            </span>

                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                onClick={() => handleCopyProfile(p)}
                                className="apple-btn-secondary"
                                style={{ padding: '3px 8px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 3 }}
                                title="Copy chart data for Jagannatha Hora or astrology tool"
                              >
                                {copiedProfileId === p.id ? <Check size={11} color="#2FA84F" /> : <Copy size={11} />}
                                {copiedProfileId === p.id ? 'Copied' : 'Copy'}
                              </button>

                              <button
                                onClick={() => toggleExpandProfile(p.id)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8E8E93', padding: 2 }}
                              >
                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>
                            </div>
                          </div>

                          <div style={{ fontWeight: 600, fontSize: 13.5, color: '#1D1D1F', marginBottom: 3 }}>
                            {p.full_name}
                          </div>

                          <div style={{ fontSize: 12, color: '#48484A', display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <div>📅 DOB: <strong>{p.dob}</strong></div>
                            <div>⏰ TOB: <strong>{p.tob}</strong> {p.tob_uncertain ? '<span style="color:#D98E04">(Approx)</span>' : ''}</div>
                            <div>📍 POB: <strong>{p.pob}</strong></div>
                          </div>

                          {isExpanded && (
                            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed #E5E5EA', fontSize: 11.5, color: '#6E6E73' }}>
                              <div>Profile ID: <code style={{ fontSize: 10.5 }}>{p.id}</code></div>
                              {p.notes && <div style={{ marginTop: 4 }}>Notes: <em>{p.notes}</em></div>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* APPOINTMENT & FOLLOW-UP HISTORY */}
              <div>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: '#3A3A6E', textTransform: 'uppercase', letterSpacing: '0.03em', display: 'block', marginBottom: 8 }}>
                  Consultation History ({customerFullContext?.appointments?.length || 0})
                </span>

                {(!customerFullContext?.appointments || customerFullContext.appointments.length === 0) ? (
                  <div style={{ fontSize: 12, color: '#86868B' }}>No consultations booked yet.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {customerFullContext.appointments.slice(0, 4).map((a: any) => (
                      <div key={a.id} style={{ border: '1px solid #E5E5EA', borderRadius: 10, padding: '8px 10px', fontSize: 12, backgroundColor: '#FAF9F6' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                          <strong>{a.package_name}</strong>
                          <span className={a.status === 'Confirmed' ? 'apple-badge-success' : 'apple-badge-gold'} style={{ fontSize: 10 }}>
                            {a.status}
                          </span>
                        </div>
                        <div style={{ color: '#6E6E73' }}>
                          {a.requested_date} ({a.requested_time_window})
                        </div>

                        {a.followup_days > 0 && (
                          <div style={{ marginTop: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 10.5, color: a.followup_active ? '#247D3B' : '#8E8E93', fontWeight: 600 }}>
                              {a.followup_days}d Follow-up: {a.followup_active ? 'Active' : 'Ended'}
                            </span>
                            {a.status === 'Confirmed' && (
                              <button
                                onClick={() => openFollowupThread(a)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3A3A6E', fontSize: 11, fontWeight: 600, textDecoration: 'underline' }}
                              >
                                View Thread
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* FINANCIAL SUMMARY */}
              <div style={{ backgroundColor: '#F0F9F1', padding: '10px 12px', borderRadius: 10, border: '1px solid #C3E6CB' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#247D3B', textTransform: 'uppercase' }}>Verified Lifetime Spending</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#1D1D1F', marginTop: 2 }}>
                  ₹{(customerFullContext?.totalSpent || 0).toLocaleString('en-IN')}
                </div>
              </div>

              {/* PRIVATE ASTROLOGER NOTES */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#86868B', marginBottom: 4, textTransform: 'uppercase' }}>Private Astrologer Notes</div>
                <textarea
                  rows={3}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Private notes (remedies prescribed, gems, birth chart insights)..."
                  className="apple-input"
                  style={{ fontSize: 12, padding: 8, width: '100%' }}
                />
                <button
                  onClick={handleSaveNotes}
                  className="apple-btn-secondary"
                  style={{ width: '100%', marginTop: 6, padding: '6px 10px', fontSize: 12 }}
                >
                  Save Internal Notes
                </button>
              </div>
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

        {/* 5. CUSTOMERS CRM & CLIENT MANAGEMENT */}
        {activeTab === 'customers' && (
          <div className="apple-card" style={{ padding: '28px 24px', backgroundColor: '#FFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
              <div>
                <h2 className="text-h2" style={{ fontSize: 20 }}>
                  Client Directory & CRM
                </h2>
                <p style={{ fontSize: 13, color: '#6E6E73', marginTop: 2 }}>
                  Showing {filteredCustomers.length} of {customers.length} registered clients · Toggle 5-min trial eligibility for new and returning clients.
                </p>
              </div>

              {/* Search & Filters */}
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={14} color="#8E8E93" style={{ position: 'absolute', left: 10, top: 10 }} />
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Search by name, phone, email..."
                    className="apple-input"
                    style={{ paddingLeft: 30, fontSize: 13, padding: '7px 12px 7px 30px', minWidth: 230 }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 4, backgroundColor: '#F5F5F7', padding: 3, borderRadius: 8 }}>
                  {(['all', 'new', 'old'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setCustomerFilter(f)}
                      style={{
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: customerFilter === f ? 600 : 500,
                        backgroundColor: customerFilter === f ? '#FFF' : 'transparent',
                        boxShadow: customerFilter === f ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                        cursor: 'pointer',
                        color: customerFilter === f ? '#1D1D1F' : '#6E6E73'
                      }}
                    >
                      {f === 'all' ? `All (${customers.length})` : f === 'new' ? `New (${customers.filter(c => c.is_new_customer && !c.trial_used).length})` : `Established (${customers.filter(c => !c.is_new_customer || c.trial_used).length})`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {filteredCustomers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 20px', color: '#8E8E93' }}>
                No clients match the selected filter or search term.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {filteredCustomers.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      border: '1px solid #E5E5EA',
                      borderRadius: 14,
                      padding: '16px 20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 14,
                      backgroundColor: '#FFF'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: 600, fontSize: 15, color: '#1D1D1F' }}>
                          {c.name}
                        </span>

                        {/* Status Badge */}
                        {c.is_new_customer && !c.trial_used ? (
                          <span className="apple-badge-success" style={{ fontSize: 11 }}>
                            New Client · Trial Eligible
                          </span>
                        ) : c.trial_used ? (
                          <span style={{ fontSize: 11, backgroundColor: '#F2E7FE', color: '#6A1B9A', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>
                            Trial Utilized
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, backgroundColor: '#F5F5F7', color: '#6E6E73', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>
                            Established Client · Trial Revoked
                          </span>
                        )}
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

                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 13, color: '#1D1D1F' }}>
                          Appointments: <strong>{c.appointment_count}</strong>
                        </div>
                        <div style={{ fontSize: 13, color: '#2FA84F', fontWeight: 600 }}>
                          Spent: ₹{(c.total_spent || 0).toLocaleString('en-IN')}
                        </div>
                      </div>

                      {/* Admin Toggle: Mark Old Client (Revoke) vs Mark New Client (Grant) */}
                      <div style={{ display: 'flex', gap: 8 }}>
                        {c.is_new_customer ? (
                          <button
                            onClick={() => handleToggleNewCustomer(c.id, false)}
                            className="apple-btn-secondary"
                            style={{ fontSize: 12, padding: '7px 12px', color: '#D64545', borderColor: '#F5C6CB' }}
                            title="Revoke 5-minute free trial eligibility for this client"
                          >
                            Revoke Trial (Mark Old)
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleNewCustomer(c.id, true)}
                            className="apple-btn-secondary"
                            style={{ fontSize: 12, padding: '7px 12px', color: '#2FA84F', borderColor: '#C3E6CB' }}
                            title="Grant 5-minute free trial eligibility to this client"
                          >
                            Grant Trial (Mark New)
                          </button>
                        )}

                        <button
                          onClick={() => openCustomerChatFromCrm(c)}
                          className="apple-btn-primary"
                          style={{ fontSize: 12, padding: '7px 14px' }}
                        >
                          <MessageSquare size={13} /> Chat & Family 360
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
          </main>
        </div>
      </div>

      {/* Admin Follow-up Consultation Thread Modal */}
      {activeFollowupThread && (
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
                    {activeFollowupThread.followup_days}-Day Window
                  </span>
                </div>
                <p style={{ fontSize: 12.5, color: '#6E6E73', marginTop: 2 }}>
                  Client: <strong>{activeFollowupThread.customer_name}</strong> ({activeFollowupThread.customer_phone}) · {activeFollowupThread.package_name}
                </p>
              </div>
              <button
                onClick={() => setActiveFollowupThread(null)}
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
                backgroundColor: activeFollowupThread.followup_active ? '#F0F9F1' : '#F5F5F7',
                borderBottom: '1px solid #E5E5EA',
                color: activeFollowupThread.followup_active ? '#247D3B' : '#8E8E93'
              }}
            >
              <span>
                <strong>Follow-up Status:</strong> {activeFollowupThread.followup_active ? 'Active Window · Client can send queries' : 'Window Concluded'}
              </span>
              {activeFollowupThread.followup_chat_expires_at && (
                <span style={{ fontSize: 11 }}>
                  Expires: {new Date(activeFollowupThread.followup_chat_expires_at).toLocaleDateString()}
                </span>
              )}
            </div>

            {/* Messages Thread */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', minHeight: 280, maxHeight: 380, display: 'flex', flexDirection: 'column', gap: 10, backgroundColor: '#FAF9F6' }}>
              {followupThreadMessages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px 20px', color: '#6E6E73' }}>
                  <Sparkles size={30} color="#C9A24B" style={{ marginBottom: 8 }} />
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#1D1D1F', marginBottom: 4 }}>
                    No follow-up messages yet
                  </div>
                  <p style={{ fontSize: 12.5, maxWidth: 360, margin: '0 auto' }}>
                    Messages submitted by the client within the {activeFollowupThread.followup_days}-day window will appear here. You can also proactively message the client.
                  </p>
                </div>
              ) : (
                followupThreadMessages.map((m: any) => {
                  const isMe = m.sender_type === 'admin';
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
                      <div style={{ fontSize: 11, fontWeight: 600, color: isMe ? '#247D3B' : '#3A3A6E', marginBottom: 3 }}>
                        {isMe ? 'Amit (You)' : activeFollowupThread.customer_name || 'Client'}
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
              onSubmit={handleSendAdminFollowup}
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
                value={adminFollowupInput}
                onChange={(e) => setAdminFollowupInput(e.target.value)}
                placeholder="Reply to client follow-up query..."
                className="apple-input"
                style={{ flex: 1, borderRadius: 9999, padding: '9px 16px', fontSize: 13.5 }}
              />
              <button
                type="submit"
                disabled={!adminFollowupInput.trim()}
                className="apple-btn-primary"
                style={{ padding: '9px 18px', fontSize: 13.5, opacity: !adminFollowupInput.trim() ? 0.5 : 1 }}
              >
                <Send size={14} /> Send Reply
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
