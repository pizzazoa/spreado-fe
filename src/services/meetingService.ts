import apiClient from './apiClient';
import type { 
  Meeting, 
  MeetingDetail, 
  MeetingCreateRequest, 
  MeetingCreateResponse, 
  MeetingJoinResponse, 
  NoteResponse,
  LiveblocksTokenResponse
} from '../types';

export const meetingService = {
  // 회의 생성
  createMeeting: async (data: MeetingCreateRequest): Promise<MeetingCreateResponse> => {
    const response = await apiClient.post<MeetingCreateResponse>('/meeting', data);
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

  // 회의 참여 (토큰 반환됨)
  joinMeeting: async (meetingId: number, _groupIdHint?: number): Promise<MeetingJoinResponse> => {
    const response = await apiClient.post<MeetingJoinResponse>(`/meeting/${meetingId}/join`);
    return response.data;
  },

  // 회의 나가기
  leaveMeeting: async (meetingId: number): Promise<void> => {
    await apiClient.post(`/meeting/${meetingId}/leave`);
  },

  // [수정] 회의 종료 (컨텐츠 저장 포함)
  endMeeting: async (meetingId: number): Promise<NoteResponse> => {
    const response = await apiClient.post<NoteResponse>(`/meeting/${meetingId}/end`);
    return response.data;
  },

  // [추가] Liveblocks 토큰 개별 발급 (새로고침/재접속용)
  getLiveblocksToken: async (meetingId: number): Promise<LiveblocksTokenResponse> => {
    const response = await apiClient.post<LiveblocksTokenResponse>(`/liveblocks/${meetingId}`);
    return response.data;
  },
};