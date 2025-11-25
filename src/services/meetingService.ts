import apiClient from './apiClient';
import type { Meeting, MeetingDetail, MeetingCreateRequest, NoteResponse } from '../types';

export const meetingService = {
  // 회의 생성
  createMeeting: async (data: MeetingCreateRequest): Promise<Meeting> => {
    const response = await apiClient.post<Meeting>('/meeting', data);
    return response.data;
  },

  // 내 회의 목록 조회
  getMyMeetings: async (): Promise<Meeting[]> => {
    const response = await apiClient.get<Meeting[]>('/meeting/my');
    return response.data;
  },

  // 그룹의 회의 목록 조회
  getMeetingsByGroup: async (groupId: number): Promise<Meeting[]> => {
    const response = await apiClient.get<Meeting[]>('/meeting', {
      params: { groupId },
    });
    return response.data;
  },

  // 회의 상세 조회
  getMeetingDetail: async (meetingId: number): Promise<MeetingDetail> => {
    const response = await apiClient.get<MeetingDetail>(`/meeting/${meetingId}`);
    return response.data;
  },

  // 회의 참여
  joinMeeting: async (meetingId: number): Promise<void> => {
    await apiClient.post(`/meeting/${meetingId}/join`);
  },

  // 회의 나가기
  leaveMeeting: async (meetingId: number): Promise<void> => {
    await apiClient.post(`/meeting/${meetingId}/leave`);
  },

  // 회의 종료 (호스트만 가능)
  endMeeting: async (meetingId: number): Promise<NoteResponse> => {
    const response = await apiClient.post<NoteResponse>(`/meeting/${meetingId}/end`);
    return response.data;
  },
};
