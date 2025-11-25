import apiClient from './apiClient';
import type { User } from '../types';

export const userService = {
  // 내 정보 조회
  getMyInfo: async (): Promise<User> => {
    const response = await apiClient.get<User>('/user/me');
    return response.data;
  },

  // 특정 사용자 정보 조회
  getUserById: async (id: number): Promise<User> => {
    const response = await apiClient.get<User>(`/user/${id}`);
    return response.data;
  },

  // 사용자 정보 업데이트 (닉네임 설정)
  updateMyInfo: async (name: string): Promise<User> => {
    const response = await apiClient.patch<User>('/user/name', null, {
      params: { name },
    });
    return response.data;
  },
};
