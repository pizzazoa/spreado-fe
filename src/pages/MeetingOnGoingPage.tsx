import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import GroupSidebar from '../components/GroupSidebar';
import MeetingLiveModal from '../components/MeetingLiveModal';
import ProfileModal from '../components/ProfileModal';
import InviteModal from '../components/InviteModal';
import SummarySavingModal from '../components/SummarySavingModal';
import SummaryResultModal from '../components/SummaryResultModal';
import { groupService } from '../services/groupService';
import { meetingService } from '../services/meetingService';
import { summaryService } from '../services/summaryService';
import type { Group, GroupDetail, MeetingDetail, SummaryResponse } from '../types';
import './MeetingOnGoingPage.css';

export default function MeetingOnGoingPage() {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [meetingMeta, setMeetingMeta] = useState<MeetingDetail | null>(null);
  const [pendingInviteCode, setPendingInviteCode] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // [추가] 토큰 상태 관리
  const [token, setToken] = useState<string | undefined>(undefined);

  // [추가] 요약 모달 상태 관리
  const [showSavingModal, setShowSavingModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [summaryData, setSummaryData] = useState<SummaryResponse | null>(null);

  const meetingGroupIdRef = useRef<number | null>(null);

  const meetingIdNumber = useMemo(() => (meetingId ? Number(meetingId) : null), [meetingId]);

  const formatDateLabel = (isoDate?: string) => {
    const parsed = isoDate ? new Date(isoDate) : new Date();
    if (Number.isNaN(parsed.getTime())) {
      const today = new Date();
      const todayLabel = today.toLocaleDateString('ko-KR', { weekday: 'long' });
      return `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일 ${todayLabel}`;
    }
    const dayLabel = parsed.toLocaleDateString('ko-KR', { weekday: 'long' });
    return `${parsed.getFullYear()}년 ${parsed.getMonth() + 1}월 ${parsed.getDate()}일 ${dayLabel}`;
  };

  const reloadGroups = async () => {
    try {
      const groupsData = await groupService.getMyGroups();
      setGroups(groupsData);
      if (meetingMeta?.groupId && !selectedGroupId) {
        setSelectedGroupId(meetingMeta.groupId);
      } else if (selectedGroupId && !groupsData.find((g) => g.groupId === selectedGroupId)) {
        setSelectedGroupId(null);
      }
    } catch (error) {
      console.error('Failed to reload groups:', error);
    }
  };

  useEffect(() => {
    const invite = sessionStorage.getItem('pendingInvite');
    if (invite) {
      setPendingInviteCode(invite);
      sessionStorage.removeItem('pendingInvite');
    }
  }, []);

  useEffect(() => {
    const loadContext = async () => {
      if (!meetingIdNumber) {
        navigate('/main');
        return;
      }
      try {
        setLoading(true);
        const meetingData = await meetingService.getMeetingDetail(meetingIdNumber);
        setMeetingMeta(meetingData);

        const queryGroupIdRaw = new URLSearchParams(location.search).get('groupId');
        const queryGroupId = queryGroupIdRaw ? Number(queryGroupIdRaw) : null;

        if (meetingData.groupId) {
          setSelectedGroupId(meetingData.groupId);
          meetingGroupIdRef.current = meetingData.groupId;
        } else if (!Number.isNaN(queryGroupId) && queryGroupId) {
          setSelectedGroupId(queryGroupId);
          meetingGroupIdRef.current = queryGroupId;
        }

        try {
          // [수정] joinMeeting 호출 결과에서 토큰 추출하여 저장
          const joinResponse = await meetingService.joinMeeting(meetingIdNumber, meetingData.groupId ?? undefined);
          if (joinResponse.token) {
            setToken(joinResponse.token);
          }
        } catch (error) {
          console.error('Join meeting failed (ignored):', error);
        }
      } catch (error) {
        console.error('Failed to load ongoing meeting:', error);
        alert('회의 정보를 불러올 수 없습니다.');
        navigate('/main');
      } finally {
        setLoading(false);
      }
    };

    loadContext();
  }, [meetingIdNumber, navigate, location.search]);

  useEffect(() => {
    reloadGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const loadGroupDetail = async () => {
      const gid = meetingGroupIdRef.current ?? meetingMeta?.groupId ?? selectedGroupId;
      if (!gid) return;
      try {
        const groupData = await groupService.getGroupDetail(gid);
        setGroup(groupData);
      } catch (error) {
        console.error('Failed to load group detail:', error);
      }
    };

    loadGroupDetail();
  }, [meetingMeta?.groupId, selectedGroupId]);

  const handleLeave = () => {
    // 우선순위: meetingMeta.groupId (회의가 속한 그룹) > meetingGroupIdRef (초기 설정값) > selectedGroupId (현재 선택된 그룹)
    const targetGroupId = meetingMeta?.groupId ?? meetingGroupIdRef.current ?? selectedGroupId;
    const redirect = targetGroupId ? `/main?groupId=${targetGroupId}` : '/main';

    // 명확하게 메인 페이지로 이동 (뒤로가기 사용 안 함)
    navigate(redirect, { replace: true });
  };

  const handleBack = () => {
    handleLeave();
  };

  // [추가] 회의 종료 시작 핸들러 (로딩 모달 표시)
  const handleEndingStart = () => {
    setShowSavingModal(true);
  };

  // [추가] 회의 종료 완료 핸들러 (요약 조회 및 결과 모달 표시)
  const handleEndingComplete = async (noteId: number) => {
    try {
      // 요약 조회
      const summary = await summaryService.getSummaryByNote(noteId);
      setSummaryData(summary);
      setShowSavingModal(false);
      setShowResultModal(true);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
      setShowSavingModal(false);
      alert('요약을 불러오는 데 실패했습니다.');
      // 그룹 디테일 페이지로 이동
      handleLeave();
    }
  };

  // [추가] 회의 종료 취소 핸들러 (에러 발생 시 로딩 모달 닫기)
  const handleEndingCancel = () => {
    setShowSavingModal(false);
  };

  // [추가] 이메일 전송 완료 후 핸들러
  const handleSendComplete = () => {
    setShowResultModal(false);
    setSummaryData(null);
    // 회의가 속한 그룹의 디테일 페이지로 명확하게 이동
    const targetGroupId = meetingMeta?.groupId ?? meetingGroupIdRef.current ?? selectedGroupId;
    const redirect = targetGroupId ? `/main?groupId=${targetGroupId}` : '/main';
    navigate(redirect, { replace: true });
  };

  // [추가] 결과 모달 닫기 핸들러
  const handleResultModalClose = () => {
    setShowResultModal(false);
    setSummaryData(null);
    // 회의가 속한 그룹의 디테일 페이지로 명확하게 이동
    const targetGroupId = meetingMeta?.groupId ?? meetingGroupIdRef.current ?? selectedGroupId;
    const redirect = targetGroupId ? `/main?groupId=${targetGroupId}` : '/main';
    navigate(redirect, { replace: true });
  };

  if (!meetingIdNumber || loading || !meetingMeta) {
    return <div className="meeting-on-going-loading">로딩 중...</div>;
  }

  const participants = (meetingMeta.members || []).map((m) => m.name).join(', ');
  const currentMeetingForSidebar = {
    meetingId: meetingMeta.meetingId,
    groupId: meetingMeta.groupId ?? 0,
    title: meetingMeta.title,
    status: meetingMeta.status,
  } as const;

  return (
    <div className="meeting-on-going-layout">
      <Sidebar
        groups={groups}
        selectedGroupId={selectedGroupId}
        onSelectGroup={(gid) => {
          // 다른 그룹 선택 시 메인 페이지로 이동 (현재 페이지 완전히 벗어남)
          if (gid) {
            navigate(`/main?groupId=${gid}`, { replace: true });
          } else {
            navigate('/main', { replace: true });
          }
        }}
        onCreateGroup={() => navigate('/main', { replace: true })}
        onMyProfile={() => setShowProfileModal(true)}
      />

      <GroupSidebar
        group={group}
        currentMeeting={currentMeetingForSidebar}
        onBack={handleBack}
        onGroupsChanged={reloadGroups}
        disableBackButton
      />

      <div className="meeting-on-going-main">
        <div className="meeting-on-going-header">
          <div className="header-group">
            <button className="header-back" onClick={handleBack} aria-label="뒤로가기">←</button>
            <div className="header-chip">{group?.name ?? 'Group'}</div>
            <div className="header-chip primary">{meetingMeta.title}</div>
            <div className="header-chip">{formatDateLabel(meetingMeta.startedAt || meetingMeta.createdAt)}</div>
          </div>
          <button className="header-leave" onClick={handleLeave}>회의 나가기</button>
        </div>

        <div className="meeting-on-going-content">
          <MeetingLiveModal
            variant="inline"
            meetingId={meetingMeta.meetingId}
            groupId={meetingMeta.groupId || selectedGroupId || 0} // [필수] RoomID 생성용
            title={meetingMeta.title}
            dateLabel={formatDateLabel(meetingMeta.startedAt || meetingMeta.createdAt) || '날짜 미정'}
            participants={participants}
            hostUserId={meetingMeta.hostUserId || meetingMeta.hostId}
            initialToken={token} // [필수] API에서 받은 토큰 전달
            onClose={handleLeave}
            onEnded={handleLeave}
            onLeft={handleLeave}
            onEndingStart={handleEndingStart}
            onEndingComplete={handleEndingComplete}
            onEndingCancel={handleEndingCancel}
          />
        </div>
      </div>

      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />

      <SummarySavingModal isOpen={showSavingModal} />

      {summaryData && (
        <SummaryResultModal
          isOpen={showResultModal}
          onClose={handleResultModalClose}
          summaryId={summaryData.summaryId}
          summaryContent={summaryData.summaryJson}
          onSendComplete={handleSendComplete}
        />
      )}

      <InviteModal
        inviteCode={pendingInviteCode}
        isOpen={!!pendingInviteCode}
        onClose={() => setPendingInviteCode(null)}
        onSuccess={() => {
          setPendingInviteCode(null);
          (async () => {
            try {
              await reloadGroups();
            } catch (error) {
              console.error('Failed to reload groups after invite:', error);
            }
          })();
        }}
      />
    </div>
  );
}