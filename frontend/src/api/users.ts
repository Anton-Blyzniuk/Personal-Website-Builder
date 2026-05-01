import { apiClient } from '../lib/api';
import type { UserProfile, ApiCredential, ApiCredentialWithSecret } from '../types/api';

export const usersApi = {
  getProfile: () => apiClient.get<UserProfile>('/user/my-info/').then((r) => r.data),

  updateProfile: (data: FormData | { first_name?: string; last_name?: string }) =>
    apiClient
      .patch<UserProfile>('/user/my-info/', data, {
        headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
      })
      .then((r) => r.data),

  changePassword: (current_password: string, new_password: string) =>
    apiClient
      .post<{ details: string }>('/user/change-password/', { current_password, new_password })
      .then((r) => r.data),

  getApiKey: () => apiClient.get<ApiCredential>('/user/api-key/').then((r) => r.data),

  createApiKey: () =>
    apiClient.post<ApiCredentialWithSecret>('/user/api-key/').then((r) => r.data),

  deleteApiKey: () => apiClient.delete('/user/api-key/').then((r) => r.data),

  rotateApiKey: () =>
    apiClient.post<ApiCredentialWithSecret>('/user/api-key/rotate/').then((r) => r.data),
};
