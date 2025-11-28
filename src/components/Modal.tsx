import type { ReactNode } from 'react';
import './Modal.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  showCloseButton?: boolean;
  className?: string; // 외부 스타일 주입을 위한 prop 추가
}

export default function Modal({ 
  isOpen, 
  onClose, 
  children, 
  showCloseButton = false, 
  className = '' 
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      {/* 외부에서 전달받은 className을 추가하여 스타일 오버라이딩 가능하게 함 */}
      <div className={`modal-content ${className}`} onClick={(e) => e.stopPropagation()}>
        {showCloseButton && (
          <button className="modal-close-button" onClick={onClose}>
            ✕
          </button>
        )}
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}