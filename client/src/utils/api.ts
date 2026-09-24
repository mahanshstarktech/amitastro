const isProd = typeof window !== 'undefined' && !window.location.hostname.includes('localhost');

const PROD_PRIMARY = 'https://amitastro.onrender.com/api';

const PROD_CANDIDATES = [
  'https://amitastro.onrender.com/api',
  'https://amitastro-api.onrender.com/api'
];

let rawEnv = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
// Purge any deprecated legacy endpoints
if (rawEnv.includes('nakshaktram')) {
  rawEnv = '';
}

let activeBase = rawEnv || (isProd ? PROD_PRIMARY : 'http://localhost:5001/api');

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
    return await fetch(fullUrl, { ...options, headers });
  };

  let response: Response;

  if (endpoint.startsWith('http')) {
    response = await executeOnBase(endpoint);
  } else {
    try {
      response = await executeOnBase(activeBase);
      // If 404 or connection failed on current base in prod, attempt candidate fallback
      if (response.status === 404 && isProd) {
        throw new Error('404 on current base');
      }
    } catch {
      // Fallback: try PROD_CANDIDATES
      let foundResponse: Response | null = null;
      for (const candidate of PROD_CANDIDATES) {
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
        throw new Error('Unable to connect to Amit Astro backend API. Please check your network connection.');
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
