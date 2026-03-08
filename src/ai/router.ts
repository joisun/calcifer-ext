import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import type { ProviderConfig } from '../shared/types';
import { DEFAULT_SYSTEM_PROMPT } from '../shared/constants';

export async function* streamAIResponse(
  config: ProviderConfig,
  messages: any[]
) {
  let model;

  switch (config.provider) {
    case 'openai':
      model = openai(config.model, { apiKey: config.apiKey });
      break;
    case 'anthropic':
      model = anthropic(config.model, { apiKey: config.apiKey });
      break;
    case 'gemini':
      model = google(config.model, { apiKey: config.apiKey });
      break;
    default:
      throw new Error(`Unsupported provider: ${config.provider}`);
  }

  const result = streamText({
    model,
    messages: [
      { role: 'system', content: DEFAULT_SYSTEM_PROMPT },
      ...messages
    ],
    temperature: config.temperature,
    maxTokens: config.maxTokens,
  });

  for await (const chunk of result.textStream) {
    yield chunk;
  }
}
