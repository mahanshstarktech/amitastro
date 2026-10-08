import { apiRequest } from './api';

interface KeyResponse {
  keyId: string;
  publicKey: string;
  algorithm: string;
  serverTime: number;
}

let cachedKey: KeyResponse | null = null;
let keyFetchedAt = 0;
const KEY_TTL = 10 * 60 * 1000; // 10 minutes

/**
 * Fetches or returns cached active RSA public key from the backend security engine
 */
export async function getActiveEncryptionKey(): Promise<KeyResponse> {
  const now = Date.now();
  if (cachedKey && now - keyFetchedAt < KEY_TTL) {
    return cachedKey;
  }

  const res = await apiRequest<KeyResponse>('/auth/encryption-key');
  cachedKey = res;
  keyFetchedAt = now;
  return res;
}

/**
 * Converts a PEM-formatted RSA public key into an ArrayBuffer for WebCrypto
 */
function pemToArrayBuffer(pem: string): ArrayBuffer {
  const cleanPem = pem
    .replace(/-----BEGIN PUBLIC KEY-----/g, '')
    .replace(/-----END PUBLIC KEY-----/g, '')
    .replace(/[\r\n\s]/g, '');

  const binaryString = window.atob(cleanPem);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Generates high-entropy cryptographic nonce
 */
function generateNonce(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  const arr = new Uint8Array(16);
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(arr);
    return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Dynamic Client-Side RSA Encryption (Zoho Accounts IAM ZASEC.encrypt Equivalent)
 * Encrypts password alongside a fresh millisecond timestamp and single-use nonce
 * to prevent MITM interception, proxy sniffing, and replay attacks.
 */
export async function encryptPasswordForAuth(password: string): Promise<{
  encryptedPassword?: string;
  keyId?: string;
  isEncrypted: boolean;
}> {
  // If WebCrypto is not supported, safely degrade to TLS-protected plaintext
  if (
    typeof window === 'undefined' ||
    !window.crypto ||
    !window.crypto.subtle ||
    typeof window.atob !== 'function'
  ) {
    return { isEncrypted: false };
  }

  try {
    const keyData = await getActiveEncryptionKey();
    const keyBuffer = pemToArrayBuffer(keyData.publicKey);

    const importedKey = await window.crypto.subtle.importKey(
      'spki',
      keyBuffer,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256'
      },
      false,
      ['encrypt']
    );

    const payload = JSON.stringify({
      password,
      timestamp: Date.now(),
      nonce: generateNonce()
    });

    const encodedPayload = new TextEncoder().encode(payload);

    const cipherBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'RSA-OAEP'
      },
      importedKey,
      encodedPayload
    );

    // Convert encrypted ArrayBuffer to Base64 string
    const cipherBytes = new Uint8Array(cipherBuffer);
    let binary = '';
    for (let i = 0; i < cipherBytes.byteLength; i++) {
      binary += String.fromCharCode(cipherBytes[i]);
    }
    const encryptedPassword = window.btoa(binary);

    return {
      encryptedPassword,
      keyId: keyData.keyId,
      isEncrypted: true
    };
  } catch (err) {
    console.warn('[Security] Client-side RSA encryption failed, falling back to direct secure transport:', err);
    return { isEncrypted: false };
  }
}
