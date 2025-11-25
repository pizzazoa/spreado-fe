import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { groupService } from '../services/groupService';
import type { Group } from '../types';
import Sidebar from '../components/Sidebar';
import GroupDetail from '../components/GroupDetail';
import ProfileModal from '../components/ProfileModal';
import CreateGroupModal from '../components/CreateGroupModal';
import logoImage from '../assets/spreado_logo.png';
import './MainPage.css';

export default function MainPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);

  // URL에서 groupId 파라미터 읽기
  useEffect(() => {
    const groupId = searchParams.get('groupId');
    if (groupId) {
      setSelectedGroupId(Number(groupId));
    } else {
      setSelectedGroupId(null);
    }
  }, [searchParams]);

  // 로그인 확인
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/');
    }
  }, [authLoading, isAuthenticated, navigate]);

  // 그룹 목록 로드
  useEffect(() => {
    const loadGroups = async () => {
      try {
        setLoading(true);
        const fetchedGroups = await groupService.getMyGroups();
        setGroups(fetchedGroups);
      } catch (error) {
        console.error('Failed to load groups:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      loadGroups();
    }
  }, [isAuthenticated]);

  const handleSelectGroup = (groupId: number | null) => {
    setSelectedGroupId(groupId);
    if (groupId) {
      navigate(`/main?groupId=${groupId}`);
    } else {
      navigate('/main');
    }
  };

  const handleCreateGroup = () => {
    setShowProfileModal(false);
    setShowCreateGroupModal(true);
  };

  const handleMyProfile = () => {
    setShowCreateGroupModal(false);
    setShowProfileModal(true);
  };

  const handleGroupCreated = async () => {
    // 그룹 목록 새로고침
    try {
      const fetchedGroups = await groupService.getMyGroups();
      setGroups(fetchedGroups);
    } catch (error) {
      console.error('Failed to reload groups:', error);
    }
  };

  if (authLoading || loading) {
    return <div className="loading">로딩 중...</div>;
  }

  return (
    <div className="main-page">
      <Sidebar
        groups={groups}
        selectedGroupId={selectedGroupId}
        onSelectGroup={handleSelectGroup}
        onCreateGroup={handleCreateGroup}
        onMyProfile={handleMyProfile}
      />

      <div className={`main-content ${selectedGroupId ? 'with-group-detail' : ''}`}>
        {!selectedGroupId && (
          <div className="empty-state">
            <img src={logoImage} alt="SpreaDo" className="empty-logo" />
            <div className="empty-text">
              <p>새 그룹을 생성하거나</p>
              <p>&nbsp;</p>
              <p>기존 그룹에 참여하세요!</p>
            </div>
          </div>
        )}
      </div>

      {selectedGroupId && <GroupDetail groupId={selectedGroupId} />}

      {/* 프로필 모달 */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

      {/* 그룹 생성 모달 */}
      <CreateGroupModal
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        onSuccess={handleGroupCreated}
      />
    </div>
  );
}
