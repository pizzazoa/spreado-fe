import apiClient from './apiClient';
import type { AccessTokenResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const authService = {
  // Google OAuth 로그인 URL 생성 (백엔드 엔드포인트 사용)
  getGoogleAuthUrl: (): string => {
    return `${API_BASE_URL}/oauth2/authorization/google`;
  },

  // Access Token 재발급
  refreshAccessToken: async (refreshToken: string): Promise<AccessTokenResponse> => {
    const response = await apiClient.post<AccessTokenResponse>('/auth/refresh', null, {
      params: { refreshToken },
    });
    return response.data;
  },

  // 로그아웃
  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },

  // 토큰 저장
  saveTokens: (tokens: AccessTokenResponse): void => {
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
  },

  // 토큰 가져오기
  getAccessToken: (): string | null => {
    return localStorage.getItem('accessToken');
  },

  // 인증 여부 확인
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('accessToken');
  },

  // Google OAuth 콜백 처리 (code -> 토큰)
  handleGoogleCallback: async (code: string): Promise<AccessTokenResponse> => {
    const response = await apiClient.post<AccessTokenResponse>('/auth/google/callback', { code });
    return response.data;
  },
};
