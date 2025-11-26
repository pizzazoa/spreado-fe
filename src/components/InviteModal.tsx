import { useEffect, useState } from 'react';
import Modal from './Modal';
import RoleSelectModal from './RoleSelectModal';
import { groupService } from '../services/groupService';
import type { Role } from '../types';
import './InviteModal.css';

interface InviteModalProps {
  inviteCode: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function InviteModal({ inviteCode, isOpen, onClose, onSuccess }: InviteModalProps) {
  const [groupInfo, setGroupInfo] = useState<{ name: string; valid: boolean; message?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRoleSelect, setShowRoleSelect] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    const loadGroupInfo = async () => {
      if (!inviteCode || !isOpen) return;
      try {
        setLoading(true);
        const fullLink = `${window.location.origin}/invite/${inviteCode}`;
        const response = await groupService.getGroupByInviteLink(fullLink);
        setGroupInfo({ name: response.groupName, valid: true });
      } catch (error) {
        console.error('Failed to fetch invite group info:', error);
        setGroupInfo({ name: '', valid: false, message: '유효하지 않은 초대 링크입니다.' });
      } finally {
        setLoading(false);
      }
    };
    loadGroupInfo();
  }, [inviteCode, isOpen]);

  const handleAccept = () => {
    setShowRoleSelect(true);
  };

  const handleDecline = () => {
    onClose();
  };

  const handleRoleSelect = async (role: Role) => {
    if (!inviteCode) return;
    try {
      setIsJoining(true);
      await groupService.joinGroup({ inviteLink: `${window.location.origin}/invite/${inviteCode}`, role });
      alert('그룹에 참여했습니다!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to join group:', error);
      alert('그룹 참여에 실패했습니다.');
    } finally {
      setIsJoining(false);
      setShowRoleSelect(false);
    }
  };

  const isDisabled = loading || !groupInfo?.valid;

  return (
    <>
      <Modal isOpen={isOpen && !showRoleSelect} onClose={onClose}>
        <div className="invite-modal">
          <div className="invite-message">
            {loading && <p>초대 정보를 불러오는 중...</p>}
            {!loading && groupInfo && groupInfo.valid && (
              <>
                <p>"{groupInfo.name}"</p>
                <p>로부터의 초대를</p>
                <p>수락하시겠습니까?</p>
              </>
            )}
            {!loading && groupInfo && !groupInfo.valid && (
              <p>{groupInfo.message || '유효하지 않은 초대 링크입니다.'}</p>
            )}
          </div>

          <div className="invite-buttons">
            <button className="decline-button" onClick={handleDecline}>
              거절
            </button>
            <button className="accept-button" onClick={handleAccept} disabled={isDisabled}>
              수락
            </button>
          </div>
        </div>
      </Modal>

      <RoleSelectModal
        isOpen={showRoleSelect}
        onClose={() => setShowRoleSelect(false)}
        onConfirm={handleRoleSelect}
        isLoading={isJoining}
      />
    </>
  );
}
