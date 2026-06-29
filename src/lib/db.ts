import Dexie, { Table } from 'dexie';

export interface Conversation {
  id?: number;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export interface Message {
  id?: number;
  conversationId: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export class CalciferDB extends Dexie {
  conversations!: Table<Conversation>;
  messages!: Table<Message>;

  constructor() {
    super('CalciferDB');
    this.version(1).stores({
      conversations: '++id, createdAt, updatedAt',
      messages: '++id, conversationId, timestamp'
    });
  }
}

export const db = new CalciferDB();
