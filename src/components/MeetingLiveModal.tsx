import { useState, useRef } from 'react';
import { 
  LiveblocksProvider, 
  RoomProvider, 
  ClientSideSuspense,
  useBroadcastEvent,
  useEventListener,
  useRoom
} from "@liveblocks/react/suspense";
import { meetingService } from '../services/meetingService';
import { useAuth } from '../contexts/AuthContext';
import CollaborativeEditor from './CollaborativeEditor';
import './MeetingLiveModal.css';

interface MeetingLiveModalProps {
  variant?: 'modal' | 'inline';
  meetingId: number;
  groupId?: number;
  title: string;
  dateLabel: string;
  participants: string;
  hostUserId?: number;
  initialToken?: string;
  onClose: () => void;
  onEnded?: () => void;
  onLeft?: () => void;
  onEndingStart?: () => void;
  onEndingComplete?: (noteId: number) => void;
  onEndingCancel?: () => void;
}

function MeetingRoomInner({
  title, dateLabel, participants, isHost, meetingId, onClose, onEnded, onLeft, onEndingStart, onEndingComplete, onEndingCancel
}: any) {
  const room = useRoom();
  const broadcast = useBroadcastEvent();
  const [isEnding, setIsEnding] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [editorInstance, setEditorInstance] = useState<any>(null);

  // 👂 [참가자] 호스트가 보낸 종료 이벤트 수신
  useEventListener(({ event }) => {
    if (event.type === 'MEETING_ENDED') {
      alert('호스트가 회의를 종료했습니다.');
      if (onEnded) onEnded();
      else onClose();
    }
  });

  // 🚪 [호스트] 회의 종료 핸들러
  const handleEndMeeting = async () => {
    if (!isHost) return;
    if (!confirm("회의를 종료하시겠습니까? 회의록이 저장되고 요약이 생성됩니다.")) return;

    setIsEnding(true);

    // 로딩 모달 표시
    if (onEndingStart) {
      onEndingStart();
    }

    try {
      // 1. [유지] Liveblocks Storage에 에디터 내용 저장 (백엔드가 가져갈 데이터)
      if (editorInstance) {
        console.log("💾 [Host] Saving content to Room Storage...");
        const contentJson = editorInstance.getJSON();
        const { root } = await room.getStorage();
        root.set("content", JSON.stringify(contentJson));
        console.log("✅ [Host] Content saved!");
      }

      // 2. [유지] 동기화 대기 (2초 권장)
      console.log("⏳ Waiting for Liveblocks sync...");
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 3. 회의 종료 API 호출 (백엔드에서 호스트 검증 및 요약 생성까지 수행함)
      console.log("🚀 [Host] Ending meeting via API...");
      const noteResponse = await meetingService.endMeeting(meetingId);
      console.log("✅ [Host] Meeting Ended successfully.");

      // 4. [수정] API 성공 후에만 참가자 종료 신호 전송 (호스트 검증 통과 확인됨)
      console.log("📢 [Host] Broadcasting MEETING_ENDED to all participants...");
      broadcast({ type: 'MEETING_ENDED' });

      // 5. 완료 모달 표시를 위해 noteId 전달
      if (onEndingComplete && noteResponse.noteId) {
        onEndingComplete(noteResponse.noteId);
      } else {
        // 이전 방식 호환
        if (onEnded) onEnded();
        else onClose();
      }

    } catch (error: any) {
      console.error('❌ [Host] Failed to end meeting:', error);

      // 로딩 모달 닫기
      if (onEndingCancel) {
        onEndingCancel();
      }

      // 에러 메시지 표시
      const errorMessage = error?.response?.data?.message || error?.message || '회의 종료 처리 중 오류가 발생했습니다.';

      // 호스트 권한 관련 에러인지 확인
      if (errorMessage.includes('호스트') || errorMessage.includes('권한') || error?.response?.status === 403) {
        alert('회의를 종료할 권한이 없습니다. 호스트만 회의를 종료할 수 있습니다.');
      } else {
        alert(errorMessage);
      }

      setIsEnding(false);
    }
  };

  // 🏃 [참가자/호스트] 나가기 핸들러
  const handleLeaveMeeting = async () => {
    if (isLeaving) return;
    if (!confirm("회의에서 나가시겠습니까?")) return;

    setIsLeaving(true);
    try {
      await meetingService.leaveMeeting(meetingId);
    } catch (error) {
      console.error('Failed to leave:', error);
    } finally {
      setIsLeaving(false);
      if (onLeft) onLeft();
      else onClose();
    }
  };

  return (
    <>
      <div className="live-top-row">
        <input className="live-title-input" value={title} readOnly aria-label="회의 제목" />
        <div className="live-action-group">
          <button className="live-leave-btn" onClick={handleLeaveMeeting} disabled={isLeaving || isEnding}>
            나가기
          </button>
          <button
            className="live-end-btn"
            onClick={handleEndMeeting}
            disabled={isEnding || isLeaving || !isHost}
            title={isHost ? '회의 종료 및 요약 생성' : '호스트만 회의를 종료할 수 있습니다'}
          >
            종료
          </button>
        </div>
      </div>

      <div className="live-info-row">
        <div className="live-field">
          <label className="live-field-label">날짜</label>
          <div className="live-field-box">{dateLabel}</div>
        </div>
        <div className="live-field">
          <label className="live-field-label">참석자</label>
          <div className="live-field-box live-field-participants">{participants || '참석자 없음'}</div>
        </div>
      </div>

      <div className="live-divider" />

      <CollaborativeEditor setEditorInstance={setEditorInstance} />
    </>
  );
}

export default function MeetingLiveModal(props: MeetingLiveModalProps) {
  const { user } = useAuth();
  const { meetingId, groupId, initialToken } = props;
  const isHost = !props.hostUserId || user?.id === props.hostUserId;
  const usedInitialToken = useRef(false);

  const resolveAuth = async (_room?: string) => {
    if (initialToken && !usedInitialToken.current) {
      usedInitialToken.current = true;
      return { token: initialToken };
    }
    try {
      const response = await meetingService.getLiveblocksToken(meetingId);
      return { token: response.token };
    } catch (error) {
      console.error("Auth failed:", error);
      throw error;
    }
  };

  const liveblocksRoomId = groupId 
    ? `group:${groupId}:meeting:${meetingId}` 
    : `meeting:${meetingId}`;

  const content = (
    <div className="live-meeting-card">
      <LiveblocksProvider authEndpoint={resolveAuth}>
        <RoomProvider
          id={liveblocksRoomId}
          initialPresence={{ cursor: null }}
          initialStorage={{ content: "" }}
        >
          <ClientSideSuspense fallback={<div className="live-editor-placeholder">연결 중...</div>}>
            <MeetingRoomInner {...props} isHost={isHost} />
          </ClientSideSuspense>
        </RoomProvider>
      </LiveblocksProvider>
    </div>
  );

  if (props.variant === 'inline') {
    return <div className="live-inline-container">{content}</div>;
  }

  return (
    <div className="meeting-ended-overlay">
      {content}
    </div>
  );
}