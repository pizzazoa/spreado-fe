import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';
import { authService } from '../services/authService';
import Modal from './Modal';
import logoImage from '../assets/spreado_logo.png';
import './ProfileModal.css';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
    }
  }, [user]);

  const handleUpdateName = async () => {
    if (!name.trim()) {
      alert('이름을 입력해주세요.');
      return;
    }

    try {
      setIsLoading(true);
      await userService.updateMyInfo(name.trim());
      alert('이름이 수정되었습니다.');
      onClose();
    } catch (error) {
      console.error('Failed to update name:', error);
      alert('이름 수정에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to logout:', error);
      alert('로그아웃에 실패했습니다.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="profile-modal">
        {/* 로고 */}
        <div className="profile-logo">
          <img src={logoImage} alt="SpreadDo Logo" />
        </div>

        {/* 로그아웃 버튼 */}
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>

        {/* E-mail (읽기 전용) */}
        <div className="modal-field">
          <label className="modal-label">E-mail</label>
          <div className="modal-input readonly">
            {user?.email || ''}
          </div>
        </div>

        {/* Name (수정 가능) */}
        <div className="modal-field">
          <label className="modal-label">Name</label>
          <input
            type="text"
            className="modal-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름을 입력하세요"
          />
        </div>

        {/* 이름 수정하기 버튼 */}
        <div className="modal-footer">
          <button
            className="modal-button"
            onClick={handleUpdateName}
            disabled={isLoading}
          >
            이름 수정하기
          </button>
        </div>
      </div>
    </Modal>
  );
}
