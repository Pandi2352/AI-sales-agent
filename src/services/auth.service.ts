import { apiClient, ENDPOINTS } from '@/api';
import type { ApiResponse, AuthTokens, User } from '@/types';

export const authService = {
  async login(email: string, password: string) {
    const { data } = await apiClient.post<ApiResponse<AuthTokens>>(
      ENDPOINTS.AUTH.LOGIN,
      { email, password },
    );
    return data;
  },

  async register(name: string, email: string, password: string) {
    const { data } = await apiClient.post<ApiResponse<User>>(
      ENDPOINTS.AUTH.REGISTER,
      { name, email, password },
    );
    return data;
  },

  async logout() {
    const { data } = await apiClient.post<ApiResponse<null>>(ENDPOINTS.AUTH.LOGOUT);
    return data;
  },
};
