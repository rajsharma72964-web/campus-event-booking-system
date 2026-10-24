'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, getStoredToken } from '@/lib/api';

const AuthContext = createContext({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  isAuthenticated: false,
  isOrganizer: false,
  isAdmin: false,
});

// Helper to safely parse payload from JWT without external libraries
const decodeJwtPayload = (token) => {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

// Check if JWT token has expired based on its 'exp' timestamp
const isTokenExpired = (token) => {
  try {
    const payload = decodeJwtPayload(token);
    if (!payload || !payload.exp) return false;
    // Buffer by 5 seconds
    return payload.exp * 1000 < (Date.now() - 5000);
  } catch {
    return false;
  }
};

// Helper to set cookie for token
const setTokenCookie = (token) => {
  if (typeof document !== 'undefined') {
    document.cookie = `token=${encodeURIComponent(token)}; path=/; max-age=604800; SameSite=Lax`;
  }
};

// Helper to remove cookie for token
const removeTokenCookie = () => {
  if (typeof document !== 'undefined') {
    document.cookie = 'token=; path=/; max-age=0; SameSite=Lax';
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      removeTokenCookie();
    } catch (e) {
      console.error('Error clearing localStorage on logout:', e);
    }
  }, []);

  // Listen for global session-expired events from API client
  useEffect(() => {
    const handleSessionExpired = () => {
      console.warn('Session expired (401 received). Logging out.');
      logout();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('auth:session-expired', handleSessionExpired);
      return () => {
        window.removeEventListener('auth:session-expired', handleSessionExpired);
      };
    }
  }, [logout]);

  // Restore authentication session on mount (and verify with backend in background)
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = getStoredToken();
        let storedUser = null;

        try {
          const rawUser = localStorage.getItem('user');
          if (rawUser && rawUser !== 'undefined' && rawUser !== 'null') {
            storedUser = JSON.parse(rawUser);
          }
        } catch {
          storedUser = null;
        }

        if (storedToken) {
          // If the token is already expired according to its JWT claim, clean up and exit
          if (isTokenExpired(storedToken)) {
            console.warn('Stored JWT token has expired. Clearing session.');
            logout();
            setLoading(false);
            return;
          }

          // If stored user object is missing, reconstruct it from token claims
          if (!storedUser) {
            const claims = decodeJwtPayload(storedToken);
            if (claims) {
              storedUser = {
                id: claims.id,
                name: claims.name || claims.email?.split('@')[0] || 'User',
                email: claims.email,
                role: claims.role || 'STUDENT',
              };
              localStorage.setItem('user', JSON.stringify(storedUser));
            }
          }

          // Immediately restore state so that pages don't redirect or flash login UI
          setToken(storedToken);
          setUser(storedUser);
          setTokenCookie(storedToken);
          setLoading(false);

          // Verify with backend in the background to sync latest user profile
          try {
            const data = await api.get('/auth/me');
            if (data?.user) {
              setUser(data.user);
              localStorage.setItem('user', JSON.stringify(data.user));
            }
          } catch (verifyErr) {
            // ONLY log out if the backend explicitly rejected the token as 401 Unauthorized
            if (verifyErr?.status === 401) {
              console.warn('Backend rejected session token (401), logging out:', verifyErr.message);
              logout();
            } else {
              // Network error, 500, or backend cold-booting: preserve the cached credentials!
              console.warn('Backend verification temporarily unreachable, retaining active session:', verifyErr?.message);
            }
          }
          return;
        }
      } catch (err) {
        console.error('Failed to restore authentication session:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [logout]);

  const login = async (email, password) => {
    const data = await api.post('/auth/login', { email, password });
    if (data?.token && data?.user) {
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setTokenCookie(data.token);
      return data.user;
    }
    throw new Error('Invalid response from server during login');
  };

  const register = async (name, email, password, role = 'STUDENT') => {
    const data = await api.post('/auth/register', { name, email, password, role });
    if (data?.token && data?.user) {
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setTokenCookie(data.token);
      return data.user;
    }
    throw new Error('Invalid response from server during registration');
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isOrganizer: user?.role === 'ORGANIZER' || user?.role === 'ADMIN',
    isAdmin: user?.role === 'ADMIN',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
