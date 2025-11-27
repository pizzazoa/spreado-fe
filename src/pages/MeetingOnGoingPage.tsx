import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import GroupSidebar from '../components/GroupSidebar';
import MeetingLiveModal from '../components/MeetingLiveModal';
import ProfileModal from '../components/ProfileModal';
import InviteModal from '../components/InviteModal';
import { groupService } from '../services/groupService';
import { meetingService } from '../services/meetingService';
import type { Group, GroupDetail, MeetingDetail } from '../types';
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
    const searchGroupId = Number(new URLSearchParams(location.search).get('groupId'));
    const targetGroupId = meetingGroupIdRef.current || meetingMeta?.groupId || selectedGroupId || (Number.isNaN(searchGroupId) ? null : searchGroupId);
    const redirect = targetGroupId ? `/main?groupId=${targetGroupId}` : '/main';
    
    // 뒤로가기가 가능한 경우 뒤로 가고, 아니면 메인으로 이동
    if (window.history.length > 1) navigate(-1);
    else navigate(redirect);
  };

  const handleBack = () => {
    handleLeave();
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
        onSelectGroup={(gid) => setSelectedGroupId(gid)}
        onCreateGroup={() => navigate('/main')}
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
          />
        </div>
      </div>

      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />

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