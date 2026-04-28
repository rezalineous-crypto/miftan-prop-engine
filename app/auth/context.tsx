'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { login as apiLogin, logout as apiLogout, refreshTokenApi, register as apiRegister } from '../api/client';

interface User {
  id: number;  // user_id from API
  email: string;
  full_name: string;
  role_id: number;
  is_super_admin: boolean;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: Omit<User, 'id'> & { password_hash: string }) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  // Helper to get user_id for API calls
  getUserId: () => number | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load tokens from localStorage on mount
    const storedAccess = localStorage.getItem('access_token');
    const storedRefresh = localStorage.getItem('refresh_token');
    const storedUser = localStorage.getItem('user');

    if (storedAccess && storedRefresh && storedUser && storedUser !== 'undefined') {
      setAccessToken(storedAccess);
      setRefreshToken(storedRefresh);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiLogin(email, password);
      // Response structure: { status, message, data: { access_token, refresh_token, user_id, email, full_name, role_id, is_super_admin } }
      const { data } = response;
      const { access_token, refresh_token, user_id, email: apiEmail, full_name, role_id, is_super_admin } = data;
      
      // Prepare user object
      const user = {
        id: user_id,
        email: apiEmail,
        full_name,
        role_id,
        is_super_admin,
      };

      // Update state
      setAccessToken(access_token);
      setRefreshToken(refresh_token);
      setUser(user);

      // Store in localStorage
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('user', JSON.stringify(user));
      // Also store user_id separately for quick access in API calls
      localStorage.setItem('user_id', String(user_id));
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: Omit<User, 'id'> & { password_hash: string }) => {
    setIsLoading(true);
    try {
      await apiRegister(userData);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (refreshToken) {
      try {
        await apiLogout(refreshToken);
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('user_id');
  };

  const getUserId = () => {
    if (user?.id) return user.id;
    // Fallback to localStorage if context not yet loaded
    if (typeof window !== 'undefined') {
      const storedId = localStorage.getItem('user_id');
      return storedId ? parseInt(storedId) : null;
    }
    return null;
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, refreshToken, login, register, logout, isLoading, getUserId }}>
      {children}
    </AuthContext.Provider>
  );
};