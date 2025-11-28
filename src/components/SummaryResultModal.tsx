import { useState, type ReactElement } from 'react';
import Modal from './Modal';
import { summaryService } from '../services/summaryService';
import './SummaryResultModal.css';

interface SummaryResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  summaryId: number;
  summaryContent: string;
  onSendComplete?: () => void;
}

export default function SummaryResultModal({
  isOpen,
  onClose,
  summaryId,
  summaryContent,
  onSendComplete
}: SummaryResultModalProps) {
  const [isSending, setIsSending] = useState(false);

  const handleSendEmail = async () => {
    if (isSending) return;

    try {
      setIsSending(true);
      await summaryService.sendSummaryMail(summaryId);
      alert('이메일이 성공적으로 전송되었습니다.');
      if (onSendComplete) {
        onSendComplete();
      }
      onClose();
    } catch (error) {
      console.error('Failed to send summary email:', error);
      alert('이메일 전송에 실패했습니다.');
    } finally {
      setIsSending(false);
    }
  };

  const renderSummaryContent = () => {
    try {
      const parsed = JSON.parse(summaryContent);
      return (
        <div className="summary-content">
          {/* Summary 섹션 */}
          {(parsed.summary || parsed.summaries) && (
            <div className="summary-section">
              <h3 className="summary-section-title">[summary]</h3>
              <div className="summary-section-content">
                {formatSummarySection(parsed.summary || parsed.summaries)}
              </div>
            </div>
          )}

          {/* Milestone 섹션 */}
          {(parsed.milestone || parsed.milestones) && (
            <div className="summary-section">
              <h3 className="summary-section-title">[milestone]</h3>
              <div className="summary-section-content">
                {formatMilestoneSection(parsed.milestone || parsed.milestones)}
              </div>
            </div>
          )}

          {/* ActionItemsByRoles 섹션 */}
          {(parsed.actionItemsByRoles || parsed.actionItemsByRole || parsed.actionItems) && (
            <div className="summary-section">
              <h3 className="summary-section-title">[actionItemsByRoles]</h3>
              <div className="summary-section-content">
                {formatActionItemsSection(parsed.actionItemsByRoles || parsed.actionItemsByRole || parsed.actionItems)}
              </div>
            </div>
          )}
        </div>
      );
    } catch (error) {
      console.error('Failed to parse summary content:', error);
      return <pre className="summary-raw">{summaryContent}</pre>;
    }
  };

  const formatSummarySection = (content: any): ReactElement => {
    if (!content) return <></>;

    if (Array.isArray(content)) {
      return (
        <ul>
          {content.map((item, idx) => (
            <li key={idx}>{String(item)}</li>
          ))}
        </ul>
      );
    }

    if (typeof content === 'string') {
      return <p style={{ whiteSpace: 'pre-wrap' }}>{content}</p>;
    }

    return <p>{JSON.stringify(content, null, 2)}</p>;
  };

  const formatMilestoneSection = (content: any): ReactElement => {
    if (!content) return <></>;

    if (Array.isArray(content)) {
      return (
        <ul>
          {content.map((item, idx) => {
            if (typeof item === 'string') {
              return <li key={idx}>{item}</li>;
            }
            if (item && typeof item === 'object' && item.task) {
              return <li key={idx}>{item.task} {item.deadline && `(${item.deadline})`}</li>;
            }
            return <li key={idx}>{JSON.stringify(item)}</li>;
          })}
        </ul>
      );
    }

    if (typeof content === 'string') {
      return <p style={{ whiteSpace: 'pre-wrap' }}>{content}</p>;
    }

    return <p>{JSON.stringify(content, null, 2)}</p>;
  };

  const formatActionItemsSection = (content: any): ReactElement => {
    if (!content) return <></>;

    if (typeof content === 'object' && !Array.isArray(content)) {
      return (
        <ul>
          {Object.entries(content).map(([role, items]) => {
            const itemsList = Array.isArray(items) ? items : [];
            return (
              <li key={role}>
                <strong>{role}:</strong> {itemsList.length > 0 ? itemsList.join(', ') : '[]'}
              </li>
            );
          })}
        </ul>
      );
    }

    if (typeof content === 'string') {
      return <p style={{ whiteSpace: 'pre-wrap' }}>{content}</p>;
    }

    return <p>{JSON.stringify(content, null, 2)}</p>;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false}>
      <div className="summary-result-modal">
        <div className="summary-result-header">
          <div className="summary-result-title">회의본 AI 요약 결과</div>
          <button
            className="summary-send-button"
            onClick={handleSendEmail}
            disabled={isSending}
          >
            {isSending ? '전송 중...' : '전송'}
          </button>
        </div>
        <div className="summary-result-body">
          {renderSummaryContent()}
        </div>
      </div>
    </Modal>
  );
}
