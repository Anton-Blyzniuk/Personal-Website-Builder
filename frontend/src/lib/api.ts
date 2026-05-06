import axios, { AxiosError } from 'axios';
import { API_BASE_URL } from './env';
import type { ApiError } from '../types/api';
import { useAuthStore } from '../store/authStore';

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (reason: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as typeof error.config & { _retry?: boolean };
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        original.headers!.Authorization = `Bearer ${token}`;
        return apiClient(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    const refresh = localStorage.getItem('refresh_token');
    if (!refresh) {
      isRefreshing = false;
      localStorage.removeItem('access_token');
      useAuthStore.getState().logout();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    try {
      const res = await axios.post(`${API_BASE_URL}/api/v1/token/refresh/`, { refresh });
      const newAccess: string = res.data.access;
      localStorage.setItem('access_token', newAccess);
      apiClient.defaults.headers.common.Authorization = `Bearer ${newAccess}`;
      processQueue(null, newAccess);
      original.headers!.Authorization = `Bearer ${newAccess}`;
      return apiClient(original);
    } catch (refreshError) {
      processQueue(refreshError, null);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      useAuthStore.getState().logout();
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as ApiError | undefined;
    if (data?.detail) return data.detail;
    const fieldErrors = Object.entries(data ?? {})
      .filter(([, v]) => v)
      .map(([k, v]) => {
        if (Array.isArray(v)) return `${k}: ${v.join(', ')}`;
        if (typeof v === 'string') return `${k}: ${v}`;
        return k;
      });
    if (fieldErrors.length) return fieldErrors.join(' | ');
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return 'An unexpected error occurred';
}
