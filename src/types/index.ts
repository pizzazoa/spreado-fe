// User Types
export interface User {
  id: number;
  email: string;
  name: string;
  profileImageUrl?: string;
  createdAt: string;
}

// Auth Types
export interface AccessTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface GoogleAuthResponse {
  code: string;
  state?: string;
}

// API Error Type
export interface ApiError {
  status: number;
  message: string;
}

// Group Types
export type Role = 'PM' | 'PD' | 'FE' | 'BE' | 'AI' | 'ALL';

// GET /group 응답 (GroupSummaryResponse)
export interface Group {
  groupId: number;
  name: string;
  role: Role;
}

export interface GroupWithLeader extends Group {
  isLeader: boolean;
}

// GroupMemberResponse
export interface GroupMember {
  userId: number;
  name: string;
  role: Role;
}

// GET /group/{groupId} 응답 (GroupDetailResponse)
export interface GroupDetail {
  groupId: number;
  name: string;
  inviteLink: string;
  myRole: Role;
  isLeader: boolean;
  members: GroupMember[];
}

export interface GroupCreateRequest {
  name: string;
  role: Role;
  inviteEmails?: string[];
}

export interface GroupJoinRequest {
  inviteLink: string;
  role: Role;
}

export interface GroupInviteRequest {
  emails: string[];
  message?: string;
}

export interface GroupEmailInviteResponse {
  groupId: number;
  successCount: number;
  sentEmails: string[];
}

export interface GroupInviteInfoResponse {
  groupId: number;
  groupName: string;
  memberCount: number;
  leaderName: string;
  inviteLink: string;
}

// Meeting Types
export type MeetingStatus = 'ONGOING' | 'ENDED';

// MeetingSummaryResponse
export interface Meeting {
  meetingId: number;
  groupId: number;
  title: string;
  status: MeetingStatus;
  createdAt?: string;
  startedAt?: string;
  endedAt?: string;
  members?: MeetingMember[];
}

// MeetingDetailResponse
export interface MeetingDetail {
  meetingId: number;
  title: string;
  status: MeetingStatus;
  members: MeetingMember[];
  noteId?: number;
  // Optional fields kept for backward compatibility with earlier API versions
  groupId?: number;
  summary?: string;
  note?: string;
  hostId?: number;
  hostUserId?: number;
  summaryId?: number;
  startedAt?: string;
  createdAt?: string;
  endedAt?: string;
}

// MeetingMemberResponse
export interface MeetingMember {
  userId: number;
  name: string;
  role?: Role;
}

export interface MeetingCreateRequest {
  groupId: number;
  title: string;
}

export interface MeetingCreateResponse {
  meetingId: number;
  groupId: number;
  token: string;
  roomId?: string;
}

export interface MeetingJoinResponse {
  meetingId?: number;
  groupId?: number;
  token: string;
  roomId?: string;
}

// Note Types
export interface NoteResponse {
  noteId: number;
  meetingId: number;
  content: unknown;
}

// Summary Types
export interface SummaryResponse {
  summaryId: number;
  noteId: number;
  summaryJson: string;
}

export interface SummaryUpdateRequest {
  summaryJson: string;
}

export interface LiveblocksTokenResponse {
  token: string;
}