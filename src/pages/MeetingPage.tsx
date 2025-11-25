import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import GroupSidebar from '../components/GroupSidebar';
import ProfileModal from '../components/ProfileModal';
import MeetingDetailView from '../components/MeetingDetailView';
import { meetingService } from '../services/meetingService';
import { groupService } from '../services/groupService';
import type { Group, GroupDetail } from '../types';
import './MeetingPage.css';

export default function MeetingPage() {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();

  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const meetingIdNumber = meetingId ? Number(meetingId) : null;

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
    const loadGroupForMeeting = async () => {
      if (!meetingIdNumber) return;
      try {
        const meetingData = await meetingService.getMeetingDetail(meetingIdNumber);
        if (meetingData.groupId) {
          setSelectedGroupId(meetingData.groupId);
          const groupData = await groupService.getGroupDetail(meetingData.groupId);
          setGroup(groupData);
        }
      } catch (error) {
        console.error('Failed to load meeting group:', error);
      }
    };
    loadGroupForMeeting();
  }, [meetingIdNumber]);

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
    </div>
  );
}
