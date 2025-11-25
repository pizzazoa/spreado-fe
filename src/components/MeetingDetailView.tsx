import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { meetingService } from '../services/meetingService';
import { summaryService } from '../services/summaryService';
import type { MeetingDetail } from '../types';
import './MeetingDetailView.css';
import '../pages/MeetingPage.css';

type TabKey = 'summary' | 'note';

const buildStorageKey = (meetingId: number) => `meeting:notes:${meetingId}`;

const formatDateLabel = (isoDate?: string) => {
  if (!isoDate) {
    const today = new Date();
    return `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
  }
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) {
    const today = new Date();
    return `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
  }
  return `${parsed.getFullYear()}년 ${parsed.getMonth() + 1}월 ${parsed.getDate()}일`;
};

interface MeetingDetailViewProps {
  meetingId: number;
  onBack: () => void;
}

export default function MeetingDetailView({ meetingId, onBack }: MeetingDetailViewProps) {
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [summary, setSummary] = useState('');
  const [note, setNote] = useState('');
  const [summaryId, setSummaryId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('summary');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [editedSummary, setEditedSummary] = useState('');
  const [isSendingMail, setIsSendingMail] = useState(false);
  const [showMailSentModal, setShowMailSentModal] = useState(false);

  const cachedNotesRef = useRef<{ summary?: string; note?: string; title?: string }>({});

  const persistNotesToStorage = (payload: { title?: string; summary?: string; note?: string; status?: string }) => {
    cachedNotesRef.current = {
      title: payload.title ?? cachedNotesRef.current.title,
      summary: payload.summary ?? cachedNotesRef.current.summary,
      note: payload.note ?? cachedNotesRef.current.note,
    };

    localStorage.setItem(
      buildStorageKey(meetingId),
      JSON.stringify({
        ...cachedNotesRef.current,
        status: payload.status,
        storedAt: new Date().toISOString(),
      }),
    );
  };

  const loadSummaryForNote = async (
    noteIdValue: number,
    options: { regenerate?: boolean; openModal?: boolean; skipSpinner?: boolean } = {},
  ) => {
    try {
      if (!options.skipSpinner) setIsGeneratingSummary(true);
      const response = options.regenerate
        ? await summaryService.createSummary(noteIdValue)
        : await summaryService.getSummaryByNote(noteIdValue);

      setSummaryId(response.summaryId);
      setSummary(response.summaryJson);
      setEditedSummary(response.summaryJson);
      setActiveTab('summary');
      setMeeting((prev) => (prev ? { ...prev, summary: response.summaryJson, summaryId: response.summaryId, noteId: noteIdValue } : prev));
      persistNotesToStorage({ summary: response.summaryJson, note });
      if (options.openModal) {
        setShowSummaryModal(true);
        setIsEditingSummary(false);
      }
    } catch (error) {
      console.error('Summary load failed:', error);
      if (options.regenerate) {
        alert('AI 요약 생성에 실패했습니다. 잠시 후 다시 시도해주세요.');
      }
    } finally {
      if (!options.skipSpinner) setIsGeneratingSummary(false);
    }
  };

  const loadMeeting = async (withSpinner = true) => {
    try {
      if (withSpinner) setLoading(true);
      const meetingData = await meetingService.getMeetingDetail(meetingId);
      setMeeting(meetingData);
      setMeetingTitle(meetingData.title);
      const dateSource = meetingData.startedAt || meetingData.createdAt;
      setMeetingDate(formatDateLabel(dateSource));

      if (meetingData.summaryId) setSummaryId(meetingData.summaryId);

      const summaryText = meetingData.summary ?? cachedNotesRef.current.summary ?? '';
      const noteText = meetingData.note ?? cachedNotesRef.current.note ?? '';
      setSummary(summaryText);
      setNote(noteText);
      persistNotesToStorage({ title: meetingData.title, summary: summaryText, note: noteText, status: meetingData.status });

      if (meetingData.status === 'ENDED' && meetingData.noteId && !summaryText) {
        await loadSummaryForNote(meetingData.noteId, { regenerate: false, openModal: false, skipSpinner: true });
      }
    } catch (error) {
      console.error('Failed to load meeting:', error);
      alert('회의를 불러올 수 없습니다.');
      navigate('/main');
    } finally {
      if (withSpinner) setLoading(false);
    }
  };

  const handleUpdateSummary = async () => {
    if (!summaryId) {
      alert('요약 ID를 찾을 수 없습니다.');
      return;
    }
    try {
      const response = await summaryService.updateSummary(summaryId, { summaryJson: editedSummary });
      setSummary(response.summaryJson);
      setEditedSummary(response.summaryJson);
      setIsEditingSummary(false);
      persistNotesToStorage({ summary: response.summaryJson, note });
    } catch (error) {
      console.error('Failed to update summary:', error);
      alert('요약 수정에 실패했습니다.');
    }
  };

  const handleSendMail = async () => {
    if (!summaryId) {
      alert('요약 ID를 찾을 수 없습니다.');
      return;
    }
    try {
      setIsSendingMail(true);
      await summaryService.sendSummaryMail(summaryId);
      setShowMailSentModal(true);
    } catch (error) {
      console.error('Failed to send summary mail:', error);
      alert('메일 전송에 실패했습니다.');
    } finally {
      setIsSendingMail(false);
    }
  };

  useEffect(() => {
    const cachedRaw = localStorage.getItem(buildStorageKey(meetingId));
    if (cachedRaw) {
      try {
        const cached = JSON.parse(cachedRaw) as { summary?: string; note?: string; title?: string };
        cachedNotesRef.current = cached;
        if (cached.summary) setSummary(cached.summary);
        if (cached.note) setNote(cached.note);
        if (cached.title) setMeetingTitle(cached.title);
      } catch (error) {
        console.warn('Failed to parse cached meeting notes', error);
      }
    }
  }, [meetingId]);

  useEffect(() => {
    loadMeeting(true);
    const interval = setInterval(() => loadMeeting(false), 8000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId]);

  if (loading || !meeting) {
    return <div className="meeting-page-loading">로딩 중...</div>;
  }

  return (
    <div className="meeting-page">
      <div className="meeting-header">
        <div className="meeting-header-info">
          <button className="meeting-name-btn">{meetingTitle}</button>
          <button className="meeting-date-btn">{meetingDate}</button>
        </div>
        <div className="meeting-header-actions">
          <button className="meeting-back-btn" onClick={onBack}>
            뒤로 가기
          </button>
        </div>
      </div>

      <div className="meeting-tabs">
        <button
          className={`meeting-tab ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          AI 요약본 보기
        </button>
        <div className="meeting-tab-divider" />
        <button
          className={`meeting-tab ${activeTab === 'note' ? 'active' : ''}`}
          onClick={() => setActiveTab('note')}
        >
          회의록 원본 보기
        </button>
      </div>

      <div className="meeting-divider" />

      <div className="meeting-notes-container">
        <div className="meeting-sheet">
          <div className="meeting-sheet-content">
            {activeTab === 'summary' ? (
              <div className={`meeting-summary ${summary ? '' : 'empty'}`}>
                {summary || '아직 요약이 제공되지 않았습니다.'}
              </div>
            ) : (
              <div className={`meeting-note ${note ? '' : 'empty'}`}>
                {note || '아직 회의록 원본이 제공되지 않았습니다.'}
              </div>
            )}
          </div>
        </div>
      </div>

      {isGeneratingSummary && (
        <div className="meeting-ended-overlay">
          <div className="summary-loading-modal">
            <h3>AI 요약 생성중</h3>
            <div className="summary-spinner" aria-hidden />
          </div>
        </div>
      )}

      {showSummaryModal && (
        <div className="meeting-ended-overlay">
          <div className="summary-result-modal">
            <div className="summary-result-card">
              <div className="summary-result-header">
                <span className="summary-result-badge">회의본 AI 요약 결과</span>
                <div className="summary-actions">
                  {isEditingSummary ? (
                    <>
                      <button className="summary-action-btn" onClick={handleUpdateSummary}>저장</button>
                      <button className="summary-action-btn ghost" onClick={() => setIsEditingSummary(false)}>취소</button>
                    </>
                  ) : (
                    <button className="summary-edit-icon" onClick={() => setIsEditingSummary(true)} aria-label="요약 수정">
                      ✏️
                    </button>
                  )}
                </div>
              </div>
              {isEditingSummary ? (
                <textarea
                  className="summary-edit-area"
                  value={editedSummary}
                  onChange={(e) => setEditedSummary(e.target.value)}
                />
              ) : (
                <div className="summary-result-body">{summary || '요약을 불러오는 중입니다.'}</div>
              )}
              {summaryId && (
                <button
                  className="summary-send-fab"
                  onClick={handleSendMail}
                  disabled={isSendingMail}
                  title="그룹 멤버 이메일로 요약을 전송합니다"
                >
                  {isSendingMail ? '전송 중...' : '요약 메일 전송'}
                </button>
              )}
            </div>
            <button className="meeting-ended-button" onClick={() => setShowSummaryModal(false)}>
              닫기
            </button>
          </div>
        </div>
      )}

      {showMailSentModal && (
        <div className="meeting-ended-overlay">
          <div className="mail-sent-modal">
            <h3 className="mail-sent-title">메일이 전송되었습니다!</h3>
            <div className="mail-sent-icon" aria-hidden>
              ✉️
            </div>
            <button className="meeting-ended-button" onClick={() => navigate('/main')}>
              그룹 메인 화면으로 나가기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
