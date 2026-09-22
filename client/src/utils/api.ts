const isProd = typeof window !== 'undefined' && !window.location.hostname.includes('localhost');

const PROD_CANDIDATES = [
  'https://amitastro.onrender.com/api',
  'https://amitastro-api.onrender.com/api',
  'https://nakshaktram.onrender.com/api'
];

const envApi = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
let activeBase = envApi || (isProd ? PROD_CANDIDATES[0] : 'http://localhost:5001/api');

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

  const token = localStorage.getItem('amitastro_token') || localStorage.getItem('nakshaktram_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Helper to execute request on a given base
  const executeOnBase = async (base: string) => {
    const fullUrl = endpoint.startsWith('http') ? endpoint : `${base}${endpoint}`;
    const response = await fetch(fullUrl, { ...options, headers });
    return response;
  };

  let response: Response;

  if (endpoint.startsWith('http') || !isProd || envApi) {
    response = await executeOnBase(activeBase);
  } else {
    // Try candidate bases in order if needed
    try {
      response = await executeOnBase(activeBase);
      // If Render 404 (service renamed or not found), try fallbacks
      if (response.status === 404 && activeBase !== PROD_CANDIDATES[PROD_CANDIDATES.length - 1]) {
        throw new Error('Candidate 404');
      }
    } catch {
      let foundResponse: Response | null = null;
      for (const candidate of PROD_CANDIDATES) {
        if (candidate === activeBase) continue;
        try {
          const testRes = await executeOnBase(candidate);
          if (testRes.status !== 404 || candidate === PROD_CANDIDATES[PROD_CANDIDATES.length - 1]) {
            activeBase = candidate;
            foundResponse = testRes;
            break;
          }
        } catch {
          // Continue to next candidate
        }
      }
      if (!foundResponse) {
        throw new Error('Unable to connect to Amit Astro backend API. Please check your internet connection.');
      }
      response = foundResponse;
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || `HTTP error ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

