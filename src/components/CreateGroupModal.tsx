import { useState } from 'react';
import { groupService } from '../services/groupService';
import Modal from './Modal';
import RoleSelectModal from './RoleSelectModal';
import type { Role } from '../types';
import './CreateGroupModal.css';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateGroupModal({ isOpen, onClose, onSuccess }: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState('');
  const [inviteEmails, setInviteEmails] = useState<string[]>(['']);
  const [showRoleSelect, setShowRoleSelect] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddEmailField = () => {
    setInviteEmails([...inviteEmails, '']);
  };

  const handleRemoveEmailField = (index: number) => {
    if (inviteEmails.length === 1) return;
    const newEmails = inviteEmails.filter((_, i) => i !== index);
    setInviteEmails(newEmails);
  };

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...inviteEmails];
    newEmails[index] = value;
    setInviteEmails(newEmails);
  };

  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      alert('그룹 이름을 입력해주세요.');
      return;
    }
    // 역할 선택 팝업 표시
    setShowRoleSelect(true);
  };

  const handleRoleSelect = async (role: Role) => {
    try {
      setIsLoading(true);
      // 빈 이메일 제거
      const validEmails = inviteEmails.filter(email => email.trim());

      await groupService.createGroup({
        name: groupName.trim(),
        inviteEmails: validEmails,
        role,
      });

      alert('그룹이 생성되었습니다!');
      setGroupName('');
      setInviteEmails(['']);
      setShowRoleSelect(false);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to create group:', error);
      alert('그룹 생성에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const isButtonEnabled = groupName.trim().length > 0;

  return (
    <>
      <Modal isOpen={isOpen && !showRoleSelect} onClose={onClose} showCloseButton>
        <div className="create-group-modal">
          {/* Group Name */}
          <div className="modal-field">
            <label className="modal-label">Group Name</label>
            <input
              type="text"
              className="modal-input"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="그룹의 이름을 입력하세요."
            />
          </div>

          {/* Invite Member */}
          <div className="modal-field invite-section">
            <label className="modal-label">Invite Member</label>
            <div className="email-inputs-container">
              <button className="add-email-button" onClick={handleAddEmailField} title="이메일 추가">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
              </button>
              <div className="email-inputs">
                {inviteEmails.map((email, index) => (
                  <div key={index} className="email-input-row">
                    <input
                      type="email"
                      className="modal-input email-input"
                      value={email}
                      onChange={(e) => handleEmailChange(index, e.target.value)}
                      placeholder="멤버의 e-mail을 입력하세요"
                    />
                    {inviteEmails.length > 1 && (
                      <button
                        className="remove-email-button"
                        onClick={() => handleRemoveEmailField(index)}
                        title="삭제"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 그룹 생성 버튼 */}
          <div className="modal-footer">
            <button
              className={`modal-button ${!isButtonEnabled ? 'secondary' : ''}`}
              onClick={handleCreateGroup}
              disabled={!isButtonEnabled}
            >
              그룹 생성
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
