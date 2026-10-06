import { io, Socket } from 'socket.io-client';

const isProd = typeof window !== 'undefined' && !window.location.hostname.includes('localhost');
const PROD_SOCKET_URL = 'https://amitastro.onrender.com';

const rawApiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');
const SOCKET_URL = rawApiUrl || (isProd ? PROD_SOCKET_URL : 'http://localhost:5001');

let socketInstance: Socket | null = null;

export function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      autoConnect: true
    });

    socketInstance.on('connect', () => {
      console.log(`[Socket.IO Client] Connected to real-time server: ${socketInstance?.id}`);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log(`[Socket.IO Client] Disconnected: ${reason}`);
    });

    socketInstance.on('connect_error', (err) => {
      console.warn(`[Socket.IO Client] Connection warning: ${err.message}`);
    });
  }

  return socketInstance;
}

export function authenticateSocket(userId?: string, role?: string) {
  const socket = getSocket();
  if (socket.connected) {
    socket.emit('authenticate', { userId, role });
  } else {
    socket.once('connect', () => {
      socket.emit('authenticate', { userId, role });
    });
  }
}

// ----------------------------------------------------------------------
// Audio Synthesizer: WhatsApp / Apple High-Fidelity Notification Chimes
// ----------------------------------------------------------------------
export function playReceiveChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Harmonic Double Chime (WhatsApp / Apple iMessage Acoustic signature)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now); // E5
    osc1.frequency.setValueAtTime(880, now + 0.08); // A5
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1318.5, now); // E6 sparkle
    gain2.gain.setValueAtTime(0.06, now);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now);
    osc2.stop(now + 0.22);
  } catch (_) {
    // Non-blocking catch for browser autoplay policies
  }
}

export function playSendChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  } catch (_) {}
}

// ----------------------------------------------------------------------
// Native Browser Web Notifications & Tab Badge Notifications
// ----------------------------------------------------------------------
export function requestNotificationPermission() {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }
}

export function notifyNewMessage(title: string, body: string, icon = '/favicon.ico') {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try {
      const n = new Notification(title, {
        body,
        icon,
        badge: icon,
        silent: false
      });
      n.onclick = () => {
        window.focus();
        n.close();
      };
      setTimeout(() => n.close(), 6000);
    } catch (_) {}
  }
}

let originalTitleCache = typeof document !== 'undefined' ? document.title : 'Amit Astro';
let unreadFlashInterval: any = null;

export function setTabUnreadBadge(count: number, fallbackTitle?: string) {
  if (typeof document === 'undefined') return;
  if (fallbackTitle) originalTitleCache = fallbackTitle;

  if (unreadFlashInterval) {
    clearInterval(unreadFlashInterval);
    unreadFlashInterval = null;
  }

  if (count <= 0) {
    document.title = originalTitleCache;
    return;
  }

  let showCount = true;
  document.title = `(${count}) 💬 New Message · ${originalTitleCache}`;

  // Subtly flash title if document is hidden to grab attention like WhatsApp Web
  unreadFlashInterval = setInterval(() => {
    if (document.hidden) {
      document.title = showCount
        ? `(${count}) 💬 New Message · ${originalTitleCache}`
        : `💬 Amit Astro`;
      showCount = !showCount;
    } else {
      document.title = `(${count}) ${originalTitleCache}`;
    }
  }, 1400);
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && unreadFlashInterval) {
      clearInterval(unreadFlashInterval);
      unreadFlashInterval = null;
      document.title = originalTitleCache;
    }
  });
}
