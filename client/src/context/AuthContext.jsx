import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('smart_irrigation_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('smart_irrigation_token') || null);
  const [loading, setLoading] = useState(true);

  // Sync auth state on initial mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('smart_irrigation_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem('smart_irrigation_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.warn('[Auth] Session expired or invalid:', err.message);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();

    const handleLogoutEvent = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener('auth-logout', handleLogoutEvent);
    return () => window.removeEventListener('auth-logout', handleLogoutEvent);
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('smart_irrigation_token', res.data.token);
      localStorage.setItem('smart_irrigation_user', JSON.stringify(res.data.user));
      return res.data;
    }
    throw new Error(res.data.error || 'Login failed');
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    if (res.data.success) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('smart_irrigation_token', res.data.token);
      localStorage.setItem('smart_irrigation_user', JSON.stringify(res.data.user));
      return res.data;
    }
    throw new Error(res.data.error || 'Registration failed');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('smart_irrigation_token');
    localStorage.removeItem('smart_irrigation_user');
  };

  const updateUserData = (updatedUser) => {
    setUser(prev => ({ ...prev, ...updatedUser }));
    localStorage.setItem('smart_irrigation_user', JSON.stringify({ ...user, ...updatedUser }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user && !!token,
        isAdmin: user?.role === 'admin',
        isFarmer: user?.role === 'farmer',
        login,
        register,
        logout,
        updateUserData
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
