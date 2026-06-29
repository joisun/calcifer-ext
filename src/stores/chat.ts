import { create } from 'zustand';
import type { ChatMessage } from '../shared/types';
import { db } from '../lib/db';

interface ChatStore {
  currentConversationId: number | null;
  messages: ChatMessage[];
  conversations: Array<{ id: number; title: string; updatedAt: number }>;

  setCurrentConversation: (id: number) => void;
  loadConversation: (id: number) => Promise<void>;
  createConversation: (title?: string) => Promise<number>;
  addMessage: (message: Omit<ChatMessage, 'timestamp'>) => Promise<void>;
  upsertStreamingAssistantMessage: (content: string) => Promise<void>;
  loadConversations: () => Promise<void>;
  deleteConversation: (id: number) => Promise<void>;
  clearMessages: () => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  currentConversationId: null,
  messages: [],
  conversations: [],

  setCurrentConversation: (id) => set({ currentConversationId: id }),

  loadConversation: async (id) => {
    const messages = await db.messages
      .where('conversationId')
      .equals(id)
      .sortBy('timestamp');

    set({
      currentConversationId: id,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp
      }))
    });
  },

  createConversation: async (title = 'New Chat') => {
    const id = await db.conversations.add({
      title,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    await get().loadConversations();
    return id;
  },

  addMessage: async (message) => {
    const { currentConversationId } = get();

    if (!currentConversationId) {
      const id = await get().createConversation();
      set({ currentConversationId: id });
    }

    const msg = { ...message, timestamp: Date.now() };

    await db.messages.add({
      conversationId: get().currentConversationId!,
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp
    });

    await db.conversations.update(get().currentConversationId!, {
      updatedAt: Date.now()
    });

    set((state) => ({
      messages: [...state.messages, msg]
    }));
  },

  upsertStreamingAssistantMessage: async (content) => {
    const { currentConversationId, messages } = get();

    if (!currentConversationId) {
      const id = await get().createConversation();
      set({ currentConversationId: id });
    }

    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'assistant') {
      const timestamp = lastMessage.timestamp;
      const stored = await db.messages
        .where({ conversationId: get().currentConversationId!, timestamp })
        .first();

      if (stored?.id) {
        await db.messages.update(stored.id, { content });
      }

      set((state) => ({
        messages: state.messages.map((message, index) => (
          index === state.messages.length - 1 ? { ...message, content } : message
        )),
      }));
      return;
    }

    await get().addMessage({ role: 'assistant', content });
  },

  loadConversations: async () => {
    const convs = await db.conversations
      .orderBy('updatedAt')
      .reverse()
      .toArray();

    set({
      conversations: convs.map(c => ({
        id: c.id!,
        title: c.title,
        updatedAt: c.updatedAt
      }))
    });
  },

  deleteConversation: async (id) => {
    await db.messages.where('conversationId').equals(id).delete();
    await db.conversations.delete(id);
    await get().loadConversations();

    if (get().currentConversationId === id) {
      set({ currentConversationId: null, messages: [] });
    }
  },

  clearMessages: () => set({ messages: [] }),
}));
