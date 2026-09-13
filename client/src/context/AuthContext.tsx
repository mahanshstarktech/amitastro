import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'admin';
  isPhoneVerified: boolean;
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
  sendOtp: (phone: string) => Promise<{ simulatedCode?: string; cooldownSeconds: number }>;
  verifyOtp: (data: { phone: string; code: string; name?: string; email?: string; password?: string }) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
  addProfile: (data: any) => Promise<BirthProfile>;
  updateProfile: (id: string, data: any) => Promise<BirthProfile>;
  deleteProfile: (id: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profiles, setProfiles] = useState<BirthProfile[]>([]);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('nakshaktram_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshMe = async () => {
    try {
      if (!localStorage.getItem('nakshaktram_token')) {
        setUser(null);
        setProfiles([]);
        setIsLoading(false);
        return;
      }
      const data = await apiRequest<{ user: User; profiles: BirthProfile[] }>('/auth/me');
      setUser(data.user);
      setProfiles(data.profiles || []);
    } catch (err) {
      console.warn('Auth token invalid or expired:', err);
      localStorage.removeItem('nakshaktram_token');
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
    localStorage.setItem('nakshaktram_token', res.token);
    setToken(res.token);
    setUser(res.user);
    setProfiles(res.profiles || []);
  };

  const sendOtp = async (phone: string) => {
    return await apiRequest<{ simulatedCode?: string; cooldownSeconds: number }>('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone })
    });
  };

  const verifyOtp = async (data: { phone: string; code: string; name?: string; email?: string; password?: string }) => {
    const res = await apiRequest<{ token: string; user: User; profiles: BirthProfile[] }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    localStorage.setItem('nakshaktram_token', res.token);
    setToken(res.token);
    setUser(res.user);
    setProfiles(res.profiles || []);
  };

  const logout = () => {
    localStorage.removeItem('nakshaktram_token');
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
        sendOtp,
        verifyOtp,
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
