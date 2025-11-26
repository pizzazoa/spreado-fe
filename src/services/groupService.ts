import apiClient from './apiClient';
import type {
  Group,
  GroupDetail,
  GroupCreateRequest,
  GroupJoinRequest,
  GroupInviteRequest,
  GroupEmailInviteResponse,
  GroupInviteInfoResponse,
} from '../types';

export const groupService = {
  // 그룹 생성
  createGroup: async (data: GroupCreateRequest): Promise<Group> => {
    const response = await apiClient.post<Group>('/group', data);
    return response.data;
  },

  // 내 그룹 목록 조회
  getMyGroups: async (): Promise<Group[]> => {
    const response = await apiClient.get<Group[]>('/group');
    return response.data;
  },

  // 그룹 상세 조회
  getGroupDetail: async (groupId: number): Promise<GroupDetail> => {
    const response = await apiClient.get<GroupDetail>(`/group/${groupId}`);
    return response.data;
  },

  // 그룹 참여 (초대 링크)
  joinGroup: async (data: GroupJoinRequest): Promise<{ groupId: number }> => {
    const response = await apiClient.post<{ groupId: number }>('/group/join', data);
    return response.data;
  },

  // 그룹 나가기
  leaveGroup: async (groupId: number): Promise<void> => {
    await apiClient.post(`/group/${groupId}/leave`);
  },

  // 그룹 삭제 (리더만 가능)
  deleteGroup: async (groupId: number): Promise<void> => {
    await apiClient.delete(`/group/${groupId}`);
  },

  // 그룹 초대 이메일 발송
  inviteMembers: async (groupId: number, data: GroupInviteRequest): Promise<GroupEmailInviteResponse> => {
    const response = await apiClient.post<GroupEmailInviteResponse>(`/group/${groupId}/invite`, data);
    return response.data;
  },

  // 초대 링크로 그룹 정보 조회 (쿼리 파라미터 link)
  getGroupByInviteLink: async (inviteLink: string): Promise<GroupInviteInfoResponse> => {
    const response = await apiClient.get<GroupInviteInfoResponse>('/group/invite-info', {
      params: { link: inviteLink },
    });
    return response.data;
  },
};
