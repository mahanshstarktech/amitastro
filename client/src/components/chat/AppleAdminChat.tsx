import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Send,
  Phone,
  Trash2,
  User,
  Calendar,
  Clock,
  Sparkles,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Paperclip,
  Mic,
  X,
  ArrowUp,
  CheckCheck,
  RefreshCw,
  MessageSquare,
  AlertTriangle,
  Info,
  ShieldCheck,
  Smile,
  Volume2,
  VolumeX
} from 'lucide-react';
import { apiRequest } from '../../utils/api';
import { useNotification } from '../../context/NotificationContext';
import {
  getSocket,
  authenticateSocket,
  playReceiveChime,
  playSendChime,
  notifyNewMessage,
  setTabUnreadBadge,
  requestNotificationPermission
} from '../../utils/socket';

export interface ChatConversationItem {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_photo?: string;
  trial_used?: number;
  trial_seconds_remaining?: number;
  is_new_customer?: number;
  internal_notes?: string;
  tags_json?: string;
  last_message_text?: string;
  last_message_time?: string;
  last_message_sender?: string;
  last_message_type?: string;
  unread_admin_count: number;
  is_locked?: number;
}

export interface ChatMessageItem {
  id: string;
  conversation_id: string;
  sender_type: 'admin' | 'customer';
  sender_id: string;
  message_type: 'text' | 'image' | 'voice' | 'astrological_remedy' | 'system';
  content: string;
  attachment_url?: string;
  is_read: number;
  created_at: string;
}

interface AppleAdminChatProps {
  onCustomerDeleted?: (customerId: string) => void;
  initialConversationId?: string;
}

// Web Audio API Synthesizer for Authentic Apple-style message chime
function playAppleSendChime() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  } catch (_) {}
}

