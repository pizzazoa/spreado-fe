import apiClient from './apiClient';
import type { SummaryResponse, SummaryUpdateRequest } from '../types';

export const summaryService = {
  // AI 요약 생성 (또는 갱신)
  createSummary: async (noteId: number): Promise<SummaryResponse> => {
    const response = await apiClient.post<SummaryResponse>(`/summaries/${noteId}`);
    return response.data;
  },

  // 노트 ID로 요약 조회
  getSummaryByNote: async (noteId: number): Promise<SummaryResponse> => {
    const response = await apiClient.get<SummaryResponse>(`/summaries/${noteId}`);
    return response.data;
  },

  // 요약 수정
  updateSummary: async (summaryId: number, data: SummaryUpdateRequest): Promise<SummaryResponse> => {
    const response = await apiClient.put<SummaryResponse>(`/summaries/${summaryId}`, data);
    return response.data;
  },

  // 요약 이메일 전송
  sendSummaryMail: async (summaryId: number): Promise<void> => {
    await apiClient.post(`/summaries/${summaryId}/mail`);
  },
};
