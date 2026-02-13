import { apiClient, ENDPOINTS } from '@/api';
import type { ApiResponse, User } from '@/types';

export const userService = {
  async getProfile() {
    const { data } = await apiClient.get<ApiResponse<User>>(ENDPOINTS.USERS.PROFILE);
    return data;
  },

  async getById(id: string) {
    const { data } = await apiClient.get<ApiResponse<User>>(ENDPOINTS.USERS.BY_ID(id));
    return data;
  },
};
