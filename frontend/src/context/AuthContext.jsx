import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  registerUser, 
  loginUser, 
  logoutUser, 
  getCurrentUser 
} from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Check if session exists on initial application load
  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getCurrentUser();
      if (res && res.data) {
        setUser(res.data);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Register action
  const register = async (userData) => {
    setAuthError(null);
    try {
      const res = await registerUser(userData);
      if (res.user) {
        setUser(res.user);
      }
      return { success: true, user: res.user };
    } catch (err) {
      const message = err.message || 'Registration failed.';
      setAuthError(message);
      return { success: false, error: message };
    }
  };

  // Login action
  const login = async (credentials) => {
    setAuthError(null);
    try {
      const res = await loginUser(credentials);
      if (res.user) {
        setUser(res.user);
      }
      return { success: true, user: res.user };
    } catch (err) {
      const message = err.message || 'Invalid credentials.';
      setAuthError(message);
      return { success: false, error: message };
    }
  };

  // Logout action
  const logout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        authError,
        register,
        login,
        logout,
        checkAuth,
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
