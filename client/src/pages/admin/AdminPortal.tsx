import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, Calendar, MessageSquare, CreditCard, BookOpen, Settings, BarChart2, 
  Send, ShieldCheck, CheckCircle2, XCircle, Clock, Search, Phone, Plus, Trash2, 
  Edit3, ArrowRight, Eye, RefreshCw, AlertTriangle, Copy, Check, ChevronDown, ChevronUp, Sparkles, Filter, X, PanelLeft,
  Wand2, Image as ImageIcon, Languages, Star, ExternalLink, ShieldAlert, UserCheck, UserX, FileText, Upload
} from 'lucide-react';
import { apiRequest } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useHeaderActions } from '../../context/HeaderActionsContext';
import { AppleAdminChat } from '../../components/chat/AppleAdminChat';

export type AdminTab = 'dashboard' | 'customers' | 'appointments' | 'chat' | 'payments' | 'blog' | 'broadcast' | 'analytics' | 'settings';

interface AdminPortalProps {
  initialTab?: AdminTab;
}

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Listen to hash changes (e.g. from mobile bottom nav #chat)
  useEffect(() => {
    const handleHashChange = () => {
      const h = window.location.hash.replace('#', '');
      if (['dashboard', 'customers', 'appointments', 'chat', 'payments', 'blog', 'broadcast', 'analytics', 'settings'].includes(h)) {
        setActiveTab(h as AdminTab);
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

  const handleGenerateAiArticle = async () => {
    if (!aiPrompt.trim()) {
      showToast('Please type your article topic or idea first', 'error');
      return;
    }

    setIsAiGenerating(true);
    setAiStatusMsg('Gemini AI is analyzing Vedic texts & crafting bilingual article...');

    try {
      const res = await apiRequest<any>('/blog/admin/generate-ai-article', {
        method: 'POST',
        body: JSON.stringify({
          idea: aiPrompt.trim(),
          tone: aiTone,
          length: aiLength,
          categoryId: newPost.categoryId || (categories[0]?.id || '')
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
      showToast('Bilingual article & artwork generated by Gemini AI!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to generate article with AI', 'error');
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

    setIsTranslating(true);
    try {
      const res = await apiRequest<any>('/blog/admin/translate', {
        method: 'POST',
        body: JSON.stringify({
          title: sourceTitle,
          excerpt: sourceExcerpt,
          contentMarkdown: sourceContent,
          direction
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

  const handleInsertMarkdownSnippet = (snippet: string, isHindi = false) => {
    const field = isHindi ? 'contentMarkdownHi' : 'contentMarkdown';
    setNewPost(prev => ({
      ...prev,
      [field]: prev[field] ? `${prev[field]}\n\n${snippet}` : snippet
    }));
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
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F5F7', display: 'flex', flexDirection: 'column' }}>
      {/* Admin Top Header (Desktop only) */}
      <header
        className="desktop-header-controls"
        style={{
          backgroundColor: '#1D1D1F',
          color: '#FFFFFF',
          padding: '14px 24px',
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
                  {(['all', 'admin', 'new', 'old'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setCustomerFilter(f as any)}
                      style={{
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: (customerFilter as string) === f ? 600 : 500,
                        backgroundColor: (customerFilter as string) === f ? '#FFF' : 'transparent',
                        boxShadow: (customerFilter as string) === f ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                        cursor: 'pointer',
                        color: (customerFilter as string) === f ? '#1D1D1F' : '#6E6E73'
                      }}
                    >
                      {f === 'all'
                        ? `All (${customers.length})`
                        : f === 'admin'
                        ? `Admins (${customers.filter((c) => c.role === 'admin').length})`
                        : f === 'new'
                        ? `New (${customers.filter((c) => c.is_new_customer && !c.trial_used).length})`
                        : `Established (${customers.filter((c) => !c.is_new_customer || c.trial_used).length})`}
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
                      border: c.role === 'admin' ? '1.5px solid #C9A24B' : '1px solid #E5E5EA',
                      borderRadius: 14,
                      padding: '16px 20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 14,
                      backgroundColor: c.role === 'admin' ? '#FCFAF5' : '#FFF'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: 600, fontSize: 15, color: '#1D1D1F' }}>
                          {c.name}
                        </span>

                        {/* Role Badge */}
                        {c.role === 'admin' && (
                          <span className="apple-badge-gold" style={{ fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <ShieldCheck size={12} /> Administrator
                          </span>
                        )}

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

                      {/* Admin Controls & Role Promotion */}
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {/* Promote / Demote Action */}
                        {c.id !== user?.id && (
                          c.role === 'admin' ? (
                            <button
                              type="button"
                              onClick={() => handleUpdateUserRole(c.id, 'customer', c.name)}
                              className="apple-btn-secondary"
                              style={{ fontSize: 12, padding: '7px 12px', color: '#6E6E73' }}
                              title="Demote this admin to Customer role"
                            >
                              <UserX size={13} /> Demote to Customer
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleUpdateUserRole(c.id, 'admin', c.name)}
                              className="apple-btn-secondary"
                              style={{ fontSize: 12, padding: '7px 12px', color: '#C9A24B', borderColor: '#C9A24B' }}
                              title="Promote this user to Administrator"
                            >
                              <ShieldCheck size={13} /> Promote to Admin
                            </button>
                          )
                        )}

                        {c.is_new_customer ? (
                          <button
                            type="button"
                            onClick={() => handleToggleNewCustomer(c.id, false)}
                            className="apple-btn-secondary"
                            style={{ fontSize: 12, padding: '7px 12px', color: '#D64545', borderColor: '#F5C6CB' }}
                            title="Revoke 5-minute free trial eligibility for this client"
                          >
                            Revoke Trial (Mark Old)
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleNewCustomer(c.id, true)}
                            className="apple-btn-secondary"
                            style={{ fontSize: 12, padding: '7px 12px', color: '#2FA84F', borderColor: '#C3E6CB' }}
                            title="Grant 5-minute free trial eligibility to this client"
                          >
                            Grant Trial (Mark New)
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => openCustomerChatFromCrm(c)}
                          className="apple-btn-primary"
                          style={{ fontSize: 12, padding: '7px 14px' }}
                        >
                          <MessageSquare size={13} /> Chat & Family 360
                        </button>

                        {c.id !== user?.id && (
                          <button
                            type="button"
                            onClick={() => setCustomerToDelete({ id: c.id, name: c.name })}
                            className="apple-btn-secondary"
                            style={{ fontSize: 12, padding: '7px 12px', color: '#D64545', borderColor: '#F5C6CB' }}
                            title="Permanently delete client and all records"
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 6. BLOG CMS & AI EDITORIAL STUDIO */}
        {activeTab === 'blog' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Studio Header Card */}
            <div className="apple-card" style={{ padding: '24px 28px', backgroundColor: '#FFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span className="apple-badge-gold">
                    <Sparkles size={12} /> Editorial Studio
                  </span>
                  <span className="apple-badge-primary">
                    Bilingual (EN & HI) · Gemini 2.5 Flash
                  </span>
                </div>
                <h2 className="text-h2" style={{ fontSize: 24, margin: '4px 0' }}>
                  Vedic Blog & Article Publishing
                </h2>
                <p style={{ fontSize: 13.5, color: '#6E6E73', margin: 0 }}>
                  Craft authentic astrological wisdom essays with Gemini AI drafting, bidirectional translation, and cosmic image synthesis.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setShowAiModal(true)}
                  className="apple-btn-gold"
                  style={{ fontSize: 13.5, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 7, boxShadow: '0 4px 14px rgba(201, 162, 75, 0.25)' }}
                >
                  <Wand2 size={16} /> Compose with Gemini AI
                </button>
                <button
                  type="button"
                  onClick={handleStartNewPost}
                  className="apple-btn-primary"
                  style={{ fontSize: 13.5, padding: '10px 18px' }}
                >
                  <Plus size={15} /> Compose Manually
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span className="apple-badge-gold">
                        <Wand2 size={12} /> Gemini 2.5 Flash
                      </span>
                      <span style={{ fontSize: 12, color: '#2FA84F', fontWeight: 600 }}>
                        ● Active & Connected
                      </span>
                    </div>
                    <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1D1D1F', margin: '4px 0' }}>
                      Generate Bilingual Vedic Article from an Idea
                    </h3>
                    <p style={{ fontSize: 13.5, color: '#6E6E73', margin: 0 }}>
                      Describe your topic in plain text (English or Hindi). Gemini will research classical Parashari shastras, draft both English and Hindi articles, suggest remedies, and synthesize cosmic artwork.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAiModal(false)}
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

                  {/* Preset inspiration chips */}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#86868B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Quick Topic Inspirations:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {[
                        '🪐 Saturn Retrograde in Pisces 2026: Karmic Tests & Remedies',
                        '☀️ Surya Gochar in Aries: Career Surge & Power Shifts',
                        '🏡 Vastu Shastra for Main Entrance & Kitchen Prosperity',
                        '💎 Blue Sapphire (Neelam): Who Should & Shouldn’t Wear It',
                        '🕉️ Powerful Mahamrityunjaya & Navagraha Mantras for Protection',
                        '🌙 Moon in 8th House: Overcoming Anxiety & Emotional Healing'
                      ].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setAiPrompt(preset)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#F5F5F7',
                            border: '1px solid #E5E5EA',
                            borderRadius: 20,
                            fontSize: 12.5,
                            color: '#3A3A6E',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
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

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        type="button"
                        onClick={() => setShowAiModal(false)}
                        className="apple-btn-secondary"
                        style={{ padding: '9px 18px', fontSize: 13.5 }}
                        disabled={isAiGenerating}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleGenerateAiArticle}
                        disabled={isAiGenerating || !aiPrompt.trim()}
                        className="apple-btn-gold"
                        style={{ padding: '9px 24px', fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 8 }}
                      >
                        {isAiGenerating ? <RefreshCw size={15} className="spinner" /> : <Sparkles size={15} />}
                        {isAiGenerating ? 'Drafting with Gemini...' : 'Generate Bilingual Article'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Compose / Edit Full Workspace */}
            {showPostEditor && (
              <form
                onSubmit={handleSavePost}
                className="apple-card"
                style={{
                  padding: '28px',
                  backgroundColor: '#FFF',
                  borderRadius: 20,
                  boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 20
                }}
              >
                {/* Editor Header Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, paddingBottom: 16, borderBottom: '1px solid #E5E5EA' }}>
                  <div>
                    <span className="apple-badge-primary" style={{ marginBottom: 4 }}>
                      {editingPostId ? 'Editing Existing Article' : 'Composing New Article'}
                    </span>
                    <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1D1D1F', margin: '4px 0' }}>
                      {newPost.title || newPost.titleHi || 'Untitled Vedic Article'}
                    </h3>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setShowAiModal(true)}
                      className="apple-btn-secondary"
                      style={{ fontSize: 13, padding: '8px 14px', color: '#C9A24B', borderColor: '#C9A24B', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <Wand2 size={14} /> AI Assistant
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditorLivePreview(!editorLivePreview)}
                      className="apple-btn-secondary"
                      style={{ fontSize: 13, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <Eye size={14} /> {editorLivePreview ? 'Hide Split Preview' : 'Split Live Preview'}
                    </button>

                    <button
                      type="button"
                      onClick={() => { setShowPostEditor(false); setEditingPostId(null); }}
                      className="apple-btn-secondary"
                      style={{ fontSize: 13, padding: '8px 14px' }}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="apple-btn-primary"
                      style={{ fontSize: 13.5, padding: '9px 22px', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <Check size={15} /> {editingPostId ? 'Save & Update Article' : 'Publish Article Live'}
                    </button>
                  </div>
                </div>

                {/* 1. Language Segmented Switcher & Instant Translator Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, backgroundColor: '#F5F5F7', padding: '10px 16px', borderRadius: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: '#6E6E73', marginRight: 6 }}>Active Language:</span>
                    {(['en', 'hi', 'dual'] as const).map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setEditorLang(l)}
                        style={{
                          border: 'none',
                          padding: '6px 14px',
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: editorLang === l ? 600 : 500,
                          backgroundColor: editorLang === l ? '#FFFFFF' : 'transparent',
                          color: editorLang === l ? '#1D1D1F' : '#6E6E73',
                          boxShadow: editorLang === l ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        {l === 'en' && <span>🇬🇧 English {newPost.contentMarkdown ? '●' : ''}</span>}
                        {l === 'hi' && <span>🇮🇳 हिंदी (Hindi) {newPost.contentMarkdownHi ? '●' : ''}</span>}
                        {l === 'dual' && <span>🌐 Side-by-Side Dual View</span>}
                      </button>
                    ))}
                  </div>

                  {/* One-Click Bidirectional Translation Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => handleTranslateArticle('en-to-hi')}
                      disabled={isTranslating || !newPost.contentMarkdown.trim()}
                      className="apple-btn-secondary"
                      style={{ fontSize: 12.5, padding: '6px 12px', color: '#3A3A6E', borderColor: '#3A3A6E', display: 'flex', alignItems: 'center', gap: 6 }}
                      title="Translate current English content into authentic Vedic Hindi"
                    >
                      {isTranslating ? <RefreshCw size={13} className="spinner" /> : <Languages size={13} />}
                      Translate EN ➔ हिंदी
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTranslateArticle('hi-to-en')}
                      disabled={isTranslating || !newPost.contentMarkdownHi.trim()}
                      className="apple-btn-secondary"
                      style={{ fontSize: 12.5, padding: '6px 12px', color: '#3A3A6E', borderColor: '#3A3A6E', display: 'flex', alignItems: 'center', gap: 6 }}
                      title="Translate current Hindi content into fluent English"
                    >
                      {isTranslating ? <RefreshCw size={13} className="spinner" /> : <Languages size={13} />}
                      Translate हिंदी ➔ EN
                    </button>
                  </div>
                </div>

                {/* 2. Visual Image Studio */}
                <div style={{ border: '1px solid #E5E5EA', borderRadius: 16, padding: '18px 20px', backgroundColor: '#FAFAFA' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#1D1D1F' }}>Article Hero & Cover Artwork</span>
                      <p style={{ fontSize: 12.5, color: '#6E6E73', margin: '2px 0 0' }}>
                        Generate high-resolution Vedic artwork with AI, upload a custom image from your device, or paste a URL.
                      </p>
                    </div>
                    {newPost.heroImageUrl && (
                      <button
                        type="button"
                        onClick={() => setNewPost(prev => ({ ...prev, heroImageUrl: '' }))}
                        style={{ background: 'none', border: 'none', color: '#D64545', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <Trash2 size={13} /> Remove Image
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 340px) 1fr', gap: 20, alignItems: 'center' }}>
                    {/* Image Preview Thumbnail */}
                    <div style={{ borderRadius: 14, overflow: 'hidden', height: 180, border: '1px solid #E5E5EA', backgroundColor: '#F0F0F2', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      {newPost.heroImageUrl ? (
                        <img
                          src={newPost.heroImageUrl}
                          alt="Article Cover"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ textAlign: 'center', color: '#8E8E93', padding: 16 }}>
                          <ImageIcon size={32} style={{ marginBottom: 6, opacity: 0.5 }} />
                          <div style={{ fontSize: 12.5 }}>No image attached</div>
                        </div>
                      )}
                    </div>

                    {/* Image Tools */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {/* AI Artwork Generator */}
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#3A3A6E', marginBottom: 4 }}>
                          ✨ Synthesize Artwork with AI:
                        </label>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input
                            type="text"
                            value={imagePromptInput}
                            onChange={(e) => setImagePromptInput(e.target.value)}
                            placeholder="e.g. Celestial golden Jupiter transit with sacred geometry and cosmic aura..."
                            className="apple-input"
                            style={{ fontSize: 13 }}
                          />
                          <button
                            type="button"
                            onClick={() => handleGenerateAiImage()}
                            disabled={isGeneratingImage}
                            className="apple-btn-gold"
                            style={{ padding: '8px 16px', fontSize: 12.5, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}
                          >
                            {isGeneratingImage ? <RefreshCw size={13} className="spinner" /> : <Sparkles size={13} />}
                            {isGeneratingImage ? 'Synthesizing...' : 'Generate AI Image'}
                          </button>
                        </div>
                      </div>

                      {/* Custom Upload and Paste URL */}
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
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

                        <div style={{ flex: 1, minWidth: 200 }}>
                          <input
                            type="url"
                            value={newPost.heroImageUrl}
                            onChange={(e) => setNewPost({ ...newPost, heroImageUrl: e.target.value })}
                            placeholder="Or paste external image URL (https://...)"
                            className="apple-input"
                            style={{ fontSize: 12.5, padding: '6px 12px' }}
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

                      {/* Markdown Toolbar */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <label style={{ fontSize: 13, fontWeight: 600 }}>Markdown Content (English)</label>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {[
                              { label: 'H2', snippet: '## Section Title\n' },
                              { label: 'H3', snippet: '### Subsection Title\n' },
                              { label: 'Bold', snippet: '**Important Text**' },
                              { label: 'Italic', snippet: '*Subtle Emphasis*' },
                              { label: 'Quote', snippet: '> "Classical Shloka / Vedic Principle"\n' },
                              { label: '🕉️ Mantra Box', snippet: '> **🕉️ Sacred Mantra Remedy:**\n> `Om Sham Shanaicharaya Namah` (108 times at dusk)' },
                              { label: '⚡ Remedy List', snippet: '- **Gemstone:** Blue Sapphire (only after trial)\n- **Rudraksha:** 7 Mukhi\n- **Charity (Daan):** Black sesame, mustard oil on Saturdays' },
                              { label: 'Table', snippet: '| Planetary Aspect | Affected Rashis | Classical Remedy |\n|---|---|---|\n| Shani Gochar | Kumbha, Meena | Shani Daan & Hanuman Chalisa |' }
                            ].map((btn) => (
                              <button
                                key={btn.label}
                                type="button"
                                onClick={() => handleInsertMarkdownSnippet(btn.snippet, false)}
                                style={{ padding: '3px 8px', fontSize: 11, backgroundColor: '#F5F5F7', border: '1px solid #E5E5EA', borderRadius: 6, cursor: 'pointer', color: '#3A3A6E' }}
                              >
                                {btn.label}
                              </button>
                            ))}
                          </div>
                        </div>
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

                      {/* Hindi Markdown Toolbar */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <label style={{ fontSize: 13, fontWeight: 600 }}>मुख्य लेख (Hindi Markdown)</label>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {[
                              { label: 'H2', snippet: '## खंड का शीर्षक\n' },
                              { label: 'H3', snippet: '### उप-खंड शीर्षक\n' },
                              { label: 'Bold', snippet: '**महत्वपूर्ण बिंदु**' },
                              { label: 'Quote', snippet: '> "प्रामाणिक श्लोक या शास्त्रीय सूत्र"\n' },
                              { label: '🕉️ मंत्र बॉक्स', snippet: '> **🕉️ सिद्ध मंत्र जप:**\n> `ॐ शं शनैश्चराय नमः` (प्रतिदिन संध्याकाल में 108 बार)' },
                              { label: '⚡ उपाय सूची', snippet: '- **रत्न परामर्श:** केवल कुंडली विश्लेषण के उपरांत\n- **रुद्राक्ष:** सात मुखी रुद्राक्ष\n- **दान कर्म:** शनिवार को तिल, सरसों का तेल एवं छाया दान' },
                              { label: 'Table', snippet: '| ग्रह गोचर | प्रभावित राशियां | अनुशंसित उपाय |\n|---|---|---|\n| शनि गोचर | कुंभ, मीन | हनुमान चालीसा पाठ एवं शनि दान |' }
                            ].map((btn) => (
                              <button
                                key={btn.label}
                                type="button"
                                onClick={() => handleInsertMarkdownSnippet(btn.snippet, true)}
                                style={{ padding: '3px 8px', fontSize: 11, backgroundColor: '#F5F5F7', border: '1px solid #E5E5EA', borderRadius: 6, cursor: 'pointer', color: '#3A3A6E' }}
                              >
                                {btn.label}
                              </button>
                            ))}
                          </div>
                        </div>
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
            <div className="apple-card" style={{ padding: '24px 28px', backgroundColor: '#FFF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 18 }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 2px' }}>
                    Published Articles Directory
                  </h3>
                  <p style={{ fontSize: 13, color: '#6E6E73', margin: 0 }}>
                    Showing {filteredBlogPosts.length} of {blogPosts.length} total articles.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* Search */}
                  <div style={{ position: 'relative' }}>
                    <Search size={14} color="#8E8E93" style={{ position: 'absolute', left: 10, top: 10 }} />
                    <input
                      type="text"
                      value={blogSearch}
                      onChange={(e) => setBlogSearch(e.target.value)}
                      placeholder="Search title, category..."
                      className="apple-input"
                      style={{ paddingLeft: 30, fontSize: 13, padding: '7px 12px 7px 30px', minWidth: 200 }}
                    />
                  </div>

                  {/* Category Filter */}
                  <select
                    value={blogCategoryFilter}
                    onChange={(e) => setBlogCategoryFilter(e.target.value)}
                    className="apple-input"
                    style={{ fontSize: 12.5, padding: '6px 12px' }}
                  >
                    <option value="all">All Categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>

                  {/* Status Pills */}
                  <div style={{ display: 'flex', gap: 4, backgroundColor: '#F5F5F7', padding: 3, borderRadius: 8 }}>
                    {(['all', 'published', 'drafts', 'featured'] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setBlogStatusFilter(st)}
                        style={{
                          border: 'none',
                          padding: '5px 10px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: blogStatusFilter === st ? 600 : 500,
                          backgroundColor: blogStatusFilter === st ? '#FFF' : 'transparent',
                          color: blogStatusFilter === st ? '#1D1D1F' : '#6E6E73',
                          boxShadow: blogStatusFilter === st ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                          cursor: 'pointer'
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
                  No articles match the current filter. Click "Compose with Gemini AI" to create your first article!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {filteredBlogPosts.map((bp) => (
                    <div
                      key={bp.id}
                      style={{
                        border: '1px solid #E5E5EA',
                        borderRadius: 14,
                        padding: '16px 20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 16,
                        backgroundColor: '#FFF'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 260 }}>
                        {/* Thumbnail */}
                        <div style={{ width: 72, height: 50, borderRadius: 8, overflow: 'hidden', flexShrink: 0, backgroundColor: '#F5F5F7', border: '1px solid #E5E5EA' }}>
                          <img
                            src={bp.hero_image_url}
                            alt={bp.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                            <span style={{ fontWeight: 600, fontSize: 15, color: '#1D1D1F' }}>
                              {bp.title}
                            </span>
                            {bp.is_featured === 1 && (
                              <span className="apple-badge-gold" style={{ fontSize: 10.5, padding: '2px 6px' }}>
                                ⭐ Featured
                              </span>
                            )}
                            {bp.is_published === 0 ? (
                              <span style={{ fontSize: 10.5, backgroundColor: '#F0F0F0', color: '#8E8E93', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>
                                Draft
                              </span>
                            ) : (
                              <span className="apple-badge-success" style={{ fontSize: 10.5, padding: '2px 6px' }}>
                                Live
                              </span>
                            )}
                          </div>

                          {bp.title_hi && (
                            <div style={{ fontSize: 13, color: '#3A3A6E', marginBottom: 2 }}>
                              🇮🇳 {bp.title_hi}
                            </div>
                          )}

                          <div style={{ fontSize: 12.5, color: '#6E6E73' }}>
                            {bp.category_name} · {bp.reading_time_min} min read
                            {bp.content_markdown_hi && <span style={{ marginLeft: 8, color: '#2FA84F', fontWeight: 600 }}>● Bilingual Available</span>}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => handleTogglePostFeatured(bp)}
                          style={{
                            background: 'none',
                            border: '1px solid #E5E5EA',
                            borderRadius: 8,
                            padding: '6px 10px',
                            cursor: 'pointer',
                            color: bp.is_featured === 1 ? '#D98E04' : '#8E8E93',
                            fontSize: 12.5,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                          title="Toggle featured homepage placement"
                        >
                          <Star size={13} fill={bp.is_featured === 1 ? '#D98E04' : 'none'} />
                          {bp.is_featured === 1 ? 'Featured' : 'Feature'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleEditPost(bp)}
                          className="apple-btn-secondary"
                          style={{ padding: '6px 12px', fontSize: 12.5, color: '#3A3A6E', borderColor: '#3A3A6E' }}
                        >
                          <Edit3 size={13} /> Edit
                        </button>

                        <a
                          href={`/blog/post/${bp.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="apple-btn-secondary"
                          style={{ padding: '6px 12px', fontSize: 12.5, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <ExternalLink size={13} /> View Live
                        </a>

                        <button
                          type="button"
                          onClick={() => handleDeletePost(bp.id, bp.title)}
                          style={{ background: 'none', border: 'none', color: '#D64545', cursor: 'pointer', padding: 6 }}
                          title="Delete article"
                        >
                          <Trash2 size={16} />
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
    </div>
  );
};
