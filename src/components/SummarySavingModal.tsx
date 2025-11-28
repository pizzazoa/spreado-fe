import Modal from './Modal';
import './SummarySavingModal.css';

interface SummarySavingModalProps {
  isOpen: boolean;
}

export default function SummarySavingModal({ isOpen }: SummarySavingModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={() => {}} showCloseButton={false}>
      <div className="summary-saving-modal">
        <div className="summary-saving-loader">
          <div className="summary-saving-spinner" />
        </div>
        <p className="summary-saving-text">AI 요약 생성중</p>
      </div>
    </Modal>
  );
}
