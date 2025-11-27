import './MeetingLiveModal.css';

interface MeetingLiveModalFallbackProps {
  title: string;
  dateLabel: string;
  participants: string;
  onClose: () => void;
}

export default function MeetingLiveModalFallback({ title, dateLabel, participants, onClose }: MeetingLiveModalFallbackProps) {
  return (
    <div className="meeting-ended-overlay">
      <div className="live-meeting-modal">
        <div className="live-header">
          <div className="live-header-text">
            <div className="live-title">{title}</div>
            <div className="live-meta">{dateLabel} · {participants}</div>
          </div>
          <button className="live-close" onClick={onClose} aria-label="닫기">×</button>
        </div>

        <div className="live-body">
          <div style={{ padding: '16px', color: '#111827' }}>에디터 로딩 실패 또는 초기화 오류가 발생했습니다.</div>
        </div>
      </div>
    </div>
  );
}
