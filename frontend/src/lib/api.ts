import axios from 'axios';
import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(async (config) => {
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
  (error) => {
    if (error.response?.status === 401) {
      // Clear mock session just in case
      localStorage.removeItem('sb-mock-session');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
