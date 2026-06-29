import type { ProviderConfig } from '../shared/types';
import { aiService } from './service';

export async function* streamAIResponse(
  config: ProviderConfig,
  messages: any[]
) {
  const chunks: string[] = [];
  const waiters: Array<() => void> = [];
  let done = false;
  let streamError: Error | null = null;

  const wakeAll = () => {
    let waiter = waiters.shift();
    while (waiter) {
      waiter();
      waiter = waiters.shift();
    }
  };

  const waitForChunk = () => new Promise<void>((resolve) => {
    waiters.push(resolve);
  });

  const consumeChunk = (chunk: string) => {
    chunks.push(chunk);
    wakeAll();
  };

  const pump = aiService.streamText({
    messages,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    onChunk: consumeChunk,
  }).catch((error) => {
    streamError = error instanceof Error ? error : new Error(String(error));
  }).finally(() => {
    done = true;
    wakeAll();
  });

  while (!done || chunks.length > 0) {
    if (chunks.length === 0) {
      await waitForChunk();
      continue;
    }

    const chunk = chunks.shift();
    if (chunk !== undefined) {
      yield chunk;
    }
  }

  await pump;

  if (streamError) {
    throw streamError;
  }
}
