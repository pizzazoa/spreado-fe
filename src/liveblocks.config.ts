import { LiveList, LiveObject } from "@liveblocks/client";

declare global {
  interface Liveblocks {
    // 커서에 표시될 사용자 정보
    UserMeta: {
      id: string;
      info: {
        name: string;
        color: string;
        avatar?: string;
      };
    };
    RoomEvent: {
      type: 'MEETING_ENDED';
    };
    Storage: {
      content: string;
    };
  }
}

export {};