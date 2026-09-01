import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../api/apiServices';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('wastewatch_token'));
  const [loading, setLoading] = useState(true);
  const { success, error: toastError } = useToast();

  const fetchCurrentUser = useCallback(async () => {
    const savedToken = localStorage.getItem('wastewatch_token');
    if (!savedToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await authService.getMe();
      if (res.data.success) {
        setUser(res.data.user);
      }
    } catch (err) {
      console.warn('Authentication check failed, clearing token.');
      localStorage.removeItem('wastewatch_token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  // Regular Login
  const login = async (email, password) => {
    try {
      const res = await authService.login({ email, password });
      if (res.data.success) {
        localStorage.setItem('wastewatch_token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        success(`Welcome back, ${res.data.user.name}!`);
        return { success: true };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      toastError(msg);
      return { success: false, message: msg };
    }
  };

  // Register
  const register = async (userData) => {
    try {
      const res = await authService.register(userData);
      if (res.data.success) {
        localStorage.setItem('wastewatch_token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        success('Account created successfully! Welcome to WasteWatch.');
        return { success: true };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed.';
      toastError(msg);
      return { success: false, message: msg };
    }
  };

  // Quick 1-Click Demo Login
  const demoLogin = async (role) => {
    try {
      const res = await authService.demoLogin(role);
      if (res.data.success) {
        localStorage.setItem('wastewatch_token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        success(`Logged in as demo ${role.toUpperCase()}!`);
        return { success: true };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Demo login failed.';
      toastError(msg);
      return { success: false, message: msg };
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('wastewatch_token');
    setToken(null);
    setUser(null);
    success('You have been logged out.');
  };

  // Update user in state
  const updateUser = (updatedUser) => {
    setUser((prev) => ({ ...prev, ...updatedUser }));
  };

  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'cleanup_staff' || user?.role === 'admin';
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        isAdmin,
        isStaff,
        login,
        register,
        demoLogin,
        logout,
        updateUser,
        refreshUser: fetchCurrentUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
