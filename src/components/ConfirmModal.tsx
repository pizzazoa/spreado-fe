import './ConfirmModal.css';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText?: string;
  confirmColor?: 'red' | 'blue';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText,
  cancelText = '취소',
  confirmColor = 'red',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="confirm-overlay">
      <div className="confirm-modal">
        <h3 className="confirm-title">{title}</h3>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button className="confirm-btn cancel" onClick={onCancel}>{cancelText}</button>
          <button className={`confirm-btn ${confirmColor}`} onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}
