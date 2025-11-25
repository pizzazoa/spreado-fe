import { useState } from 'react';
import Modal from './Modal';
import type { Role } from '../types';
import './RoleSelectModal.css';

interface RoleSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (role: Role) => void;
  isLoading?: boolean;
}

const ROLES: Role[] = ['PM', 'PD', 'FE', 'BE', 'AI'];

export default function RoleSelectModal({ isOpen, onClose, onConfirm, isLoading }: RoleSelectModalProps) {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const handleConfirm = () => {
    if (!selectedRole) {
      alert('역할을 선택해주세요.');
      return;
    }
    onConfirm(selectedRole);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="role-select-modal">
        {/* 뒤로가기 버튼 */}
        <button className="role-back-button" onClick={onClose} aria-label="뒤로가기">
          ←
        </button>

        {/* 제목 */}
        <div className="role-title">
          <p>그룹 내 본인의 역할을</p>
          <p>&nbsp;</p>
          <p>선택해주세요.</p>
          <p>&nbsp;</p>
          <p className="role-subtitle">(수정 불가하니 신중하게 선택하세요)</p>
        </div>

        {/* 역할 버튼들 */}
        <div className="role-buttons">
          {ROLES.map((role) => (
            <button
              key={role}
              className={`role-button ${selectedRole === role ? 'selected' : ''}`}
              onClick={() => setSelectedRole(role)}
            >
              {role}
            </button>
          ))}
        </div>

        {/* 확인 버튼 */}
        <div className="modal-footer">
          <button
            className="modal-button"
            onClick={handleConfirm}
            disabled={!selectedRole || isLoading}
          >
            확인
          </button>
        </div>
      </div>
    </Modal>
  );
}
