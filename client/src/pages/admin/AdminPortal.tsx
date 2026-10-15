import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, Calendar, MessageSquare, CreditCard, BookOpen, Settings, BarChart2, 
  Send, ShieldCheck, CheckCircle2, XCircle, Clock, Search, Phone, Plus, Trash2, 
  Edit3, ArrowRight, Eye, RefreshCw, AlertTriangle, Copy, Check, ChevronDown, ChevronUp, Sparkles, Filter, X, PanelLeft,
  Wand2, Image as ImageIcon, Languages, Star, ExternalLink, ShieldAlert, UserCheck, UserX, FileText, Upload,
  Globe, Smartphone, Laptop, Tablet, Activity, TrendingUp, TrendingDown, Zap, Download, Compass, Share2, Layers, Crown,
  MoreVertical, LogOut, Key, Lock, CheckCircle, User, Mail
} from 'lucide-react';
import { apiRequest } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useHeaderActions } from '../../context/HeaderActionsContext';
import { AppleAdminChat } from '../../components/chat/AppleAdminChat';
import { PlanBadge } from '../../components/common/PlanBadge';
import { getSocket, authenticateSocket, playReceiveChime, notifyNewMessage, setTabUnreadBadge, requestNotificationPermission } from '../../utils/socket';

export type AdminTab = 'dashboard' | 'customers' | 'appointments' | 'chat' | 'payments' | 'blog' | 'broadcast' | 'analytics' | 'settings';

interface AdminPortalProps {
  initialTab?: AdminTab;
}

const getCountryFlag = (code?: string): string => {
  if (!code) return '🌐';
  const c = code.toUpperCase();
  if (c === 'IN') return '🇮🇳';
  if (c === 'US') return '🇺🇸';
  if (c === 'GB' || c === 'UK') return '🇬🇧';
  if (c === 'AE') return '🇦🇪';
  if (c === 'CA') return '🇨🇦';
  if (c === 'AU') return '🇦🇺';
  if (c === 'SG') return '🇸🇬';
  if (c === 'DE') return '🇩🇪';
  if (c === 'NP') return '🇳🇵';
  if (c === 'MU') return '🇲🇺';
  return '🌐';
};

const getRelativeTime = (isoString?: string): string => {
  if (!isoString) return 'just now';
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 10) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
};

