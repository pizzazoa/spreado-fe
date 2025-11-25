import { useState } from 'react';
import Modal from './Modal';
import RoleSelectModal from './RoleSelectModal';
import { groupService } from '../services/groupService';
import type { Role } from '../types';
import './GroupInviteModal.css';

interface GroupInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupName: string;
  inviteLink: string;
  onSuccess: () => void;
}

export default function GroupInviteModal({
  isOpen,
  onClose,
  groupName,
  inviteLink,
  onSuccess
}: GroupInviteModalProps) {
  const [showRoleSelect, setShowRoleSelect] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAccept = () => {
    setShowRoleSelect(true);
  };

  const handleDecline = () => {
    onClose();
  };

  const handleRoleSelect = async (role: Role) => {
    try {
      setIsLoading(true);
      await groupService.joinGroup({ inviteLink, role });
      alert('그룹에 참여했습니다!');
      setShowRoleSelect(false);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to join group:', error);
      alert('그룹 참여에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen && !showRoleSelect} onClose={onClose}>
        <div className="group-invite-modal">
          <div className="invite-message">
            <p>"{groupName}"</p>
            <p>로부터의 초대를</p>
            <p>수락하시겠습니까?</p>
          </div>

          <div className="invite-buttons">
            <button className="decline-button" onClick={handleDecline}>
              거절
            </button>
            <button className="accept-button" onClick={handleAccept}>
              수락
            </button>
          </div>
        </div>
      </Modal>

      {/* 역할 선택 모달 */}
      <RoleSelectModal
        isOpen={showRoleSelect}
        onClose={() => setShowRoleSelect(false)}
        onConfirm={handleRoleSelect}
        isLoading={isLoading}
      />
    </>
  );
}
