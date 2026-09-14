import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  type Auth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
};

export const isFirebaseConfigured = (): boolean => {
  return !!firebaseConfig.apiKey && !!firebaseConfig.projectId;
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

if (typeof window !== 'undefined' && isFirebaseConfigured()) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
  } catch (err) {
    console.warn('[Firebase] Failed to initialize Firebase:', err);
  }
}

export { auth };

let recaptchaVerifier: RecaptchaVerifier | null = null;

/**
 * Initializes an invisible reCAPTCHA verifier for Firebase Phone Auth
 */
export function initPhoneRecaptcha(containerId: string = 'recaptcha-container'): RecaptchaVerifier | null {
  if (!auth) return null;
  try {
    if (recaptchaVerifier) {
      recaptchaVerifier.clear();
      recaptchaVerifier = null;
    }
    recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved
      },
      'expired-callback': () => {
        console.warn('[Firebase] reCAPTCHA expired, resetting...');
      }
    });
    return recaptchaVerifier;
  } catch (err) {
    console.error('[Firebase] Error setting up RecaptchaVerifier:', err);
    return null;
  }
}

/**
 * Sends a real SMS OTP to the phone number via Google Firebase Phone Auth (10,000 free/month)
 */
export async function sendFirebaseSms(phoneNumber: string, containerId: string = 'recaptcha-container'): Promise<ConfirmationResult> {
  if (!auth) {
    throw new Error('Firebase Auth is not configured. Please set VITE_FIREBASE_API_KEY in your environment.');
  }

  // Ensure standard international E.164 format (+91 for India)
  let formattedPhone = phoneNumber.trim().replace(/\s+/g, '');
  if (!formattedPhone.startsWith('+')) {
    formattedPhone = `+91${formattedPhone}`;
  }

  const verifier = initPhoneRecaptcha(containerId);
  if (!verifier) {
    throw new Error('Could not initialize reCAPTCHA verifier.');
  }

  return await signInWithPhoneNumber(auth, formattedPhone, verifier);
}
