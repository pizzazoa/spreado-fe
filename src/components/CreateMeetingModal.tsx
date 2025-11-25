import { useState } from 'react';
import Modal from './Modal';
import { meetingService } from '../services/meetingService';
import './CreateMeetingModal.css';

interface CreateMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: number;
  onSuccess: (meetingId: number) => void | Promise<void>;
}

export default function CreateMeetingModal({
  isOpen,
  onClose,
  groupId,
  onSuccess
}: CreateMeetingModalProps) {
  const [meetingName, setMeetingName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (!meetingName.trim()) {
      alert('회의 이름을 입력해주세요.');
      return;
    }

    try {
      setIsLoading(true);
      const response = await meetingService.createMeeting({
        groupId,
        title: meetingName.trim()
      });

      setMeetingName('');
      await onSuccess(response.meetingId);
      onClose();
    } catch (error) {
      console.error('Failed to create meeting:', error);
      alert('회의 생성에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const isButtonEnabled = meetingName.trim().length > 0 && !isLoading;

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton>
      <div className="create-meeting-modal">
        {/* Meeting Name */}
        <div className="modal-field">
          <label className="modal-label">Meeting Name</label>
          <input
            type="text"
            className="modal-input"
            value={meetingName}
            onChange={(e) => setMeetingName(e.target.value)}
            placeholder="회의 이름을 입력하세요."
            disabled={isLoading}
          />
        </div>

        {/* 회의 생성 버튼 */}
        <div className="modal-footer">
          <button
            className={`modal-button ${!isButtonEnabled ? 'secondary' : ''}`}
            onClick={handleCreate}
            disabled={!isButtonEnabled}
          >
            {isLoading ? '생성 중...' : '회의 생성'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
