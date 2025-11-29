import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { meetingService } from '../services/meetingService';
import { summaryService } from '../services/summaryService';
import { noteService } from '../services/noteService';
import type { MeetingDetail } from '../types';
import './MeetingDetailView.css';
import '../pages/MeetingPage.css';

type TabKey = 'summary' | 'note';

// ProseMirror 노드 타입 정의 (간소화)
interface TextNode {
  type: 'text';
  text: string;
  marks?: Array<{ type: string }>;
}

interface ElementNode {
  type: string;
  content?: Array<ElementNode | TextNode>;
  attrs?: any;
}

type PMNode = ElementNode | TextNode;

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
  
  // note 상태를 구조화된 데이터(PMNode) 또는 문자열로 관리
  const [noteContent, setNoteContent] = useState<PMNode | string | null>(null);
  
  const [summaryId, setSummaryId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('summary');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [editedSummary, setEditedSummary] = useState('');
  const [isSendingMail, setIsSendingMail] = useState(false);
  const [showMailSentModal, setShowMailSentModal] = useState(false);
  const [isMailSent, setIsMailSent] = useState(false);

  const cachedNotesRef = useRef<{ summary?: string; note?: any; title?: string }>({});

  // 회의록 원본 데이터 전처리 레이어
  const preprocessNoteContent = (rawContent: unknown): PMNode | string => {
    if (!rawContent) return '';

    try {
      let content = rawContent;

      // 1. 문자열인 경우 JSON 파싱 시도
      if (typeof content === 'string') {
        try {
          content = JSON.parse(content);
        } catch {
          return String(rawContent); // 파싱 실패 시 일반 텍스트로 반환
        }
      }

      // 2. { "data": { "content": "..." } } 형태 등 중첩 구조 처리
      if (content && typeof content === 'object' && !Array.isArray(content)) {
        const anyContent = content as any;
        // data.content가 있는 경우
        if (anyContent.data && anyContent.data.content) {
          content = anyContent.data.content;
          if (typeof content === 'string') {
            try { content = JSON.parse(content); } catch {}
          }
        }
      }

      // 3. ProseMirror 문서 구조인지 확인 (type: 'doc', content: [...])
      if (content && typeof content === 'object' && (content as any).type === 'doc' && Array.isArray((content as any).content)) {
        return content as PMNode;
      }

      // 구조가 맞지 않으면 문자열로 변환 (또는 객체 그대로 반환하여 렌더링 시 처리)
      return typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    } catch (error) {
      console.warn('Note preprocessing failed:', error);
      return String(rawContent);
    }
  };

  // ProseMirror 노드 렌더링 함수 (재귀)
  const renderPMNode = (node: PMNode, key: number | string): React.ReactNode => {
    // 텍스트 노드 처리
    if (node.type === 'text') {
      const textNode = node as TextNode;
      let element: React.ReactNode = textNode.text;
      
      if (textNode.marks) {
        textNode.marks.forEach(mark => {
          if (mark.type === 'bold') {
            element = <strong key={`${key}-bold`}>{element}</strong>;
          } else if (mark.type === 'code') {
            element = <code key={`${key}-code`}>{element}</code>;
          } else if (mark.type === 'italic') {
            element = <em key={`${key}-italic`}>{element}</em>;
          } else if (mark.type === 'strike') {
            element = <s key={`${key}-strike`}>{element}</s>;
          }
        });
      }
      return <span key={key}>{element}</span>;
    }

    // 요소 노드 처리
    const elementNode = node as ElementNode;
    const children = elementNode.content?.map((child, idx) => renderPMNode(child, idx));

    switch (elementNode.type) {
      case 'doc':
        return <div key={key} className="pm-doc">{children}</div>;
      case 'paragraph':
        return <p key={key}>{children}</p>;
      case 'bulletList':
        return <ul key={key}>{children}</ul>;
      case 'orderedList':
        return <ol key={key}>{children}</ol>;
      case 'listItem':
        return <li key={key}>{children}</li>;
      case 'horizontalRule':
        return <hr key={key} />;
      case 'heading':
        const level = elementNode.attrs?.level || 1;
        const Tag = `h${level}` as keyof React.JSX.IntrinsicElements;
        return <Tag key={key}>{children}</Tag>;
      case 'blockquote':
        return <blockquote key={key}>{children}</blockquote>;
      case 'codeBlock':
        return <pre key={key}><code>{children}</code></pre>;
      default:
        // 알 수 없는 타입은 div로 감싸서 렌더링
        return <div key={key} className={`pm-${elementNode.type}`}>{children}</div>;
    }
  };

  // 요약본 구조화 렌더링
  const renderStructuredSummary = (rawJson: string) => {
    if (!rawJson) return <div className="summary-empty">요약 내용이 없습니다.</div>;

    try {
      const parsed = JSON.parse(rawJson);
      if (typeof parsed !== 'object' || !parsed) {
        return <div className="summary-text">{rawJson}</div>;
      }

      return (
        <div className="structured-summary">
          {(parsed.summary || parsed.summaries) && (
            <div className="summary-block">
              <h3 className="summary-block-title">Summary</h3>
              <div className="summary-block-content">
                {Array.isArray(parsed.summary)
                  ? parsed.summary.map((line: string, i: number) => <p key={i}>{line}</p>)
                  : <p>{parsed.summary}</p>}
              </div>
            </div>
          )}
          {(parsed.milestone || parsed.milestones) && (
            <div className="summary-block">
              <h3 className="summary-block-title">Milestones</h3>
              <ul className="summary-list">
                {(Array.isArray(parsed.milestone ? parsed.milestone : parsed.milestones) ? (parsed.milestone || parsed.milestones) : []).map((item: any, i: number) => {
                  if (typeof item === 'string') return <li key={i}>{item}</li>;
                  return (
                    <li key={i}>
                      <span className="task">{item.task}</span>
                      {item.deadline && <span className="deadline">{item.deadline}</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {(parsed.actionItemsByRoles || parsed.actionItemsByRole || parsed.actionItems) && (
            <div className="summary-block">
              <h3 className="summary-block-title">Action Items</h3>
              <div className="action-items-grid">
                {Object.entries(parsed.actionItemsByRoles || parsed.actionItemsByRole || parsed.actionItems).map(([role, items]: [string, any]) => (
                  <div key={role} className="action-role-group">
                    <h4 className="role-name">{role}</h4>
                    <ul className="role-items">
                      {(Array.isArray(items) ? items : []).map((act: string, j: number) => (
                        <li key={j}>{act}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    } catch (e) {
      return <div className="summary-text" style={{ whiteSpace: 'pre-wrap' }}>{rawJson}</div>;
    }
  };

  const persistNotesToStorage = (payload: { title?: string; summary?: string; note?: any; status?: string }) => {
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
    options: { regenerate?: boolean; openModal?: boolean; skipSpinner?: boolean; skipTabSwitch?: boolean } = {},
  ) => {
    try {
      if (!options.skipSpinner) setIsGeneratingSummary(true);
      const response = options.regenerate
        ? await summaryService.createSummary(noteIdValue)
        : await summaryService.getSummaryByNote(noteIdValue);

      setSummaryId(response.summaryId);
      setSummary(response.summaryJson);
      setEditedSummary(response.summaryJson);

      if (!options.skipTabSwitch) {
        setActiveTab('summary');
      }

      setMeeting((prev) => (prev ? { ...prev, summary: response.summaryJson, summaryId: response.summaryId, noteId: noteIdValue } : prev));
      persistNotesToStorage({ summary: response.summaryJson, note: noteContent });
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

      let summaryText = meetingData.summary ?? '';
      let processedNote: PMNode | string = '';

      if (meetingData.noteId) {
        try {
          // 노트 정보가 이미 있으면 그것을 사용, 없으면 API 호출
          // [수정] 타입 에러 해결을 위해 any 타입 사용
          let rawContent: any = meetingData.note; 
          if (!rawContent) {
             const noteResponse = await noteService.getNoteDetail(meetingData.noteId);
             rawContent = noteResponse.content;
          }
          
          processedNote = preprocessNoteContent(rawContent);
          setNoteContent(processedNote);
        } catch (error) {
          console.error('Failed to load note detail:', error);
          processedNote = cachedNotesRef.current.note ?? '';
          setNoteContent(processedNote);
        }
      } else {
        setNoteContent('');
      }

      if (meetingData.status === 'ENDED' && meetingData.noteId && !meetingData.summary) {
        try {
          await loadSummaryForNote(meetingData.noteId, { regenerate: false, openModal: false, skipSpinner: true, skipTabSwitch: true });
        } catch (error) {
          console.error('Failed to load summary:', error);
          summaryText = cachedNotesRef.current.summary ?? '';
          setSummary(summaryText);
        }
      } else {
        setSummary(summaryText);
      }

      persistNotesToStorage({ title: meetingData.title, summary: summaryText, note: processedNote, status: meetingData.status });
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
      persistNotesToStorage({ summary: response.summaryJson, note: noteContent });
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
      setIsMailSent(true);
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
        const cached = JSON.parse(cachedRaw);
        cachedNotesRef.current = cached;
        if (cached.summary) setSummary(cached.summary);
        if (cached.note) setNoteContent(cached.note);
        if (cached.title) setMeetingTitle(cached.title);
      } catch (error) {
        console.warn('Failed to parse cached meeting notes', error);
      }
    }
  }, [meetingId]);

  useEffect(() => {
    loadMeeting(true);
    let interval: number | null = null;
    if (meeting?.status !== 'ENDED') {
      interval = setInterval(() => loadMeeting(false), 8000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [meetingId, meeting?.status]);

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

      <div className="meeting-notes-container">
        <div className="meeting-sheet">
          <div className="meeting-sheet-content">
            {activeTab === 'summary' ? (
              renderStructuredSummary(summary)
            ) : (
              <div className={`meeting-note ${!noteContent ? 'empty' : ''}`}>
                {noteContent 
                  ? (typeof noteContent === 'string' ? noteContent : renderPMNode(noteContent, 'root'))
                  : '아직 회의록 원본이 제공되지 않았습니다.'}
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
                      <button className="summary-action-btn" onClick={handleUpdateSummary} disabled={isMailSent}>저장</button>
                      <button className="summary-action-btn ghost" onClick={() => setIsEditingSummary(false)}>취소</button>
                    </>
                  ) : (
                    <button className="summary-edit-icon" onClick={() => setIsEditingSummary(true)} aria-label="요약 수정" disabled={isMailSent}>
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
                <div className="summary-result-body">
                  {renderStructuredSummary(summary)}
                </div>
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
            <button className="meeting-ended-button" onClick={() => setShowMailSentModal(false)}>
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}