import { useChatStore } from '../../stores/chat';
import { MessageSquare, Trash2, X } from 'lucide-react';
import { useEffect } from 'react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ConversationDrawer({ isOpen, onClose }: DrawerProps) {
  const { conversations, currentConversationId, loadConversations, loadConversation, deleteConversation } = useChatStore();

  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen, loadConversations]);

  const handleSelect = (id: number) => {
    loadConversation(id);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-background/70"
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[70vh] flex-col rounded-t-md border bg-surface animate-slideUp">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <h2 className="text-[13px] font-semibold">History</h2>
          <button onClick={onClose} className="rounded p-1 text-muted-foreground hover:bg-surface-3 hover:text-foreground">
            <X size={15} />
          </button>
        </div>

        <div className="scrollbar-thin flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`group flex cursor-pointer items-center gap-3 border-b px-3 py-2 transition-colors hover:bg-surface-3 ${
                currentConversationId === conv.id ? 'bg-accent text-accent-foreground' : ''
              }`}
              onClick={() => handleSelect(conv.id)}
            >
              <MessageSquare size={15} className="shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate text-[13px]">{conv.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteConversation(conv.id);
                }}
                className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-surface hover:text-foreground group-hover:opacity-100"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          {conversations.length === 0 && (
            <div className="px-3 py-6 text-center text-[12px] text-muted-foreground">No conversations yet.</div>
          )}
        </div>
      </div>
    </>
  );
}
