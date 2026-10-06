/**
 * Live Real-Time Analytics Tracker for Amit Astro
 * Telemetry inspired by Big-Tech engines (Plausible, GA4, PostHog)
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getOrCreateVisitorId(): string {
  try {
    let vid = localStorage.getItem('amit_astro_vid');
    if (!vid) {
      vid = `vis-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
      localStorage.setItem('amit_astro_vid', vid);
    }
    return vid;
  } catch (_) {
    return `vis-${Date.now().toString(36)}`;
  }
}

function getOrCreateSessionId(): string {
  try {
    let sid = sessionStorage.getItem('amit_astro_sid');
    if (!sid) {
      sid = `sess-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
      sessionStorage.setItem('amit_astro_sid', sid);
    }
    return sid;
  } catch (_) {
    return `sess-${Date.now().toString(36)}`;
  }
}

function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width <= 1024) return 'tablet';
  return 'desktop';
}

function getBrowserInfo(): { browser: string; os: string } {
  if (typeof navigator === 'undefined') return { browser: 'Unknown', os: 'Unknown' };
  const ua = navigator.userAgent;
  let browser = 'Chrome';
  let os = 'Windows';

  if (ua.includes('iPhone') || ua.includes('iPad')) os = ua.includes('iPad') ? 'iPadOS' : 'iOS';
  else if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('Linux')) os = 'Linux';

  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Chrome')) browser = 'Chrome';

  return { browser, os };
}

export function trackEvent(eventType: string = 'pageview', meta: Record<string, any> = {}) {
  try {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const { browser, os } = getBrowserInfo();

    const payload = {
      visitor_id: getOrCreateVisitorId(),
      session_id: getOrCreateSessionId(),
      event_type: eventType,
      page_path: window.location.pathname + window.location.hash,
      page_title: document.title || 'Amit Astro',
      referrer: document.referrer || 'direct',
      utm_source: urlParams.get('utm_source') || '',
      utm_medium: urlParams.get('utm_medium') || '',
      utm_campaign: urlParams.get('utm_campaign') || '',
      device_type: getDeviceType(),
      browser,
      os,
      meta_json: JSON.stringify(meta)
    };

    const endpoint = `${API_BASE}/analytics/track`;
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(() => {});
  } catch (_) {}
}

let heartbeatInterval: any = null;

export function initAnalyticsHeartbeat() {
  if (typeof window === 'undefined' || heartbeatInterval) return;

  // Track initial page view
  trackEvent('pageview');

  // Send lightweight heartbeat every 45 seconds while page is visible
  heartbeatInterval = setInterval(() => {
    if (document.visibilityState === 'visible') {
      trackEvent('heartbeat');
    }
  }, 45000);
}
