// src/components/CollaborativeEditor.tsx
import { useEffect, useState } from "react";
import { useRoom, useSelf } from "@liveblocks/react/suspense";
import { LiveblocksYjsProvider } from "@liveblocks/yjs";
import * as Y from "yjs";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import Placeholder from "@tiptap/extension-placeholder";

// [복구] Props 인터페이스 부활
interface CollaborativeEditorProps {
  setEditorInstance: (editor: any) => void;
}

// 사용자별 일관된 랜덤 색상 생성 함수
function generateUserColor(userId: string): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788',
    '#E74C3C', '#3498DB', '#9B59B6', '#1ABC9C', '#F39C12',
    '#E67E22', '#16A085', '#27AE60', '#2980B9', '#8E44AD'
  ];

  // userId를 숫자로 해싱하여 일관된 색상 선택
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

export default function CollaborativeEditor({ setEditorInstance }: CollaborativeEditorProps) {
  const room = useRoom();
  const userInfo = useSelf((me) => me.info);
  
  const [yDoc] = useState(() => new Y.Doc());
  const [provider, setProvider] = useState<LiveblocksYjsProvider>();

  // 1. Liveblocks Provider 연결
  useEffect(() => {
    const yProvider = new LiveblocksYjsProvider(room, yDoc);
    setProvider(yProvider);

    return () => {
      yProvider.destroy();
    };
  }, [room, yDoc]);

  // 2. Tiptap 에디터 설정
  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          history: false,
        }),
        Placeholder.configure({
          placeholder: "팀원들과 함께 회의록을 작성해보세요...",
        }),
        Collaboration.configure({
          document: yDoc,
        }),
        ...(provider ? [
          CollaborationCursor.configure({
            provider: provider,
            user: {
              name: userInfo?.name || "Anonymous",
              color: generateUserColor(userInfo?.name || "Anonymous"),
            },
            render: (user) => {
              const cursor = document.createElement('span');
              cursor.classList.add('collaboration-cursor__caret');
              cursor.style.borderColor = user.color;

              const label = document.createElement('div');
              label.classList.add('collaboration-cursor__label');
              label.style.backgroundColor = user.color;
              label.textContent = (user.name || 'A')[0].toUpperCase();

              cursor.appendChild(label);
              return cursor;
            },
          })
        ] : []),
      ],
      editorProps: {
        attributes: {
          class: "live-editor-content",
        },
      },
    },
    [provider]
  );

  // [복구] 에디터 인스턴스 상위로 전달
  useEffect(() => {
    if (editor) {
      setEditorInstance(editor);
    }
  }, [editor, setEditorInstance]);

  if (!editor || !provider) {
    return <div className="live-editor-loading">에디터 로딩 중...</div>;
  }

  return (
    <div className="live-editor-shell">
      <div className="live-toolbar">
        <button onClick={() => editor.chain().focus().toggleBold().run()} className={`live-tool-btn ${editor.isActive('bold') ? 'is-active' : ''}`}>B</button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`live-tool-btn ${editor.isActive('italic') ? 'is-active' : ''}`}>I</button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`live-tool-btn ${editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}`}>H1</button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`live-tool-btn ${editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}`}>H2</button>
        <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`live-tool-btn ${editor.isActive('bulletList') ? 'is-active' : ''}`}>•</button>
        <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`live-tool-btn ${editor.isActive('orderedList') ? 'is-active' : ''}`}>1.</button>
      </div>
      
      <div className="live-editor-inner">
        <EditorContent editor={editor} className="live-editor" />
      </div>
    </div>
  );
}