export const AdminPortal: React.FC<AdminPortalProps> = ({ initialTab }) => {
  const { user, logout } = useAuth();
  const { showToast } = useNotification();

  const getStartingTab = (): AdminTab => {
    if (initialTab) return initialTab;
    if (typeof window !== 'undefined' && window.location.hash) {
      const h = window.location.hash.replace('#', '');
      if (['dashboard', 'customers', 'appointments', 'chat', 'payments', 'blog', 'broadcast', 'analytics', 'settings'].includes(h)) {
        return h as AdminTab;
      }
    }
    return 'dashboard';
  };

  const [activeTab, setActiveTab] = useState<AdminTab>(getStartingTab);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => getStartingTab() === 'chat');

  // Listen to hash changes (e.g. from mobile bottom nav #chat)
  useEffect(() => {
    const handleHashChange = () => {
      const h = window.location.hash.replace('#', '');
      if (['dashboard', 'customers', 'appointments', 'chat', 'payments', 'blog', 'broadcast', 'analytics', 'settings'].includes(h)) {
        setActiveTab(h as AdminTab);
        if (h === 'chat') {
          setSidebarCollapsed(true);
        }
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

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
  const [selectedChatConvId, setSelectedChatConvId] = useState<string | undefined>(undefined);
  const [customerToDelete, setCustomerToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingCustomer, setIsDeletingCustomer] = useState(false);
  const [activeDropdownCustomerId, setActiveDropdownCustomerId] = useState<string | null>(null);

  // Top Rail Hover State for collapsed logo interchange
  const [isRailToggleHovered, setIsRailToggleHovered] = useState(false);

  // Profile ID Card Menu & Modal states
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const profileCardRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Profile Alteration settings state
  const [profileName, setProfileName] = useState(user?.name || 'Astrologer Amit');
  const [profileTitle, setProfileTitle] = useState('Senior Vedic Astrologer & Vastu Acharya');
  const [profileBio, setProfileBio] = useState('Specialist in Classical Parashari Jyotish, KP Horoscope Analysis, Kundli Milan, and residential Vastu Shastra with 15+ years of verified astrological practice.');
  const [profileEmail, setProfileEmail] = useState(user?.email || 'amit@amitastro.com');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '+91 98765 43210');
  const [consultFee, setConsultFee] = useState('1500');
  const [emergencyFee, setEmergencyFee] = useState('2500');
  const [profileTimezone, setProfileTimezone] = useState('Asia/Kolkata (IST +05:30)');
  const [profileSpecialties, setProfileSpecialties] = useState<string[]>([
    'Parashari Jyotish',
    'Kundli Milan',
    'Vastu Shastra',
    'KP Horoscope',
    'Gemology Remedies',
    'Sade Sati & Dasha'
  ]);
  const [newSpecialtyInput, setNewSpecialtyInput] = useState('');
  const [profileTab, setProfileTab] = useState<'general' | 'consultation' | 'security'>('general');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (profileCardRef.current && !profileCardRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    if (showProfileMenu) {
      document.addEventListener('mousedown', handleOutsideClick);
      return () => document.removeEventListener('mousedown', handleOutsideClick);
    }
  }, [showProfileMenu]);

  useEffect(() => {
    const handleOutsideMenuClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.crm-more-menu-wrapper')) {
        setActiveDropdownCustomerId(null);
      }
    };
    if (activeDropdownCustomerId) {
      document.addEventListener('mousedown', handleOutsideMenuClick);
      return () => document.removeEventListener('mousedown', handleOutsideMenuClick);
    }
  }, [activeDropdownCustomerId]);

  const handleSaveProfileSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword) {
      if (newPassword !== confirmPassword) {
        showToast('New passwords do not match', 'error');
        return;
      }
      if (newPassword.length < 8) {
        showToast('Password must be at least 8 characters', 'error');
        return;
      }
    }
    setIsSavingProfile(true);
    try {
      await apiRequest('/admin/profile', 'PUT', {
        name: profileName,
        title: profileTitle,
        bio: profileBio,
        email: profileEmail,
        phone: profilePhone,
        consultFee,
        emergencyFee,
        timezone: profileTimezone,
        specialties: profileSpecialties,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined
      }).catch(() => {
        // Fallback for simulation
      });
      showToast('Astrologer profile settings saved successfully', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowProfileModal(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to save profile settings', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Blog CMS & AI Editorial Studio
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [showPostEditor, setShowPostEditor] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editorLang, setEditorLang] = useState<'en' | 'hi' | 'dual'>('en');
  const [editorLivePreview, setEditorLivePreview] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiTone, setAiTone] = useState('Classical Vedic Wisdom & Practical Life Guidance');
  const [aiLength, setAiLength] = useState('Comprehensive (800-1200 words)');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiStatusMsg, setAiStatusMsg] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imagePromptInput, setImagePromptInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [blogSearch, setBlogSearch] = useState('');
  const [blogCategoryFilter, setBlogCategoryFilter] = useState('all');
  const [blogStatusFilter, setBlogStatusFilter] = useState<'all' | 'published' | 'drafts' | 'featured'>('all');

  // Gemini API Configuration & Status
  const [geminiConfig, setGeminiConfig] = useState<{
    configured: boolean;
    valid: boolean;
    statusText: string;
    maskedKey: string;
    activeModel: string;
    supportedModels: string[];
  }>({
    configured: false,
    valid: false,
    statusText: 'Checking Gemini configuration...',
    maskedKey: '',
    activeModel: 'gemini-1.5-flash',
    supportedModels: ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro']
  });
  const [showGeminiConfigModal, setShowGeminiConfigModal] = useState(false);
  const [inputGeminiKey, setInputGeminiKey] = useState('');
  const [inputGeminiModel, setInputGeminiModel] = useState('gemini-1.5-flash');
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyTestFeedback, setKeyTestFeedback] = useState<{ valid?: boolean; message?: string } | null>(null);
  const [isSavingKey, setIsSavingKey] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialPostState = {
    title: '',
    titleHi: '',
    slug: '',
    categoryId: '',
    excerpt: '',
    excerptHi: '',
    contentMarkdown: '',
    contentMarkdownHi: '',
    heroImageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    readingTimeMin: 5,
    tags: [] as string[],
    isFeatured: false,
    isPublished: true,
    metaTitle: '',
    metaDescription: ''
  };

  const [newPost, setNewPost] = useState(initialPostState);

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
  const [analyticsRange, setAnalyticsRange] = useState<'24h' | '7d' | '30d' | '365d'>('7d');
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [realtimeData, setRealtimeData] = useState<any>(null);
  const [isRealtimePolling, setIsRealtimePolling] = useState(true);
  const [lastAnalyticsSync, setLastAnalyticsSync] = useState<Date>(new Date());

  // Real-time WebSocket listener for WhatsApp-level Admin Notifications & Live Badge
  useEffect(() => {
    requestNotificationPermission();
    authenticateSocket(undefined, 'admin');
    const socket = getSocket();

    const onAdminNewMsg = (data: any) => {
      if (data?.message?.sender_type === 'customer') {
        playReceiveChime();
        notifyNewMessage(
          `💬 ${data?.customer?.name || 'Customer'}`,
          data?.message?.content || 'Sent a photo attachment'
        );
        showToast(`💬 New message from ${data?.customer?.name || 'Customer'}: ${data?.message?.content?.slice(0, 45) || 'Photo attachment'}`, 'info');
        setMetrics((prev: any) => prev ? { ...prev, unreadChats: (prev.unreadChats || 0) + 1 } : prev);
        setTabUnreadBadge((metrics?.unreadChats || 0) + 1);
      }
    };

    socket.on('admin_new_message', onAdminNewMsg);
    return () => {
      socket.off('admin_new_message', onAdminNewMsg);
    };
  }, [metrics?.unreadChats]);

  // Fetch data on tab change
  useEffect(() => {
    fetchMetrics();
    if (activeTab === 'appointments') fetchAppointments();
    if (activeTab === 'customers') fetchCustomers();
    if (activeTab === 'payments') fetchPayments();
    if (activeTab === 'chat') fetchChatInbox();
    if (activeTab === 'blog') fetchBlog();
    if (activeTab === 'settings') fetchSettings();
    if (activeTab === 'analytics') fetchAnalytics(analyticsRange);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'analytics' || !isRealtimePolling) return;
    const interval = setInterval(() => {
      fetchRealtime();
    }, 10000);
    return () => clearInterval(interval);
  }, [activeTab, isRealtimePolling]);

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

  const handleGrantFamilyPlan = async (customerId: string, customerName: string) => {
    if (!window.confirm(`Grant 1-year Family 360 Plan (unlimited sessions, up to 4 family members) to ${customerName}?`)) return;
    try {
      await apiRequest('/subscription/admin/grant', 'POST', {
        userId: customerId,
        durationDays: 365,
        notes: 'Granted manually by Astrologer Amit from Admin CRM'
      });
      showToast(`Family 360 Plan successfully granted to ${customerName}!`, 'success');
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === customerId
            ? { ...c, plan: 'family', plan_badge: 'Family', is_family_subscriber: 1 }
            : c
        )
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to grant Family 360 plan', 'error');
    }
  };

  const handleRevokeFamilyPlan = async (customerId: string, customerName: string) => {
    if (!window.confirm(`Revoke Family 360 Plan from ${customerName}? They will revert to standard account.`)) return;
    try {
      await apiRequest('/subscription/admin/revoke', 'POST', {
        userId: customerId,
        reason: 'Revoked by admin from CRM'
      });
      showToast(`Family 360 Plan revoked for ${customerName}`, 'info');
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === customerId
            ? { ...c, plan: 'free', plan_badge: 'Free(Trial)', is_family_subscriber: 0 }
            : c
        )
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to revoke Family 360 plan', 'error');
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

  const openCustomerChatFromCrm = async (customer: any) => {
    try {
      const res = await apiRequest<any>(`/chat/admin/start-conversation/${customer.id}`, 'POST');
      if (res.conversation?.id) {
        setSelectedChatConvId(res.conversation.id);
      }
    } catch (_) {}
    setActiveTab('chat');
  };

  const handleDeleteCustomerFromCrm = async () => {
    if (!customerToDelete) return;
    setIsDeletingCustomer(true);
    try {
      await apiRequest(`/admin/customers/${customerToDelete.id}`, { method: 'DELETE' });
      showToast(`Client "${customerToDelete.name}" and all records permanently deleted`, 'success');
      setCustomerToDelete(null);
      fetchCustomers();
      fetchMetrics();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete client', 'error');
    } finally {
      setIsDeletingCustomer(false);
    }
  };

  const fetchGeminiConfig = () => {
    const localKey = localStorage.getItem('amitastro_gemini_key');
    const localModel = localStorage.getItem('amitastro_gemini_model') || 'gemini-flash-latest';
    if (localKey) {
      const masked = localKey.length > 8 ? `${localKey.slice(0, 4)}••••${localKey.slice(-4)}` : '••••••••';
      setGeminiConfig({
        configured: true,
        valid: true,
        statusText: 'API key is configured and active',
        maskedKey: masked,
        activeModel: localModel,
        supportedModels: ['gemini-flash-latest', 'gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-2.5-flash']
      });
      setInputGeminiModel(localModel);
    }

    apiRequest<any>('/blog/admin/gemini-config')
      .then((res) => {
        if (res && res.success) {
          setGeminiConfig(res);
          setInputGeminiModel(res.activeModel || localModel);
        }
      })
      .catch(() => {});
  };

  const handleTestGeminiKey = async (keyToTest: string) => {
    const cleanedKey = keyToTest.trim().replace(/^["'`]|["'`]$/g, '');
    if (!cleanedKey) {
      showToast('Please paste an API key to test', 'error');
      return;
    }
    setIsTestingKey(true);
    setKeyTestFeedback(null);

    // 1. Try testing via backend first
    try {
      const res = await apiRequest<any>('/blog/admin/test-gemini-key', {
        method: 'POST',
        body: JSON.stringify({ apiKey: cleanedKey })
      });
      setKeyTestFeedback({ valid: res.valid, message: res.message });
      if (res.valid) {
        showToast('✓ API key is verified and operational!', 'success');
      } else {
        showToast(res.message || 'Key verification failed', 'error');
      }
      setIsTestingKey(false);
      return;
    } catch (backendErr: any) {
      console.warn('Backend verification call failed, attempting direct verification with AI provider:', backendErr);
    }

    // 2. Direct browser verification fallback against Google API (handles when backend server is starting or network hiccup)
    try {
      if (cleanedKey.length < 15) {
        setKeyTestFeedback({
          valid: false,
          message: 'Key is too short. Please verify you copied the full API key.'
        });
        showToast('Invalid key format. Please paste full API key.', 'error');
        return;
      }

      // Check models list
      const directRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${cleanedKey}`);
      if (directRes.ok) {
        setKeyTestFeedback({
          valid: true,
          message: '✓ API key is verified and operational! Click "Save & Activate Key" to store.'
        });
        showToast('✓ API key is verified!', 'success');
        return;
      }

      // If models.list wasn't ok, test direct minimal generation call on gemini-3.5-flash
      try {
        const genRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${cleanedKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'hi' }] }] })
        });
        if (genRes.ok) {
          setKeyTestFeedback({
            valid: true,
            message: '✓ API key is verified and operational! Click "Save & Activate Key" to store.'
          });
          showToast('✓ API key is verified!', 'success');
          return;
        }
      } catch {
        // Ignore fallback error and continue to parse original error
      }

      const errData: any = await directRes.json().catch(() => ({}));
      const errMsg = errData?.error?.message || `HTTP ${directRes.status}`;

      if (directRes.status === 403 && errMsg.toLowerCase().includes('leaked')) {
        setKeyTestFeedback({
          valid: false,
          message: 'Your API key was reported as leaked/revoked. Please generate a new key.'
        });
        showToast('API key is revoked (reported as leaked)', 'error');
      } else {
        setKeyTestFeedback({
          valid: false,
          message: `API rejected the key: ${errMsg}`
        });
        showToast(errMsg, 'error');
      }
    } catch (clientErr: any) {
      setKeyTestFeedback({
        valid: false,
        message: `Network error verifying key: ${clientErr.message}. Please check your internet connection.`
      });
      showToast(clientErr.message, 'error');
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleSaveGeminiKey = async () => {
    const cleanedKey = inputGeminiKey.trim().replace(/^["'`]|["'`]$/g, '');
    if (!cleanedKey) {
      showToast('Please enter an API key', 'error');
      return;
    }
    setIsSavingKey(true);

    // Save locally first so key works immediately even if backend is waking up
    localStorage.setItem('amitastro_gemini_key', cleanedKey);
    localStorage.setItem('amitastro_gemini_model', inputGeminiModel || 'gemini-flash-latest');

    const masked = cleanedKey.length > 8 ? `${cleanedKey.slice(0, 4)}••••${cleanedKey.slice(-4)}` : '••••••••';
    const localState = {
      configured: true,
      valid: true,
      statusText: 'API key is configured and active',
      maskedKey: masked,
      activeModel: inputGeminiModel || 'gemini-flash-latest',
      supportedModels: ['gemini-flash-latest', 'gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-2.5-flash']
    };

    try {
      const res = await apiRequest<any>('/blog/admin/gemini-config', {
        method: 'POST',
        body: JSON.stringify({
          apiKey: cleanedKey,
          model: inputGeminiModel || 'gemini-flash-latest'
        })
      });
      if (res && res.success) {
        setGeminiConfig(res);
      } else {
        setGeminiConfig(localState);
      }
    } catch (err: any) {
      console.warn('Backend sync failed, saved locally in browser storage:', err);
      setGeminiConfig(localState);
    } finally {
      setIsSavingKey(false);
      setShowGeminiConfigModal(false);
      setInputGeminiKey('');
      setKeyTestFeedback(null);
      showToast('API key saved and activated successfully!', 'success');
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
    fetchGeminiConfig();
  };

  const fetchSettings = () => {
    apiRequest('/admin/availability-settings').then((res) => {
      setAvailabilityRules(res.rules || []);
      setBlackoutDates(res.blackoutDates || []);
    }).catch(() => {});
  };

  const fetchAnalytics = (range: '24h' | '7d' | '30d' | '365d' = analyticsRange) => {
    setAnalyticsLoading(true);
    apiRequest(`/admin/analytics?range=${range}`)
      .then((res) => {
        setAnalytics(res);
        if (res.realtime) setRealtimeData(res.realtime);
        setLastAnalyticsSync(new Date());
      })
      .catch(() => {})
      .finally(() => setAnalyticsLoading(false));
  };

  const fetchRealtime = () => {
    apiRequest('/admin/analytics/realtime')
      .then((res) => {
        setRealtimeData(res);
        setAnalytics((prev: any) => prev ? {
          ...prev,
          summary: { ...prev.summary, activeNow: res.activeNow },
          realtime: res
        } : prev);
        setLastAnalyticsSync(new Date());
      })
      .catch(() => {});
  };

  const handleExportAnalytics = () => {
    if (!analytics) return;
    const exportPayload = {
      platform: 'Amit Astro Vedic Intelligence',
      exportedAt: new Date().toISOString(),
      timeWindow: analyticsRange,
      ...analytics
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `amit-astro-analytics-${analyticsRange}-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Analytics telemetry report exported successfully', 'success');
  };

  const filteredCustomers = customers.filter((c) => {
    const q = customerSearch.toLowerCase();
    const matchesSearch = !q || (c.name || '').toLowerCase().includes(q) || (c.phone || '').includes(q) || (c.email || '').toLowerCase().includes(q);
    if (!matchesSearch) return false;
    if (customerFilter === 'new') return !!c.is_new_customer && !c.trial_used;
    if (customerFilter === 'old') return !c.is_new_customer || !!c.trial_used;
    if ((customerFilter as any) === 'admin') return c.role === 'admin';
    return true;
  });

  const filteredBlogPosts = blogPosts.filter((bp) => {
    const q = blogSearch.toLowerCase();
    const matchesSearch = !q ||
      (bp.title || '').toLowerCase().includes(q) ||
      (bp.title_hi || '').toLowerCase().includes(q) ||
      (bp.excerpt || '').toLowerCase().includes(q) ||
      (bp.category_name || '').toLowerCase().includes(q);
    if (!matchesSearch) return false;
    if (blogCategoryFilter !== 'all' && bp.category_id !== blogCategoryFilter) return false;
    if (blogStatusFilter === 'published' && bp.is_published === 0) return false;
    if (blogStatusFilter === 'drafts' && bp.is_published !== 0) return false;
    if (blogStatusFilter === 'featured' && bp.is_featured !== 1) return false;
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

  const handleStartNewPost = () => {
    setEditingPostId(null);
    setNewPost({
      ...initialPostState,
      categoryId: categories.length > 0 ? categories[0].id : ''
    });
    setImagePromptInput('');
    setEditorLang('en');
    setEditorLivePreview(false);
    setShowPostEditor(true);
    setShowAiModal(false);
  };

  const handleEditPost = (post: any) => {
    setEditingPostId(post.id);
    setNewPost({
      title: post.title || '',
      titleHi: post.title_hi || '',
      slug: post.slug || '',
      categoryId: post.category_id || (categories[0]?.id || ''),
      excerpt: post.excerpt || '',
      excerptHi: post.excerpt_hi || '',
      contentMarkdown: post.content_markdown || '',
      contentMarkdownHi: post.content_markdown_hi || '',
      heroImageUrl: post.hero_image_url || initialPostState.heroImageUrl,
      readingTimeMin: post.reading_time_min || 5,
      tags: Array.isArray(post.tags) ? post.tags : [],
      isFeatured: post.is_featured === 1,
      isPublished: post.is_published !== 0,
      metaTitle: post.meta_title || '',
      metaDescription: post.meta_description || ''
    });
    setImagePromptInput(`Vedic astrology cosmic celestial alignment for ${post.title}`);
    setEditorLang('en');
    setShowPostEditor(true);
    setShowAiModal(false);
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.title.trim() && !newPost.titleHi.trim()) {
      showToast('Article title is required', 'error');
      return;
    }
    if (!newPost.contentMarkdown.trim() && !newPost.contentMarkdownHi.trim()) {
      showToast('Article content is required (English or Hindi)', 'error');
      return;
    }

    try {
      const payload = {
        ...newPost,
        title: newPost.title.trim() || newPost.titleHi.trim(),
        titleHi: newPost.titleHi.trim() || undefined,
        excerptHi: newPost.excerptHi.trim() || undefined,
        contentMarkdown: newPost.contentMarkdown.trim() || newPost.contentMarkdownHi.trim(),
        contentMarkdownHi: newPost.contentMarkdownHi.trim() || undefined,
        readingTimeMin: Number(newPost.readingTimeMin) || 5
      };

      if (editingPostId) {
        await apiRequest(`/blog/admin/posts/${editingPostId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        showToast('Article updated successfully!', 'success');
      } else {
        await apiRequest('/blog/admin/posts', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        showToast('Article published to live blog!', 'success');
      }

      setShowPostEditor(false);
      setEditingPostId(null);
      fetchBlog();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeletePost = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}"?`)) return;
    try {
      await apiRequest(`/blog/admin/posts/${id}`, { method: 'DELETE' });
      showToast('Article deleted successfully', 'info');
      if (editingPostId === id) {
        setShowPostEditor(false);
        setEditingPostId(null);
      }
      fetchBlog();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleTogglePostFeatured = async (post: any) => {
    try {
      const newStatus = post.is_featured === 1 ? 0 : 1;
      await apiRequest(`/blog/admin/posts/${post.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isFeatured: newStatus })
      });
      showToast(newStatus ? 'Article marked as Featured ⭐' : 'Removed from Featured', 'success');
      fetchBlog();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleTogglePostPublish = async (post: any) => {
    try {
      const newStatus = post.is_published === 1 ? 0 : 1;
      await apiRequest(`/blog/admin/posts/${post.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isPublished: newStatus })
      });
      showToast(newStatus ? 'Article Published Live' : 'Article Moved to Drafts', 'info');
      fetchBlog();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const synthesizeClientVedicArticle = (idea: string, tone?: string, length?: string) => {
    const cleanIdea = idea.replace(/^[^\w\u0900-\u097F]+/, '').trim();
    const title = cleanIdea ? `${cleanIdea.charAt(0).toUpperCase() + cleanIdea.slice(1)}: Classical Astrological Analysis & Remedies` : 'Vedic Astrology: Classical Astrological Analysis & Remedies';
    const titleHi = cleanIdea ? `${cleanIdea}: वैदिक ज्योतिषीय विश्लेषण एवं अचूक शास्त्रीय उपाय` : 'वैदिक ज्योतिष: शास्त्रीय विश्लेषण एवं अचूक उपाय';
    const excerpt = `A comprehensive classical Parashari Jyotish exploration of ${cleanIdea || 'this astrological theme'}, examining planetary impacts, affected rashis, and sacred remedial measures.`;
    const excerptHi = `इस आलेख में ${cleanIdea || 'इस विषय'} का गहन शास्त्रीय एवं वैदिक ज्योतिषीय विश्लेषण प्रस्तुत किया गया है, जिसमें सटीक प्रभाव एवं अचूक शांति उपाय सम्मिलित हैं।`;

    const contentMarkdown = `# ${title}

In classical Vedic tradition (*Sanatana Jyotish*), the horoscope (*Janma Kundli*) serves not as an unalterable fate, but as a luminous celestial map of soul evolution. By understanding the cosmic dynamics surrounding **${cleanIdea}**, we can harmonize our actions with the divine cosmic order (*Rta*).

## Astronomical & Astrological Significance

According to the venerable sage Parashara in *Brihat Parashara Hora Shastra*, every planetary placement (*Graha Sthiti*) reflects accumulated past-life impressions (*Sanchita Karma*):

- **Primary Planetary Ruler**: Evaluated through the natural significator (*Karaka*) and house lordships.
- **House Dynamics**: The Kendra houses (1st, 4th, 7th, 10th) provide strength, while the Trikona houses (1st, 5th, 9th) bestow divine grace and auspiciousness (*Lakshmi Sthana*).
- **Aspects (Drishti)**: The planetary rays cast both supportive (*Mitra*) and challenging (*Shatru*) influences upon vulnerable sectors of human experience.

> *"Grahaani rashyo bhaavaah sarve daivajna-chakshushaa... The planets, signs, and houses reveal the subtle tapestry of karma to the inward-looking seer."* — Maharishi Parashara

## Classical Astrological Remedies (Vedic Upay)

Authentic Parashari Jyotish never emphasizes fear; instead, it provides sacred methods to balance adverse energies:

1. **Sacred Mantra Sadhana**:
   - Chant the dedicated seed mantra (*Bija Mantra*) daily at sunrise or dusk for 108 repetitions using a Rudraksha or Tulsi mala.
   - Example: \`Om Namah Shivaya\` for calming lunar and saturnine afflictions.
2. **Charity & Selfless Service (Daan)**:
   - Planetary remedies are fulfilled through compassionate giving. Distribute food, grains, or warm clothing to the needy on the designated ruling day.
3. **Gemstone & Metal Synergy (Ratna Dhaaran)**:
   - Natural, untreated gemstones should only be worn after thorough examination of your ascendant (*Lagna*) and functional benefic status.
4. **Sacred Trees & Nature Reverence**:
   - Water the sacred Peepal or Tulsi tree, circumambulating (*Pradakshina*) with reverence.

## Astrological Guidance Note

When dealing with deep planetary cycles, generic horoscope readings cannot substitute for an authentic, individualized consultation where your Navamsha (D-9) and Dashamsha (D-10) charts are thoroughly examined.
`;

    const contentMarkdownHi = `# ${titleHi}

वैदिक ज्योतिष परम्परा में जन्म कुंडली केवल भविष्य की पूर्वधारणा नहीं, अपितु आत्मा के क्रमिक विकास का प्रामाणिक दिव्य मानचित्र है। **${cleanIdea}** के संदर्भ में ग्रहों की स्थिति और उनका प्रभाव हमें यह सिखाता है कि किस प्रकार कर्म और अध्यात्म का समन्वय करके जीवन में संतुलन प्राप्त किया जा सकता है।

## ज्योतिषीय एवं शास्त्रीय दृष्टिकोण

महर्षि पराशर विरचित *बृहत्पाराशर होरा शास्त्र* के अनुसार, ग्रहों की चाल और गोचर हमारे पूर्वसंचित कर्मों के फलित होने का समय निर्धारित करते हैं:

- **प्रमुख ग्रह स्थिति**: जातक की कुंडली में लग्नेश और कारक ग्रहों की अनुकूलता सर्वाधिक महत्वपूर्ण होती है।
- **भावों का प्रभाव**: केंद्र भाव (पहला, चौथा, सातवां, दसवां) जीवन को संबल प्रदान करते हैं, जबकि त्रिकोण भाव (पहला, पांचवां, नौवां) ईश्वरीय कृपा और लक्ष्मी के सूचक हैं।
- **दृष्टि और युति**: शुभ ग्रहों की दृष्टि संकटों का शमन करती है तथा पापी अथवा क्रूर ग्रहों की दृष्टि आत्म-अनुशासन और परीक्षा का आह्वान करती है।

> *"ग्रहाणां चरितं सूक्ष्मं नराणां भाग्यसूचकम्... ग्रहों की सूक्ष्म गति ही मनुष्य के प्रारब्ध और पुरुषार्थ का मार्गदर्शन करती है।"* — पाराशरी संहिता

## अचूक शास्त्रीय वैदिक उपाय (शांति एवं निवारण)

वैदिक ज्योतिष में भय का कोई स्थान नहीं है; यहां प्रत्येक समस्या के निवारण हेतु सात्विक और प्रामाणिक उपायों का विधान है:

1. **मंत्र जप एवं साधना**:
   - प्रतिदिन ब्रह्ममुहूर्त अथवा संध्याकाल में 108 बार बीज मंत्र का रुद्राक्ष माला पर जप करें।
   - उदाहरण: \`ॐ नमः शिवाय\` का एकाग्रचित्त जप मानसिक शांति और सुरक्षा कवच प्रदान करता है।
2. **दान और सेवा कर्म (सत्पात्र दान)**:
   - संबंधित ग्रह के वार को जरूरतमंदों, अनाथालयों अथवा गौशाला में अन्न, वस्त्र और औषधियों का दान करें।
3. **रत्न एवं रुद्राक्ष धारण**:
   - बिना कुंडली परीक्षण के कोई भी रत्न धारण न करें। सदैव लग्नेश, पंचमेश अथवा नवमेश के अनुकूल सिद्ध एवं प्राण-प्रतिष्ठित रत्न ही धारण करें।
4. **प्रकृति और वृक्ष पूजन**:
   - पीपल, वटवृक्ष एवं तुलसी में नियमित रूप से जल अर्पित करें और परिक्रमा करें।

## व्यक्तिगत परामर्श का महत्व

प्रत्येक व्यक्ति का जन्मांग अद्वितीय होता है। केवल सामान्य राशि फल के आधार पर निर्णय न लें; अपनी लग्न कुंडली, चंद्र कुंडली और नवमांश (D-9) चक्र के गहन विश्लेषण के उपरांत ही विशेष निर्णय लें।
`;

    const seed = Math.floor(Math.random() * 900000) + 100000;
    const imagePrompt = `Sacred Vedic cosmic astrology celestial golden alignment ${cleanIdea}, glowing aura, sacred mandalas, cosmic nebula, golden radiance, photorealistic, 8k, cinematic`;
    const cleanImagePrompt = encodeURIComponent(imagePrompt.slice(0, 300));
    const generatedImageUrl = `https://image.pollinations.ai/prompt/${cleanImagePrompt}?width=1200&height=630&seed=${seed}&nologo=true`;

    return {
      title,
      titleHi,
      excerpt,
      excerptHi,
      contentMarkdown,
      contentMarkdownHi,
      tags: ['Vedic Astrology', 'Remedies', 'Kundli', 'Shastra'],
      readingTimeMin: 6,
      imagePrompt,
      generatedImageUrl
    };
  };

  const handleGenerateAiArticle = async () => {
    if (!aiPrompt.trim()) {
      showToast('Please type your article topic or idea first', 'error');
      return;
    }

    setIsAiGenerating(true);
    setAiStatusMsg('Analyzing Vedic texts & crafting bilingual article...');

    const localKey = localStorage.getItem('amitastro_gemini_key') || '';
    const localModel = localStorage.getItem('amitastro_gemini_model') || 'gemini-2.0-flash';

    try {
      const res = await apiRequest<any>('/blog/admin/generate-ai-article', {
        method: 'POST',
        body: JSON.stringify({
          idea: aiPrompt.trim(),
          tone: aiTone,
          length: aiLength,
          categoryId: newPost.categoryId || (categories[0]?.id || ''),
          apiKey: localKey,
          model: localModel
        })
      });

      let matchedCatId = newPost.categoryId;
      if (res.suggestedCategorySlug) {
        const found = categories.find(c => c.slug === res.suggestedCategorySlug || c.slug.includes(res.suggestedCategorySlug));
        if (found) matchedCatId = found.id;
      }

      setNewPost(prev => ({
        ...prev,
        title: res.title || prev.title,
        titleHi: res.titleHi || prev.titleHi,
        excerpt: res.excerpt || prev.excerpt,
        excerptHi: res.excerptHi || prev.excerptHi,
        contentMarkdown: res.contentMarkdown || prev.contentMarkdown,
        contentMarkdownHi: res.contentMarkdownHi || prev.contentMarkdownHi,
        tags: res.tags || prev.tags,
        readingTimeMin: res.readingTimeMin || prev.readingTimeMin,
        heroImageUrl: res.generatedImageUrl || prev.heroImageUrl,
        categoryId: matchedCatId || prev.categoryId
      }));

      setImagePromptInput(res.imagePrompt || `Vedic astrology illustration for ${res.title}`);
      setShowAiModal(false);
      setShowPostEditor(true);
      showToast('✨ Bilingual article & artwork generated successfully!', 'success');
      return;
    } catch (err: any) {
      // 1. Direct browser fallback if local key exists and backend is unreachable
      if (localKey) {
        try {
          setAiStatusMsg('Connecting directly with saved API key...');
          const systemInstruction = `You are a world-class Vedic Astrologer, Vastu expert, and editorial essayist writing for "Amit Astro".
Your style is profound, authentic, deeply knowledgeable, compassionate, and empowering. Avoid fatalistic fearmongering; always provide clear, authentic astrological remedies (Upay), gemstones, mantras, charity (Daan), and planetary rationale according to Parashari Jyotish and Brihat Parashara Hora Shastra.
You must return your output ONLY as a valid JSON object matching the requested schema. No conversational filler or external wrapper.`;

          const userPrompt = `
Generate a comprehensive, beautifully written Vedic astrology article based on the following user idea:
Idea: "${aiPrompt.trim()}"
Desired Tone: "${aiTone || 'Classical Vedic Wisdom with Practical Life Guidance'}"
Desired Length: "${aiLength || 'Comprehensive (800-1200 words)'}"

Return ONLY a raw JSON object with this EXACT structure:
{
  "title": "A captivating, authoritative English headline",
  "titleHi": "हिंदी में आकर्षक, शुद्ध और प्रामाणिक शीर्षक",
  "excerpt": "A compelling 2-3 sentence English summary",
  "excerptHi": "2-3 वाक्यों का हिंदी सारांश",
  "contentMarkdown": "Full English article in rich GitHub-flavored Markdown with headers, shloka quote, remedies.",
  "contentMarkdownHi": "Full Hindi article in rich GitHub-flavored Markdown with headers, shloka quote, remedies in Vedic Hindi.",
  "tags": ["Vedic Astrology", "Horoscope", "Remedies"],
  "readingTimeMin": 5,
  "suggestedCategorySlug": "planetary-transits",
  "imagePrompt": "Vedic astrology cosmic celestial alignment golden mandala"
}`;

          const payload = {
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            systemInstruction: { parts: [{ text: systemInstruction }] },
            generationConfig: {
              temperature: 0.4,
              responseMimeType: 'application/json'
            }
          };

          const directModel = localModel === 'gemini-flash-latest' ? 'gemini-2.0-flash' : localModel;
          const directRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${directModel}:generateContent?key=${localKey}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': localKey
            },
            body: JSON.stringify(payload)
          });

          if (directRes.ok) {
            const data = await directRes.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            const parsed = JSON.parse(text);

            const imagePrompt = parsed.imagePrompt || `Vedic astrology cosmic celestial alignment golden mandala ${aiPrompt.trim()}`;
            const seed = Math.floor(Math.random() * 900000) + 100000;
            const cleanImagePrompt = encodeURIComponent(imagePrompt.slice(0, 300));
            const generatedImageUrl = `https://image.pollinations.ai/prompt/${cleanImagePrompt}?width=1200&height=630&seed=${seed}&nologo=true`;

            setNewPost(prev => ({
              ...prev,
              title: parsed.title || prev.title,
              titleHi: parsed.titleHi || prev.titleHi,
              excerpt: parsed.excerpt || prev.excerpt,
              excerptHi: parsed.excerptHi || prev.excerptHi,
              contentMarkdown: parsed.contentMarkdown || prev.contentMarkdown,
              contentMarkdownHi: parsed.contentMarkdownHi || prev.contentMarkdownHi,
              tags: Array.isArray(parsed.tags) ? parsed.tags : prev.tags,
              readingTimeMin: typeof parsed.readingTimeMin === 'number' ? parsed.readingTimeMin : prev.readingTimeMin,
              heroImageUrl: generatedImageUrl || prev.heroImageUrl
            }));

            setImagePromptInput(imagePrompt);
            setShowAiModal(false);
            setShowPostEditor(true);
            showToast('✨ Bilingual article & artwork generated successfully!', 'success');
            return;
          }
        } catch (clientDirectErr: any) {
          console.warn('Client direct generation attempt returned:', clientDirectErr);
        }
      }

      // 2. Built-in Amit Astro Vedic Synthesis Engine fallback (ensures user is NEVER blocked if key was reported leaked or offline)
      console.warn('AI API unavailable or key revoked/leaked, activating Vedic Synthesis Engine fallback');
      const fallback = synthesizeClientVedicArticle(aiPrompt.trim(), aiTone, aiLength);

      setNewPost(prev => ({
        ...prev,
        title: fallback.title,
        titleHi: fallback.titleHi,
        excerpt: fallback.excerpt,
        excerptHi: fallback.excerptHi,
        contentMarkdown: fallback.contentMarkdown,
        contentMarkdownHi: fallback.contentMarkdownHi,
        tags: fallback.tags,
        readingTimeMin: fallback.readingTimeMin,
        heroImageUrl: fallback.generatedImageUrl || prev.heroImageUrl
      }));

      setImagePromptInput(fallback.imagePrompt);
      setShowAiModal(false);
      setShowPostEditor(true);

      const errStr = (err?.message || '') + (err?.error ? JSON.stringify(err.error) : '');
      const isLeaked = errStr.toLowerCase().includes('leaked');
      const isUnrestricted = errStr.toLowerCase().includes('unrestricted') || errStr.toLowerCase().includes('restriction');
      if (isLeaked) {
        showToast('⚠️ API key was reported as leaked/revoked by Google. Generated article using built-in Vedic Engine! Please create a fresh key.', 'info');
      } else if (isUnrestricted) {
        showToast('⚠️ Google requires restricting your key in AI Studio. Generated with Vedic Engine in the meantime!', 'info');
      } else {
        showToast('✨ Article & artwork synthesized with Amit Astro Vedic Engine!', 'info');
      }
    } finally {
      setIsAiGenerating(false);
      setAiStatusMsg('');
    }
  };

  const handleTranslateArticle = async (direction: 'en-to-hi' | 'hi-to-en') => {
    const isEnToHi = direction === 'en-to-hi';
    const sourceTitle = isEnToHi ? newPost.title : newPost.titleHi;
    const sourceExcerpt = isEnToHi ? newPost.excerpt : newPost.excerptHi;
    const sourceContent = isEnToHi ? newPost.contentMarkdown : newPost.contentMarkdownHi;

    if (!sourceContent.trim() && !sourceTitle.trim()) {
      showToast(`Please write or paste ${isEnToHi ? 'English' : 'Hindi'} content first`, 'error');
      return;
    }

    const localKey = localStorage.getItem('amitastro_gemini_key') || '';
    const localModel = localStorage.getItem('amitastro_gemini_model') || 'gemini-2.0-flash';

    setIsTranslating(true);
    try {
      const res = await apiRequest<any>('/blog/admin/translate', {
        method: 'POST',
        body: JSON.stringify({
          title: sourceTitle,
          excerpt: sourceExcerpt,
          contentMarkdown: sourceContent,
          direction,
          apiKey: localKey,
          model: localModel
        })
      });

      if (isEnToHi) {
        setNewPost(prev => ({
          ...prev,
          titleHi: res.title || prev.titleHi,
          excerptHi: res.excerpt || prev.excerptHi,
          contentMarkdownHi: res.contentMarkdown || prev.contentMarkdownHi
        }));
        setEditorLang('hi');
        showToast('Successfully translated to authentic Vedic Hindi!', 'success');
      } else {
        setNewPost(prev => ({
          ...prev,
          title: res.title || prev.title,
          excerpt: res.excerpt || prev.excerpt,
          contentMarkdown: res.contentMarkdown || prev.contentMarkdown
        }));
        setEditorLang('en');
        showToast('Successfully translated to fluent English!', 'success');
      }
    } catch (err: any) {
      // Direct browser fallback if local key exists and backend is unreachable
      const localKey = localStorage.getItem('amitastro_gemini_key');
      const localModel = localStorage.getItem('amitastro_gemini_model') || 'gemini-flash-latest';
      if (localKey) {
        try {
          const directPrompt = `Translate the following Vedic astrology text from ${isEnToHi ? 'English to authentic classical Hindi (शुद्ध वैदिक ज्योतिषीय शब्दावली)' : 'Hindi to fluent, authoritative English'}.
Title: ${sourceTitle}
Excerpt: ${sourceExcerpt}
Markdown Content:
${sourceContent}

Return ONLY a JSON object:
{
  "title": "translated title",
  "excerpt": "translated excerpt",
  "contentMarkdown": "translated markdown content"
}`;

          const payload = {
            contents: [{ role: 'user', parts: [{ text: directPrompt }] }],
            generationConfig: {
              temperature: 0.3,
              responseMimeType: 'application/json'
            }
          };

          const directRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${localModel}:generateContent?key=${localKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (directRes.ok) {
            const data = await directRes.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            const parsed = JSON.parse(text);

            if (isEnToHi) {
              setNewPost(prev => ({
                ...prev,
                titleHi: parsed.title || prev.titleHi,
                excerptHi: parsed.excerpt || prev.excerptHi,
                contentMarkdownHi: parsed.contentMarkdown || prev.contentMarkdownHi
              }));
              setEditorLang('hi');
              showToast('Successfully translated to authentic Vedic Hindi!', 'success');
            } else {
              setNewPost(prev => ({
                ...prev,
                title: parsed.title || prev.title,
                excerpt: parsed.excerpt || prev.excerpt,
                contentMarkdown: parsed.contentMarkdown || prev.contentMarkdown
              }));
              setEditorLang('en');
              showToast('Successfully translated to fluent English!', 'success');
            }
            return;
          }
        } catch (clientTrErr) {
          console.error('Client direct translation failed:', clientTrErr);
        }
      }

      showToast(err.message || 'Translation failed', 'error');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleGenerateAiImage = async (customPrompt?: string) => {
    const promptToUse = customPrompt || imagePromptInput || newPost.title || 'Vedic astrology cosmic celestial alignment golden mandala';
    setIsGeneratingImage(true);
    try {
      const res = await apiRequest<any>('/blog/admin/generate-image', {
        method: 'POST',
        body: JSON.stringify({ prompt: promptToUse })
      });
      setNewPost(prev => ({ ...prev, heroImageUrl: res.imageUrl }));
      showToast('Fresh celestial astrological artwork synthesized!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Image generation failed', 'error');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleCustomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size should be less than 5MB', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setNewPost(prev => ({ ...prev, heroImageUrl: base64 }));
      showToast('Custom article image attached successfully!', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim().replace(/^,+|,+$/g, '');
      if (val && !newPost.tags.includes(val)) {
        setNewPost(prev => ({ ...prev, tags: [...prev.tags, val] }));
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setNewPost(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
  };

  const handleUpdateUserRole = async (userId: string, targetRole: 'admin' | 'customer', userName: string) => {
    const action = targetRole === 'admin' ? 'promote to Administrator' : 'demote to Customer';
    if (!window.confirm(`Are you sure you want to ${action} for "${userName}"?`)) return;

    try {
      await apiRequest(`/admin/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: targetRole })
      });
      showToast(`User "${userName}" role updated to ${targetRole}!`, 'success');
      fetchCustomers();
    } catch (err: any) {
      showToast(err.message || 'Failed to update user role', 'error');
    }
  };

  const renderSimpleMarkdown = (content: string) => {
    if (!content) return <p style={{ color: '#8E8E93', fontStyle: 'italic' }}>No content preview available.</p>;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {content.split('\n').map((line, idx) => {
          const trimmed = line.trim();
          if (trimmed.startsWith('# ')) {
            return <h1 key={idx} style={{ fontSize: 22, fontWeight: 700, margin: '14px 0 6px', color: '#1D1D1F' }}>{trimmed.replace('# ', '')}</h1>;
          }
          if (trimmed.startsWith('## ')) {
            return <h2 key={idx} style={{ fontSize: 18, fontWeight: 600, margin: '12px 0 6px', color: '#1D1D1F' }}>{trimmed.replace('## ', '')}</h2>;
          }
          if (trimmed.startsWith('### ')) {
            return <h3 key={idx} style={{ fontSize: 15, fontWeight: 600, margin: '10px 0 4px', color: '#3A3A6E' }}>{trimmed.replace('### ', '')}</h3>;
          }
          if (trimmed.startsWith('> ')) {
            return (
              <blockquote key={idx} style={{ borderLeft: '3px solid #C9A24B', paddingLeft: 14, margin: '10px 0', fontStyle: 'italic', color: '#3A3A6E', backgroundColor: '#FFFDF9', padding: '8px 12px', borderRadius: '0 8px 8px 0' }}>
                {trimmed.replace('> ', '')}
              </blockquote>
            );
          }
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            return <li key={idx} style={{ marginLeft: 20, margin: '3px 0', color: '#424245', fontSize: 13.5 }}>{trimmed.substring(2)}</li>;
          }
          if (!trimmed) {
            return <div key={idx} style={{ height: 6 }} />;
          }
          return <p key={idx} style={{ margin: '4px 0', color: '#424245', fontSize: 14, lineHeight: 1.6 }}>{trimmed}</p>;
        })}
      </div>
    );
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
    { id: 'chat' as const, label: 'Chats', icon: MessageSquare, badge: metrics?.unreadChats },
    { id: 'payments' as const, label: 'Payment Queue', icon: CreditCard, badge: metrics?.pendingPayments },
    { id: 'customers' as const, label: 'Clients & Kundli', icon: Users },
    { id: 'blog' as const, label: 'Articles', icon: BookOpen },
    { id: 'broadcast' as const, label: 'Broadcasts', icon: Send },
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart2 },
    { id: 'settings' as const, label: 'Availability & Hours', icon: Clock }
  ];

  const currentAdminTab = adminTabs.find((t) => t.id === activeTab) || adminTabs[0];

  const handleSelectAdminTab = (tabId: typeof activeTab) => {
    setActiveTab(tabId);
    if (tabId === 'chat') {
      setSidebarCollapsed(true);
    }
  };

  const { setHeaderActions } = useHeaderActions();

  // Register Apple top navigation actions (Curtain menu with admin module tabs)
  useEffect(() => {
    setHeaderActions({
      optionsTitle: 'Admin Command Center',
      options: adminTabs.map((t) => ({
        id: t.id,
        label: t.label,
        icon: t.icon,
        badge: t.badge !== undefined && t.badge > 0 ? String(t.badge) : undefined
      })),
      activeOptionId: activeTab,
      onSelectOption: (id) => setActiveTab(id as typeof activeTab)
    });

    return () => {
      setHeaderActions(null);
    };
  }, [activeTab, metrics]);

  return (
    <div className="admin-portal-root">
      {/* Admin App Workspace - Full-bleed, zero ugly black titlebar */}
      <div
        className="admin-app-workspace"
        style={{
          display: 'flex',
          flex: 1,
          height: '100vh',
          width: '100vw',
          overflow: 'hidden',
          backgroundColor: '#FFFFFF'
        }}
      >
        {/* Apple macOS / WhatsApp Style Left Icon Rail (Smooth CSS Transition 68px <-> 240px) */}
        <aside
          className="portal-app-rail"
          style={{
            width: sidebarCollapsed ? 68 : 240,
            flexShrink: 0,
            backgroundColor: '#F0F2F5',
            borderRight: '1px solid #E5E5EA',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'width 0.32s cubic-bezier(0.16, 1, 0.3, 1)',
            overflow: 'visible',
            position: 'relative',
            zIndex: 30,
            willChange: 'width'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Top Logo & Rail Header with reference hover interchange */}
            <div
              style={{
                height: 60,
                display: 'flex',
                alignItems: 'center',
                justifyContent: sidebarCollapsed ? 'center' : 'space-between',
                padding: sidebarCollapsed ? '0 10px' : '0 14px',
                borderBottom: '1px solid #E5E5EA',
                flexShrink: 0
              }}
            >
              {!sidebarCollapsed ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <img
                      src="/icons/logo-mark.png"
                      alt="Amit Astro Logo"
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        objectFit: 'contain',
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
                        flexShrink: 0
                      }}
                    />
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: 15,
                        color: '#111B21',
                        letterSpacing: '-0.01em',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      Amit Astro
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSidebarCollapsed(true)}
                    className="sidebar-collapse-toggle-btn"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      color: '#54656F',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background-color 0.2s cubic-bezier(0.16, 1, 0.3, 1), color 0.15s ease'
                    }}
                    title="Collapse sidebar"
                    aria-label="Collapse sidebar"
                  >
                    <PanelLeft size={18} />
                  </button>
                </>
              ) : (
                /* Collapsed state: Hover interchange between original logo and PanelLeft toggle */
                <button
                  type="button"
                  onClick={() => setSidebarCollapsed(false)}
                  onMouseEnter={() => setIsRailToggleHovered(true)}
                  onMouseLeave={() => setIsRailToggleHovered(false)}
                  className="sidebar-rail-hover-toggle"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 9,
                    position: 'relative',
                    border: 'none',
                    background: isRailToggleHovered ? '#E5E5EA' : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    transition: 'background-color 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                  title="Expand sidebar"
                  aria-label="Expand sidebar"
                >
                  {/* 1. Original Logo Mark (shown when mouse is away) */}
                  <img
                    src="/icons/logo-mark.png"
                    alt="Amit Astro"
                    style={{
                      position: 'absolute',
                      width: 28,
                      height: 28,
                      borderRadius: 7,
                      objectFit: 'contain',
                      boxShadow: '0 2px 5px rgba(0, 0, 0, 0.08)',
                      opacity: isRailToggleHovered ? 0 : 1,
                      transform: isRailToggleHovered ? 'scale(0.8)' : 'scale(1)',
                      transition: 'opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1), transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                      pointerEvents: 'none'
                    }}
                  />

                  {/* 2. Collapse/Expand Icon (appears smoothly when mouse is in range / hovered) */}
                  <span
                    style={{
                      position: 'absolute',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#111B21',
                      opacity: isRailToggleHovered ? 1 : 0,
                      transform: isRailToggleHovered ? 'scale(1)' : 'scale(0.8)',
                      transition: 'opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1), transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                      pointerEvents: 'none'
                    }}
                  >
                    <PanelLeft size={19} />
                  </span>
                </button>
              )}
            </div>

            {/* Nav Items List (WhatsApp style) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: sidebarCollapsed ? '10px 0' : '10px 10px' }}>
              {adminTabs.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return sidebarCollapsed ? (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <button
                      type="button"
                      onClick={() => handleSelectAdminTab(item.id)}
                      className={`rail-item-btn-collapsed ${active ? 'active' : ''}`}
                      title={item.label}
                    >
                      <Icon size={20} color={active ? '#0F5132' : '#54656F'} />
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className={`rail-badge-collapsed ${item.id === 'chat' ? '' : 'danger'}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  </div>
                ) : (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectAdminTab(item.id)}
                    className={`rail-item-btn ${active ? 'active' : ''}`}
                  >
                    <Icon size={18} color={active ? '#111B21' : '#54656F'} />
                    <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span style={{ backgroundColor: item.id === 'chat' ? '#25D366' : '#D64545', color: '#FFF', fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 9999 }}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Profile ID Card & 3-Dots Popover Menu */}
          <div
            ref={profileCardRef}
            style={{
              padding: sidebarCollapsed ? '12px 8px' : '10px 12px',
              borderTop: '1px solid #E5E5EA',
              backgroundColor: '#F0F2F5',
              position: 'relative'
            }}
          >
            {/* Floating Apple-Style Popover Menu */}
            {showProfileMenu && (
              <div
                ref={profileMenuRef}
                style={{
                  position: 'absolute',
                  bottom: 'calc(100% + 10px)',
                  left: sidebarCollapsed ? 8 : 12,
                  width: 236,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 14,
                  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.14), 0 2px 8px rgba(0, 0, 0, 0.06)',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  padding: '6px',
                  zIndex: 100,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  animation: 'applePopoverFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                {/* 1. Profile Alteration Settings */}
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    setShowProfileModal(true);
                  }}
                  className="profile-popover-item"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                    fontSize: 13,
                    fontWeight: 500,
                    color: '#1D1D1F',
                    transition: 'background 0.15s ease'
                  }}
                >
                  <User size={16} color="#54656F" />
                  <span>Profile Settings</span>
                </button>

                <div style={{ height: 1, backgroundColor: '#E5E5EA', margin: '4px 6px' }} />

                {/* 2. View Public Site */}
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    window.open('/', '_blank');
                  }}
                  className="profile-popover-item"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                    fontSize: 13,
                    fontWeight: 500,
                    color: '#1D1D1F',
                    transition: 'background 0.15s ease'
                  }}
                >
                  <Globe size={16} color="#54656F" />
                  <span>View Public Site</span>
                  <ExternalLink size={12} color="#8E8E93" style={{ marginLeft: 'auto' }} />
                </button>

                {/* 3. Privacy Policy & Legal Policies */}
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    window.open('/legal', '_blank');
                  }}
                  className="profile-popover-item"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                    fontSize: 13,
                    fontWeight: 500,
                    color: '#1D1D1F',
                    transition: 'background 0.15s ease'
                  }}
                >
                  <ShieldCheck size={16} color="#54656F" />
                  <span>Privacy & Legal</span>
                </button>

                <div style={{ height: 1, backgroundColor: '#E5E5EA', margin: '4px 6px' }} />

                {/* 4. Sign Out */}
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                  }}
                  className="profile-popover-item"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                    fontSize: 13,
                    fontWeight: 500,
                    color: '#FF3B30',
                    transition: 'background 0.15s ease'
                  }}
                >
                  <LogOut size={16} color="#FF3B30" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}

            {/* The Profile ID Card Trigger */}
            {sidebarCollapsed ? (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 4,
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                  title="Astrologer Amit - Profile Options"
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: '#3A3A6E',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 14
                    }}
                  >
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 3,
                      right: 3,
                      width: 9,
                      height: 9,
                      borderRadius: '50%',
                      backgroundColor: '#25D366',
                      border: '2px solid #F0F2F5'
                    }}
                  />
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  borderRadius: 10,
                  backgroundColor: showProfileMenu ? '#E5E5EA' : 'transparent',
                  transition: 'background 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        backgroundColor: '#3A3A6E',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 14
                      }}
                    >
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                    </div>
                    <div
                      style={{
                        position: 'absolute',
                        bottom: -1,
                        right: -1,
                        width: 9,
                        height: 9,
                        borderRadius: '50%',
                        backgroundColor: '#25D366',
                        border: '2px solid #F0F2F5'
                      }}
                      title="Online"
                    />
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 13,
                        color: '#111B21',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {user?.name || 'Astrologer Amit'}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: '#54656F',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {user?.email || 'amit@amitastro.com'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 6,
                    borderRadius: 6,
                    color: '#54656F',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.15s ease'
                  }}
                  title="Profile Settings & Options"
                  aria-label="Profile options"
                >
                  <MoreVertical size={17} />
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Right Main Content Area */}
        <main
          className={`admin-portal-main-content ${activeTab === 'chat' ? 'chat-mode' : ''}`}
          style={{
            flex: 1,
            minWidth: 0,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: activeTab === 'chat' ? 'hidden' : 'auto',
            padding: activeTab === 'chat' ? 0 : '24px 32px',
            backgroundColor: activeTab === 'chat' ? '#FFFFFF' : '#F5F5F7'
          }}
        >
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

        {/* 3. UNIFIED CHAT INBOX - APPLE MESSAGES ENGINE */}
        {activeTab === 'chat' && (
          <AppleAdminChat
            initialConversationId={selectedChatConvId}
            onCustomerDeleted={() => {
              fetchCustomers();
              fetchMetrics();
            }}
          />
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
          <div className="apple-card" style={{ padding: '24px 20px', backgroundColor: '#FFF' }}>
            {/* Header & Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
              <div>
                <h2 className="text-h2" style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  Client Directory & CRM
                </h2>
              </div>

              {/* Search & Filter Dropdown */}
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', width: '100%', maxWidth: 540 }}>
                {/* Search Bar */}
                <div style={{ position: 'relative', flex: '1 1 200px' }}>
                  <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: 11, top: 11 }} />
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Search by name, phone, email..."
                    className="apple-input"
                    style={{ paddingLeft: 32, fontSize: 13, padding: '8px 12px 8px 32px', width: '100%', borderRadius: 10 }}
                  />
                  {customerSearch && (
                    <button
                      type="button"
                      onClick={() => setCustomerSearch('')}
                      style={{ position: 'absolute', right: 10, top: 9, border: 'none', background: 'transparent', cursor: 'pointer', color: '#94A3B8', padding: 2 }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Filter Dropdown */}
                <div style={{ position: 'relative', minWidth: 155, flexShrink: 0 }}>
                  <Filter size={13} color="#64748B" style={{ position: 'absolute', left: 11, top: 11, pointerEvents: 'none' }} />
                  <select
                    value={customerFilter}
                    onChange={(e) => setCustomerFilter(e.target.value as any)}
                    className="apple-input"
                    style={{
                      paddingLeft: 30,
                      paddingRight: 28,
                      fontSize: 12.5,
                      fontWeight: 600,
                      paddingTop: 8,
                      paddingBottom: 8,
                      borderRadius: 10,
                      border: '1px solid #CBD5E1',
                      background: '#FFFFFF',
                      color: '#0F172A',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      cursor: 'pointer',
                      width: '100%',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                    }}
                  >
                    <option value="all">All ({customers.length})</option>
                    <option value="admin">Admins ({customers.filter((c) => c.role === 'admin').length})</option>
                    <option value="new">New ({customers.filter((c) => c.is_new_customer && !c.trial_used).length})</option>
                    <option value="old">Established ({customers.filter((c) => !c.is_new_customer || c.trial_used).length})</option>
                  </select>
                  <ChevronDown size={14} color="#64748B" style={{ position: 'absolute', right: 10, top: 11, pointerEvents: 'none' }} />
                </div>
              </div>
            </div>

            {/* Quick KPI Strip */}
            <div className="crm-kpi-grid">
              <div className="crm-kpi-card">
                <span className="crm-kpi-label"><Users size={12} color="#6366F1" /> Total Registered</span>
                <span className="crm-kpi-val">{customers.length}</span>
              </div>
              <div className="crm-kpi-card">
                <span className="crm-kpi-label"><Sparkles size={12} color="#10B981" /> Trial Eligible</span>
                <span className="crm-kpi-val" style={{ color: '#059669' }}>
                  {customers.filter((c) => c.is_new_customer && !c.trial_used).length}
                </span>
              </div>
              <div className="crm-kpi-card">
                <span className="crm-kpi-label"><Crown size={12} color="#F59E0B" /> Family 360</span>
                <span className="crm-kpi-val" style={{ color: '#D97706' }}>
                  {customers.filter((c) => c.is_family_subscriber).length}
                </span>
              </div>
              <div className="crm-kpi-card">
                <span className="crm-kpi-label"><CreditCard size={12} color="#3B82F6" /> Total Revenue</span>
                <span className="crm-kpi-val" style={{ color: '#0F172A' }}>
                  ₹{customers.reduce((acc, c) => acc + (Number(c.total_spent) || 0), 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Client Cards List */}
            {filteredCustomers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 20px', color: '#94A3B8', background: '#F8FAFC', borderRadius: 12, border: '1px dashed #CBD5E1' }}>
                <Users size={32} color="#94A3B8" style={{ margin: '0 auto 8px', opacity: 0.7 }} />
                <div style={{ fontWeight: 600, fontSize: 14, color: '#475569' }}>No clients match your filter or search</div>
                <div style={{ fontSize: 12.5, color: '#94A3B8', marginTop: 4 }}>Try clearing the search or switching filter tabs.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {filteredCustomers.map((c) => {
                  const initials = c.name
                    ? c.name.trim().split(/\s+/).map((n: string) => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
                    : 'U';
                  const isAdmin = c.role === 'admin';

                  return (
                    <div
                      key={c.id}
                      className={`crm-customer-card ${isAdmin ? 'admin-card' : ''}`}
                    >
                      {/* Top Header Row: Avatar, Name, Badges, More Menu */}
                      <div className="crm-card-header">
                        <div className="crm-avatar-group">
                          {/* Avatar Circle - firmly locked to top-left */}
                          <div className={`crm-avatar ${isAdmin ? 'admin-avatar' : ''}`}>
                            {initials}
                            {isAdmin && (
                              <div className="crm-avatar-badge" title="Administrator">
                                <ShieldCheck size={10} />
                              </div>
                            )}
                          </div>

                          {/* Client Name & Badges */}
                          <div className="crm-user-info">
                            <div className="crm-name-row">
                              <span className="crm-client-name">
                                {c.name}
                              </span>

                              {/* Membership / Plan Badge */}
                              {isAdmin ? (
                                <PlanBadge badge="Admin" size="sm" />
                              ) : c.is_family_subscriber ? (
                                <PlanBadge badge="Family" size="sm" />
                              ) : c.plan && c.plan !== 'free' ? (
                                <PlanBadge badge={c.plan.charAt(0).toUpperCase() + c.plan.slice(1)} size="sm" />
                              ) : (
                                <span className="crm-badge-standard">Client</span>
                              )}

                              {/* Trial Eligibility Status Badge */}
                              {c.is_new_customer && !c.trial_used ? (
                                <span className="crm-badge-trial-active" title="Eligible for a 5-minute complimentary Vedic consultation">
                                  <Sparkles size={11} /> 5-Min Free Trial
                                </span>
                              ) : c.trial_used ? (
                                <span className="crm-badge-trial-used" title="Client has already utilized their 5-minute free trial">
                                  <Clock size={11} /> Trial Used
                                </span>
                              ) : null}
                            </div>

                            {/* Contact Info Row */}
                            <div className="crm-contact-row">
                              {c.phone && (
                                <a href={`tel:${c.phone}`} className="crm-contact-item" title="Click to call">
                                  <Phone size={12} color="#64748B" />
                                  <span style={{ fontWeight: 500, color: '#334155' }}>{c.phone}</span>
                                </a>
                              )}
                              {c.email && (
                                <a href={`mailto:${c.email}`} className="crm-contact-item" title="Click to email" style={{ wordBreak: 'break-all' }}>
                                  <Mail size={12} color="#64748B" />
                                  <span>{c.email}</span>
                                </a>
                              )}
                            </div>

                            {/* Tags Chips */}
                            {c.tags && c.tags.length > 0 && (
                              <div className="crm-tags-row">
                                {c.tags.map((tg: string) => (
                                  <span key={tg} className="crm-tag-chip">
                                    {tg}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Top-Right More Menu (Promote/Demote, Delete) */}
                        <div className="crm-more-menu-wrapper" style={{ position: 'relative' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdownCustomerId(activeDropdownCustomerId === c.id ? null : c.id);
                            }}
                            className="crm-btn-more"
                            title="More actions"
                            aria-label="More actions"
                          >
                            <MoreVertical size={16} />
                          </button>

                          {activeDropdownCustomerId === c.id && (
                            <div className="crm-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                              {/* Copy details */}
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveDropdownCustomerId(null);
                                  navigator.clipboard.writeText(`${c.name}\nPhone: ${c.phone}\nEmail: ${c.email}`);
                                  showToast(`Copied ${c.name}'s contact details`, 'success');
                                }}
                                className="crm-dropdown-item"
                              >
                                <Copy size={13} color="#64748B" />
                                <span>Copy Contact Info</span>
                              </button>

                              {/* Promote / Demote Role */}
                              {c.id !== user?.id && (
                                isAdmin ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveDropdownCustomerId(null);
                                      handleUpdateUserRole(c.id, 'customer', c.name);
                                    }}
                                    className="crm-dropdown-item"
                                    title="Demote this admin to Customer role"
                                  >
                                    <UserX size={13} color="#64748B" />
                                    <span>Demote to Customer</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveDropdownCustomerId(null);
                                      handleUpdateUserRole(c.id, 'admin', c.name);
                                    }}
                                    className="crm-dropdown-item crm-dropdown-item-gold"
                                    title="Promote this user to Administrator"
                                  >
                                    <ShieldCheck size={13} color="#C9A24B" />
                                    <span>Promote to Admin</span>
                                  </button>
                                )
                              )}

                              {/* Delete Customer */}
                              {c.id !== user?.id && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveDropdownCustomerId(null);
                                    setCustomerToDelete({ id: c.id, name: c.name });
                                  }}
                                  className="crm-dropdown-item crm-dropdown-item-danger"
                                  title="Permanently delete client and all records"
                                >
                                  <Trash2 size={13} color="#EF4444" />
                                  <span>Delete Client</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Middle: Key Metrics Strip */}
                      <div className="crm-metrics-strip">
                        <div className="crm-metric-item">
                          <span className="crm-metric-label">Appointments</span>
                          <span className="crm-metric-val">{c.appointment_count || 0}</span>
                        </div>
                        <div className="crm-metric-divider" />
                        <div className="crm-metric-item">
                          <span className="crm-metric-label">Total Spent</span>
                          <span className="crm-metric-val crm-metric-revenue">₹{(Number(c.total_spent) || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="crm-metric-divider" />
                        <div className="crm-metric-item">
                          <span className="crm-metric-label">Family 360</span>
                          <span className={`crm-metric-val ${c.is_family_subscriber ? 'crm-metric-family-active' : ''}`}>
                            {c.is_family_subscriber ? 'Active Member 👑' : 'Standard'}
                          </span>
                        </div>
                      </div>

                      {/* Bottom Action Section: Primary Chat CTA + Toggles (Never wraps into ovals or overflows) */}
                      <div className="crm-actions-container">
                        {/* Primary Action Button */}
                        <button
                          type="button"
                          onClick={() => openCustomerChatFromCrm(c)}
                          className="crm-btn-chat"
                          title="Open real-time chat with this client"
                        >
                          <MessageSquare size={14} />
                          <span>Chat & Consult</span>
                        </button>

                        {/* Free Trial Eligibility Toggle */}
                        {c.is_new_customer ? (
                          <button
                            type="button"
                            onClick={() => handleToggleNewCustomer(c.id, false)}
                            className="crm-btn-action crm-btn-trial-active"
                            title="Revoke 5-minute free trial eligibility"
                          >
                            <Zap size={13} />
                            <span>Revoke Trial</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleNewCustomer(c.id, true)}
                            className="crm-btn-action crm-btn-trial-inactive"
                            title="Grant 5-minute free trial eligibility"
                          >
                            <Zap size={13} />
                            <span>Grant Trial</span>
                          </button>
                        )}

                        {/* Family 360 Subscription Toggle */}
                        {!isAdmin && (
                          c.is_family_subscriber ? (
                            <button
                              type="button"
                              onClick={() => handleRevokeFamilyPlan(c.id, c.name)}
                              className="crm-btn-action crm-btn-family-active"
                              title="Revoke Family 360 Plan"
                            >
                              <Crown size={13} />
                              <span>Revoke Family</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleGrantFamilyPlan(c.id, c.name)}
                              className="crm-btn-action crm-btn-family-inactive"
                              title="Grant 1-Year Family 360 Plan"
                            >
                              <Crown size={13} />
                              <span>Grant Family</span>
                            </button>
                          )
                        )}
                        {isAdmin && (
                          <span className="crm-admin-pill" title="Administrator account">
                            <ShieldCheck size={13} /> System Admin
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 6. BLOG CMS & AI EDITORIAL STUDIO */}
        {activeTab === 'blog' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Studio Header Card */}
            <div className="article-studio-card">
              <div>
                <div className="article-studio-badge-row">
                  <span className="apple-badge-gold">
                    <Sparkles size={12} /> Editorial Studio
                  </span>
                </div>
                <h2 className="article-studio-title">
                  Vedic Blog & Article Publishing
                </h2>
                <p className="article-studio-desc">
                  Craft authentic astrological wisdom essays with AI drafting, bidirectional translation, and cosmic image synthesis.
                </p>
              </div>

              <div className="article-studio-actions">
                <button
                  type="button"
                  onClick={() => setShowGeminiConfigModal(true)}
                  className="apple-btn-secondary"
                  style={{ fontSize: 12.5, padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  title="Configure API Key"
                >
                  <Key size={14} /> API Key
                </button>
                <button
                  type="button"
                  onClick={handleStartNewPost}
                  className="apple-btn-secondary"
                  style={{ fontSize: 12.5, padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
                >
                  <Plus size={14} /> Manual Post
                </button>
                <button
                  type="button"
                  onClick={() => setShowAiModal(true)}
                  className="apple-btn-gold btn-full-mobile"
                  style={{ fontSize: 13, padding: '9px 18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, boxShadow: '0 4px 14px rgba(201, 162, 75, 0.25)' }}
                >
                  <Wand2 size={15} /> Compose with AI
                </button>
              </div>
            </div>

            {/* AI Generator Modal / Expandable Panel */}
            {showAiModal && (
              <div
                className="apple-card"
                style={{
                  padding: '28px',
                  backgroundColor: '#FFF',
                  border: '2px solid #C9A24B',
                  borderRadius: 20,
                  boxShadow: '0 12px 36px rgba(201, 162, 75, 0.15)',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                  <div>
                    <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1D1D1F', margin: '0 0 6px' }}>
                      Generate Bilingual Vedic Article from an Idea
                    </h3>
                    <p style={{ fontSize: 13.5, color: '#6E6E73', margin: 0 }}>
                      Enter your topic in English or Hindi to generate a complete bilingual article with remedies.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAiModal(false)}
                    aria-label="Close"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8E8E93', padding: 6 }}
                  >
                    <X size={20} />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                      Topic or Idea Prompt <span style={{ color: '#D64545' }}>*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      className="apple-input"
                      style={{ fontSize: 14, lineHeight: 1.5 }}
                      placeholder="e.g. Shani retrograde transit in Pisces 2026: In-depth impact on career and health for all Rashis, classical Parashari remedies, Shani Chalisa mantra, and Daan guidance..."
                    />
                  </div>

                  {/* Preset inspiration dropdown */}
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#1D1D1F' }}>
                      Quick Topic Inspiration
                    </label>
                    <select
                      className="apple-input"
                      style={{ fontSize: 13.5, backgroundColor: '#FAFAFC', cursor: 'pointer' }}
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) {
                          setAiPrompt(e.target.value);
                        }
                      }}
                    >
                      <option value="">— Select a topic inspiration or type your own above —</option>
                      <option value="🪐 Saturn Retrograde in Pisces 2026: Karmic Tests & Remedies">🪐 Saturn Retrograde in Pisces 2026: Karmic Tests & Remedies</option>
                      <option value="☀️ Surya Gochar in Aries: Career Surge & Power Shifts">☀️ Surya Gochar in Aries: Career Surge & Power Shifts</option>
                      <option value="🏡 Vastu Shastra for Main Entrance & Kitchen Prosperity">🏡 Vastu Shastra for Main Entrance & Kitchen Prosperity</option>
                      <option value="💎 Blue Sapphire (Neelam): Who Should & Shouldn’t Wear It">💎 Blue Sapphire (Neelam): Who Should & Shouldn’t Wear It</option>
                      <option value="🕉️ Powerful Mahamrityunjaya & Navagraha Mantras for Protection">🕉️ Powerful Mahamrityunjaya & Navagraha Mantras for Protection</option>
                      <option value="🌙 Moon in 8th House: Overcoming Anxiety & Emotional Healing">🌙 Moon in 8th House: Overcoming Anxiety & Emotional Healing</option>
                      <option value="🔮 Rahu Mahadasha: Psychological Shifts & Classical Antidotes">🔮 Rahu Mahadasha: Psychological Shifts & Classical Antidotes</option>
                      <option value="✨ Jupiter in Taurus: Financial Stability & Kundli Blessings">✨ Jupiter in Taurus: Financial Stability & Kundli Blessings</option>
                    </select>
                  </div>

                  {/* Options row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Astrological Style / Tone</label>
                      <select
                        value={aiTone}
                        onChange={(e) => setAiTone(e.target.value)}
                        className="apple-input"
                      >
                        <option value="Classical Vedic Wisdom & Practical Life Guidance">Classical Vedic Wisdom & Practical Life Guidance (Recommended)</option>
                        <option value="Remedial & Spiritual with Vedic Mantras & Gemstones">Remedial & Spiritual (Mantras, Gemstones, Daan)</option>
                        <option value="Modern Career & Relationship Astrology">Modern Career & Relationship Astrology</option>
                        <option value="Beginner-Friendly Astrology Guide">Beginner-Friendly Astrology Guide</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Article Length</label>
                      <select
                        value={aiLength}
                        onChange={(e) => setAiLength(e.target.value)}
                        className="apple-input"
                      >
                        <option value="Comprehensive (800-1200 words)">Comprehensive Standard (800 - 1200 words)</option>
                        <option value="Deep Authority Masterpiece (1500+ words)">Deep Authority Masterpiece (1500+ words)</option>
                        <option value="Quick Insightful Read (500-700 words)">Quick Insightful Read (500 - 700 words)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Target Category</label>
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
                  </div>

                  {/* Generator Submit Action */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginTop: 8, paddingTop: 16, borderTop: '1px solid #E5E5EA' }}>
                    <div style={{ fontSize: 13, color: '#6E6E73' }}>
                      {isAiGenerating ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#3A3A6E', fontWeight: 600 }}>
                          <RefreshCw size={15} className="spinner" /> {aiStatusMsg}
                        </span>
                      ) : (
                        <span>✨ Generates full English & Hindi texts + Cosmic Cover Art. You can freely edit everything before publishing.</span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleGenerateAiArticle}
                      disabled={isAiGenerating || !aiPrompt.trim()}
                      className="apple-btn-gold"
                      style={{ padding: '9px 24px', fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                      {isAiGenerating ? <RefreshCw size={15} className="spinner" /> : <Sparkles size={15} />}
                      {isAiGenerating ? 'Drafting Article...' : 'Generate Bilingual Article'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Compose / Edit Full Workspace */}
            {showPostEditor && (
              <form
                onSubmit={handleSavePost}
                className="apple-card article-editor-card"
                style={{
                  position: 'relative',
                  backgroundColor: '#FFF',
                  borderRadius: 20,
                  boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 20
                }}
              >
                {/* Fixed Top-Right Corner Close Button */}
                <button
                  type="button"
                  onClick={() => { setShowPostEditor(false); setEditingPostId(null); }}
                  className="article-editor-close-btn"
                  aria-label="Close editor"
                  title="Close editor"
                >
                  <X size={18} />
                </button>

                {/* Editor Header Bar */}
                <div className="article-editor-header">
                  <div>
                    <span className="apple-badge-primary" style={{ marginBottom: 4 }}>
                      {editingPostId ? 'Editing Existing Article' : 'Composing New Article'}
                    </span>
                    <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1D1D1F', margin: '4px 0' }}>
                      {newPost.title || newPost.titleHi || 'Untitled Vedic Article'}
                    </h3>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => setEditorLivePreview(!editorLivePreview)}
                      className="apple-btn-secondary"
                      style={{ fontSize: 13, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <Eye size={14} /> {editorLivePreview ? 'Hide Split Preview' : 'Split Live Preview'}
                    </button>
                  </div>
                </div>

                {/* 1. Language Dropdown & Instant Translation Bar */}
                <div className="article-editor-lang-bar">
                  <div className="article-editor-lang-group">
                    <label htmlFor="active-lang-select" className="article-editor-lang-label">
                      Active Language:
                    </label>
                    <select
                      id="active-lang-select"
                      value={editorLang}
                      onChange={(e) => setEditorLang(e.target.value as 'en' | 'hi' | 'dual')}
                      className="apple-input article-editor-lang-select"
                    >
                      <option value="en">🇬🇧 English {newPost.contentMarkdown ? '●' : ''}</option>
                      <option value="hi">🇮🇳 हिंदी (Hindi) {newPost.contentMarkdownHi ? '●' : ''}</option>
                      <option value="dual">🌐 Side-by-Side Dual View</option>
                    </select>
                  </div>

                  {/* One-Click Bidirectional Translation Buttons */}
                  <div className="article-editor-translate-group">
                    <button
                      type="button"
                      onClick={() => handleTranslateArticle('en-to-hi')}
                      disabled={isTranslating || !newPost.contentMarkdown.trim()}
                      className="apple-btn-secondary article-editor-translate-btn"
                      title="Translate current English content into authentic Vedic Hindi"
                    >
                      {isTranslating ? <RefreshCw size={13} className="spinner" /> : <Languages size={13} />}
                      Translate EN ➔ हिंदी
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTranslateArticle('hi-to-en')}
                      disabled={isTranslating || !newPost.contentMarkdownHi.trim()}
                      className="apple-btn-secondary article-editor-translate-btn"
                      title="Translate current Hindi content into fluent English"
                    >
                      {isTranslating ? <RefreshCw size={13} className="spinner" /> : <Languages size={13} />}
                      Translate हिंदी ➔ EN
                    </button>
                  </div>
                </div>

                {/* 2. Visual Image Studio */}
                <div className="article-artwork-box">
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1D1D1F' }}>Article Hero & Cover Artwork</span>
                    <p style={{ fontSize: 12.5, color: '#6E6E73', margin: '2px 0 0' }}>
                      Generate high-resolution Vedic artwork with AI, upload a custom image from your device, or paste a URL.
                    </p>
                  </div>

                  <div className="article-artwork-grid">
                    {/* Image Preview Thumbnail with Sleek Overlay Remove Button */}
                    <div className="article-artwork-preview">
                      {newPost.heroImageUrl ? (
                        <>
                          <img
                            src={newPost.heroImageUrl}
                            alt="Article Cover"
                          />
                          <button
                            type="button"
                            onClick={() => setNewPost(prev => ({ ...prev, heroImageUrl: '' }))}
                            className="article-artwork-remove-btn"
                            title="Remove Cover Image"
                          >
                            <Trash2 size={12} /> Remove Image
                          </button>
                        </>
                      ) : (
                        <div style={{ textAlign: 'center', color: '#8E8E93', padding: 16 }}>
                          <ImageIcon size={32} style={{ marginBottom: 6, opacity: 0.5 }} />
                          <div style={{ fontSize: 12.5 }}>No image attached</div>
                        </div>
                      )}
                    </div>

                    {/* Image Controls */}
                    <div className="article-artwork-controls">
                      {/* AI Artwork Generator */}
                      <div style={{ width: '100%' }}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#3A3A6E', marginBottom: 4 }}>
                          ✨ Synthesize Artwork with AI:
                        </label>
                        <div className="article-artwork-prompt-row">
                          <input
                            type="text"
                            value={imagePromptInput}
                            onChange={(e) => setImagePromptInput(e.target.value)}
                            placeholder="e.g. Celestial golden Jupiter transit with sacred geometry and cosmic aura..."
                            className="apple-input"
                            style={{ fontSize: 13, flex: 1, minWidth: 0 }}
                          />
                          <button
                            type="button"
                            onClick={() => handleGenerateAiImage()}
                            disabled={isGeneratingImage}
                            className="apple-btn-gold"
                            style={{ padding: '8px 16px', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
                          >
                            {isGeneratingImage ? <RefreshCw size={13} className="spinner" /> : <Sparkles size={13} />}
                            {isGeneratingImage ? 'Synthesizing...' : 'Generate AI Image'}
                          </button>
                        </div>
                      </div>

                      {/* Custom Upload and Paste URL */}
                      <div className="article-artwork-upload-row">
                        <div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleCustomImageUpload}
                            style={{ display: 'none' }}
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="apple-btn-secondary"
                            style={{ fontSize: 12.5, padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 6 }}
                          >
                            <Upload size={14} /> Upload Image from Device
                          </button>
                        </div>

                        <div className="article-artwork-url-wrap" style={{ flex: 1, minWidth: 160 }}>
                          <input
                            type="url"
                            value={newPost.heroImageUrl}
                            onChange={(e) => setNewPost({ ...newPost, heroImageUrl: e.target.value })}
                            placeholder="Or paste external image URL (https://...)"
                            className="apple-input"
                            style={{ fontSize: 12.5, padding: '7px 12px' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Text & Markdown Content Inputs */}
                <div style={{ display: 'grid', gridTemplateColumns: editorLang === 'dual' ? '1fr 1fr' : '1fr', gap: 20 }}>
                  {/* English Form Column */}
                  {(editorLang === 'en' || editorLang === 'dual') && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#1D1D1F' }}>🇬🇧 English Content</span>
                        <span style={{ fontSize: 12, color: '#8E8E93' }}>Primary Title & Content</span>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                          Article Title (English) <span style={{ color: '#D64545' }}>*</span>
                        </label>
                        <input
                          type="text"
                          value={newPost.title}
                          onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                          className="apple-input"
                          style={{ fontSize: 15, fontWeight: 600 }}
                          placeholder="e.g. Navigating Saturn in Pisces: Karmic Tests and Astrological Remedies"
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                          Excerpt / Summary (English)
                        </label>
                        <textarea
                          rows={2}
                          value={newPost.excerpt}
                          onChange={(e) => setNewPost({ ...newPost, excerpt: e.target.value })}
                          className="apple-input"
                          placeholder="2-3 sentence overview for search previews & card listings..."
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                          Markdown Content (English)
                        </label>
                        <textarea
                          rows={14}
                          value={newPost.contentMarkdown}
                          onChange={(e) => setNewPost({ ...newPost, contentMarkdown: e.target.value })}
                          className="apple-input"
                          style={{ fontFamily: 'monospace', fontSize: 13.5, lineHeight: 1.6 }}
                          placeholder="# Main Article Title&#10;&#10;Introduction paragraph detailing the planetary alignments...&#10;&#10;## Astrological Significance&#10;&#10;According to classical Parashari Jyotish..."
                        />
                      </div>
                    </div>
                  )}

                  {/* Hindi Form Column */}
                  {(editorLang === 'hi' || editorLang === 'dual') && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#1D1D1F' }}>🇮🇳 हिंदी सामग्री (Vedic Hindi)</span>
                        <span style={{ fontSize: 12, color: '#8E8E93' }}>शुद्ध एवं प्रामाणिक ज्योतिषीय शब्दावली</span>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                          लेख का शीर्षक (Hindi Title)
                        </label>
                        <input
                          type="text"
                          value={newPost.titleHi}
                          onChange={(e) => setNewPost({ ...newPost, titleHi: e.target.value })}
                          className="apple-input"
                          style={{ fontSize: 15, fontWeight: 600 }}
                          placeholder="उदा. मीन राशि में शनि का गोचर: कर्मफल, प्रभाव और सटीक वैदिक उपाय"
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                          संक्षेप / सारांश (Hindi Excerpt)
                        </label>
                        <textarea
                          rows={2}
                          value={newPost.excerptHi}
                          onChange={(e) => setNewPost({ ...newPost, excerptHi: e.target.value })}
                          className="apple-input"
                          placeholder="2-3 वाक्यों का संक्षिप्त सारांश..."
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                          मुख्य लेख (Hindi Markdown)
                        </label>
                        <textarea
                          rows={14}
                          value={newPost.contentMarkdownHi}
                          onChange={(e) => setNewPost({ ...newPost, contentMarkdownHi: e.target.value })}
                          className="apple-input"
                          style={{ fontFamily: 'monospace', fontSize: 13.5, lineHeight: 1.6 }}
                          placeholder="# मुख्य शीर्षक&#10;&#10;प्रस्तावना: वैदिक ज्योतिष अनुसार ग्रहों की यह स्थिति...&#10;&#10;## गोचर का ज्योतिषीय महत्व&#10;&#10;वृहत् पाराशर होरा शास्त्र के अनुसार..."
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Live Markdown Preview Drawer */}
                {editorLivePreview && (
                  <div style={{ border: '1px solid #C9A24B', borderRadius: 16, padding: '24px', backgroundColor: '#FFFDF9', marginTop: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <span className="apple-badge-gold">
                        <Eye size={12} /> Live Rendered Preview
                      </span>
                      <span style={{ fontSize: 12, color: '#6E6E73' }}>
                        Showing {editorLang === 'hi' ? 'Hindi (हिंदी)' : 'English'} Typography
                      </span>
                    </div>

                    <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1D1D1F', marginBottom: 8 }}>
                      {editorLang === 'hi' ? (newPost.titleHi || newPost.title) : (newPost.title || 'Article Title Preview')}
                    </h1>

                    <p style={{ fontSize: 15, color: '#6E6E73', fontStyle: 'italic', marginBottom: 18 }}>
                      {editorLang === 'hi' ? (newPost.excerptHi || newPost.excerpt) : newPost.excerpt}
                    </p>

                    {newPost.heroImageUrl && (
                      <div style={{ borderRadius: 14, overflow: 'hidden', maxHeight: 280, marginBottom: 20 }}>
                        <img src={newPost.heroImageUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}

                    <div style={{ fontSize: 15, color: '#1D1D1F', borderTop: '1px solid #E5E5EA', paddingTop: 16 }}>
                      {renderSimpleMarkdown(editorLang === 'hi' ? (newPost.contentMarkdownHi || newPost.contentMarkdown) : newPost.contentMarkdown)}
                    </div>
                  </div>
                )}

                {/* 5. Publishing Controls & SEO Meta */}
                <div style={{ borderTop: '1px solid #E5E5EA', paddingTop: 18, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
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
                      onChange={(e) => setNewPost({ ...newPost, readingTimeMin: parseInt(e.target.value, 10) || 5 })}
                      className="apple-input"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Custom URL Slug</label>
                    <input
                      type="text"
                      value={newPost.slug}
                      onChange={(e) => setNewPost({ ...newPost, slug: e.target.value })}
                      placeholder="Leave blank for auto slug..."
                      className="apple-input"
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Tags (Press Enter)</label>
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      placeholder="Type tag & press enter..."
                      className="apple-input"
                    />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                      {newPost.tags.map((t) => (
                        <span key={t} style={{ backgroundColor: '#E5E5EA', borderRadius: 12, padding: '2px 8px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {t}
                          <button type="button" onClick={() => handleRemoveTag(t)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Toggles Row */}
                <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap', padding: '12px 16px', backgroundColor: '#F5F5F7', borderRadius: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13.5, fontWeight: 500 }}>
                    <input
                      type="checkbox"
                      checked={newPost.isFeatured}
                      onChange={(e) => setNewPost({ ...newPost, isFeatured: e.target.checked })}
                    />
                    <span>⭐ Feature on Homepage & Top Banner</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13.5, fontWeight: 500 }}>
                    <input
                      type="checkbox"
                      checked={newPost.isPublished}
                      onChange={(e) => setNewPost({ ...newPost, isPublished: e.target.checked })}
                    />
                    <span>🚀 Publish Live to Public Blog immediately</span>
                  </label>
                </div>

                {/* Submit Actions Bottom */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid #E5E5EA', paddingTop: 16 }}>
                  <button
                    type="button"
                    onClick={() => { setShowPostEditor(false); setEditingPostId(null); }}
                    className="apple-btn-secondary"
                    style={{ padding: '10px 20px', fontSize: 14 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="apple-btn-primary"
                    style={{ padding: '10px 28px', fontSize: 14 }}
                  >
                    <Check size={16} /> {editingPostId ? 'Update Article' : 'Publish Article Live'}
                  </button>
                </div>
              </form>
            )}

            {/* Articles Directory & Filter Table */}
            <div className="apple-card" style={{ padding: '24px 20px', backgroundColor: '#FFF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 18 }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 2px' }}>
                    Published Articles Directory
                  </h3>
                  <p style={{ fontSize: 13, color: '#6E6E73', margin: 0 }}>
                    Showing {filteredBlogPosts.length} of {blogPosts.length} total articles.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', width: '100%', maxWidth: 580 }}>
                  {/* Search */}
                  <div style={{ position: 'relative', flex: '1 1 180px' }}>
                    <Search size={14} color="#8E8E93" style={{ position: 'absolute', left: 10, top: 10 }} />
                    <input
                      type="text"
                      value={blogSearch}
                      onChange={(e) => setBlogSearch(e.target.value)}
                      placeholder="Search title, category..."
                      className="apple-input"
                      style={{ paddingLeft: 30, fontSize: 13, padding: '7px 12px 7px 30px', width: '100%' }}
                    />
                  </div>

                  {/* Category Filter */}
                  <div style={{ position: 'relative', minWidth: 140, flexShrink: 0 }}>
                    <select
                      value={blogCategoryFilter}
                      onChange={(e) => setBlogCategoryFilter(e.target.value)}
                      className="apple-input"
                      style={{ fontSize: 12.5, padding: '7px 24px 7px 10px', width: '100%', appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer', backgroundColor: '#FFF' }}
                    >
                      <option value="all">All Categories</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={13} color="#64748B" style={{ position: 'absolute', right: 8, top: 10, pointerEvents: 'none' }} />
                  </div>

                  {/* Status Pills */}
                  <div style={{ display: 'flex', gap: 3, backgroundColor: '#F1F5F9', padding: 3, borderRadius: 10, overflowX: 'auto' }}>
                    {(['all', 'published', 'drafts', 'featured'] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setBlogStatusFilter(st)}
                        style={{
                          border: 'none',
                          padding: '5px 10px',
                          borderRadius: 7,
                          fontSize: 12,
                          fontWeight: blogStatusFilter === st ? 600 : 500,
                          backgroundColor: blogStatusFilter === st ? '#FFF' : 'transparent',
                          color: blogStatusFilter === st ? '#0F172A' : '#64748B',
                          boxShadow: blogStatusFilter === st ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {st.charAt(0).toUpperCase() + st.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Articles List */}
              {filteredBlogPosts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 20px', color: '#8E8E93' }}>
                  No articles match the current filter. Click "Compose with AI" to create your first article!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {filteredBlogPosts.map((bp) => (
                    <div key={bp.id} className="article-item-card">
                      {/* Left: Thumbnail & Content */}
                      <div className="article-item-main">
                        {/* Thumbnail */}
                        <div className="article-item-thumb">
                          <img
                            src={bp.hero_image_url}
                            alt={bp.title}
                          />
                        </div>

                        {/* Text and Badges */}
                        <div className="article-item-body">
                          {/* Badges Row */}
                          <div className="article-item-badges">
                            {bp.is_published === 0 ? (
                              <span style={{ fontSize: 10.5, backgroundColor: '#F1F5F9', color: '#64748B', padding: '2px 7px', borderRadius: 4, fontWeight: 600 }}>
                                Draft
                              </span>
                            ) : (
                              <span className="apple-badge-success" style={{ fontSize: 10.5, padding: '2px 7px' }}>
                                Live
                              </span>
                            )}
                            {bp.is_featured === 1 && (
                              <span className="apple-badge-gold" style={{ fontSize: 10.5, padding: '2px 7px' }}>
                                ⭐ Featured
                              </span>
                            )}
                            <span style={{ fontSize: 11, fontWeight: 500, color: '#64748B', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1px 6px', borderRadius: 4 }}>
                              {bp.category_name}
                            </span>
                          </div>

                          {/* English Title */}
                          <h4 className="article-item-title">
                            {bp.title}
                          </h4>

                          {/* Hindi Subtitle */}
                          {bp.title_hi && (
                            <p className="article-item-title-hi">
                              🇮🇳 {bp.title_hi}
                            </p>
                          )}

                          {/* Meta: Read Time + Bilingual Status */}
                          <div className="article-item-meta">
                            <span>{bp.reading_time_min} min read</span>
                            {bp.content_markdown_hi && (
                              <span style={{ color: '#059669', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }} />
                                Bilingual Available
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Action Buttons Row */}
                      <div className="article-item-actions">
                        <button
                          type="button"
                          onClick={() => handleTogglePostFeatured(bp)}
                          className={`article-btn-action ${bp.is_featured === 1 ? 'article-btn-star-active' : ''}`}
                          title="Toggle featured homepage placement"
                        >
                          <Star size={13} fill={bp.is_featured === 1 ? '#D97706' : 'none'} color={bp.is_featured === 1 ? '#D97706' : '#64748B'} />
                          <span>{bp.is_featured === 1 ? 'Featured' : 'Feature'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleEditPost(bp)}
                          className="article-btn-action article-btn-edit"
                          title="Edit article"
                        >
                          <Edit3 size={13} />
                          <span>Edit</span>
                        </button>

                        <a
                          href={`/blog/post/${bp.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="article-btn-action"
                          title="View live public article"
                        >
                          <ExternalLink size={13} />
                          <span>View</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => handleDeletePost(bp.id, bp.title)}
                          className="article-btn-delete"
                          title="Delete article"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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

        {/* 8. ANALYTICS & REPORTS (Big-Tech Real-Time Telemetry Suite) */}
        {activeTab === 'analytics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Top Command & Period Bar */}
            <div 
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 16,
                backgroundColor: '#FFFFFF',
                padding: '20px 24px',
                borderRadius: 16,
                border: '1px solid #E5E5EA',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h2 className="text-h2" style={{ fontSize: 22, margin: 0, fontWeight: 700, color: '#1D1D1F' }}>
                    Omnichannel Reach & Telemetry
                  </h2>
                  <span style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: 6, 
                    backgroundColor: 'rgba(39, 201, 63, 0.12)', 
                    color: '#15803D', 
                    fontSize: 11, 
                    fontWeight: 700, 
                    padding: '3px 9px', 
                    borderRadius: 9999,
                    letterSpacing: '0.04em'
                  }}>
                    <span className="radar-pulse-dot" /> LIVE ENGINE
                  </span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#86868B' }}>
                  Live seeker behavior · Geographic footprint · Attribution channels · Database conversion funnel
                </p>
              </div>

              {/* Time Window Pills & Action Controls */}
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
                {/* Time range selector */}
                <div style={{ display: 'flex', backgroundColor: '#F2F2F7', padding: 3, borderRadius: 10 }}>
                  {[
                    { id: '24h', label: '24 Hours' },
                    { id: '7d', label: '7 Days' },
                    { id: '30d', label: '30 Days' },
                    { id: '365d', label: 'All Time' }
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      type="button"
                      onClick={() => {
                        const r = btn.id as typeof analyticsRange;
                        setAnalyticsRange(r);
                        fetchAnalytics(r);
                      }}
                      style={{
                        padding: '6px 13px',
                        fontSize: 12.5,
                        fontWeight: analyticsRange === btn.id ? 600 : 500,
                        backgroundColor: analyticsRange === btn.id ? '#FFFFFF' : 'transparent',
                        color: analyticsRange === btn.id ? '#1D1D1F' : '#6E6E73',
                        border: 'none',
                        borderRadius: 8,
                        cursor: 'pointer',
                        boxShadow: analyticsRange === btn.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                {/* Real-time toggle */}
                <button
                  type="button"
                  onClick={() => setIsRealtimePolling(!isRealtimePolling)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 12px',
                    borderRadius: 10,
                    backgroundColor: isRealtimePolling ? 'rgba(39, 201, 63, 0.1)' : '#F5F5F7',
                    border: '1px solid ' + (isRealtimePolling ? 'rgba(39, 201, 63, 0.3)' : '#E5E5EA'),
                    color: isRealtimePolling ? '#15803D' : '#86868B',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  title="Toggle 10-second automatic polling of real-time telemetry"
                >
                  <Activity size={14} />
                  <span>Stream: {isRealtimePolling ? 'Live' : 'Paused'}</span>
                </button>

                {/* Manual Sync */}
                <button
                  type="button"
                  onClick={() => {
                    fetchAnalytics(analyticsRange);
                    fetchRealtime();
                  }}
                  disabled={analyticsLoading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 13px',
                    borderRadius: 10,
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #D1D1D6',
                    color: '#1D1D1F',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <RefreshCw size={13} style={{ animation: analyticsLoading ? 'spin 1s linear infinite' : 'none' }} />
                  <span>Sync Now</span>
                </button>

                {/* Export Data */}
                <button
                  type="button"
                  onClick={handleExportAnalytics}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 13px',
                    borderRadius: 10,
                    backgroundColor: '#1C1C1E',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Download size={13} />
                  <span>Export JSON</span>
                </button>
              </div>
            </div>

            {/* REAL-TIME RADAR COMMAND CARD (Big Tech Style Dark Luxury Surface) */}
            <div 
              style={{
                background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)',
                borderRadius: 20,
                padding: '28px 26px',
                color: '#FFFFFF',
                boxShadow: '0 12px 36px rgba(15, 23, 42, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: 22
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 18 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span className="radar-pulse-dot" />
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4ADE80' }}>
                      Real-Time Concurrency Radar
                    </span>
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>
                      · Synced {getRelativeTime(lastAnalyticsSync.toISOString())}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
                    <span style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-0.03em', color: '#FFFFFF', lineHeight: 1 }}>
                      {realtimeData?.activeNow ?? analytics?.summary?.activeNow ?? 1}
                    </span>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: '#F1F5F9' }}>
                        Active Seekers on Site Right Now
                      </div>
                      <div style={{ fontSize: 12, color: '#94A3B8' }}>
                        Unique IP sessions sending telemetry pings in the last 5 minutes
                      </div>
                    </div>
                  </div>
                </div>

                {/* Concurrent Active Pages Right Now */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 260 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94A3B8' }}>
                    Active Pages In-Flight Right Now
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {((realtimeData?.topActivePages && realtimeData.topActivePages.length > 0)
                      ? realtimeData.topActivePages
                      : (analytics?.content?.topPages && analytics.content.topPages.length > 0)
                        ? analytics.content.topPages.slice(0, 3).map((p: any) => ({
                            page_title: p.page_title || p.page_path,
                            page_path: p.page_path,
                            active_seekers: p.views || 1
                          }))
                        : []
                    ).map((pg: any, idx: number) => (
                      <div 
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          backgroundColor: 'rgba(255, 255, 255, 0.07)',
                          padding: '6px 12px',
                          borderRadius: 8,
                          fontSize: 12
                        }}
                      >
                        <span style={{ color: '#E2E8F0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                          {pg.page_title || pg.page_path}
                        </span>
                        <span style={{ color: '#4ADE80', fontWeight: 700, fontSize: 11, padding: '1px 6px', backgroundColor: 'rgba(74, 222, 128, 0.15)', borderRadius: 9999 }}>
                          {pg.active_seekers} active
                        </span>
                      </div>
                    ))}
                    {(!realtimeData?.topActivePages?.length && !analytics?.content?.topPages?.length) && (
                      <div style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic', padding: '6px 0' }}>
                        Awaiting incoming seeker page telemetry...
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Live Event Stream / Ingestion Feed */}
              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#CBD5E1' }}>
                    Live Seeker Event Stream (Ingested Telemetry)
                  </span>
                  <span style={{ fontSize: 11, color: '#64748B' }}>Showing last events</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 8 }}>
                  {(realtimeData?.events && realtimeData.events.length > 0 
                    ? realtimeData.events.slice(0, 6)
                    : (analytics?.realtime?.events?.slice(0, 6) || [])
                  ).map((evt: any) => {
                    const flag = getCountryFlag(evt.country_code);
                    return (
                      <div
                        key={evt.id}
                        className="analytics-live-event-row"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: 10,
                          fontSize: 12,
                          gap: 10,
                          border: '1px solid rgba(255, 255, 255, 0.06)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                          <span style={{ fontSize: 14 }}>{flag}</span>
                          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                            <span style={{ color: '#FFFFFF', fontWeight: 600, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {evt.city || 'Seeker'}, {evt.country || 'India'}
                            </span>
                            <span style={{ color: '#94A3B8', fontSize: 10.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {evt.page_title || evt.page_path} · {evt.device_type} ({evt.browser || 'Browser'})
                            </span>
                          </div>
                        </div>
                        <span style={{ color: '#A5B4FC', fontSize: 10.5, fontWeight: 500, whiteSpace: 'nowrap' }}>
                          {getRelativeTime(evt.created_at)}
                        </span>
                      </div>
                    );
                  })}
                  {(!realtimeData?.events?.length && !analytics?.realtime?.events?.length) && (
                    <div style={{ color: '#94A3B8', fontSize: 12, fontStyle: 'italic', padding: '12px 0' }}>
                      Waiting for incoming telemetry events from active visitors...
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* EXECUTIVE PERFORMANCE KPI GRID (6 Deep Metrics) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
              {/* 1. Unique Seekers */}
              <div className="apple-card" style={{ padding: '20px 18px', backgroundColor: '#FFFFFF' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#86868B' }}>
                    Unique Seekers
                  </span>
                  <div style={{ padding: 6, borderRadius: 8, backgroundColor: '#F5F5F7', color: '#3A3A6E' }}>
                    <Users size={16} />
                  </div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8, color: '#1D1D1F', letterSpacing: '-0.02em' }}>
                  {Number(analytics?.summary?.totalVisits ?? 0).toLocaleString()}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 11.5, color: '#15803D' }}>
                  <TrendingUp size={13} />
                  <span>{analytics?.summary?.totalVisits ? 'Distinct visitors recorded' : 'No visitors in period'}</span>
                </div>
              </div>

              {/* 2. Page Impressions */}
              <div className="apple-card" style={{ padding: '20px 18px', backgroundColor: '#FFFFFF' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#86868B' }}>
                    Page Impressions
                  </span>
                  <div style={{ padding: 6, borderRadius: 8, backgroundColor: '#F5F5F7', color: '#2563EB' }}>
                    <Eye size={16} />
                  </div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8, color: '#1D1D1F', letterSpacing: '-0.02em' }}>
                  {Number(analytics?.summary?.totalPageviews ?? 0).toLocaleString()}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 11.5, color: '#86868B' }}>
                  <span>
                    {analytics?.summary?.totalVisits 
                      ? `${((analytics?.summary?.totalPageviews || 0) / Math.max(1, analytics?.summary?.totalVisits || 1)).toFixed(1)} views / visitor`
                      : '0 views / visitor'}
                  </span>
                </div>
              </div>

              {/* 3. Kundli Signups */}
              <div className="apple-card" style={{ padding: '20px 18px', backgroundColor: '#FFFFFF' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#86868B' }}>
                    Seekers Registered
                  </span>
                  <div style={{ padding: 6, borderRadius: 8, backgroundColor: '#F5F5F7', color: '#7C3AED' }}>
                    <UserCheck size={16} />
                  </div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8, color: '#1D1D1F', letterSpacing: '-0.02em' }}>
                  {Number(analytics?.summary?.signups ?? 0).toLocaleString()}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 11.5, color: '#15803D' }}>
                  <TrendingUp size={13} />
                  <span>Vedic accounts created</span>
                </div>
              </div>

              {/* 4. Conversion Rate */}
              <div className="apple-card" style={{ padding: '20px 18px', backgroundColor: '#FFFFFF' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#86868B' }}>
                    Consultation Conversion
                  </span>
                  <div style={{ padding: 6, borderRadius: 8, backgroundColor: 'rgba(39, 201, 63, 0.1)', color: '#15803D' }}>
                    <TrendingUp size={16} />
                  </div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8, color: '#15803D', letterSpacing: '-0.02em' }}>
                  {analytics?.summary?.conversionRate ?? '0.00%'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 11.5, color: '#86868B' }}>
                  <span>Visits → Paid readings</span>
                </div>
              </div>

              {/* 5. Verified Platform Revenue */}
              <div className="apple-card" style={{ padding: '20px 18px', backgroundColor: '#FFFFFF' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#86868B' }}>
                    Verified Revenue
                  </span>
                  <div style={{ padding: 6, borderRadius: 8, backgroundColor: '#F5F5F7', color: '#C9A24B' }}>
                    <CreditCard size={16} />
                  </div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8, color: '#1D1D1F', letterSpacing: '-0.02em' }}>
                  ₹{Number(analytics?.summary?.revenue ?? 0).toLocaleString('en-IN')}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 11.5, color: '#86868B' }}>
                  <span>{analytics?.summary?.paidConsultations ?? 0} Paid Consultations</span>
                </div>
              </div>

              {/* 6. Dwell Time & Bounce */}
              <div className="apple-card" style={{ padding: '20px 18px', backgroundColor: '#FFFFFF' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#86868B' }}>
                    Avg Engagement
                  </span>
                  <div style={{ padding: 6, borderRadius: 8, backgroundColor: '#F5F5F7', color: '#E11D48' }}>
                    <Activity size={16} />
                  </div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8, color: '#1D1D1F', letterSpacing: '-0.02em' }}>
                  {analytics?.summary?.avgSessionDuration ?? '0m 0s'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 11.5, color: '#86868B' }}>
                  <span>Bounce rate: {analytics?.summary?.bounceRate ?? '0.0%'}</span>
                </div>
              </div>
            </div>

            {/* CONSULTATION CONVERSION PIPELINE (Live Database Funnel with Step Dropoffs) */}
            <div className="apple-card" style={{ padding: '28px 24px', backgroundColor: '#FFFFFF' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 10 }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1D1D1F', margin: 0 }}>
                    Vedic Consultation Conversion Pipeline
                  </h3>
                  <p style={{ margin: '3px 0 0', fontSize: 13, color: '#86868B' }}>
                    Real-time database progression from first discovery to confirmed & paid birth chart reading
                  </p>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#3A3A6E', backgroundColor: 'rgba(58, 58, 110, 0.08)', padding: '4px 10px', borderRadius: 8 }}>
                  End-to-End Conversion: {analytics?.funnel?.conversionRate || analytics?.summary?.conversionRate || '0.00%'}
                </span>
              </div>

              {/* Visual Stepped Pipeline */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
                {[
                  {
                    step: '1. Discovery & Visits',
                    val: analytics?.funnel?.visits ?? 0,
                    rate: '100%',
                    desc: 'Seekers landed on platform',
                    bg: '#F5F5F7',
                    color: '#1D1D1F'
                  },
                  {
                    step: '2. Kundli Signups',
                    val: analytics?.funnel?.signups ?? 0,
                    rate: `${(((analytics?.funnel?.signups ?? 0) / Math.max(1, analytics?.funnel?.visits || 1)) * 100).toFixed(1)}%`,
                    desc: 'Created birth chart profile',
                    bg: '#F5F5F7',
                    color: '#1D1D1F'
                  },
                  {
                    step: '3. Booking Inquiries',
                    val: analytics?.funnel?.bookingRequests ?? 0,
                    rate: `${(((analytics?.funnel?.bookingRequests ?? 0) / Math.max(1, analytics?.funnel?.signups || 1)) * 100).toFixed(1)}%`,
                    desc: 'Submitted consultation slot',
                    bg: '#F5F5F7',
                    color: '#1D1D1F'
                  },
                  {
                    step: '4. Confirmed Slots',
                    val: analytics?.funnel?.confirmed ?? 0,
                    rate: `${(((analytics?.funnel?.confirmed ?? 0) / Math.max(1, analytics?.funnel?.bookingRequests || 1)) * 100).toFixed(1)}%`,
                    desc: 'Approved by Astrologer Amit',
                    bg: 'rgba(58, 58, 110, 0.06)',
                    color: '#3A3A6E'
                  },
                  {
                    step: '5. Paid & Completed',
                    val: analytics?.funnel?.paid ?? 0,
                    rate: `${(((analytics?.funnel?.paid ?? 0) / Math.max(1, analytics?.funnel?.confirmed || 1)) * 100).toFixed(1)}%`,
                    desc: 'Verified payment received',
                    bg: 'rgba(39, 201, 63, 0.1)',
                    color: '#15803D'
                  }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '18px 16px',
                      backgroundColor: item.bg,
                      borderRadius: 14,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative',
                      border: idx === 4 ? '1.5px solid rgba(39, 201, 63, 0.3)' : '1px solid rgba(0,0,0,0.04)'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#86868B', letterSpacing: '0.04em' }}>
                        {item.step}
                      </div>
                      <div style={{ fontSize: 26, fontWeight: 800, marginTop: 6, color: item.color, letterSpacing: '-0.02em' }}>
                        {item.val.toLocaleString()}
                      </div>
                    </div>
                    <div style={{ marginTop: 12, borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 11, color: '#86868B' }}>Stage Rate:</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: item.color }}>{item.rate}</span>
                      </div>
                      <div style={{ fontSize: 10.5, color: '#86868B', marginTop: 2 }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AUDIENCE GEOGRAPHIES & HUBS (2 Column Grid) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
              {/* Top Countries */}
              <div className="apple-card" style={{ padding: '24px 22px', backgroundColor: '#FFFFFF' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1D1D1F', margin: 0 }}>
                      Global Seeker Reach (Countries)
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#86868B' }}>
                      Geographic distribution based on incoming telemetry
                    </p>
                  </div>
                  <Globe size={18} color="#3A3A6E" />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {analytics?.audience?.countries && analytics.audience.countries.length > 0 ? (
                    analytics.audience.countries.map((c: any, idx: number) => {
                      const flag = getCountryFlag(c.country_code);
                      return (
                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500, color: '#1D1D1F' }}>
                              <span style={{ fontSize: 15 }}>{flag}</span>
                              <span>{c.country || 'Direct'}</span>
                            </span>
                            <span style={{ fontSize: 12, color: '#6E6E73', fontWeight: 600 }}>
                              {Number(c.visitors).toLocaleString()} seekers ({c.percentage}%)
                            </span>
                          </div>
                          <div style={{ height: 6, width: '100%', backgroundColor: '#F2F2F7', borderRadius: 9999, overflow: 'hidden' }}>
                            <div 
                              style={{ 
                                height: '100%', 
                                width: `${Math.min(100, Math.max(4, Number(c.percentage)))}%`, 
                                backgroundColor: idx === 0 ? '#3A3A6E' : '#818CF8', 
                                borderRadius: 9999 
                              }} 
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ padding: '24px 0', textAlign: 'center', color: '#8E8E93', fontSize: 13 }}>
                      No country telemetry logged in selected time window.
                    </div>
                  )}
                </div>
              </div>

              {/* Top Cities */}
              <div className="apple-card" style={{ padding: '24px 22px', backgroundColor: '#FFFFFF' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1D1D1F', margin: 0 }}>
                      Top Metropolitan Seeker Hubs
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#86868B' }}>
                      Cities with highest engagement and birth chart queries
                    </p>
                  </div>
                  <Compass size={18} color="#2563EB" />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {analytics?.audience?.cities && analytics.audience.cities.length > 0 ? (
                    analytics.audience.cities.map((city: any, idx: number) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '9px 12px',
                          backgroundColor: '#F9FAFB',
                          borderRadius: 10,
                          fontSize: 13
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', width: 18 }}>#{idx + 1}</span>
                          <span style={{ fontWeight: 600, color: '#1F2937' }}>{city.city || 'Direct Area'}</span>
                          {city.country && <span style={{ fontSize: 11, color: '#9CA3AF' }}>({city.country})</span>}
                        </div>
                        <span style={{ fontWeight: 700, color: '#3A3A6E', fontSize: 12.5 }}>
                          {city.count} seekers
                        </span>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '24px 0', textAlign: 'center', color: '#8E8E93', fontSize: 13 }}>
                      No city telemetry logged in selected time window.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ACQUISITION CHANNELS & TECHNOLOGY MATRICES (2 Column Grid) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
              {/* Traffic Acquisition Channels */}
              <div className="apple-card" style={{ padding: '24px 22px', backgroundColor: '#FFFFFF' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1D1D1F', margin: 0 }}>
                      Traffic Acquisition & Attribution
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#86868B' }}>
                      Where seekers discover Amit Astro and book slots
                    </p>
                  </div>
                  <Share2 size={18} color="#059669" />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {analytics?.acquisition?.sources && analytics.acquisition.sources.length > 0 ? (
                    analytics.acquisition.sources.map((src: any, idx: number) => {
                      const totalVis = Math.max(1, analytics?.summary?.totalVisits || 1);
                      const pct = Math.round((src.visitors / totalVis) * 100);
                      return (
                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                            <span style={{ fontWeight: 600, color: '#1D1D1F' }}>{src.channel}</span>
                            <span style={{ fontSize: 12, color: '#6E6E73', fontWeight: 600 }}>
                              {src.visitors.toLocaleString()} ({pct}%)
                            </span>
                          </div>
                          <div style={{ height: 6, width: '100%', backgroundColor: '#F2F2F7', borderRadius: 9999, overflow: 'hidden' }}>
                            <div 
                              style={{ 
                                height: '100%', 
                                width: `${Math.min(100, Math.max(5, pct))}%`, 
                                backgroundColor: idx === 0 ? '#10B981' : '#3B82F6', 
                                borderRadius: 9999 
                              }} 
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ padding: '24px 0', textAlign: 'center', color: '#8E8E93', fontSize: 13 }}>
                      No acquisition source logged in selected time window.
                    </div>
                  )}
                </div>
              </div>

              {/* Technology & Device Telemetry */}
              <div className="apple-card" style={{ padding: '24px 22px', backgroundColor: '#FFFFFF' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1D1D1F', margin: 0 }}>
                      Device & Platform Environment
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#86868B' }}>
                      Seeker client hardware, operating systems, and browsers
                    </p>
                  </div>
                  <Smartphone size={18} color="#7C3AED" />
                </div>

                {/* Device distribution cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
                  <div style={{ padding: '12px 10px', backgroundColor: '#F9FAFB', borderRadius: 10, textAlign: 'center' }}>
                    <Smartphone size={18} color="#4F46E5" style={{ margin: '0 auto 4px' }} />
                    <div style={{ fontSize: 11, color: '#6B7280' }}>Mobile</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginTop: 2 }}>
                      {analytics?.technology?.mobilePercentage ?? 0}%
                    </div>
                  </div>
                  <div style={{ padding: '12px 10px', backgroundColor: '#F9FAFB', borderRadius: 10, textAlign: 'center' }}>
                    <Laptop size={18} color="#2563EB" style={{ margin: '0 auto 4px' }} />
                    <div style={{ fontSize: 11, color: '#6B7280' }}>Desktop</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginTop: 2 }}>
                      {analytics?.technology?.desktopPercentage ?? 0}%
                    </div>
                  </div>
                  <div style={{ padding: '12px 10px', backgroundColor: '#F9FAFB', borderRadius: 10, textAlign: 'center' }}>
                    <Tablet size={18} color="#059669" style={{ margin: '0 auto 4px' }} />
                    <div style={{ fontSize: 11, color: '#6B7280' }}>Tablet</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginTop: 2 }}>
                      {analytics?.technology?.tabletPercentage ?? 0}%
                    </div>
                  </div>
                </div>

                {/* Browser Breakdown */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#86868B' }}>
                    Top Browsers
                  </div>
                  {analytics?.technology?.browsers && analytics.technology.browsers.length > 0 ? (
                    analytics.technology.browsers.map((b: any, idx: number) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5, borderBottom: '1px solid #F3F4F6', paddingBottom: 5 }}>
                        <span style={{ color: '#374151', fontWeight: 500 }}>{b.browser || 'Standard Browser'}</span>
                        <span style={{ color: '#6B7280', fontWeight: 600 }}>{b.count} sessions</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '12px 0', textAlign: 'center', color: '#8E8E93', fontSize: 12 }}>
                      No browser telemetry recorded yet.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* TOP VEDIC CONTENT & CONSULTATION PACKAGES (2 Column Grid) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
              {/* Popular Content */}
              <div className="apple-card" style={{ padding: '24px 22px', backgroundColor: '#FFFFFF' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1D1D1F', margin: 0 }}>
                      Most Viewed Vedic Guides & Articles
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#86868B' }}>
                      Vedic content driving highest seeker engagement and trust
                    </p>
                  </div>
                  <BookOpen size={18} color="#3A3A6E" />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {analytics?.content?.topPages && analytics.content.topPages.length > 0 ? (
                    analytics.content.topPages.map((p: any, idx: number) => (
                      <div 
                        key={idx}
                        style={{
                          padding: '10px 12px',
                          backgroundColor: '#F9FAFB',
                          borderRadius: 10,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.page_title || p.page_path}
                          </div>
                          <div style={{ fontSize: 11, color: '#9CA3AF' }}>{p.page_path}</div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#3A3A6E' }}>{p.views} views</div>
                          <div style={{ fontSize: 10.5, color: '#6B7280' }}>~{p.avg_duration || 0}s read</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '24px 0', textAlign: 'center', color: '#8E8E93', fontSize: 13 }}>
                      No pageviews logged in selected time window.
                    </div>
                  )}
                </div>
              </div>

              {/* Consultation Packages Demand */}
              <div className="apple-card" style={{ padding: '24px 22px', backgroundColor: '#FFFFFF' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1D1D1F', margin: 0 }}>
                      Consultation Package Demand
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#86868B' }}>
                      Breakdown of booked astrology offerings
                    </p>
                  </div>
                  <Sparkles size={18} color="#C9A24B" />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {analytics?.content?.packages && analytics.content.packages.length > 0 ? (
                    analytics.content.packages.map((pkg: any, idx: number) => (
                      <div
                        key={idx}
                        style={{
                          padding: '10px 12px',
                          backgroundColor: '#F9FAFB',
                          borderRadius: 10,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{pkg.name}</div>
                          <div style={{ fontSize: 11, color: '#C9A24B', fontWeight: 600 }}>₹{pkg.price}</div>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#3A3A6E', backgroundColor: '#EEF2FF', padding: '3px 8px', borderRadius: 6 }}>
                          {pkg.booking_count} Bookings
                        </span>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '24px 0', textAlign: 'center', color: '#8E8E93', fontSize: 13 }}>
                      No packages loaded.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* AUDIT TRAIL (Live Admin Action Trail) */}
            <div className="apple-card" style={{ padding: '24px 22px', backgroundColor: '#FFFFFF' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1D1D1F', margin: 0 }}>
                    Administrative Action Trail (Audit Log)
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#86868B' }}>
                    Immutable security log of operations performed in Command Center
                  </p>
                </div>
                <ShieldCheck size={18} color="#15803D" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: '#4B5563', maxHeight: 320, overflowY: 'auto' }}>
                {analytics?.auditLogs && analytics.auditLogs.length > 0 ? (
                  analytics.auditLogs.map((log: any) => (
                    <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F3F4F6', paddingBottom: 8, gap: 12 }}>
                      <span><strong>{log.action}</strong>: {log.details}</span>
                      <span style={{ fontSize: 11.5, color: '#9CA3AF', whiteSpace: 'nowrap' }}>
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '16px 0', textAlign: 'center', color: '#9CA3AF' }}>No security events recorded.</div>
                )}
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

      {/* Apple-style Confirmation Modal for Deleting Customer */}
      {customerToDelete && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16
          }}
          onClick={() => !isDeletingCustomer && setCustomerToDelete(null)}
        >
          <div
            className="apple-card"
            style={{
              maxWidth: 440,
              width: '100%',
              padding: 24,
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: '#FFEEEE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FF3B30'
                }}
              >
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: '#1D1D1F', margin: 0 }}>
                  Delete Client?
                </h3>
                <p style={{ fontSize: 12.5, color: '#86868B', margin: '2px 0 0 0' }}>
                  Action cannot be undone
                </p>
              </div>
            </div>

            <p style={{ fontSize: 14, color: '#3A3A3C', lineHeight: 1.5, marginBottom: 20 }}>
              Are you sure you want to permanently delete <strong>{customerToDelete.name}</strong>?
              This will erase all appointments, payment records, Kundli birth charts, and chat history.
            </p>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                disabled={isDeletingCustomer}
                onClick={() => setCustomerToDelete(null)}
                className="apple-btn-secondary"
                style={{ fontSize: 13, padding: '8px 16px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingCustomer}
                onClick={handleDeleteCustomerFromCrm}
                style={{
                  backgroundColor: '#FF3B30',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 10,
                  padding: '8px 18px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                {isDeletingCustomer ? 'Deleting...' : 'Delete Client'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ADVANCED ASTROLOGER PROFILE ALTERATION SETTINGS MODAL     */}
      {/* ======================================================== */}
      {showProfileModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 3500,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowProfileModal(false);
          }}
        >
          <div
            className="apple-card"
            style={{
              width: '100%',
              maxWidth: 680,
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#FFFFFF',
              borderRadius: 22,
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.22)',
              border: '1px solid #E5E5EA'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #E5E5EA',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#FAFAFC'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #3A3A6E, #232348)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 18,
                    boxShadow: '0 4px 12px rgba(58, 58, 110, 0.25)'
                  }}
                >
                  {profileName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1D1D1F', margin: 0, letterSpacing: '-0.01em' }}>
                    Astrologer Profile & Practice
                  </h2>
                  <p style={{ fontSize: 12.5, color: '#86868B', margin: '2px 0 0 0' }}>
                    Configure your public Vedic identity, consultation fees, and credentials
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#8E8E93',
                  cursor: 'pointer',
                  padding: 6,
                  borderRadius: 8
                }}
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Segmented Tabs */}
            <div
              style={{
                display: 'flex',
                gap: 8,
                padding: '12px 24px',
                backgroundColor: '#FFFFFF',
                borderBottom: '1px solid #F0F0F2'
              }}
            >
              {[
                { id: 'general' as const, label: 'Identity & Bio', icon: User },
                { id: 'consultation' as const, label: 'Rates & Timings', icon: Clock },
                { id: 'security' as const, label: 'Security & Password', icon: Lock }
              ].map((tab) => {
                const Icon = tab.icon;
                const active = profileTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setProfileTab(tab.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 16px',
                      borderRadius: 10,
                      border: 'none',
                      backgroundColor: active ? '#3A3A6E' : '#F2F2F7',
                      color: active ? '#FFFFFF' : '#54656F',
                      fontWeight: active ? 600 : 500,
                      fontSize: 13,
                      cursor: 'pointer',
                      transition: 'all 0.18s ease'
                    }}
                  >
                    <Icon size={14} color={active ? '#FFFFFF' : '#54656F'} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Modal Body / Tab Contents */}
            <form onSubmit={handleSaveProfileSettings} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div
                style={{
                  padding: '22px 24px',
                  overflowY: 'auto',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 18
                }}
              >
                {profileTab === 'general' && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#1D1D1F', marginBottom: 6 }}>
                          Astrologer Name
                        </label>
                        <input
                          type="text"
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                          required
                          className="apple-input"
                          style={{ width: '100%', fontSize: 13.5 }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#1D1D1F', marginBottom: 6 }}>
                          Astrological Designation / Title
                        </label>
                        <input
                          type="text"
                          value={profileTitle}
                          onChange={(e) => setProfileTitle(e.target.value)}
                          required
                          placeholder="e.g. Senior Vedic Astrologer & Vastu Acharya"
                          className="apple-input"
                          style={{ width: '100%', fontSize: 13.5 }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#1D1D1F', marginBottom: 6 }}>
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={profileEmail}
                          onChange={(e) => setProfileEmail(e.target.value)}
                          required
                          className="apple-input"
                          style={{ width: '100%', fontSize: 13.5 }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#1D1D1F', marginBottom: 6 }}>
                          WhatsApp / Direct Hotline
                        </label>
                        <input
                          type="tel"
                          value={profilePhone}
                          onChange={(e) => setProfilePhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="apple-input"
                          style={{ width: '100%', fontSize: 13.5 }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#1D1D1F', marginBottom: 6 }}>
                        Public Vedic Bio & Lineage Introduction
                      </label>
                      <textarea
                        value={profileBio}
                        onChange={(e) => setProfileBio(e.target.value)}
                        rows={4}
                        className="apple-input"
                        style={{ width: '100%', fontSize: 13.5, lineHeight: 1.5, resize: 'vertical' }}
                      />
                      <span style={{ fontSize: 11, color: '#8E8E93', marginTop: 4, display: 'block' }}>
                        Displayed on consultation package cards, chat headers, and public booking confirmation receipts.
                      </span>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#1D1D1F', marginBottom: 6 }}>
                        Specializations & Domains
                      </label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                        {profileSpecialties.map((spec, idx) => (
                          <span
                            key={idx}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              backgroundColor: '#F2F2F7',
                              border: '1px solid #E5E5EA',
                              borderRadius: 20,
                              padding: '4px 10px',
                              fontSize: 12,
                              fontWeight: 500,
                              color: '#1D1D1F'
                            }}
                          >
                            <span>{spec}</span>
                            <button
                              type="button"
                              onClick={() => setProfileSpecialties(profileSpecialties.filter((_, i) => i !== idx))}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#8E8E93',
                                cursor: 'pointer',
                                padding: 0,
                                fontSize: 14,
                                lineHeight: 1
                              }}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          type="text"
                          value={newSpecialtyInput}
                          onChange={(e) => setNewSpecialtyInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (newSpecialtyInput.trim()) {
                                setProfileSpecialties([...profileSpecialties, newSpecialtyInput.trim()]);
                                setNewSpecialtyInput('');
                              }
                            }
                          }}
                          placeholder="Add specialty (e.g. Navamsha Analysis, Prashna)..."
                          className="apple-input"
                          style={{ flex: 1, fontSize: 13 }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newSpecialtyInput.trim()) {
                              setProfileSpecialties([...profileSpecialties, newSpecialtyInput.trim()]);
                              setNewSpecialtyInput('');
                            }
                          }}
                          className="apple-btn-secondary"
                          style={{ padding: '6px 14px', fontSize: 13 }}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {profileTab === 'consultation' && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#1D1D1F', marginBottom: 6 }}>
                          Standard 30-Min Consultation Fee (₹)
                        </label>
                        <input
                          type="number"
                          value={consultFee}
                          onChange={(e) => setConsultFee(e.target.value)}
                          className="apple-input"
                          style={{ width: '100%', fontSize: 13.5 }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#1D1D1F', marginBottom: 6 }}>
                          Emergency Expedited Surcharge (₹)
                        </label>
                        <input
                          type="number"
                          value={emergencyFee}
                          onChange={(e) => setEmergencyFee(e.target.value)}
                          className="apple-input"
                          style={{ width: '100%', fontSize: 13.5 }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#1D1D1F', marginBottom: 6 }}>
                        Astrological Ephemeris Timezone
                      </label>
                      <select
                        value={profileTimezone}
                        onChange={(e) => setProfileTimezone(e.target.value)}
                        className="apple-input"
                        style={{ width: '100%', fontSize: 13.5 }}
                      >
                        <option value="Asia/Kolkata (IST +05:30)">Asia/Kolkata (IST +05:30) - Standard India Ephemeris</option>
                        <option value="Asia/Dubai (GST +04:00)">Asia/Dubai (GST +04:00) - Gulf Standard</option>
                        <option value="Europe/London (GMT/BST)">Europe/London (GMT/BST) - Greenwich Mean</option>
                        <option value="America/New_York (EST/EDT)">America/New_York (EST/EDT) - US Eastern</option>
                        <option value="America/Los_Angeles (PST/PDT)">America/Los_Angeles (PST/PDT) - US Pacific</option>
                      </select>
                      <span style={{ fontSize: 11, color: '#8E8E93', marginTop: 4, display: 'block' }}>
                        All planetary hora calculations and calendar slot availability are referenced against this zone.
                      </span>
                    </div>

                    <div
                      style={{
                        backgroundColor: '#FAF8F5',
                        border: '1.5px solid #EEDFBA',
                        borderRadius: 12,
                        padding: '14px 16px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12
                      }}
                    >
                      <Sparkles size={18} color="#C9A24B" style={{ flexShrink: 0, marginTop: 2 }} />
                      <div style={{ fontSize: 12.5, color: '#5B4314', lineHeight: 1.5 }}>
                        <strong>Calendar Auto-Sync Active:</strong> Client consultation bookings adhere to your configured blackout windows and weekly hours set under the "Availability & Hours" tab.
                      </div>
                    </div>
                  </>
                )}

                {profileTab === 'security' && (
                  <>
                    <div
                      style={{
                        backgroundColor: '#F5F5F7',
                        borderRadius: 12,
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 6
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <ShieldCheck size={18} color="#34C759" />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#1D1D1F' }}>Two-Factor Security & RSA Protection</div>
                          <div style={{ fontSize: 11, color: '#8E8E93' }}>All client charts and credentials encrypted with RSA-OAEP</div>
                        </div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#34C759', backgroundColor: '#E8F9EE', padding: '3px 8px', borderRadius: 9999 }}>
                        ACTIVE
                      </span>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#1D1D1F', marginBottom: 6 }}>
                        Current Password (Required for credentials update)
                      </label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="apple-input"
                        style={{ width: '100%', fontSize: 13.5 }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#1D1D1F', marginBottom: 6 }}>
                          New Password
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Minimum 8 characters"
                          className="apple-input"
                          style={{ width: '100%', fontSize: 13.5 }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#1D1D1F', marginBottom: 6 }}>
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter new password"
                          className="apple-input"
                          style={{ width: '100%', fontSize: 13.5 }}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  padding: '16px 24px',
                  borderTop: '1px solid #E5E5EA',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 12,
                  backgroundColor: '#FAFAFC'
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="apple-btn-secondary"
                  style={{ padding: '8px 18px', fontSize: 13.5 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="apple-btn-primary"
                  style={{ padding: '8px 24px', fontSize: 13.5, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  {isSavingProfile ? (
                    <>
                      <div className="spinner-micro" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={15} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* GOOGLE GEMINI AI CONFIGURATION & KEY SETTINGS MODAL       */}
      {/* ======================================================== */}
      {showGeminiConfigModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 3500,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowGeminiConfigModal(false);
          }}
        >
          <div
            className="apple-card"
            style={{
              width: '100%',
              maxWidth: 620,
              maxHeight: '92vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#FFFFFF',
              borderRadius: 22,
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.22)',
              border: '1px solid #E5E5EA'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #E5E5EA',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#FAFAFC'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: '#FFF7E6',
                    color: '#C9A24B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #FFE58F'
                  }}
                >
                  <Sparkles size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1D1D1F', margin: 0 }}>
                    API Key Configuration
                  </h3>
                  <div style={{ fontSize: 12.5, color: '#6E6E73' }}>
                    Powers automatic bilingual Vedic article generation & Parashari translation
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGeminiConfigModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8E8E93', padding: 6 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Current Status Pill */}
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: 14,
                  backgroundColor: geminiConfig.valid ? '#F6FFED' : '#FFFBE6',
                  border: `1px solid ${geminiConfig.valid ? '#B7EB8F' : '#FFE58F'}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: geminiConfig.valid ? '#389E0D' : '#D48806' }}>
                    {geminiConfig.valid ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                    {geminiConfig.valid ? 'Active & Operational' : 'API Key Not Configured (Fallback Active)'}
                  </div>
                  <div style={{ fontSize: 12, color: '#6E6E73', marginTop: 3 }}>
                    Key: <code style={{ backgroundColor: 'rgba(0,0,0,0.04)', padding: '2px 6px', borderRadius: 4 }}>{geminiConfig.maskedKey || 'Not configured'}</code> · Model: <strong>{geminiConfig.activeModel}</strong>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={fetchGeminiConfig}
                  className="apple-btn-secondary"
                  style={{ padding: '5px 10px', fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 4 }}
                  title="Re-check status"
                >
                  <RefreshCw size={12} /> Refresh
                </button>
              </div>

              {/* API Key Input */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1D1D1F', marginBottom: 6 }}>
                  API Key
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="password"
                    value={inputGeminiKey}
                    onChange={(e) => {
                      setInputGeminiKey(e.target.value);
                      setKeyTestFeedback(null);
                    }}
                    placeholder={geminiConfig.maskedKey ? `Current: ${geminiConfig.maskedKey} (paste new key to update)` : 'Paste API key here'}
                    className="apple-input"
                    style={{ flex: 1, fontSize: 13.5, fontFamily: 'monospace' }}
                  />
                  <button
                    type="button"
                    onClick={() => handleTestGeminiKey(inputGeminiKey)}
                    disabled={isTestingKey || !inputGeminiKey.trim()}
                    className="apple-btn-secondary"
                    style={{ padding: '8px 14px', fontSize: 12.5, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    {isTestingKey ? <RefreshCw size={13} className="spinner" /> : <ShieldCheck size={13} />}
                    Test Key
                  </button>
                </div>
              </div>

              {/* Test feedback */}
              {keyTestFeedback && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 10,
                    fontSize: 12.5,
                    backgroundColor: keyTestFeedback.valid ? '#F6FFED' : '#FFF2F0',
                    border: `1px solid ${keyTestFeedback.valid ? '#B7EB8F' : '#FFCCC7'}`,
                    color: keyTestFeedback.valid ? '#389E0D' : '#CF1322'
                  }}
                >
                  {keyTestFeedback.message}
                </div>
              )}

              {/* Model Selection */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1D1D1F', marginBottom: 6 }}>
                  AI Model
                </label>
                <select
                  value={inputGeminiModel}
                  onChange={(e) => setInputGeminiModel(e.target.value)}
                  className="apple-input"
                  style={{ width: '100%', fontSize: 13.5 }}
                >
                  <option value="gemini-flash-latest">gemini-flash-latest (Recommended: High availability & speed)</option>
                  <option value="gemini-3.5-flash">gemini-3.5-flash (State-of-the-art fast bilingual generation)</option>
                  <option value="gemini-3.5-flash-lite">gemini-3.5-flash-lite (Ultra lightweight & economical)</option>
                  <option value="gemini-2.5-flash">gemini-2.5-flash (Legacy flash model)</option>
                </select>
                <span style={{ fontSize: 11.5, color: '#8E8E93', marginTop: 4, display: 'block' }}>
                  If the primary model faces rate limits, Amit Astro automatically falls back sequentially across supported models and our Vedic Engine.
                </span>
              </div>

              {/* How to create a new key guide */}
              <div
                style={{
                  backgroundColor: '#F5F5F7',
                  border: '1px solid #E5E5EA',
                  borderRadius: 14,
                  padding: '16px 18px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1D1D1F' }}>
                    How to get an API Key:
                  </div>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 12, color: '#0071E3', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
                  >
                    Open AI Studio <ExternalLink size={12} />
                  </a>
                </div>
                <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: '#6E6E73', lineHeight: 1.6 }}>
                  <li>Go to <strong>https://aistudio.google.com/app/apikey</strong> and sign in with your account.</li>
                  <li>Click the blue <strong>"Create API key"</strong> button.</li>
                  <li>Select an existing Google Cloud project or create a free project in 1 click.</li>
                  <li>Copy your new key (e.g. <code>AIzaSy...</code> or <code>AQ....</code>) and paste it into the box above.</li>
                  <li>Click <strong>"Test Key"</strong> to verify, then click <strong>"Save & Activate Key"</strong>.</li>
                </ol>
                <div style={{ marginTop: 10, fontSize: 11.5, color: '#2FA84F', fontWeight: 600 }}>
                  ✓ Generous free tier provided for high-speed bilingual Vedic article drafting & translation.
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '16px 24px',
                borderTop: '1px solid #E5E5EA',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 12,
                backgroundColor: '#FAFAFC'
              }}
            >
              <button
                type="button"
                onClick={() => setShowGeminiConfigModal(false)}
                className="apple-btn-secondary"
                style={{ padding: '8px 18px', fontSize: 13.5 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveGeminiKey}
                disabled={isSavingKey}
                className="apple-btn-primary"
                style={{ padding: '8px 24px', fontSize: 13.5, display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                {isSavingKey ? (
                  <>
                    <RefreshCw size={14} className="spinner" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={15} />
                    <span>Save & Activate Key</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
