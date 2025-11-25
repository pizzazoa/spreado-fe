import { useState } from 'react';
import type { GroupDetail as GroupDetailType, Meeting } from '../types';
import { groupService } from '../services/groupService';
import ConfirmModal from './ConfirmModal';
import './GroupDetail.css';

interface GroupSidebarProps {
  group: GroupDetailType | null;
  currentMeeting?: Meeting | null;
  onBack: () => void;
  onGroupsChanged?: () => void;
}

export default function GroupSidebar({ group, currentMeeting, onBack, onGroupsChanged }: GroupSidebarProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleConfirm = async () => {
    if (!group) return;
    try {
      if (group.isLeader) {
        await groupService.deleteGroup(group.groupId);
      } else {
        await groupService.leaveGroup(group.groupId);
      }
      if (onGroupsChanged) onGroupsChanged();
      onBack();
    } catch (error) {
      console.error('Group action failed:', error);
      alert('작업에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setShowConfirm(false);
    }
  };

  return (
    <div className="group-detail-sidebar meeting-group-sidebar">
      <div className="sidebar-header">
        <button className="back-button" onClick={onBack} aria-label="뒤로가기">
          ←
        </button>
        <div className="group-info">
          <div className="group-avatar">{group?.name?.charAt(0).toUpperCase() ?? '?'}</div>
          <h2 className="group-name">{group?.name ?? '그룹'}</h2>
        </div>
        <button
          className="group-settings-btn"
          onClick={() => setShowConfirm(true)}
          aria-label="그룹 설정"
          title={group?.isLeader ? '그룹 삭제' : '그룹 탈퇴'}
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
              <div className={`meeting-indicator ${currentMeeting.status === 'ONGOING' ? 'active' : ''}`} />
              <span className="meeting-name">{currentMeeting.title}</span>
            </div>
          ) : (
            <div className="current-meeting-empty">회의 정보 없음</div>
          )}
        </div>
      </div>

      <div className="sidebar-divider" />

        <div className="sidebar-section members-section">
          <div className="section-header">Group Members</div>
          <div className="members-list">
            {group?.members.map((member) => (
              <div key={member.userId} className="member-card">
              <span className="member-role">{member.role}</span>
              <span className="member-separator">|</span>
              <span className="member-name">{member.name}</span>
            </div>
          ))}
        </div>
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        title={`정말로 "${group?.name ?? ''}"을 ${group?.isLeader ? '삭제' : '나가'}하시겠습니까?`}
        message=""
        confirmText={group?.isLeader ? '그룹 삭제하기' : '그룹 탈퇴하기'}
        cancelText="취소"
        confirmColor="red"
        onConfirm={handleConfirm}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
