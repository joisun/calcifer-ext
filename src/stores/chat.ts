import { create } from 'zustand';
import type { ChatMessage } from '../shared/types';

interface ChatStore {
  messages: ChatMessage[];
  addMessage: (message: Omit<ChatMessage, 'timestamp'>) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, { ...message, timestamp: Date.now() }]
  })),
  clearMessages: () => set({ messages: [] }),
}));
