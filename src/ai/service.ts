import { streamText, type CoreMessage, type LanguageModel } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { buildContext } from './context-builder';
import {
  DEFAULT_SYSTEM_PROMPT,
  PAGE_QA_SYSTEM_PROMPT,
  PAGE_SUMMARY_SYSTEM_PROMPT,
  SELECTION_UNDERSTANDING_SYSTEM_PROMPT,
} from '../shared/constants';
import type { PageContext } from '../shared/types';
import type { AiAgentApiKey } from './providers';
import { legacyConfigToAgent, normalizeAgentConfigs } from './providers';

export interface AITextStreamOptions {
  messages: CoreMessage[];
  system?: string;
  temperature?: number;
  maxTokens?: number;
  abortSignal?: AbortSignal;
  onChunk?: (chunk: string) => void;
  onRetry?: (attempt: number, maxRetries: number, error: Error) => void;
}

export interface PageChatStreamOptions {
  pageContext: PageContext;
  question: string;
  task?: 'chat' | 'summary' | 'selection';
  imageMode: boolean;
  temperature?: number;
  maxTokens?: number;
  abortSignal?: AbortSignal;
  onChunk?: (chunk: string) => void;
  onRetry?: (attempt: number, maxRetries: number, error: Error) => void;
}

export class AIService {
  async streamPageChat(options: PageChatStreamOptions) {
    const content = buildContext(options.pageContext, options.question, options.imageMode);
    const system = options.task === 'summary'
      ? PAGE_SUMMARY_SYSTEM_PROMPT
      : options.task === 'selection'
        ? SELECTION_UNDERSTANDING_SYSTEM_PROMPT
      : options.task === 'chat'
        ? PAGE_QA_SYSTEM_PROMPT
        : DEFAULT_SYSTEM_PROMPT;

    await this.streamText({
      messages: [{ role: 'user', content }],
      system,
      temperature: options.temperature,
      maxTokens: options.maxTokens,
      abortSignal: options.abortSignal,
      onChunk: options.onChunk,
      onRetry: options.onRetry,
    });
  }

  async streamText(options: AITextStreamOptions) {
    const agents = await getStoredAgents();
    const agent = agents[0];
    if (!agent) throw new Error('No AI providers configured');

    const maxRetries = await getStoredRetryCount();
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await this.streamWithAgent(agent, options);
        return;
      } catch (error) {
        const normalized = normalizeAiError(error, agent.providerLabel);
        lastError = normalized;
        if (options.abortSignal?.aborted) throw normalized;
        if (attempt < maxRetries) {
          options.onRetry?.(attempt + 1, maxRetries, normalized);
          await delay(getRetryDelayMs(attempt), options.abortSignal);
          continue;
        }
      }
    }

    throw lastError || new Error('The AI provider did not return a usable response.');
  }

  private async streamWithAgent(agent: AiAgentApiKey, options: AITextStreamOptions) {
    const result = await streamText({
      model: this.createModel(agent),
      system: options.system,
      messages: options.messages,
      temperature: options.temperature,
      maxTokens: options.maxTokens,
      maxRetries: 0,
      abortSignal: options.abortSignal,
    });

    for await (const chunk of result.textStream) {
      options.onChunk?.(chunk);
    }
  }

  private createModel(agent: AiAgentApiKey): LanguageModel {
    switch (agent.providerId) {
      case 'openai':
        return createOpenAI({ apiKey: agent.apiKey, ...(agent.baseURL ? { baseURL: agent.baseURL } : {}) })(agent.model as never);
      case 'anthropic':
        return createAnthropic({ apiKey: agent.apiKey, ...(agent.baseURL ? { baseURL: agent.baseURL } : {}) })(agent.model as never);
      case 'google':
        return createGoogleGenerativeAI({ apiKey: agent.apiKey, ...(agent.baseURL ? { baseURL: agent.baseURL } : {}) })(agent.model as never);
      case 'deepseek':
        return createOpenAI({ apiKey: agent.apiKey, baseURL: agent.baseURL || 'https://api.deepseek.com/v1' })(agent.model as never);
      default:
        if (!agent.providerId.startsWith('custom:')) {
          throw new Error(`Unsupported AI provider: ${agent.providerId}`);
        }
        if (!agent.baseURL) {
          throw new Error(`${agent.providerLabel} requires a Base URL`);
        }
        return createOpenAI({
          apiKey: agent.apiKey,
          baseURL: agent.baseURL,
          compatibility: 'compatible',
        })(agent.model as never);
    }
  }
}

export const aiService = new AIService();

async function getStoredAgents() {
  const result = await chrome.storage.local.get(['agents', 'providerConfig']);
  const agents = normalizeAgentConfigs(result.agents);
  if (agents.length) {
    return agents;
  }

  const migrated = legacyConfigToAgent(result.providerConfig);
  if (migrated) {
    await chrome.storage.local.set({ agents: [migrated] });
    return [migrated];
  }

  return agents;
}

async function getStoredRetryCount() {
  const result = await chrome.storage.local.get('aiMaxRetries');
  const value = Number(result.aiMaxRetries);
  if (!Number.isFinite(value)) return 2;
  return Math.max(0, Math.min(5, Math.round(value)));
}

function normalizeAiError(error: unknown, providerLabel: string) {
  if (error instanceof Error) return error;
  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>;
    const status = record.statusCode || record.status || record.code;
    const message = record.message || record.error || JSON.stringify(record);
    return new Error(`${providerLabel} request failed${status ? ` (${status})` : ''}: ${String(message)}`);
  }
  return new Error(`${providerLabel} request failed: ${String(error || 'unknown error')}`);
}

function getRetryDelayMs(attempt: number) {
  return Math.min(1_000 * 2 ** attempt, 4_000);
}

function delay(ms: number, signal?: AbortSignal) {
  if (signal?.aborted) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      resolve();
    }, { once: true });
  });
}
