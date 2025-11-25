import { useState } from 'react';
import Modal from './Modal';
import './AddMemberModal.css';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  inviteLink?: string;
}

export default function AddMemberModal({ isOpen, onClose, inviteLink }: AddMemberModalProps) {
  const [emails, setEmails] = useState<string[]>(['']);

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

  const handleAdd = () => {
    // 초대 링크 복사 기능
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      alert('초대 링크가 복사되었습니다!');
      setEmails(['']);
      onClose();
    } else {
      alert('초대 링크가 없습니다.');
    }
  };

  const isButtonEnabled = !!inviteLink;

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
        <div className="modal-footer">
          <button
            className={`modal-button ${!isButtonEnabled ? 'secondary' : ''}`}
            onClick={handleAdd}
            disabled={!isButtonEnabled}
          >
            추가
          </button>
        </div>
      </div>
    </Modal>
  );
}
