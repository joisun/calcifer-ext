export const PROVIDERS = {
  openai: { name: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'] },
  anthropic: { name: 'Anthropic', models: ['claude-opus-4', 'claude-sonnet-4', 'claude-haiku-3'] },
  gemini: { name: 'Google Gemini', models: ['gemini-1.5-pro', 'gemini-1.5-flash'] },
  ollama: { name: 'Ollama', models: ['llama3', 'mistral', 'codellama'] },
} as const;

export const DEFAULT_SYSTEM_PROMPT = `You are Calcifer, an AI assistant that helps users understand web pages.
You have access to the full content of the current page. Answer questions accurately and concisely.`;
