import axios from 'axios';

function getApiBaseUrl() {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined') {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocal) {
      return `http://${window.location.hostname}:5000/api`;
    }
    // Production (Vercel, custom domain): use relative /api
    return '/api';
  }
  return '/api';
}

const API_BASE = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT token to every request if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('wastewatch_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle unauthenticated 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect if checking /auth/me
      if (!error.config.url.includes('/auth/me')) {
        console.warn('Session expired or unauthorized.');
      }
    }
    return Promise.reject(error);
  }
);

export function getImageUrl(url) {
  if (!url) return 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=800&auto=format&fit=crop&q=80';
  if (url.startsWith('/uploads')) {
    if (import.meta.env.VITE_API_URL) {
      const base = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');
      return `${base}${url}`;
    }
    if (typeof window !== 'undefined') {
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (isLocal) {
        return `http://${window.location.hostname}:5000${url}`;
      }
      return url;
    }
    return url;
  }
  return url;
}

export default api;
