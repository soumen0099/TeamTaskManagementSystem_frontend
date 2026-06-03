import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  // Validate session and fetch fresh profile if token exists
  const checkSession = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await api.getProfile();
      // Ensure we extract the user correctly.
      // Check if response contains user directly or in user object
      const userProfile = data.user || data;
      setUser(userProfile);
      localStorage.setItem('user', JSON.stringify(userProfile));
    } catch (error) {
      // API handler will handle token clear on 401
      console.error("Session verification failed", error);
      logout();
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await api.login(email, password);
      // Backend typically returns { token, user: { ... } } or similar
      const receivedToken = response.token;
      const receivedUser = response.user || response.data?.user || response;
      
      if (!receivedToken) {
        throw new Error("Invalid response format: token not provided");
      }

      localStorage.setItem('token', receivedToken);
      localStorage.setItem('user', JSON.stringify(receivedUser));
      
      setToken(receivedToken);
      setUser(receivedUser);
      
      showToast('Welcome back! Successfully logged in.', 'success');
      return true;
    } catch (error) {
      showToast(error.message || 'Login failed', 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userName, email, password) => {
    try {
      setLoading(true);
      const response = await api.register(userName, email, password);
      
      showToast('Registration successful! Please login to continue.', 'success');
      return true;
    } catch (error) {
      showToast(error.message || 'Registration failed', 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    showToast('Successfully logged out.', 'success');
  }, [showToast]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshProfile: checkSession }}>
      {children}
    </AuthContext.Provider>
  );
};
