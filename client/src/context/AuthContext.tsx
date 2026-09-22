import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'admin';
  isPhoneVerified: boolean;
  isNewCustomer: boolean;
  trialUsed: boolean;
  trialSecondsRemaining: number;
}

export interface BirthProfile {
  id: string;
  user_id: string;
  relation: string;
  full_name: string;
  dob: string;
  tob: string;
  tob_uncertain: number;
  pob: string;
  pob_lat?: number;
  pob_lng?: number;
  pob_timezone?: string;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  profiles: BirthProfile[];
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (data: { email: string; name: string; googleId?: string }) => Promise<void>;
  sendOtp: (destination: string, channel?: 'phone' | 'email') => Promise<{ simulatedCode?: string; cooldownSeconds: number; channel?: string }>;
  sendDualOtp: (phone: string, email: string) => Promise<{ phoneSimulatedCode?: string; emailSimulatedCode?: string; cooldownSeconds: number }>;
  verifyOtp: (data: { phone?: string; email?: string; code: string; name?: string; password?: string }) => Promise<void>;
  verifyDualOtp: (data: { phone: string; email: string; phoneCode?: string; emailCode: string; firebaseVerified?: boolean; name?: string; password?: string }) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
  addProfile: (data: any) => Promise<BirthProfile>;
  updateProfile: (id: string, data: any) => Promise<BirthProfile>;
  deleteProfile: (id: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'amitastro_token';
const LEGACY_TOKEN_KEY = 'nakshaktram_token';

function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY);
}

function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profiles, setProfiles] = useState<BirthProfile[]>([]);
  const [token, setToken] = useState<string | null>(getStoredToken);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load user profile if token exists
  const refreshMe = async () => {
    if (!token) {
      setUser(null);
      setProfiles([]);
      setIsLoading(false);
      return;
    }
    try {
      const res = await apiRequest<{ user: User; profiles: BirthProfile[] }>('/auth/me');
      setUser(res.user);
      setProfiles(res.profiles || []);
    } catch {
      clearStoredToken();
      setToken(null);
      setUser(null);
      setProfiles([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshMe();
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await apiRequest<{ token: string; user: User; profiles: BirthProfile[] }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    setStoredToken(res.token);
    setToken(res.token);
    setUser(res.user);
    setProfiles(res.profiles || []);
  };

  const loginWithGoogle = async (googleData: { email: string; name: string; googleId?: string }) => {
    const res = await apiRequest<{ token: string; user: User; profiles: BirthProfile[] }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify(googleData)
    });
    setStoredToken(res.token);
    setToken(res.token);
    setUser(res.user);
    setProfiles(res.profiles || []);
  };

  const sendOtp = async (destination: string, channel?: 'phone' | 'email') => {
    const isEmail = channel === 'email' || destination.includes('@');
    return await apiRequest<{ simulatedCode?: string; cooldownSeconds: number; channel?: string }>('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({
        phone: !isEmail ? destination : undefined,
        email: isEmail ? destination : undefined,
        channel: isEmail ? 'email' : 'phone'
      })
    });
  };

  const sendDualOtp = async (phone: string, email: string) => {
    return await apiRequest<{ phoneSimulatedCode?: string; emailSimulatedCode?: string; cooldownSeconds: number }>('/auth/send-dual-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, email })
    });
  };

  const verifyOtp = async (data: { phone?: string; email?: string; code: string; name?: string; password?: string }) => {
    const res = await apiRequest<{ token: string; user: User; profiles: BirthProfile[] }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    setStoredToken(res.token);
    setToken(res.token);
    setUser(res.user);
    setProfiles(res.profiles || []);
  };

  const verifyDualOtp = async (data: { phone: string; email: string; phoneCode?: string; emailCode: string; firebaseVerified?: boolean; name?: string; password?: string }) => {
    const res = await apiRequest<{ token: string; user: User; profiles: BirthProfile[] }>('/auth/verify-dual-otp', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    setStoredToken(res.token);
    setToken(res.token);
    setUser(res.user);
    setProfiles(res.profiles || []);
  };

  const logout = () => {
    clearStoredToken();
    setToken(null);
    setUser(null);
    setProfiles([]);
  };

  const addProfile = async (profileData: any): Promise<BirthProfile> => {
    const res = await apiRequest<{ profile: BirthProfile }>('/profiles', {
      method: 'POST',
      body: JSON.stringify(profileData)
    });
    setProfiles((prev) => [...prev, res.profile]);
    return res.profile;
  };

  const updateProfile = async (id: string, profileData: any): Promise<BirthProfile> => {
    const res = await apiRequest<{ profile: BirthProfile }>(`/profiles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
    setProfiles((prev) => prev.map((p) => (p.id === id ? res.profile : p)));
    return res.profile;
  };

  const deleteProfile = async (id: string): Promise<void> => {
    await apiRequest(`/profiles/${id}`, { method: 'DELETE' });
    setProfiles((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profiles,
        token,
        isLoading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
        loginWithGoogle,
        sendOtp,
        sendDualOtp,
        verifyOtp,
        verifyDualOtp,
        logout,
        refreshMe,
        addProfile,
        updateProfile,
        deleteProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
