import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../api/apiServices';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('wastewatch_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('wastewatch_token'));
  const [loading, setLoading] = useState(!user);
  const { success, error: toastError } = useToast();

  const fetchCurrentUser = useCallback(async () => {
    const savedToken = localStorage.getItem('wastewatch_token');
    if (!savedToken) {
      setUser(null);
      localStorage.removeItem('wastewatch_user');
      setLoading(false);
      return;
    }

    try {
      const res = await authService.getMe();
      if (res.data && res.data.success && res.data.user) {
        setUser(res.data.user);
        localStorage.setItem('wastewatch_user', JSON.stringify(res.data.user));
      }
    } catch (err) {
      // ONLY clear token if the server explicitly rejected authentication with 401 Unauthorized or 403 Forbidden.
      // Temporary network errors, cold starts, or 500 errors will NOT log out the user.
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        console.warn('Authentication token expired or rejected, clearing session.');
        localStorage.removeItem('wastewatch_token');
        localStorage.removeItem('wastewatch_user');
        setToken(null);
        setUser(null);
      } else {
        console.warn('Background profile check notice (cold-start/network), keeping authenticated session active.');
      }
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
        localStorage.setItem('wastewatch_user', JSON.stringify(res.data.user));
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
        if (res.data.token && res.data.user) {
          localStorage.setItem('wastewatch_token', res.data.token);
          localStorage.setItem('wastewatch_user', JSON.stringify(res.data.user));
          setToken(res.data.token);
          setUser(res.data.user);
        }
        success(res.data.message || 'Account created successfully!');
        return { success: true, pending_approval: res.data.pending_approval };
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
        localStorage.setItem('wastewatch_user', JSON.stringify(res.data.user));
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
    localStorage.removeItem('wastewatch_user');
    setToken(null);
    setUser(null);
    success('You have been logged out.');
  };

  // Update user in state
  const updateUser = (updatedUser) => {
    setUser((prev) => {
      const updated = { ...prev, ...updatedUser };
      localStorage.setItem('wastewatch_user', JSON.stringify(updated));
      return updated;
    });
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
