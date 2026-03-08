export interface PageContext {
  title: string;
  url: string;
  markdown: string;
  wordCount: number;
  siteName?: string;
  images?: ImageContext[];
}

export interface ImageContext {
  alt: string;
  base64: string;
  position: number;
}

export interface FeatureFlags {
  imageUnderstanding: boolean;
  autoTranslate: boolean;
  selectionToolbar: boolean;
  streamingResponse: boolean;
  debugMode: boolean;
}

export interface ProviderConfig {
  provider: 'openai' | 'anthropic' | 'gemini' | 'ollama' | 'custom';
  apiKey: string;
  baseUrl?: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}
