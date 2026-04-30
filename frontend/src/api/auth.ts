import { apiClient } from '../lib/api';
import type { TokenPair } from '../types/api';

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<TokenPair>('/token/', { email, password }).then((r) => r.data),

  register: (payload: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
  }) => apiClient.post<TokenPair>('/user/register/', payload).then((r) => r.data),

  refresh: (refresh: string) =>
    apiClient.post<{ access: string }>('/token/refresh/', { refresh }).then((r) => r.data),
};