export const AppleAdminChat: React.FC<AppleAdminChatProps> = ({
  onCustomerDeleted,
  initialConversationId
}) => {
  const { showToast } = useNotification();

  // Conversations state
  const [conversations, setConversations] = useState<ChatConversationItem[]>([]);
  const [selectedConv, setSelectedConv] = useState<ChatConversationItem | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessageItem[]>([]);
  const [customerContext, setCustomerContext] = useState<any>(null);

  // Loading states
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Filter & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'active' | 'needs_reply'>('all');

  // Input & attachments
  const [inputText, setInputText] = useState('');
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [attachmentType, setAttachmentType] = useState<'image' | 'file'>('image');
  const [showRemedyShelf, setShowRemedyShelf] = useState(true);
  const [showInspector, setShowInspector] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Mobile drawer state
  const [mobileView, setMobileView] = useState<'list' | 'thread'>('list');

  // Image zoom modal
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Delete Customer Modal
  const [customerToDelete, setCustomerToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingCustomer, setIsDeletingCustomer] = useState(false);

  // Family profiles expand & copy
  const [expandedProfiles, setExpandedProfiles] = useState<Record<string, boolean>>({});
  const [copiedProfileId, setCopiedProfileId] = useState<string | null>(null);

  // Internal note editing
  const [internalNote, setInternalNote] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedConvRef = useRef<ChatConversationItem | null>(null);
  selectedConvRef.current = selectedConv;

  // Real-time WhatsApp-level Socket Integration
  useEffect(() => {
    requestNotificationPermission();
    authenticateSocket(undefined, 'admin');
    const socket = getSocket();

    const handleAdminNewMessage = (data: { conversationId: string; message: ChatMessageItem; customer?: { id: string; name: string } }) => {
      const { conversationId, message, customer } = data;

      if (message.sender_type === 'customer') {
        if (soundEnabled) playReceiveChime();
        notifyNewMessage(
          `💬 ${customer?.name || 'Customer'}`,
          message.content || 'Photo attachment sent'
        );
      }

      // WhatsApp Top-of-Stack Reordering:
      setConversations((prev) => {
        const existing = prev.find((c) => c.id === conversationId);
        const isCurrent = selectedConvRef.current?.id === conversationId;
        const others = prev.filter((c) => c.id !== conversationId);

        if (existing) {
          const updated: ChatConversationItem = {
            ...existing,
            last_message_text: message.content || (message.attachment_url ? 'Photo attachment' : ''),
            last_message_time: message.created_at || new Date().toISOString(),
            last_message_sender: message.sender_type,
            last_message_type: message.message_type,
            unread_admin_count: isCurrent ? 0 : (message.sender_type === 'customer' ? (existing.unread_admin_count || 0) + 1 : existing.unread_admin_count)
          };
          // Move conversation to the VERY TOP of the stack
          return [updated, ...others];
        } else {
          fetchInbox(selectedConvRef.current?.id);
          return prev;
        }
      });

      // If current conversation open, append message with instant latency
      if (selectedConvRef.current?.id === conversationId) {
        setChatMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
        scrollToBottom('smooth');
        apiRequest(`/chat/admin/conversation/${conversationId}`).catch(() => {});
      }
    };

    socket.on('admin_new_message', handleAdminNewMessage);
    socket.on('receive_message', (msg: ChatMessageItem) => {
      if (selectedConvRef.current?.id === msg.conversation_id) {
        setChatMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        scrollToBottom('smooth');
      }
    });

    return () => {
      socket.off('admin_new_message', handleAdminNewMessage);
    };
  }, [soundEnabled]);

  // Join active conversation room for zero-latency direct messaging
  useEffect(() => {
    if (selectedConv?.id) {
      const socket = getSocket();
      socket.emit('join_conversation', selectedConv.id);
      return () => {
        socket.emit('leave_conversation', selectedConv.id);
      };
    }
  }, [selectedConv?.id]);

  // Scroll to bottom helper
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior });
    }, 80);
  };

  // 1. Fetch Conversations Inbox
  const fetchInbox = async (preserveSelectedId?: string) => {
    try {
      setIsLoadingList(true);
      const res = await apiRequest('/chat/admin/inbox');
      const list: ChatConversationItem[] = res.conversations || [];
      setConversations(list);

      const targetId = preserveSelectedId || selectedConv?.id || initialConversationId;
      if (targetId) {
        const found = list.find((c) => c.id === targetId);
        if (found) {
          selectConversation(found, false);
          return;
        }
      }

      if (list.length > 0 && !selectedConv) {
        selectConversation(list[0], false);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch conversations', 'error');
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    fetchInbox();
  }, []);

  // 2. Select a conversation
  const selectConversation = async (conv: ChatConversationItem, updateMobile: boolean = true) => {
    setSelectedConv(conv);
    if (updateMobile) setMobileView('thread');
    setIsLoadingMessages(true);

    try {
      const res = await apiRequest(`/chat/admin/conversation/${conv.id}`);
      setChatMessages(res.messages || []);
      setCustomerContext(res.customer360 || null);
      setInternalNote(res.customer360?.notes || '');
      scrollToBottom('auto');

      // Clear unread count locally and recalculate tab badge
      setConversations((prev) => {
        const nextList = prev.map((c) => (c.id === conv.id ? { ...c, unread_admin_count: 0 } : c));
        const totalUnread = nextList.reduce((acc, c) => acc + (c.unread_admin_count || 0), 0);
        setTabUnreadBadge(totalUnread);
        return nextList;
      });
    } catch (err: any) {
      showToast(err.message || 'Failed to load conversation details', 'error');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // 3. Send Message as Amit
  const handleSendMessage = async (e?: React.FormEvent, customContent?: string, customType?: any) => {
    if (e) e.preventDefault();
    if (!selectedConv) return;

    const contentToSend = (customContent !== undefined ? customContent : inputText).trim();
    const typeToSend = customType || (attachmentPreview ? 'image' : 'text');
    const attachmentUrlToSend = attachmentPreview || undefined;

    if (!contentToSend && !attachmentUrlToSend) return;

    setIsSending(true);
    try {
      const res = await apiRequest('/chat/message', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: selectedConv.id,
          content: contentToSend,
          messageType: typeToSend,
          attachmentUrl: attachmentUrlToSend
        })
      });

      if (soundEnabled) playSendChime();

      setChatMessages((prev) => [...prev, res.message]);
      setInputText('');
      setAttachmentPreview(null);
      scrollToBottom('smooth');

      // WhatsApp Top-of-Stack Reordering for outgoing message:
      setConversations((prev) => {
        const existing = prev.find((c) => c.id === selectedConv.id);
        const others = prev.filter((c) => c.id !== selectedConv.id);
        if (existing) {
          const updated = {
            ...existing,
            last_message_text: contentToSend || 'Photo attachment',
            last_message_time: new Date().toISOString(),
            last_message_sender: 'admin'
          };
          return [updated, ...others];
        }
        return prev;
      });
    } catch (err: any) {
      showToast(err.message || 'Failed to send message', 'error');
    } finally {
      setIsSending(false);
    }
  };

  // 4. File Attachment Handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      showToast('Attachment exceeds 8MB limit', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachmentPreview(reader.result as string);
      setAttachmentType('image');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // 5. Canned Astrological Quick Replies
  const cannedReplies = [
    { label: '🕉️ Mahamrityunjaya Mantra', text: 'Namaste! Please chant the sacred Mahamrityunjaya Mantra: "ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम्। उर्वारुकमिव बन्धनान्मृत्योर्मुक्षीय मामृतात्॥" 108 times daily during Brahma Muhurat.' },
    { label: '📋 Request Palm Photo', text: 'Kindly upload a clear, high-resolution photo of both your left and right palms under good lighting for detailed Rekha Vichar (palmistry analysis).' },
    { label: '📅 Slot Confirmed', text: 'Namaste! Your consultation slot with Amit is officially confirmed. Amit will personally connect with you at the scheduled time.' },
    { label: '⏰ Starting in 10 Min', text: 'Our consultation session will commence in 10 minutes. Please keep your birth chart questions ready.' },
    { label: '💎 Gemstone Remedy', text: 'Based on your Janam Kundli dasha, your primary favorable ratna is recommended. Please wear it energized in Panchadhatu or Silver on an auspicious Thursday morning.' },
    { label: '⚡ Shani Sade Sati Remedy', text: 'To pacify Shani transit effects, light a mustard oil diya under a Peepal tree every Saturday evening and offer roasted black gram to birds.' },
    { label: '🙏 Birth Details Received', text: 'Namaste! I have received your complete birth details and casting your D1 Lagna and D9 Navamsha charts now.' }
  ];

  // 6. Delete Customer permanently
  const executeDeleteCustomer = async () => {
    if (!customerToDelete) return;
    setIsDeletingCustomer(true);
    try {
      await apiRequest(`/admin/customers/${customerToDelete.id}`, {
        method: 'DELETE'
      });
      showToast(`Customer "${customerToDelete.name}" permanently deleted.`, 'success');

      // Refresh list
      setConversations((prev) => prev.filter((c) => c.customer_id !== customerToDelete.id));
      if (selectedConv?.customer_id === customerToDelete.id) {
        setSelectedConv(null);
        setChatMessages([]);
        setCustomerContext(null);
        setMobileView('list');
      }

      if (onCustomerDeleted) onCustomerDeleted(customerToDelete.id);
      setCustomerToDelete(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete customer', 'error');
    } finally {
      setIsDeletingCustomer(false);
    }
  };

  // 7. Save Astrological Notes
  const handleSaveInternalNote = async () => {
    if (!selectedConv?.customer_id) return;
    setIsSavingNote(true);
    try {
      await apiRequest(`/chat/admin/crm/${selectedConv.customer_id}`, {
        method: 'POST',
        body: JSON.stringify({
          notes: internalNote,
          tags: customerContext?.tags || []
        })
      });
      showToast('Astrological notes updated', 'success');
      if (customerContext) {
        setCustomerContext({ ...customerContext, notes: internalNote });
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to save note', 'error');
    } finally {
      setIsSavingNote(false);
    }
  };

  // 8. Filter Conversations
  const filteredConversations = conversations.filter((c) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      (c.customer_name || '').toLowerCase().includes(q) ||
      (c.customer_phone || '').includes(q) ||
      (c.customer_email || '').toLowerCase().includes(q) ||
      (c.last_message_text || '').toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (filterTab === 'unread') return c.unread_admin_count > 0;
    if (filterTab === 'active') return !c.is_locked;
    if (filterTab === 'needs_reply') return c.last_message_sender === 'customer';
    return true;
  });

  // Copy Profile Data for Astrology Tools
  const handleCopyProfile = (p: any) => {
    const text = `Amit Astro Profile:\nName: ${p.full_name}\nRelation: ${p.relation}\nDOB: ${p.dob}\nTOB: ${p.tob} ${p.tob_uncertain ? '(Approx)' : ''}\nPOB: ${p.pob}\nCoordinates: ${p.pob_lat || 'N/A'}, ${p.pob_lng || 'N/A'}`;
    navigator.clipboard.writeText(text);
    setCopiedProfileId(p.id);
    showToast('Chart details copied to clipboard!', 'info');
    setTimeout(() => setCopiedProfileId(null), 2000);
  };

  return (
    <div
      className="apple-messages-container hybrid-chat-wrapper hybrid-admin-chat"
      style={{
        flex: 1,
        width: '100%',
        height: '100%',
        minHeight: 0,
        maxHeight: 'none',
        display: 'flex',
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
        borderRadius: 0,
        boxShadow: 'none',
        border: 'none',
        position: 'relative'
      }}
    >
      {/* Hidden File Input for Image/Document Attachments */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*,.pdf"
        style={{ display: 'none' }}
      />

      {/* ======================================================== */}
      {/* 1. LEFT PANE: WHATSAPP-STYLE INBOX LIST (340px)          */}
      {/* ======================================================== */}
      <div
        className={`apple-messages-sidebar ${mobileView === 'thread' ? 'mobile-hidden' : ''}`}
        style={{
          width: 340,
          borderRight: '1px solid #E5E5EA',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#FFFFFF',
          flexShrink: 0
        }}
      >
        {/* WhatsApp + Apple iOS Style Chats Header */}
        <div style={{ padding: '14px 16px 10px 16px', borderBottom: '1px solid #F0F0F2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 24, fontWeight: 700, color: '#1D1D1F', letterSpacing: '-0.025em' }}>
                Chats
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  backgroundColor: '#EBF3FE',
                  color: '#3A3A6E',
                  padding: '2px 8px',
                  borderRadius: 9999
                }}
              >
                {conversations.length}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: soundEnabled ? '#007AFF' : '#8E8E93',
                  padding: 5,
                  borderRadius: 6
                }}
                title={soundEnabled ? 'Chime sound enabled' : 'Mute sound'}
              >
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>

              <button
                type="button"
                onClick={() => fetchInbox(selectedConv?.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#3A3A6E',
                  padding: 5,
                  borderRadius: 6
                }}
                title="Refresh conversations"
              >
                <RefreshCw size={15} />
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', marginBottom: 10 }}>
            <Search size={14} color="#8E8E93" style={{ position: 'absolute', left: 10, top: 9 }} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search clients, phones, texts..."
              className="apple-input"
              style={{
                width: '100%',
                padding: '6px 10px 6px 30px',
                fontSize: 12.5,
                borderRadius: 10,
                backgroundColor: '#EDEDF0',
                borderColor: 'transparent'
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: 7,
                  background: 'none',
                  border: 'none',
                  color: '#8E8E93',
                  cursor: 'pointer',
                  fontSize: 12
                }}
              >
                ×
              </button>
            )}
          </div>

          {/* Segmented Filter Pills */}
          <div style={{ display: 'flex', gap: 4, backgroundColor: '#EDEDF0', padding: 2, borderRadius: 8 }}>
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'unread', label: 'Unread' },
                { id: 'needs_reply', label: 'Reply' },
                { id: 'active', label: 'Active' }
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterTab(tab.id)}
                style={{
                  flex: 1,
                  border: 'none',
                  borderRadius: 6,
                  padding: '4px 6px',
                  fontSize: 11,
                  fontWeight: filterTab === tab.id ? 600 : 500,
                  backgroundColor: filterTab === tab.id ? '#FFFFFF' : 'transparent',
                  color: filterTab === tab.id ? '#1D1D1F' : '#6E6E73',
                  boxShadow: filterTab === tab.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation List Scroll Area */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {isLoadingList ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#8E8E93', fontSize: 13 }}>
              Loading inquiries...
            </div>
          ) : filteredConversations.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#8E8E93', fontSize: 13 }}>
              No messages found.
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = selectedConv?.id === conv.id;
              const hasUnread = conv.unread_admin_count > 0;
              const initials = conv.customer_name ? conv.customer_name.charAt(0).toUpperCase() : 'C';

              return (
                <div
                  key={conv.id}
                  onClick={() => selectConversation(conv)}
                  className={`hybrid-chat-list-item ${isSelected ? 'selected' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 14px',
                    borderBottom: '1px solid #F0F0F2',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? '#EBF3FE' : '#FFFFFF',
                    borderLeft: isSelected ? '4px solid #3A3A6E' : '4px solid transparent',
                    transition: 'all 0.15s ease',
                    position: 'relative'
                  }}
                >
                  {/* Avatar */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    {conv.customer_photo ? (
                      <img
                        src={conv.customer_photo}
                        alt={conv.customer_name}
                        style={{
                          width: 46,
                          height: 46,
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: isSelected ? '2px solid #3A3A6E' : '1px solid #E5E5EA'
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 46,
                          height: 46,
                          borderRadius: '50%',
                          background: isSelected
                            ? 'linear-gradient(135deg, #3A3A6E, #2A2A5E)'
                            : 'linear-gradient(135deg, #E5E5EA, #D1D1D6)',
                          color: isSelected ? '#FFFFFF' : '#1D1D1F',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: 16
                        }}
                      >
                        {initials}
                      </div>
                    )}
                    {/* Unread green dot */}
                    {hasUnread && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: '#25D366',
                          border: '2px solid #FFFFFF'
                        }}
                      />
                    )}
                  </div>

                  {/* Details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <span
                        style={{
                          fontWeight: hasUnread ? 700 : 600,
                          fontSize: 14.5,
                          color: '#1D1D1F',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {conv.customer_name}
                      </span>
                      <span style={{ fontSize: 11, color: hasUnread ? '#25D366' : '#8E8E93', fontWeight: hasUnread ? 600 : 400 }}>
                        {conv.last_message_time
                          ? new Date(conv.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : ''}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span
                        style={{
                          fontSize: 12.5,
                          color: hasUnread ? '#1D1D1F' : '#6E6E73',
                          fontWeight: hasUnread ? 600 : 400,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: 200
                        }}
                      >
                        {conv.last_message_sender === 'admin' ? '✓✓ You: ' : ''}
                        {conv.last_message_text || 'No messages yet'}
                      </span>

                      {hasUnread && (
                        <span className="hybrid-unread-badge">
                          {conv.unread_admin_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. MIDDLE PANE: ACTIVE CONVERSATION THREAD               */}
      {/* ======================================================== */}
      <div
        className={`apple-messages-thread ${mobileView === 'list' ? 'mobile-hidden' : ''}`}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#F2F2F7',
          minWidth: 0,
          borderRight: showInspector ? '1px solid #E5E5EA' : 'none'
        }}
      >
        {selectedConv ? (
          <>
            {/* Apple Translucent Chat Header (60px fixed, responsive, no overflow) */}
            <div
              style={{
                height: 60,
                padding: '0 16px',
                borderBottom: '1px solid #E5E5EA',
                backgroundColor: 'rgba(255, 255, 255, 0.96)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                flexShrink: 0,
                zIndex: 10
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                {/* Mobile Back Button (only visible on mobile screens) */}
                <button
                  type="button"
                  onClick={() => setMobileView('list')}
                  className="mobile-back-btn"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#3A3A6E',
                    fontSize: 14.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '4px 6px',
                    marginRight: 4,
                    flexShrink: 0
                  }}
                >
                  ‹ Chats
                </button>

                {selectedConv.customer_photo ? (
                  <img
                    src={selectedConv.customer_photo}
                    alt={selectedConv.customer_name}
                    style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                  />
                ) : (
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #3A3A6E, #2A2A5E)',
                      color: '#FFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 15,
                      flexShrink: 0
                    }}
                  >
                    {selectedConv.customer_name.charAt(0).toUpperCase()}
                  </div>
                )}

                <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: 15,
                        color: '#111B21',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        letterSpacing: '-0.01em'
                      }}
                    >
                      {selectedConv.customer_name}
                    </span>
                    {selectedConv.trial_used ? (
                      <span style={{ fontSize: 10.5, backgroundColor: '#F2E7FE', color: '#6A1B9A', padding: '1px 7px', borderRadius: 9999, fontWeight: 600, flexShrink: 0, whiteSpace: 'nowrap' }}>
                        Trial Used
                      </span>
                    ) : selectedConv.is_new_customer ? (
                      <span style={{ fontSize: 10.5, backgroundColor: '#E8F5E9', color: '#1B873F', padding: '1px 7px', borderRadius: 9999, fontWeight: 600, flexShrink: 0, whiteSpace: 'nowrap' }}>
                        New Client
                      </span>
                    ) : null}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: '#667781',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      minWidth: 0,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedConv.customer_phone || 'No phone'}</span>
                    <span>·</span>
                    <span style={{ color: '#25D366', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#25D366' }} />
                      Connected
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                {selectedConv.customer_phone && (
                  <a
                    href={`tel:${selectedConv.customer_phone}`}
                    className="chat-header-action-btn"
                    title="Direct Phone Call"
                  >
                    <Phone size={14} color="#007AFF" />
                    <span className="header-btn-label">Call</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => setShowInspector(!showInspector)}
                  className={`chat-header-action-btn ${showInspector ? 'active' : ''}`}
                  title="Toggle Kundli & Client 360"
                >
                  <Info size={15} color={showInspector ? '#007AFF' : '#54656F'} />
                  <span className="header-btn-label">Kundli 360</span>
                </button>

                {/* Delete Customer Button */}
                <button
                  type="button"
                  onClick={() => setCustomerToDelete({ id: selectedConv.customer_id, name: selectedConv.customer_name })}
                  className="chat-header-action-btn danger"
                  title="Delete this customer completely"
                >
                  <Trash2 size={14} />
                  <span className="header-btn-label">Delete</span>
                </button>
              </div>
            </div>

            {/* Chat Messages Body */}
            <div
              className="hybrid-chat-canvas"
              style={{
                flex: 1,
                padding: '14px 16px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 10
              }}
            >
              {isLoadingMessages ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#8E8E93', fontSize: 13 }}>
                  Loading chat history...
                </div>
              ) : chatMessages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#8E8E93', fontSize: 13.5 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: '#EBF3FE', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <MessageSquare size={22} color="#3A3A6E" />
                  </div>
                  <div style={{ fontWeight: 600, color: '#1D1D1F', marginBottom: 4 }}>
                    Start Consultation with {selectedConv.customer_name}
                  </div>
                  <p style={{ maxWidth: 360, margin: '0 auto', fontSize: 12.5, color: '#6E6E73' }}>
                    All messages sent here represent Astrologer Amit. You can send remedies, request palm photos, or confirm appointment slots.
                  </p>
                </div>
              ) : (
                chatMessages.map((m, idx) => {
                  const isMe = m.sender_type === 'admin';
                  const showDateDivider =
                    idx === 0 ||
                    new Date(m.created_at).toDateString() !==
                      new Date(chatMessages[idx - 1].created_at).toDateString();

                  const timeStr = new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <React.Fragment key={m.id}>
                      {showDateDivider && (
                        <div className="hybrid-date-pill">
                          {new Date(m.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      )}

                      <div
                        style={{
                          alignSelf: isMe ? 'flex-end' : 'flex-start',
                          maxWidth: '82%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isMe ? 'flex-end' : 'flex-start'
                        }}
                      >
                        {/* Speech Bubble */}
                        <div
                          className={`hybrid-bubble ${isMe ? 'hybrid-bubble-out' : 'hybrid-bubble-in'}`}
                        >
                          {/* Attachment Image Preview if present */}
                          {m.attachment_url && (
                            <div style={{ marginBottom: 6 }}>
                              <img
                                src={m.attachment_url}
                                alt="Attachment"
                                onClick={() => setZoomedImage(m.attachment_url!)}
                                style={{
                                  maxWidth: '100%',
                                  maxHeight: 240,
                                  borderRadius: 12,
                                  cursor: 'pointer',
                                  display: 'block'
                                }}
                              />
                            </div>
                          )}

                          <div style={{ fontSize: 'var(--chat-font-bubble)', color: '#111B21', lineHeight: 1.45 }}>
                            {m.content}
                          </div>

                          <div className="hybrid-bubble-time">
                            {timeStr}
                            {isMe && <span className="hybrid-read-ticks">✓✓</span>}
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Canned Astrological Replies Shelf */}
            {showRemedyShelf && (
              <div
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#FFFFFF',
                  borderTop: '1px solid #E5E5EA',
                  display: 'flex',
                  gap: 6,
                  overflowX: 'auto',
                  whiteSpace: 'nowrap'
                }}
              >
                {cannedReplies.map((r, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSendMessage(undefined, r.text, 'astrological_remedy')}
                    style={{
                      backgroundColor: '#F5F5F7',
                      border: '1px solid #E5E5EA',
                      borderRadius: 9999,
                      padding: '5px 12px',
                      fontSize: 11.5,
                      fontWeight: 500,
                      color: '#1D1D1F',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#E5E5EA')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#F5F5F7')}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            )}

            {/* Attachment Preview Banner if staging an image */}
            {attachmentPreview && (
              <div
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#F5F5F7',
                  borderTop: '1px solid #E5E5EA',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <img
                    src={attachmentPreview}
                    alt="Staged"
                    style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }}
                  />
                  <span style={{ fontSize: 12.5, color: '#1D1D1F', fontWeight: 500 }}>
                    Image attachment staged
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachmentPreview(null)}
                  style={{ background: 'none', border: 'none', color: '#D64545', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Apple + WhatsApp Hybrid Input Bar */}
            <form
              onSubmit={(e) => handleSendMessage(e)}
              className="hybrid-chat-composer"
              style={{
                flexDirection: 'column',
                gap: 6
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                {/* Paperclip Attachment Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="hybrid-action-icon-btn"
                  title="Attach Kundli chart, palm photo, or document"
                >
                  <Paperclip size={20} />
                </button>

                {/* Capsule Text Input */}
                <div className="hybrid-input-capsule">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Message as Amit..."
                    className="hybrid-input-field"
                  />
                </div>

                {/* Circular Send Button */}
                <button
                  type="submit"
                  disabled={isSending || (!inputText.trim() && !attachmentPreview)}
                  className="hybrid-send-btn"
                  style={{
                    backgroundColor: (inputText.trim() || attachmentPreview) && !isSending ? '#25D366' : '#C7C7CC',
                    cursor: (inputText.trim() || attachmentPreview) && !isSending ? 'pointer' : 'default',
                    opacity: (inputText.trim() || attachmentPreview) && !isSending ? 1 : 0.6
                  }}
                  title="Send message"
                >
                  <ArrowUp size={19} strokeWidth={2.4} />
                </button>
              </div>

              {/* Subtext info */}
              <div style={{ fontSize: 11, color: '#8E8E93', textAlign: 'center', letterSpacing: '-0.01em' }}>
                Consultation Desk · Messages sent here appear live to customer
              </div>
            </form>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8E8E93', fontSize: 14 }}>
            Select an inquiry from the left to start chatting
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 3. RIGHT PANE: CUSTOMER 360 & KUNDLI GLANCE (350px)     */}
      {/* ======================================================== */}
      {showInspector && selectedConv && (
        <div
          className="apple-messages-inspector"
          style={{
            width: 350,
            backgroundColor: '#FBFBFD',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            borderLeft: '1px solid #E5E5EA',
            height: '100%',
            overflow: 'hidden'
          }}
        >
          {/* Top Header Bar matching Chat Header height (60px) */}
          <div
            style={{
              height: 60,
              padding: '0 16px',
              borderBottom: '1px solid #E5E5EA',
              backgroundColor: 'rgba(255, 255, 255, 0.96)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#EBF3FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Info size={15} color="#3A3A6E" />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1D1D1F', letterSpacing: '-0.01em' }}>
                Kundli & Client 360
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowInspector(false)}
              style={{
                background: '#F0F2F5',
                border: 'none',
                color: '#54656F',
                cursor: 'pointer',
                width: 28,
                height: 28,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.15s ease'
              }}
              title="Close drawer"
            >
              <X size={15} />
            </button>
          </div>

          {/* Scrollable Body */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 16
            }}
          >

          {/* Customer Identity Card */}
          <div style={{ backgroundColor: '#FFFFFF', padding: 14, borderRadius: 14, border: '1px solid #E5E5EA' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              {selectedConv.customer_photo ? (
                <img
                  src={selectedConv.customer_photo}
                  alt={selectedConv.customer_name}
                  style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: '#3A3A6E', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                  {selectedConv.customer_name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div style={{ fontWeight: 700, fontSize: 14.5, color: '#1D1D1F' }}>
                  {selectedConv.customer_name}
                </div>
                <div style={{ fontSize: 12, color: '#6E6E73' }}>
                  {selectedConv.customer_phone}
                </div>
              </div>
            </div>

            <div style={{ fontSize: 12, color: '#6E6E73', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {selectedConv.customer_email && (
                <div>Email: <strong style={{ color: '#1D1D1F' }}>{selectedConv.customer_email}</strong></div>
              )}
              <div>
                Consultation Status:{' '}
                {selectedConv.trial_used ? (
                  <span style={{ color: '#6A1B9A', fontWeight: 600 }}>Trial Used</span>
                ) : (
                  <span style={{ color: '#2FA84F', fontWeight: 600 }}>Active Trial</span>
                )}
              </div>
            </div>
          </div>

          {/* Vedic Birth Profiles Shelf */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#3A3A6E', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Birth Profiles ({customerContext?.birthProfiles?.length || 0})
              </span>
            </div>

            {(!customerContext?.birthProfiles || customerContext.birthProfiles.length === 0) ? (
              <div style={{ fontSize: 12, color: '#8E8E93', padding: 12, backgroundColor: '#FFFFFF', borderRadius: 10, border: '1px solid #E5E5EA', textAlign: 'center' }}>
                No birth chart added yet by client.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {customerContext.birthProfiles.map((p: any) => {
                  const isExpanded = !!expandedProfiles[p.id];
                  return (
                    <div
                      key={p.id}
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E5E5EA',
                        borderRadius: 12,
                        padding: '10px 12px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#3A3A6E', backgroundColor: '#F0F0FF', padding: '1px 6px', borderRadius: 4 }}>
                          {p.relation} · {p.full_name}
                        </span>

                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            type="button"
                            onClick={() => handleCopyProfile(p)}
                            style={{ background: 'none', border: 'none', color: '#007AFF', cursor: 'pointer', padding: 2 }}
                            title="Copy Chart Details"
                          >
                            {copiedProfileId === p.id ? <Check size={12} color="#2FA84F" /> : <Copy size={12} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => setExpandedProfiles((prev) => ({ ...prev, [p.id]: !prev[p.id] }))}
                            style={{ background: 'none', border: 'none', color: '#8E8E93', cursor: 'pointer', padding: 2 }}
                          >
                            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          </button>
                        </div>
                      </div>

                      <div style={{ fontSize: 12, color: '#1D1D1F' }}>
                        📅 {p.dob} · ⏰ {p.tob} {p.tob_uncertain ? '(Approx)' : ''}
                      </div>
                      <div style={{ fontSize: 11.5, color: '#6E6E73' }}>
                        📍 {p.pob}
                      </div>

                      {isExpanded && (
                        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #F0F0F2', fontSize: 11, color: '#6E6E73' }}>
                          <div>Timezone: {p.pob_timezone || 'Asia/Kolkata'}</div>
                          {p.pob_lat && <div>Lat/Lng: {p.pob_lat}, {p.pob_lng}</div>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Internal Astrological Sticky Notes (Admin Eyes Only) */}
          <div style={{ backgroundColor: '#FFFFFF', padding: 14, borderRadius: 14, border: '1px solid #E5E5EA' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#D98E04', textTransform: 'uppercase' }}>
                Astrological Notes
              </span>
              <span style={{ fontSize: 10, color: '#8E8E93' }}>Private to Admins</span>
            </div>
            <textarea
              rows={3}
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              placeholder="e.g. Rahu Mahadasha running. Advised Shiva Puja..."
              className="apple-input"
              style={{ width: '100%', fontSize: 12, padding: 8, borderRadius: 8, marginBottom: 8 }}
            />
            <button
              type="button"
              onClick={handleSaveInternalNote}
              disabled={isSavingNote}
              className="apple-btn-secondary"
              style={{ width: '100%', padding: '6px', fontSize: 11.5, fontWeight: 600 }}
            >
              {isSavingNote ? 'Saving...' : 'Save Private Note'}
            </button>
          </div>

          {/* Danger Zone: Delete Customer Action */}
          <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid #E5E5EA' }}>
            <button
              type="button"
              onClick={() => setCustomerToDelete({ id: selectedConv.customer_id, name: selectedConv.customer_name })}
              className="apple-btn-secondary"
              style={{
                width: '100%',
                padding: '8px 12px',
                color: '#D64545',
                borderColor: '#F5C6CB',
                backgroundColor: '#FFF5F5',
                fontSize: 12,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}
            >
              <Trash2 size={13} />
              Delete Customer Account
            </button>
          </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. MODALS: LIGHTBOX & DELETE CONFIRMATION                */}
      {/* ======================================================== */}

      {/* Lightbox Modal for Attached Kundli/Palms */}
      {zoomedImage && (
        <div
          onClick={() => setZoomedImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24
          }}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <button
              onClick={() => setZoomedImage(null)}
              style={{
                position: 'absolute',
                top: -36,
                right: 0,
                background: 'none',
                border: 'none',
                color: '#FFFFFF',
                fontSize: 24,
                cursor: 'pointer'
              }}
            >
              ×
            </button>
            <img
              src={zoomedImage}
              alt="Zoomed"
              style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: 12, objectFit: 'contain' }}
            />
          </div>
        </div>
      )}

      {/* Permanent Customer Deletion Modal */}
      {customerToDelete && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20
          }}
        >
          <div
            className="apple-card"
            style={{
              width: '100%',
              maxWidth: 420,
              padding: 24,
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              boxShadow: '0 20px 48px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  backgroundColor: '#FFF0F0',
                  color: '#D64545',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: '#1D1D1F', margin: 0 }}>
                  Delete Customer?
                </h3>
                <span style={{ fontSize: 12.5, color: '#86868B' }}>
                  Irreversible Action
                </span>
              </div>
            </div>

            <p style={{ fontSize: 13.5, color: '#424245', lineHeight: 1.5, marginBottom: 20 }}>
              Are you sure you want to permanently delete <strong>{customerToDelete.name}</strong>?
              All consultations, Kundli charts, payment records, and chat messages will be wiped from the database.
            </p>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setCustomerToDelete(null)}
                disabled={isDeletingCustomer}
                className="apple-btn-secondary"
                style={{ padding: '9px 16px', fontSize: 13 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDeleteCustomer}
                disabled={isDeletingCustomer}
                style={{
                  backgroundColor: '#D64545',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 10,
                  padding: '9px 18px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: isDeletingCustomer ? 'default' : 'pointer',
                  opacity: isDeletingCustomer ? 0.6 : 1
                }}
              >
                {isDeletingCustomer ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Responsive Styles for Apple Messages Split View */}
      <style>{`
        @media (max-width: 900px) {
          .btn-label-desktop {
            display: none;
          }
          .apple-messages-inspector {
            display: none !important;
          }
        }
        @media (max-width: 768px) {
          .apple-messages-container {
            height: calc(100vh - 120px) !important;
          }
          .mobile-hidden {
            display: none !important;
          }
          .mobile-back-btn {
            display: inline-block !important;
          }
          .apple-messages-sidebar {
            width: 100% !important;
          }
          .apple-messages-thread {
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
};
