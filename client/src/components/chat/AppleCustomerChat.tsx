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
  ShieldCheck,
  ChevronDown,
  Trash2
} from 'lucide-react';
import { WhatsAppVoicePlayer } from './WhatsAppVoicePlayer';
import { apiRequest } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import {
  getSocket,
  authenticateSocket,
  playReceiveChime,
  playSendChime,
  notifyNewMessage,
  requestNotificationPermission
} from '../../utils/socket';

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
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('chat_sound_enabled') !== 'false';
    }
    return true;
  });

  // Attachments
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [attachmentType, setAttachmentType] = useState<'image' | 'file'>('image');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lightbox Zoom Modal
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Real WhatsApp Voice Recording & Playback State
  const [voiceRecordState, setVoiceRecordState] = useState<'idle' | 'recording' | 'paused'>('idle');
  const [voiceRecordingSeconds, setVoiceRecordingSeconds] = useState(0);
  const [audioLevels, setAudioLevels] = useState<number[]>([4, 6, 8, 12, 16, 10, 6, 8, 14, 18, 12, 8, 6, 10, 14, 8, 4, 6, 10, 14, 8]);
  const voiceTimerRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Paused Preview state
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [previewCurrentTime, setPreviewCurrentTime] = useState(0);
  const [previewDuration, setPreviewDuration] = useState(0);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Audio Playback in Chat Thread
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatCanvasRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    setTimeout(() => {
      if (chatCanvasRef.current) {
        chatCanvasRef.current.scrollTo({
          top: chatCanvasRef.current.scrollHeight,
          behavior
        });
      }
    }, 60);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, []);

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

  // Real-time WhatsApp-level Socket Integration for Customer
  useEffect(() => {
    requestNotificationPermission();
    if (user?.id) {
      authenticateSocket(user.id, 'customer');
    }
    fetchChat(false);

    const socket = getSocket();

    const handleReceive = (msg: CustomerChatMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      scrollToBottom('smooth');

      if (msg.sender_type === 'admin') {
        if (soundEnabled) playReceiveChime();
        notifyNewMessage(
          '💬 Astrologer Amit',
          msg.content || 'Photo attachment sent'
        );
      }
    };

    const handleCustomerNew = (data: { conversationId: string; message: CustomerChatMessage }) => {
      if (data?.message) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
        scrollToBottom('smooth');

        if (data.message.sender_type === 'admin') {
          if (soundEnabled) playReceiveChime();
          notifyNewMessage(
            '💬 Astrologer Amit',
            data.message.content || 'Photo attachment sent'
          );
        }
      }
    };

    socket.on('receive_message', handleReceive);
    socket.on('customer_new_message', handleCustomerNew);

    // Keep gentle fallback poll every 20 seconds
    const interval = setInterval(() => {
      fetchChat(true);
    }, 20000);

    return () => {
      socket.off('receive_message', handleReceive);
      socket.off('customer_new_message', handleCustomerNew);
      clearInterval(interval);
    };
  }, [user?.id, soundEnabled]);

  // Join active conversation room for zero latency
  useEffect(() => {
    if (conversation?.id) {
      const socket = getSocket();
      socket.emit('join_conversation', conversation.id);
      return () => {
        socket.emit('leave_conversation', conversation.id);
      };
    }
  }, [conversation?.id]);

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

  // Helper to format mm:ss
  const formatVoiceTime = (sec: number) => {
    const s = Math.max(0, Math.floor(sec));
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${rem.toString().padStart(2, '0')}`;
  };

  // Helper to parse duration from message content like "Voice query (3s)" or "Voice note (0:15)"
  const parseVoiceDuration = (content?: string): number => {
    if (!content) return 4;
    const matchSec = content.match(/\((\d+)s\)/);
    if (matchSec) return parseInt(matchSec[1], 10);
    const matchMinSec = content.match(/\((\d+):(\d+)\)/);
    if (matchMinSec) return parseInt(matchMinSec[1], 10) * 60 + parseInt(matchMinSec[2], 10);
    return 4;
  };

  // Clean up microphone stream, audio context, and animation loops
  const cleanupMedia = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (voiceTimerRef.current) {
      if (typeof voiceTimerRef.current === 'object' && voiceTimerRef.current.timer) {
        clearInterval(voiceTimerRef.current.timer);
        clearInterval(voiceTimerRef.current.sim);
      } else {
        clearInterval(voiceTimerRef.current);
      }
      voiceTimerRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (_) {}
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
      setRecordedAudioUrl(null);
    }
    setIsPreviewPlaying(false);
    setPreviewCurrentTime(0);
    setPreviewDuration(0);
  };

  // 3. Real WhatsApp Voice Recording
  const handleStartVoiceRecord = async () => {
    cleanupMedia();
    audioChunksRef.current = [];
    setVoiceRecordingSeconds(0);
    setVoiceRecordState('recording');

    // Initial base levels
    const initialLevels = [4, 6, 10, 16, 22, 14, 8, 12, 20, 26, 18, 12, 16, 24, 20, 14, 10, 8, 12, 18, 14, 8];
    setAudioLevels(initialLevels);

    // Live recording timer
    const timer = setInterval(() => {
      setVoiceRecordingSeconds((sec) => sec + 1);
    }, 1000);
    voiceTimerRef.current = timer;

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        const mimeType = MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : '';
        const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        recorder.start(100);

        // Web Audio Analyser for dancing waveform bars
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          audioContextRef.current = ctx;
          const source = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);
          analyserRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateWaveform = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);
            const barsCount = 22;
            const step = Math.max(1, Math.floor(dataArray.length / barsCount));
            const newLevels: number[] = [];
            for (let i = 0; i < barsCount; i++) {
              const val = dataArray[i * step] || 0;
              const barH = Math.max(4, Math.min(24, Math.round((val / 255) * 24)));
              newLevels.push(barH);
            }
            setAudioLevels(newLevels);
            animFrameRef.current = requestAnimationFrame(updateWaveform);
          };
          animFrameRef.current = requestAnimationFrame(updateWaveform);
        }
      }
    } catch (err) {
      console.warn('Microphone permission blocked or unavailable, using fallback audio synth:', err);
      const simInterval = setInterval(() => {
        setAudioLevels((prev) =>
          prev.map(() => 4 + Math.floor(Math.random() * 20))
        );
      }, 100);
      voiceTimerRef.current = { timer, sim: simInterval };
    }
  };

  // Pause recording -> Switch to WhatsApp Preview Mode
  const handlePauseVoiceRecord = () => {
    if (voiceRecordState !== 'recording') return;
    setVoiceRecordState('paused');

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (voiceTimerRef.current) {
      if (typeof voiceTimerRef.current === 'object' && voiceTimerRef.current.timer) {
        clearInterval(voiceTimerRef.current.timer);
        clearInterval(voiceTimerRef.current.sim);
      } else {
        clearInterval(voiceTimerRef.current);
      }
      voiceTimerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.requestData();
        mediaRecorderRef.current.pause();
      } catch (_) {}
    }

    const blobType = audioChunksRef.current[0]?.type || 'audio/webm';
    const blob = new Blob(audioChunksRef.current, { type: blobType });
    if (blob.size > 0) {
      const url = URL.createObjectURL(blob);
      setRecordedAudioUrl(url);
      setPreviewDuration(voiceRecordingSeconds > 0 ? voiceRecordingSeconds : 3);

      const audio = new Audio(url);
      previewAudioRef.current = audio;
      audio.addEventListener('timeupdate', () => {
        setPreviewCurrentTime(audio.currentTime);
      });
      audio.addEventListener('ended', () => {
        setIsPreviewPlaying(false);
        setPreviewCurrentTime(0);
      });
    } else {
      setPreviewDuration(voiceRecordingSeconds > 0 ? voiceRecordingSeconds : 3);
    }
  };

  // Toggle preview play/pause in paused mode
  const handleTogglePreviewPlay = () => {
    if (previewAudioRef.current) {
      if (isPreviewPlaying) {
        previewAudioRef.current.pause();
        setIsPreviewPlaying(false);
      } else {
        previewAudioRef.current.play().then(() => {
          setIsPreviewPlaying(true);
        }).catch(() => {});
      }
    } else {
      setIsPreviewPlaying(!isPreviewPlaying);
    }
  };

  // Resume recording from paused state (Red Mic clicked)
  const handleResumeVoiceRecord = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }
    setIsPreviewPlaying(false);
    setVoiceRecordState('recording');

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      try {
        mediaRecorderRef.current.resume();
      } catch (_) {}
    }

    voiceTimerRef.current = setInterval(() => {
      setVoiceRecordingSeconds((sec) => sec + 1);
    }, 1000);

    if (analyserRef.current) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      const updateWaveform = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const barsCount = 22;
        const step = Math.max(1, Math.floor(dataArray.length / barsCount));
        const newLevels: number[] = [];
        for (let i = 0; i < barsCount; i++) {
          const val = dataArray[i * step] || 0;
          const barH = Math.max(4, Math.min(24, Math.round((val / 255) * 24)));
          newLevels.push(barH);
        }
        setAudioLevels(newLevels);
        animFrameRef.current = requestAnimationFrame(updateWaveform);
      };
      animFrameRef.current = requestAnimationFrame(updateWaveform);
    }
  };

  // Cancel / Trash voice recording
  const handleCancelVoiceRecord = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (_) {}
    }
    cleanupMedia();
    audioChunksRef.current = [];
    setVoiceRecordState('idle');
    setVoiceRecordingSeconds(0);
  };

  // Send WhatsApp voice note
  const handleSendVoiceNote = async () => {
    if (!conversation) return;
    const recordedSec = voiceRecordingSeconds > 0 ? voiceRecordingSeconds : 4;

    const dispatchVoice = async (dataUrl?: string) => {
      try {
        if (soundEnabled) playAppleSendChime();
        const durationFormatted = recordedSec < 60 ? `${recordedSec}s` : `${Math.floor(recordedSec / 60)}:${(recordedSec % 60).toString().padStart(2, '0')}`;
        const res = await apiRequest<{ message: CustomerChatMessage }>('/chat/message', {
          method: 'POST',
          body: JSON.stringify({
            conversationId: conversation.id,
            content: `Voice note (${durationFormatted})`,
            messageType: 'voice',
            attachmentUrl: dataUrl || undefined
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

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (_) {}
    }

    let blob: Blob | null = null;
    if (audioChunksRef.current.length > 0) {
      const mime = audioChunksRef.current[0].type || 'audio/webm';
      blob = new Blob(audioChunksRef.current, { type: mime });
    }

    handleCancelVoiceRecord();

    if (blob && blob.size > 0) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result as string;
        dispatchVoice(base64Data);
      };
      reader.readAsDataURL(blob);
    } else {
      dispatchVoice();
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

  // 5. Vedic Quick Inquiry Prompts
  const quickPrompts = [
    '🙏 Namaste Amit ji, I need career guidance.',
    '💍 Kundli Milan / Marriage compatibility query.',
    '🖐️ Sharing photo of my palms for Rekha reading.',
    '💎 Which gemstone is auspicious for my current Dasha?',
    '⚡ Guidance regarding Sade Sati and planetary transits.'
  ];

  const [showPromptDropdown, setShowPromptDropdown] = useState(false);
  const [selectedPromptPreview, setSelectedPromptPreview] = useState(quickPrompts[0]);
  const promptDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (promptDropdownRef.current && !promptDropdownRef.current.contains(e.target as Node)) {
        setShowPromptDropdown(false);
      }
    };
    if (showPromptDropdown) {
      document.addEventListener('mousedown', handleOutsideClick);
      return () => document.removeEventListener('mousedown', handleOutsideClick);
    }
  }, [showPromptDropdown]);

  const sendDirectMessage = async (text: string) => {
    if (!text.trim() || !conversation || isSending) return;
    setIsSending(true);
    if (soundEnabled) playAppleSendChime();
    try {
      const res = await apiRequest<{ message: CustomerChatMessage }>('/chat/message', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: conversation.id,
          content: text.trim(),
          messageType: 'text'
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

  const isTrialCustomer = Boolean(user?.isNewCustomer && !user?.trialUsed);
  const [showTrialBanner, setShowTrialBanner] = useState(isTrialCustomer);

  useEffect(() => {
    if (isTrialCustomer) {
      setShowTrialBanner(true);
      const timer = setTimeout(() => {
        setShowTrialBanner(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [isTrialCustomer]);

  return (
    <div
      className="hybrid-chat-wrapper hybrid-customer-chat"
      style={{
        flex: 1,
        width: '100%',
        height: '100%',
        minHeight: 0,
        maxHeight: 'none',
        maxWidth: 'none',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 0,
        overflow: 'hidden',
        backgroundColor: '#F2F2F7',
        boxShadow: 'none',
        border: 'none',
        position: 'relative',
        margin: 0,
        padding: 0
      }}
    >
      {/* ======================================================== */}
      {/* 1. TOP HEADER: APPLE + WHATSAPP HYBRID BAR               */}
      {/* ======================================================== */}
      <div
        style={{
          height: 60,
          padding: '0 16px',
          backgroundColor: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderBottom: '1px solid #E5E5EA',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
          zIndex: 20
        }}
      >
        {/* Left Contact Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #FAF8F5, #EDE6D8)',
                border: '1.5px solid #D6B97A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 4,
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)'
              }}
            >
              <img
                src="/icons/logo-mark.png"
                alt="Amit"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 16,
                color: '#111B21',
                letterSpacing: '-0.01em',
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              Amit Astro
            </div>
            <div
              style={{
                fontSize: 12,
                color: '#667781',
                marginTop: 2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              Vedic Astrologer
            </div>
          </div>
        </div>

        {/* Right Action: Clean Consultation Booking Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button
            type="button"
            onClick={onOpenBooking}
            className="apple-btn-primary"
            style={{
              padding: '6px 14px',
              fontSize: 12.5,
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              borderRadius: 20
            }}
          >
            <Calendar size={13} />
            <span>Consultation</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. TRIAL OR CONSULTATION STATUS BANNER                   */}
      {/* ======================================================== */}
      {isTrialCustomer && showTrialBanner && (
        <div
          style={{
            backgroundColor: '#F0FDF4',
            borderBottom: '1px solid #DCFCE7',
            padding: '7px 12px 7px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            fontSize: 12,
            color: '#166534',
            flexShrink: 0,
            zIndex: 5
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
            <Sparkles size={14} color="#16A34A" style={{ flexShrink: 0 }} />
            <span style={{ lineHeight: 1.35 }}>
              <strong>Free 5-Min Vedic Chat Active:</strong> Share your birth query or palm chart directly with Amit ji.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowTrialBanner(false)}
            style={{
              background: 'none',
              border: 'none',
              color: '#166534',
              cursor: 'pointer',
              padding: 4,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              opacity: 0.8
            }}
            title="Dismiss notification"
            aria-label="Dismiss notification"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. MESSAGE BODY: WHATSAPP + APPLE HYBRID CANVAS          */}
      {/* ======================================================== */}
      <div
        ref={chatCanvasRef}
        className="hybrid-chat-canvas"
        style={{
          flex: '1 1 0%',
          minHeight: 0,
          padding: '14px 14px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 10
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

            const timeStr = new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <React.Fragment key={m.id ? `${m.id}-${idx}` : idx}>
                {showTimestamp && (
                  <div className="hybrid-date-pill">
                    {new Date(m.created_at).toLocaleDateString([], {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                )}

                <div
                  style={{
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isMe ? 'flex-end' : 'flex-start'
                  }}
                >
                  {/* Message Type 1: Astrological Remedy Card */}
                  {m.message_type === 'astrological_remedy' ? (
                    <div
                      style={{
                        backgroundColor: '#FFFDF9',
                        border: '1.5px solid #E8D3A7',
                        borderRadius: 14,
                        padding: '14px 16px',
                        maxWidth: 420,
                        boxShadow: '0 2px 8px rgba(201, 162, 75, 0.12)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 18 }}>🕉️</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#875C0C' }}>
                            Prescribed Vedic Remedy
                          </div>
                          <div style={{ fontSize: 10.5, color: '#A07829' }}>Astrologer Recommendation</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 'var(--chat-font-bubble)', color: '#2C200C', lineHeight: 1.45 }}>
                        {m.content}
                      </div>
                      <div className="hybrid-bubble-time" style={{ float: 'right', marginTop: 6 }}>
                        {timeStr}
                      </div>
                    </div>
                  ) : m.message_type === 'voice' ? (
                    /* Message Type 2: Authentic WhatsApp Voice Note Player */
                    <WhatsAppVoicePlayer
                      id={m.id}
                      audioUrl={m.attachment_url}
                      durationSeconds={parseVoiceDuration(m.content)}
                      isMe={isMe}
                      senderName={isMe ? (user?.name || 'You') : 'Amit Astro'}
                      senderPhoto={isMe ? user?.photoURL : '/icons/logo-mark.png'}
                      timestamp={timeStr}
                      isPlaying={playingVoiceId === m.id}
                      onTogglePlay={() => setPlayingVoiceId(playingVoiceId === m.id ? null : m.id)}
                    />
                  ) : m.message_type === 'image' || m.attachment_url ? (
                    /* Message Type 3: Image Attachment */
                    <div
                      className={`hybrid-bubble ${isMe ? 'hybrid-bubble-out' : 'hybrid-bubble-in'}`}
                      style={{ padding: 4 }}
                    >
                      {m.attachment_url && (
                        <div
                          onClick={() => setZoomedImage(m.attachment_url || null)}
                          style={{
                            cursor: 'pointer',
                            borderRadius: 12,
                            overflow: 'hidden',
                            position: 'relative'
                          }}
                        >
                          <img
                            src={m.attachment_url}
                            alt="Attachment"
                            style={{
                              maxWidth: 300,
                              maxHeight: 260,
                              width: '100%',
                              objectFit: 'cover',
                              display: 'block',
                              borderRadius: 12
                            }}
                          />
                          <div
                            style={{
                              position: 'absolute',
                              bottom: 6,
                              right: 6,
                              backgroundColor: 'rgba(0, 0, 0, 0.65)',
                              borderRadius: 6,
                              padding: '2px 6px',
                              color: '#FFF',
                              fontSize: 10,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 3
                            }}
                          >
                            <ImageIcon size={10} /> Zoom
                          </div>
                        </div>
                      )}
                      {m.content && m.content !== 'Sent an attachment' && (
                        <div
                          style={{
                            padding: '6px 8px 2px 8px',
                            fontSize: 'var(--chat-font-bubble)',
                            color: '#111B21',
                            lineHeight: 1.4
                          }}
                        >
                          {m.content}
                        </div>
                      )}
                      <span className="hybrid-bubble-meta" style={{ padding: '0 6px 4px 0' }}>
                        <span className="hybrid-bubble-time">{timeStr}</span>
                        {isMe && (
                          <span className="hybrid-read-ticks">
                            <CheckCheck size={14} color="#53BDEB" />
                          </span>
                        )}
                      </span>
                    </div>
                  ) : (
                    /* Message Type 4: Text Message Bubble */
                    <div
                      className={`hybrid-bubble ${isMe ? 'hybrid-bubble-out' : 'hybrid-bubble-in'}`}
                    >
                      <span className="hybrid-message-text">{m.content}</span>
                      <span className="hybrid-bubble-meta">
                        <span className="hybrid-bubble-time">{timeStr}</span>
                        {isMe && (
                          <span className="hybrid-read-ticks">
                            <CheckCheck size={14} color="#53BDEB" />
                          </span>
                        )}
                      </span>
                    </div>
                  )}
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
      {/* 5. VEDIC QUICK INQUIRY TEMPLATE DROPDOWN                 */}
      {/* ======================================================== */}
      <div
        ref={promptDropdownRef}
        style={{
          position: 'relative',
          padding: '6px 14px',
          backgroundColor: '#FFFFFF',
          borderTop: '1px solid #F0F0F2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          flexShrink: 0
        }}
      >
        <button
          type="button"
          onClick={() => setShowPromptDropdown(!showPromptDropdown)}
          className="quick-prompt-dropdown-trigger"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '5px 12px',
            backgroundColor: '#F5F5F7',
            border: '1px solid #E5E5EA',
            borderRadius: 16,
            fontSize: 12,
            fontWeight: 500,
            color: '#1D1D1F',
            cursor: 'pointer',
            maxWidth: '100%',
            transition: 'background-color 0.15s ease'
          }}
          title="Choose a quick inquiry template to send"
          aria-expanded={showPromptDropdown}
        >
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: 'calc(100vw - 80px)'
            }}
          >
            {selectedPromptPreview}
          </span>
          <ChevronDown
            size={14}
            color="#86868B"
            style={{
              transform: showPromptDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
              flexShrink: 0
            }}
          />
        </button>

        {/* Upward Dropdown Menu */}
        {showPromptDropdown && (
          <div
            style={{
              position: 'absolute',
              bottom: '100%',
              left: 14,
              right: 14,
              marginBottom: 6,
              backgroundColor: '#FFFFFF',
              borderRadius: 14,
              border: '1px solid #E5E5EA',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.12)',
              padding: 6,
              zIndex: 60,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              animation: 'applePopoverFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <div
              style={{
                padding: '6px 10px 4px',
                fontSize: 11,
                fontWeight: 700,
                color: '#8E8E93',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}
            >
              Tap Query to Send to Amit
            </div>
            {quickPrompts.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setSelectedPromptPreview(p);
                  setShowPromptDropdown(false);
                  sendDirectMessage(p);
                }}
                className="prompt-dropdown-option"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: 12.5,
                  color: '#111B21',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F2F2F7')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <span style={{ flex: 1, marginRight: 8 }}>{p}</span>
                <Send size={13} color="#007AFF" style={{ flexShrink: 0 }} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 6. APPLE + WHATSAPP HYBRID COMPOSER BAR                  */}
      {/* ======================================================== */}
      <div className="hybrid-chat-composer">
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        {/* Attach Photo Button (hidden during voice recording) */}
        {voiceRecordState === 'idle' && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="hybrid-action-icon-btn"
            title="Attach Kundli / Palm photo"
          >
            <Paperclip size={20} />
          </button>
        )}

        {/* Input Pill or WhatsApp Voice Recording Bar */}
        {voiceRecordState !== 'idle' ? (
          <div
            className="whatsapp-voice-recording-bar"
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              userSelect: 'none'
            }}
          >
            {/* 1. Left: Discard / Trash Can Button */}
            <button
              type="button"
              onClick={handleCancelVoiceRecord}
              className="whatsapp-trash-btn"
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#8696A0',
                transition: 'color 0.15s ease, transform 0.15s ease',
                flexShrink: 0
              }}
              title="Discard voice recording"
              aria-label="Discard voice recording"
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#FF3B30';
                e.currentTarget.style.transform = 'scale(1.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#8696A0';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <Trash2 size={21} />
            </button>

            {/* 2. Center Capsule: WhatsApp Light Mode Voice Bar */}
            <div
              className="whatsapp-recording-pill"
              style={{
                flex: 1,
                minWidth: 0,
                height: 44,
                backgroundColor: '#FFFFFF',
                borderRadius: 22,
                border: '1px solid #E5E5EA',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                padding: '0 12px 0 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10
              }}
            >
              {voiceRecordState === 'recording' ? (
                <>
                  {/* Blinking Red Dot + Live Timer */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span
                      style={{
                        width: 9,
                        height: 9,
                        borderRadius: '50%',
                        backgroundColor: '#FF3B30',
                        animation: 'pulse 1s infinite'
                      }}
                    />
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: '#111B21',
                        fontVariantNumeric: 'tabular-nums',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                      }}
                    >
                      {formatVoiceTime(voiceRecordingSeconds)}
                    </span>
                  </div>

                  {/* Dancing Waveform Bars Reacting to Voice */}
                  <div
                    style={{
                      flex: 1,
                      height: 24,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 2.5,
                      overflow: 'hidden',
                      padding: '0 4px'
                    }}
                  >
                    {audioLevels.map((lvl, i) => (
                      <div
                        key={i}
                        style={{
                          width: 2.5,
                          height: lvl,
                          borderRadius: 2,
                          backgroundColor: '#8696A0',
                          transition: 'height 0.08s ease'
                        }}
                      />
                    ))}
                  </div>

                  {/* Pause Button to enter Preview Mode */}
                  <button
                    type="button"
                    onClick={handlePauseVoiceRecord}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      border: 'none',
                      backgroundColor: '#F0F2F5',
                      color: '#54656F',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'background-color 0.15s ease'
                    }}
                    title="Pause and review"
                    aria-label="Pause and review"
                  >
                    <Pause size={16} fill="#54656F" />
                  </button>
                </>
              ) : (
                /* Paused Preview Mode */
                <>
                  {/* Play / Pause Preview Button */}
                  <button
                    type="button"
                    onClick={handleTogglePreviewPlay}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      border: 'none',
                      backgroundColor: '#F0F2F5',
                      color: '#54656F',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                    title={isPreviewPlaying ? 'Pause preview' : 'Play preview'}
                    aria-label={isPreviewPlaying ? 'Pause preview' : 'Play preview'}
                  >
                    {isPreviewPlaying ? (
                      <Pause size={16} fill="#54656F" />
                    ) : (
                      <Play size={16} fill="#54656F" style={{ marginLeft: 2 }} />
                    )}
                  </button>

                  {/* Preview Waveform with Scrubber */}
                  <div
                    style={{
                      flex: 1,
                      height: 24,
                      display: 'flex',
                      alignItems: 'center',
                      position: 'relative',
                      padding: '0 4px'
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 2.5
                      }}
                    >
                      {audioLevels.map((lvl, idx) => {
                        const progress = previewDuration > 0 ? previewCurrentTime / previewDuration : 0;
                        const isPlayed = idx / audioLevels.length <= progress;
                        return (
                          <div
                            key={idx}
                            style={{
                              width: 2.5,
                              height: lvl,
                              borderRadius: 2,
                              backgroundColor: isPlayed ? '#00A884' : '#8696A0'
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Time + Red Resume Mic Button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span
                      style={{
                        fontSize: 12.5,
                        color: '#667781',
                        fontVariantNumeric: 'tabular-nums',
                        fontWeight: 500
                      }}
                    >
                      {formatVoiceTime(isPreviewPlaying ? previewCurrentTime : (previewDuration || voiceRecordingSeconds))}
                    </span>

                    {/* Red Mic Icon to Resume Recording */}
                    <button
                      type="button"
                      onClick={handleResumeVoiceRecord}
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: '50%',
                        border: 'none',
                        backgroundColor: '#FFEAEA',
                        color: '#FF3B30',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Resume recording"
                      aria-label="Resume recording"
                    >
                      <Mic size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* 3. Right: Circular Green Send Button */}
            <button
              type="button"
              onClick={handleSendVoiceNote}
              style={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                backgroundColor: '#25D366',
                color: '#FFFFFF',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(37, 211, 102, 0.4)',
                flexShrink: 0,
                transition: 'transform 0.1s ease, background-color 0.15s ease'
              }}
              title="Send voice note"
              aria-label="Send voice note"
            >
              <Send size={18} style={{ transform: 'translateX(1px)' }} />
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSendMessage}
            style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <div className="hybrid-input-capsule">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Message Amit..."
                className="hybrid-input-field"
              />
              {/* Mic shortcut inside capsule */}
              <button
                type="button"
                onClick={handleStartVoiceRecord}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#8E8E93',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Record voice note"
              >
                <Mic size={18} />
              </button>
            </div>

            {/* Circular Send Button */}
            <button
              type="submit"
              disabled={(!inputText.trim() && !attachmentPreview) || isSending}
              className="hybrid-send-btn"
              style={{
                backgroundColor: (inputText.trim() || attachmentPreview) && !isSending ? '#25D366' : '#C7C7CC',
                cursor: (inputText.trim() || attachmentPreview) && !isSending ? 'pointer' : 'default',
                opacity: (inputText.trim() || attachmentPreview) && !isSending ? 1 : 0.6
              }}
              title="Send"
            >
              <ArrowUp size={19} strokeWidth={2.4} />
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
