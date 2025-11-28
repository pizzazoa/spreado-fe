import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { groupService } from '../services/groupService';
import { meetingService } from '../services/meetingService';
import type { GroupDetail as GroupDetailType, Meeting, MeetingCreateResponse } from '../types';
import AddMemberModal from './AddMemberModal';
import CreateMeetingModal from './CreateMeetingModal';
import MeetingDetailView from './MeetingDetailView';
import ConfirmModal from './ConfirmModal';
import './GroupDetail.css';

interface GroupDetailProps {
  groupId: number;
}

// [추가] 모던한 SVG 아이콘 컴포넌트
const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const UserGroupIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

export default function GroupDetail({ groupId }: GroupDetailProps) {
  const navigate = useNavigate();
  const [group, setGroup] = useState<GroupDetailType | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showCreateMeetingModal, setShowCreateMeetingModal] = useState(false);
  const [selectedMeetingId, setSelectedMeetingId] = useState<number | null>(null);
  const [showGroupConfirm, setShowGroupConfirm] = useState(false);

  const currentMeeting = meetings.find(m => m.status === 'ONGOING');

  const formatMeetingDate = (isoDate?: string) => {
    if (!isoDate) return '날짜 정보 없음';
    const parsed = new Date(isoDate);
    if (Number.isNaN(parsed.getTime())) return '날짜 정보 없음';
    const weekday = parsed.toLocaleDateString('ko-KR', { weekday: 'long' });
    return `${parsed.getFullYear()}년 ${parsed.getMonth() + 1}월 ${parsed.getDate()}일 ${weekday}`;
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [groupData, meetingsData] = await Promise.all([
          groupService.getGroupDetail(groupId),
          meetingService.getMeetingsByGroup(groupId),
        ]);
        setGroup(groupData);
        
        // 최신순(createdAt 내림차순) 정렬
        const sortedMeetings = meetingsData.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });
        setMeetings(sortedMeetings);
      } catch (error) {
        console.error('Failed to load group data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [groupId]);

  const handleBack = () => {
    navigate('/main');
  };

  const handleCreateMeeting = () => {
    setShowCreateMeetingModal(true);
  };

  const handleMeetingCreated = async (payload: MeetingCreateResponse) => {
    navigate(`/meeting-live/${payload.meetingId}?groupId=${groupId}`);
  };

  const handleAddMember = () => {
    setShowAddMemberModal(true);
  };

  const handleGroupConfirm = async () => {
    if (!group) return;
    try {
      if (group.isLeader) {
        await groupService.deleteGroup(group.groupId);
      } else {
        await groupService.leaveGroup(group.groupId);
      }
      navigate('/main');
    } catch (error) {
      console.error('Failed to update group:', error);
      alert('작업에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setShowGroupConfirm(false);
    }
  };

  const handleJoinMeeting = async (meetingId: number) => {
    try {
      await meetingService.joinMeeting(meetingId, groupId);
      const targetMeeting = meetings.find((m) => m.meetingId === meetingId);
      if (targetMeeting?.status === 'ONGOING') {
        navigate(`/meeting-live/${meetingId}?groupId=${groupId}`);
      } else {
        navigate(`/meeting/${meetingId}?groupId=${groupId}`);
      }
    } catch (error) {
      console.error('Failed to join meeting:', error);
      alert('회의 참가에 실패했습니다.');
    }
  };

  const handleViewMeetingDetail = (meetingId: number) => {
    setSelectedMeetingId(meetingId);
  };

  return (
    <>
      <div className="group-detail-container">
        {loading && (
          <div className="group-detail-loading">로딩 중...</div>
        )}

        {!loading && !group && (
          <div className="group-detail-error">그룹을 찾을 수 없습니다.</div>
        )}

        {!loading && group && (
          <>
            {/* 왼쪽 패널 - 그룹 디테일 사이드바 */}
            <div className="group-detail-sidebar">
              <div className="sidebar-header">
                <button className="back-button" onClick={handleBack} aria-label="뒤로가기">
                  ←
                </button>
                <div className="group-info">
                  <div className="group-avatar">
                    {group.name.charAt(0).toUpperCase()}
                  </div>
                  <h2 className="group-name">{group.name}</h2>
                </div>
                <button
                  className="group-settings-btn"
                  onClick={() => setShowGroupConfirm(true)}
                  aria-label="그룹 설정"
                  title={group.isLeader ? '그룹 삭제' : '그룹 탈퇴'}
                >
                  ⚙
                </button>
              </div>

              <div className="sidebar-divider" />

              <div className="sidebar-section">
                <div className="section-header">현재 진행 중인 회의</div>
                <div className="current-meeting-wrapper">
                  {currentMeeting ? (
                    <div className="current-meeting-card">
                      <div className="meeting-indicator active" />
                      <span className="meeting-name">{currentMeeting.title}</span>
                    </div>
                  ) : (
                    <div className="current-meeting-empty">
                      진행 중인 회의가 없습니다
                    </div>
                  )}
                </div>
              </div>

              <div className="sidebar-divider" />

              <div className="sidebar-section members-section">
                <div className="section-header">Group Members</div>
                <div className="members-list">
                  {group.members.map((member) => (
                    <div key={member.userId} className="member-card">
                      <span className="member-role">{member.role}</span>
                      <span className="member-separator">|</span>
                      <span className="member-name">{member.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="sidebar-divider" />

              <button className="add-member-btn" onClick={handleAddMember}>
                멤버 추가하기
              </button>
            </div>

            {/* 오른쪽 메인 영역 - 회의 목록 */}
            <div className="meetings-main">
              {!selectedMeetingId ? (
                <>
                  <div className="meetings-header">
                    <button className="meetings-header-btn">회의 목록</button>
                  </div>

                  <div className="meetings-list">
                  {meetings.length === 0 ? (
                      <div className="meetings-empty">
                        아직 생성된 회의가 없습니다.
                      </div>
                    ) : (
                      meetings.map((meeting) => {
                        const isOngoing = meeting.status === 'ONGOING';
                        const memberCount = meeting.members?.length ?? group.members.length;
                        const dateLabel = formatMeetingDate(meeting.createdAt);

                        return (
                          <div
                            key={meeting.meetingId}
                            className={`meeting-card ${!isOngoing ? 'clickable' : ''}`}
                            onClick={!isOngoing ? () => handleViewMeetingDetail(meeting.meetingId) : undefined}
                          >
                            <div className="meeting-status">
                              <div className={`status-dot ${isOngoing ? 'active' : ''}`} />
                              <h3 className="meeting-title">{meeting.title}</h3>
                            </div>
                            <div className="meeting-meta">
                              {/* [수정] 아이콘 적용 */}
                              <span className="meeting-date" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <CalendarIcon /> {dateLabel}
                              </span>
                              <span className="meeting-members" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <UserGroupIcon /> {memberCount}명
                              </span>
                            </div>
                            {isOngoing && (
                              <button
                                className="join-meeting-btn"
                                onClick={() => handleJoinMeeting(meeting.meetingId)}
                              >
                                참가
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  <button className="create-meeting-btn" onClick={handleCreateMeeting}>
                    새 회의 생성
                  </button>
                </>
              ) : (
                <div className="meeting-detail-embed">
                  <MeetingDetailView meetingId={selectedMeetingId} onBack={() => setSelectedMeetingId(null)} />
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {group && (
        <AddMemberModal
          isOpen={showAddMemberModal}
          onClose={() => setShowAddMemberModal(false)}
          inviteLink={group.inviteLink}
          groupId={group.groupId}
        />
      )}

      {group && (
        <CreateMeetingModal
          isOpen={showCreateMeetingModal}
          onClose={() => setShowCreateMeetingModal(false)}
          groupId={groupId}
          onSuccess={handleMeetingCreated}
        />
      )}

      <ConfirmModal
        isOpen={showGroupConfirm}
        title={`정말로 "${group?.name ?? ''}"을 ${group?.isLeader ? '삭제' : '나가'}하시겠습니까?`}
        message=""
        confirmText={group?.isLeader ? '그룹 삭제하기' : '그룹 탈퇴하기'}
        cancelText="취소"
        confirmColor="red"
        onConfirm={handleGroupConfirm}
        onCancel={() => setShowGroupConfirm(false)}
      />
    </>
  );
}