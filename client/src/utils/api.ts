const isProd = typeof window !== 'undefined' && !window.location.hostname.includes('localhost');
const envApi = (import.meta.env.VITE_API_URL || '').replace('nakshaktram-api.onrender.com', 'nakshaktram.onrender.com');
const API_BASE = envApi || (isProd ? 'https://nakshaktram.onrender.com/api' : 'http://localhost:5001/api');

export async function apiRequest<T = any>(
  endpoint: string,
  optionsOrMethod?: RequestInit | string,
  bodyData?: any
): Promise<T> {
  let options: RequestInit = {};
  if (typeof optionsOrMethod === 'string') {
    options = {
      method: optionsOrMethod,
      body: bodyData !== undefined ? (typeof bodyData === 'string' ? bodyData : JSON.stringify(bodyData)) : undefined
    };
  } else if (optionsOrMethod) {
    options = optionsOrMethod;
  }

  const token = localStorage.getItem('nakshaktram_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || `HTTP error ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}
