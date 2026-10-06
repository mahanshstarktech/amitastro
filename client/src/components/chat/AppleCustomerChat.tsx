import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Image as ImageIcon,
  Paperclip,
  Mic,
  X,
  ArrowUp,
  Sparkles,
  Phone,
  Video,
  Volume2,
  VolumeX,
  CheckCheck,
  Calendar,
  Clock,
  Download,
  AlertCircle,
  Play,
  Pause,
  ShieldCheck
} from 'lucide-react';
import { apiRequest } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

export interface CustomerChatMessage {
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

interface AppleCustomerChatProps {
  onOpenBooking: () => void;
}

// Authentic Apple-style message send chime via Web Audio API
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

export const AppleCustomerChat: React.FC<AppleCustomerChatProps> = ({ onOpenBooking }) => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<CustomerChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Attachments
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [attachmentType, setAttachmentType] = useState<'image' | 'file'>('image');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lightbox Zoom Modal
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Simulated Voice Note state
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceRecordingSeconds, setVoiceRecordingSeconds] = useState(0);
  const voiceTimerRef = useRef<any>(null);

  // Audio Playback simulation
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior });
    }, 80);
  };

  // 1. Fetch or initialize conversation
  const fetchChat = async (isBackgroundPoll: boolean = false) => {
    try {
      if (!isBackgroundPoll) setIsLoading(true);
      const res = await apiRequest<{ conversation: any; messages: CustomerChatMessage[] }>('/chat/conversation');
      if (res.conversation) {
        setConversation(res.conversation);
      }
      if (res.messages) {
        setMessages((prev) => {
          if (prev.length !== res.messages.length) {
            scrollToBottom('smooth');
          }
          return res.messages;
        });
      }
    } catch (err: any) {
      if (!isBackgroundPoll) {
        showToast(err.message || 'Failed to load conversation', 'error');
      }
    } finally {
      if (!isBackgroundPoll) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChat(false);
    // Real-time polling every 6 seconds for new replies from Amit
    const interval = setInterval(() => {
      fetchChat(true);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // 2. Handle Image Attachment Pick
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      showToast('Image size should be less than 8MB', 'error');
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

  // 3. Handle Voice Recording Simulation
  const handleStartVoiceRecord = () => {
    setIsRecordingVoice(true);
    setVoiceRecordingSeconds(0);
    voiceTimerRef.current = setInterval(() => {
      setVoiceRecordingSeconds((sec) => sec + 1);
    }, 1000);
  };

  const handleCancelVoiceRecord = () => {
    setIsRecordingVoice(false);
    if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
    setVoiceRecordingSeconds(0);
  };

  const handleSendVoiceNote = async () => {
    if (!conversation) return;
    const recordedSec = voiceRecordingSeconds;
    handleCancelVoiceRecord();

    try {
      if (soundEnabled) playAppleSendChime();
      const res = await apiRequest<{ message: CustomerChatMessage }>('/chat/message', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: conversation.id,
          content: `Voice query (${recordedSec > 0 ? recordedSec : 5}s)`,
          messageType: 'voice'
        })
      });
      if (res.message) {
        setMessages((prev) => [...prev, res.message]);
        scrollToBottom('smooth');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to send voice note', 'error');
    }
  };

  // 4. Send Message (Text or Attachment)
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && !attachmentPreview) || !conversation || isSending) return;

    const textToSend = inputText.trim();
    const imageToSend = attachmentPreview;
    const msgType = imageToSend ? 'image' : 'text';

    setInputText('');
    setAttachmentPreview(null);
    setIsSending(true);

    if (soundEnabled) playAppleSendChime();

    try {
      const res = await apiRequest<{ message: CustomerChatMessage }>('/chat/message', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: conversation.id,
          content: textToSend || (imageToSend ? 'Sent an attachment' : ''),
          messageType: msgType,
          attachmentUrl: imageToSend || undefined
        })
      });

      if (res.message) {
        setMessages((prev) => [...prev, res.message]);
        scrollToBottom('smooth');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to send message', 'error');
    } finally {
      setIsSending(false);
    }
  };

  // 5. Vedic Quick Prompts
  const quickPrompts = [
    '🙏 Namaste Amit ji, I need career guidance.',
    '💍 Kundli Milan / Marriage compatibility query.',
    '🖐️ Sharing photo of my palms for Rekha reading.',
    '💎 Which gemstone is auspicious for my current Dasha?',
    '⚡ Guidance regarding Sade Sati and planetary transits.'
  ];

  const handleSelectPrompt = (prompt: string) => {
    setInputText(prompt);
  };

  const isTrialActive = Boolean(user?.isNewCustomer && !user?.trialUsed);

  return (
    <div
      className="apple-card"
      style={{
        height: 'calc(100vh - 180px)',
        minHeight: 560,
        maxHeight: 780,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 22,
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
        border: '1px solid #E5E5EA',
        position: 'relative'
      }}
    >
      {/* ======================================================== */}
      {/* 1. TOP HEADER: APPLE MESSAGES CONTACT PROFILE            */}
      {/* ======================================================== */}
      <div
        style={{
          padding: '12px 20px',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderBottom: '1px solid #E5E5EA',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 20
        }}
      >
        {/* Left Contact Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #FAF8F5, #EDE6D8)',
                border: '1.5px solid #D6B97A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 5,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
              }}
            >
              <img
                src="/icons/logo-mark.png"
                alt="Amit"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            {/* Green Presence Dot */}
            <span
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: '#34C759',
                border: '2px solid #FFFFFF',
                boxShadow: '0 0 4px rgba(52, 199, 89, 0.6)'
              }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 16, color: '#1D1D1F', letterSpacing: '-0.02em' }}>
                Amit (Astrologer)
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  backgroundColor: '#FCF8ED',
                  border: '1px solid #E6D2A7',
                  color: '#9E741F',
                  fontSize: 10.5,
                  fontWeight: 600,
                  padding: '1px 6px',
                  borderRadius: 9999
                }}
              >
                <ShieldCheck size={11} /> Verified
              </span>
            </div>
            <div style={{ fontSize: 12, color: '#6E6E73', display: 'flex', alignItems: 'center', gap: 6, marginTop: 1 }}>
              <span style={{ color: '#34C759', fontWeight: 600 }}>Active Desk</span>
              <span>·</span>
              <span>End-to-End Private Vedic Guidance</span>
            </div>
          </div>
        </div>

        {/* Right Action Icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: soundEnabled ? '#007AFF' : '#8E8E93',
              padding: 6,
              borderRadius: 8
            }}
            title={soundEnabled ? 'Chime sound enabled' : 'Mute send chime'}
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>

          <button
            type="button"
            onClick={onOpenBooking}
            className="apple-btn-secondary"
            style={{
              padding: '6px 12px',
              fontSize: 12.5,
              fontWeight: 600,
              color: '#3A3A6E',
              borderColor: '#D2D2D7',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Calendar size={13} />
            <span className="btn-label-desktop">Book Video/Voice Call</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. TRIAL OR CONSULTATION STATUS BANNER                   */}
      {/* ======================================================== */}
      {isTrialActive && (
        <div
          style={{
            backgroundColor: '#F3FAF3',
            borderBottom: '1px solid #D8EED8',
            padding: '7px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 12.5,
            color: '#1E682E'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={14} color="#34C759" />
            <span>
              <strong>Free 5-Min Introductory Vedic Chat Active!</strong> Send your birth query or palm chart directly to Amit ji.
            </span>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. MESSAGE BODY: APPLE iMESSAGE THREAD                   */}
      {/* ======================================================== */}
      <div
        style={{
          flex: 1,
          padding: '20px 20px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          backgroundColor: '#FAF9F6' // Apple subtle warm off-white canvas
        }}
      >
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#8E8E93' }}>
            <div className="spinner" style={{ margin: '0 auto 12px auto' }} />
            <div style={{ fontSize: 13 }}>Opening encrypted channel with Amit...</div>
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: '#8E8E93' }}>
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: '50%',
                backgroundColor: '#FFFFFF',
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12
              }}
            >
              <Sparkles size={24} color="#C9A24B" />
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#1D1D1F', marginBottom: 4 }}>
              Consult Amit Directly
            </div>
            <div style={{ fontSize: 13, maxWidth: 360, margin: '0 auto', lineHeight: 1.5 }}>
              Ask questions regarding your career, relationship compatibility, health, or gemstone remedies.
            </div>
          </div>
        ) : (
          messages.map((m, idx) => {
            const isMe = m.sender_type === 'customer';
            const showTimestamp =
              idx === 0 ||
              new Date(m.created_at).getTime() - new Date(messages[idx - 1].created_at).getTime() > 10 * 60 * 1000;

            return (
              <React.Fragment key={m.id || idx}>
                {showTimestamp && (
                  <div
                    style={{
                      textAlign: 'center',
                      fontSize: 11,
                      color: '#8E8E93',
                      margin: '8px 0',
                      fontWeight: 500
                    }}
                  >
                    {new Date(m.created_at).toLocaleDateString([], {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}{' '}
                    · {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                  {/* Sender label for incoming */}
                  {!isMe && (
                    <div
                      style={{
                        fontSize: 11,
                        color: '#6E6E73',
                        fontWeight: 600,
                        marginLeft: 12,
                        marginBottom: 3
                      }}
                    >
                      Amit Soni
                    </div>
                  )}

                  {/* Message Type 1: Astrological Remedy Card */}
                  {m.message_type === 'astrological_remedy' ? (
                    <div
                      style={{
                        backgroundColor: '#FFFBF2',
                        border: '1.5px solid #E8D3A7',
                        borderRadius: 18,
                        padding: '16px 18px',
                        maxWidth: 420,
                        boxShadow: '0 4px 16px rgba(201, 162, 75, 0.12)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 18 }}>🕉️</span>
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#875C0C' }}>
                            Prescribed Vedic Remedy
                          </div>
                          <div style={{ fontSize: 11, color: '#A07829' }}>Astrologer Recommendation</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 13.5, color: '#2C200C', lineHeight: 1.55 }}>
                        {m.content}
                      </div>
                    </div>
                  ) : m.message_type === 'image' || m.attachment_url ? (
                    /* Message Type 2: Image Attachment with Lightbox Zoom */
                    <div
                      style={{
                        backgroundColor: isMe ? '#007AFF' : '#E9E9EB',
                        borderRadius: 18,
                        borderBottomRightRadius: isMe ? 4 : 18,
                        borderBottomLeftRadius: isMe ? 18 : 4,
                        padding: 6,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                      }}
                    >
                      {m.attachment_url && (
                        <div
                          onClick={() => setZoomedImage(m.attachment_url || null)}
                          style={{
                            cursor: 'pointer',
                            borderRadius: 14,
                            overflow: 'hidden',
                            position: 'relative'
                          }}
                        >
                          <img
                            src={m.attachment_url}
                            alt="Attachment"
                            style={{
                              maxWidth: 320,
                              maxHeight: 280,
                              width: '100%',
                              objectFit: 'cover',
                              display: 'block'
                            }}
                          />
                          <div
                            style={{
                              position: 'absolute',
                              bottom: 8,
                              right: 8,
                              backgroundColor: 'rgba(0, 0, 0, 0.6)',
                              borderRadius: 6,
                              padding: '2px 6px',
                              color: '#FFF',
                              fontSize: 10,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 3
                            }}
                          >
                            <ImageIcon size={10} /> Click to zoom
                          </div>
                        </div>
                      )}
                      {m.content && m.content !== 'Sent an attachment' && (
                        <div
                          style={{
                            padding: '8px 10px 4px 10px',
                            fontSize: 14,
                            color: isMe ? '#FFFFFF' : '#000000',
                            lineHeight: 1.45
                          }}
                        >
                          {m.content}
                        </div>
                      )}
                    </div>
                  ) : m.message_type === 'voice' ? (
                    /* Message Type 3: Voice Note Message */
                    <div
                      style={{
                        backgroundColor: isMe ? '#007AFF' : '#E9E9EB',
                        color: isMe ? '#FFFFFF' : '#000000',
                        borderRadius: 18,
                        borderBottomRightRadius: isMe ? 4 : 18,
                        borderBottomLeftRadius: isMe ? 18 : 4,
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        minWidth: 190
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setPlayingVoiceId(playingVoiceId === m.id ? null : m.id)}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          backgroundColor: isMe ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.08)',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isMe ? '#FFFFFF' : '#007AFF'
                        }}
                      >
                        {playingVoiceId === m.id ? <Pause size={14} /> : <Play size={14} style={{ marginLeft: 2 }} />}
                      </button>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>
                          {playingVoiceId === m.id ? 'Playing audio...' : m.content || 'Voice Query'}
                        </div>
                        <div style={{ fontSize: 10, opacity: 0.8 }}>0:15 · Audio recording</div>
                      </div>
                    </div>
                  ) : (
                    /* Message Type 4: Standard iMessage Bubble */
                    <div
                      style={{
                        backgroundColor: isMe ? '#007AFF' : '#E9E9EB',
                        backgroundImage: isMe ? 'linear-gradient(180deg, #007AFF 0%, #0062D2 100%)' : 'none',
                        color: isMe ? '#FFFFFF' : '#000000',
                        borderRadius: 18,
                        borderBottomRightRadius: isMe ? 4 : 18,
                        borderBottomLeftRadius: isMe ? 18 : 4,
                        padding: '10px 16px',
                        fontSize: 14.5,
                        lineHeight: 1.45,
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                        wordBreak: 'break-word'
                      }}
                    >
                      {m.content}
                    </div>
                  )}

                  {/* Status & Timestamp */}
                  <div
                    style={{
                      fontSize: 10.5,
                      color: '#8E8E93',
                      marginTop: 3,
                      marginRight: isMe ? 4 : 0,
                      marginLeft: isMe ? 0 : 4,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {isMe && <span style={{ color: '#007AFF' }}>Delivered</span>}
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ======================================================== */}
      {/* 4. ATTACHMENT PREVIEW TRAY                               */}
      {/* ======================================================== */}
      {attachmentPreview && (
        <div
          style={{
            backgroundColor: '#F5F5F7',
            borderTop: '1px solid #E5E5EA',
            padding: '10px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img
              src={attachmentPreview}
              alt="Preview"
              style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }}
            />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1D1D1F' }}>Attached Chart / Photo</div>
              <div style={{ fontSize: 11, color: '#8E8E93' }}>Will be sent to Amit Soni</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAttachmentPreview(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#8E8E93',
              cursor: 'pointer',
              padding: 4
            }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. VEDIC QUICK INQUIRY CHIPS                             */}
      {/* ======================================================== */}
      <div
        style={{
          padding: '6px 14px',
          backgroundColor: '#FFFFFF',
          borderTop: '1px solid #F0F0F2',
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          whiteSpace: 'nowrap'
        }}
      >
        {quickPrompts.map((p, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleSelectPrompt(p)}
            style={{
              border: '1px solid #E5E5EA',
              backgroundColor: '#F7F7F9',
              borderRadius: 14,
              padding: '4px 10px',
              fontSize: 11.5,
              color: '#3A3A3C',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
              flexShrink: 0
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* ======================================================== */}
      {/* 6. APPLE iMESSAGE COMPOSER BAR                           */}
      {/* ======================================================== */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderTop: '1px solid #E5E5EA',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}
      >
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        {/* Attach Photo Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          style={{
            background: 'none',
            border: 'none',
            color: '#8E8E93',
            cursor: 'pointer',
            padding: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            transition: 'color 0.15s ease'
          }}
          title="Attach Kundli / Palm photo"
        >
          <ImageIcon size={20} />
        </button>

        {/* Input Pill or Voice Recording Active */}
        {isRecordingVoice ? (
          <div
            style={{
              flex: 1,
              backgroundColor: '#FFEAEA',
              borderRadius: 20,
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: '#FF3B30',
                  animation: 'pulse 1s infinite'
                }}
              />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#FF3B30' }}>
                Recording Query: 00:{voiceRecordingSeconds.toString().padStart(2, '0')}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={handleCancelVoiceRecord}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#8E8E93',
                  cursor: 'pointer',
                  fontSize: 12
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendVoiceNote}
                style={{
                  backgroundColor: '#007AFF',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: 14,
                  padding: '3px 10px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Send Voice
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSendMessage}
            style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#F2F2F7',
                borderRadius: 20,
                padding: '4px 14px',
                border: '1px solid #E5E5EA'
              }}
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="iMessage · Message Amit..."
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  fontSize: 14,
                  color: '#1D1D1F',
                  padding: '6px 0'
                }}
              />
              {/* Mic shortcut */}
              <button
                type="button"
                onClick={handleStartVoiceRecord}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#8E8E93',
                  cursor: 'pointer',
                  padding: 4
                }}
                title="Record voice note"
              >
                <Mic size={17} />
              </button>
            </div>

            {/* Apple Blue Circular Send Button */}
            <button
              type="submit"
              disabled={(!inputText.trim() && !attachmentPreview) || isSending}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                backgroundColor: (inputText.trim() || attachmentPreview) && !isSending ? '#007AFF' : '#C7C7CC',
                border: 'none',
                color: '#FFFFFF',
                cursor: (inputText.trim() || attachmentPreview) && !isSending ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.15s ease'
              }}
              title="Send"
            >
              <ArrowUp size={16} strokeWidth={2.6} />
            </button>
          </form>
        )}
      </div>

      {/* ======================================================== */}
      {/* 7. APPLE LIGHTBOX MODAL FOR ZOOMING IMAGES               */}
      {/* ======================================================== */}
      {zoomedImage && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20
          }}
          onClick={() => setZoomedImage(null)}
        >
          <div
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              display: 'flex',
              gap: 12
            }}
          >
            <a
              href={zoomedImage}
              download="kundli-chart.jpg"
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: '#FFF',
                padding: '8px 14px',
                borderRadius: 20,
                fontSize: 13,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Download size={14} /> Download
            </a>
            <button
              onClick={() => setZoomedImage(null)}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: '#FFF',
                border: 'none',
                width: 36,
                height: 36,
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={20} />
            </button>
          </div>

          <img
            src={zoomedImage}
            alt="Zoomed Kundli / Chart"
            style={{
              maxWidth: '90vw',
              maxHeight: '85vh',
              borderRadius: 14,
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
              objectFit: 'contain'
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};
