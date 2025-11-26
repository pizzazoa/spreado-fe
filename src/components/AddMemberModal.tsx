import { useState } from 'react';
import { groupService } from '../services/groupService';
import Modal from './Modal';
import './AddMemberModal.css';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  inviteLink?: string;
  groupId?: number;
}

export default function AddMemberModal({ isOpen, onClose, groupId }: AddMemberModalProps) {
  const [emails, setEmails] = useState<string[]>(['']);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleAddEmailField = () => {
    setEmails([...emails, '']);
  };

  const handleRemoveEmailField = (index: number) => {
    if (emails.length === 1) return;
    const newEmails = emails.filter((_, i) => i !== index);
    setEmails(newEmails);
  };

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const handleAdd = async () => {
    if (!groupId) {
      alert('그룹 정보를 불러올 수 없습니다.');
      return;
    }
    const validEmails = emails.map(e => e.trim()).filter(Boolean);
    if (validEmails.length === 0) {
      alert('초대할 이메일을 입력해주세요.');
      return;
    }

    try {
      setIsSending(true);
      await groupService.inviteMembers(groupId, { emails: validEmails, message: message.trim() || undefined });
      alert('초대 메일을 전송했습니다.');
      setEmails(['']);
      setMessage('');
      onClose();
    } catch (error) {
      console.error('Failed to send invites:', error);
      alert('초대 메일 전송에 실패했습니다.');
    } finally {
      setIsSending(false);
    }
  };

  const isButtonEnabled = emails.some(e => e.trim());

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton>
      <div className="add-member-modal">
        {/* Add Member */}
        <div className="modal-field">
          <label className="modal-label">Add Member</label>
          <div className="email-inputs-container">
            <button className="add-email-button" onClick={handleAddEmailField} title="이메일 추가">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </button>
            <div className="email-inputs">
              {emails.map((email, index) => (
                <div key={index} className="email-input-row">
                  <input
                    type="email"
                    className="modal-input email-input"
                    value={email}
                    onChange={(e) => handleEmailChange(index, e.target.value)}
                    placeholder="멤버의 e-mail을 입력하세요"
                  />
                  {emails.length > 1 && (
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

        {/* 추가 버튼 */}
        <div className="modal-field">
          <label className="modal-label">메시지 (선택)</label>
          <textarea
            className="modal-input"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="초대 메일에 함께 보낼 메시지"
            rows={3}
          />
        </div>

        <div className="modal-footer">
          <button
            className={`modal-button ${!isButtonEnabled ? 'secondary' : ''}`}
            onClick={handleAdd}
            disabled={!isButtonEnabled || isSending}
          >
            {isSending ? '전송 중...' : '추가'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
