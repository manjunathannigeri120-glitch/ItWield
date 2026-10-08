import axios from 'axios';
import { supabase } from './supabase';
import { getDeviceId } from './device';

let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
if (API_URL && !API_URL.endsWith('/api/v1')) {
  API_URL = API_URL.replace(/\/$/, '') + '/api/v1';
}

export const api = axios.create({
  baseURL: API_URL,
  timeout: 45000,
});

api.interceptors.request.use(async (config) => {
  // Always attach unique device identifier for credit rate enforcement
  config.headers['x-device-id'] = getDeviceId();

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
      return config;
    }
  } catch (e) {
    // Ignore fetch errors
  }
  
  const mockSession = localStorage.getItem('sb-mock-session');
  if (mockSession) {
    const parsed = JSON.parse(mockSession);
    config.headers.Authorization = `Bearer ${parsed.access_token}`;
  }
  
  return config;
});
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    // Automatic retry for GET requests on transient network issues, 502, 503, 504, or timeouts
    const isGet = (originalRequest.method || 'get').toLowerCase() === 'get';
    const isTransient = !error.response || (error.response.status >= 502 && error.response.status <= 504) || error.code === 'ECONNABORTED';
    if (isGet && isTransient) {
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
      if (originalRequest._retryCount <= 3) {
        const backoffMs = originalRequest._retryCount * 1200;
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        return api(originalRequest);
      }
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const { data: { session }, error: refreshErr } = await supabase.auth.refreshSession();
        if (session?.access_token && !refreshErr) {
          originalRequest.headers.Authorization = `Bearer ${session.access_token}`;
          return api(originalRequest);
        }
      } catch (e) {
        // Refresh failed, continue to fallback
      }

      // Check if current route is public
      const normalizedPath = window.location.pathname.replace(/\/+$/, '') || '/';
      const isPublicRoute = [
        '/',
        '/login',
        '/signup',
        '/pricing',
        '/terms',
        '/privacy',
        '/refund'
      ].includes(normalizedPath);

      localStorage.removeItem('sb-mock-session');

      // Only redirect if genuinely on an authenticated/protected route
      if (!isPublicRoute) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);


// Admin Methods
export const getAdminUsers = async () => (await api.get(`/admin/users?t=${Date.now()}`)).data;
export const updateAdminCredits = async (userId: string, amount: number, action: 'add' | 'set') => (await api.post(`/admin/users/${userId}/credits`, { amount, action })).data;
export const deleteAdminUser = async (userId: string) => (await api.delete(`/admin/users/${userId}`)).data;


export const banAdminUser = async (userId: string) => (await api.post(`/admin/users/${userId}/ban`)).data;


export const unbanAdminUser = async (userId: string) => (await api.post(`/admin/users/${userId}/unban`)).data;


export const enforceAdminCredits = async () => (await api.post('/admin/enforce-credits')).data;



