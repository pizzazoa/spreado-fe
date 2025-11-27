import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import GroupSidebar from '../components/GroupSidebar';
import ProfileModal from '../components/ProfileModal';
import MeetingDetailView from '../components/MeetingDetailView';
import InviteModal from '../components/InviteModal';
import MeetingLiveModal from '../components/MeetingLiveModal';
import { meetingService } from '../services/meetingService';
import { groupService } from '../services/groupService';
import type { Group, GroupDetail } from '../types';
import './MeetingPage.css';

export default function MeetingPage() {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [pendingInviteCode, setPendingInviteCode] = useState<string | null>(null);
  const startLiveConsumedRef = useRef(false);
  const [liveMeetingInfo, setLiveMeetingInfo] = useState<{
    meetingId: number;
    groupId?: number; // groupId 추가
    title: string;
    dateLabel: string;
    participants: string;
    hostUserId?: number;
    initialToken?: string; // 토큰 추가
  } | null>(null);

  const meetingIdNumber = meetingId ? Number(meetingId) : null;
  const startLiveFromNav = Boolean((location.state as { startLive?: boolean } | undefined)?.startLive);

  const formatDateLabel = (isoDate?: string) => {
    if (!isoDate) {
      const today = new Date();
      return `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
    }
    const parsed = new Date(isoDate);
    if (Number.isNaN(parsed.getTime())) {
      const today = new Date();
      return `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
    }
    return `${parsed.getFullYear()}년 ${parsed.getMonth() + 1}월 ${parsed.getDate()}일`;
  };

  const reloadGroups = async () => {
    try {
      const groupsData = await groupService.getMyGroups();
      setGroups(groupsData);
      if (selectedGroupId && !groupsData.find((g) => g.groupId === selectedGroupId)) {
        setSelectedGroupId(null);
      }
    } catch (error) {
      console.error('Failed to reload groups:', error);
    }
  };

  useEffect(() => {
    const loadGroups = async () => {
      try {
        await reloadGroups();
      } catch (error) {
        console.error('Failed to load groups:', error);
      }
    };
    loadGroups();
  }, []);

  useEffect(() => {
    const invite = sessionStorage.getItem('pendingInvite');
    if (invite) {
      setPendingInviteCode(invite);
      sessionStorage.removeItem('pendingInvite');
    }
  }, []);

  useEffect(() => {
    startLiveConsumedRef.current = false;
  }, [meetingIdNumber]);

  const loadMeetingContext = useCallback(async () => {
    if (!meetingIdNumber) return;
    try {
      const meetingData = await meetingService.getMeetingDetail(meetingIdNumber);

      const queryGroupId = Number(searchParams.get('groupId'));
      const effectiveGroupId = meetingData.groupId ?? (Number.isNaN(queryGroupId) ? null : queryGroupId) ?? selectedGroupId;

      if (effectiveGroupId) {
        setSelectedGroupId(effectiveGroupId);
        try {
          const groupData = await groupService.getGroupDetail(effectiveGroupId);
          setGroup(groupData);
        } catch (error) {
          console.error('Failed to load group detail:', error);
        }
      }

      const startLiveOnce = startLiveFromNav && !startLiveConsumedRef.current;
      if (startLiveOnce) startLiveConsumedRef.current = true;

      const shouldStartLive = startLiveOnce || meetingData.status === 'ONGOING';
      if (shouldStartLive) {
        let token: string | undefined;
        try {
          // [수정] joinMeeting 호출 시 반환된 토큰을 받음
          const joinResponse = await meetingService.joinMeeting(meetingIdNumber, effectiveGroupId ?? undefined);
          token = joinResponse.token; 
        } catch (error) {
          console.error('Failed to join meeting:', error);
        }

        setLiveMeetingInfo({
          meetingId: meetingIdNumber,
          groupId: effectiveGroupId ?? undefined, // groupId 저장
          title: meetingData.title,
          dateLabel: formatDateLabel(meetingData.startedAt || meetingData.createdAt),
          participants: (meetingData.members || []).map((m) => m.name).join(', ') || '참가자 없음',
          hostUserId: meetingData.hostUserId || meetingData.hostId,
          initialToken: token, // 모달로 넘겨줄 토큰 저장
        });
      } else {
        setLiveMeetingInfo(null);
      }
    } catch (error) {
      console.error('Failed to load meeting context:', error);
    }
  }, [meetingIdNumber, startLiveFromNav, searchParams, selectedGroupId]);

  useEffect(() => {
    loadMeetingContext();
  }, [loadMeetingContext]);

  const handleSelectGroup = (groupId: number | null) => {
    setSelectedGroupId(groupId);
    if (groupId) {
      navigate(`/main?groupId=${groupId}`);
    } else {
      navigate('/main');
    }
  };

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/main');
    }
  };

  if (!meetingIdNumber) {
    navigate('/main');
    return null;
  }

  return (
    <div className="meeting-layout">
      <Sidebar
        groups={groups}
        selectedGroupId={selectedGroupId}
        onSelectGroup={handleSelectGroup}
        onCreateGroup={() => navigate('/main')}
        onMyProfile={() => setShowProfileModal(true)}
      />

      <GroupSidebar
        group={group}
        currentMeeting={null}
        onBack={handleBack}
        onGroupsChanged={reloadGroups}
      />

      <MeetingDetailView meetingId={meetingIdNumber} onBack={handleBack} />

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

      {liveMeetingInfo && (
        <MeetingLiveModal
          meetingId={liveMeetingInfo.meetingId}
          groupId={liveMeetingInfo.groupId} // 전달
          title={liveMeetingInfo.title}
          dateLabel={liveMeetingInfo.dateLabel}
          participants={liveMeetingInfo.participants}
          hostUserId={liveMeetingInfo.hostUserId}
          initialToken={liveMeetingInfo.initialToken} // 전달
          onClose={() => setLiveMeetingInfo(null)}
          onEnded={async () => {
            setLiveMeetingInfo(null);
            await reloadGroups();
            await loadMeetingContext();
          }}
          onLeft={async () => {
            setLiveMeetingInfo(null);
            await reloadGroups();
            await loadMeetingContext();
          }}
        />
      )}
    </div>
  );
}
