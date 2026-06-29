import type { ProviderConfig } from '../shared/types';

export type AIProviderId = 'openai' | 'anthropic' | 'google' | 'deepseek';

export interface AIProviderTemplate {
  id: AIProviderId;
  label: string;
  defaultModel: string;
  staticModels: string[];
  baseURL?: string;
}

export interface CompatibleProviderPreset {
  id: string;
  label: string;
  providerId: `custom:${string}`;
  baseURL: string;
  defaultModel: string;
  staticModels: string[];
}

export interface AiAgentApiKey {
  providerId: AIProviderId | `custom:${string}`;
  providerLabel: string;
  apiKey: string;
  model: string;
  baseURL?: string;
  providerOptions?: Record<string, unknown>;
}

export type AiAgentApiKeys = AiAgentApiKey[];

export const AI_PROVIDER_TEMPLATES: AIProviderTemplate[] = [
  {
    id: 'openai',
    label: 'OpenAI',
    defaultModel: 'gpt-4o-mini',
    staticModels: ['gpt-4o-mini', 'gpt-4o', 'o4-mini', 'o3-mini'],
  },
  {
    id: 'anthropic',
    label: 'Anthropic',
    defaultModel: 'claude-3-5-sonnet-20241022',
    staticModels: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
  },
  {
    id: 'google',
    label: 'Google Generative AI',
    defaultModel: 'gemini-2.5-flash-lite',
    staticModels: ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'],
  },
  {
    id: 'deepseek',
    label: 'DeepSeek',
    defaultModel: 'deepseek-chat',
    staticModels: ['deepseek-chat', 'deepseek-reasoner'],
    baseURL: 'https://api.deepseek.com/v1',
  },
];

export const COMPATIBLE_PROVIDER_PRESETS: CompatibleProviderPreset[] = [
  {
    id: 'openrouter',
    label: 'OpenRouter',
    providerId: 'custom:openrouter',
    baseURL: 'https://openrouter.ai/api/v1',
    defaultModel: 'openai/gpt-4o-mini',
    staticModels: ['openai/gpt-4o-mini', 'anthropic/claude-3.5-sonnet', 'google/gemini-flash-1.5'],
  },
  {
    id: 'ollama',
    label: 'Ollama',
    providerId: 'custom:ollama',
    baseURL: 'http://localhost:11434/v1',
    defaultModel: 'llama3',
    staticModels: ['llama3', 'mistral', 'codellama'],
  },
];

export const DEFAULT_PROVIDER_TEMPLATE = AI_PROVIDER_TEMPLATES[0];

export function getProviderTemplate(providerId: string) {
  return AI_PROVIDER_TEMPLATES.find((template) => template.id === providerId);
}

export function getCompatiblePreset(idOrProviderId: string) {
  return COMPATIBLE_PROVIDER_PRESETS.find(
    (preset) => preset.id === idOrProviderId || preset.providerId === idOrProviderId,
  );
}

export function isCustomProviderId(providerId: string): providerId is `custom:${string}` {
  return providerId.startsWith('custom:') && providerId.length > 'custom:'.length;
}

export function normalizeBaseURL(url: string) {
  return url.trim().replace(/\/$/, '');
}

export function slugifyProvider(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'provider';
}

export function normalizeAgentConfigs(raw: unknown): AiAgentApiKeys {
  if (!Array.isArray(raw)) return [];

  const normalized: AiAgentApiKeys = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const agent = normalizeAgent(entry as Partial<AiAgentApiKey>);
    if (agent) normalized.push(agent);
  }

  return normalized;
}

export function normalizeAgent(item: Partial<AiAgentApiKey>): AiAgentApiKey | null {
  const providerId = item.providerId?.trim();
  const apiKey = item.apiKey?.trim();
  if (!providerId || !apiKey) return null;

  const template = getProviderTemplate(providerId);
  const custom = isCustomProviderId(providerId);
  if (!template && !custom) return null;

  const model = item.model?.trim() || template?.defaultModel;
  if (!model) return null;

  const baseURL = custom
    ? normalizeBaseURL(item.baseURL || '')
    : item.baseURL
      ? normalizeBaseURL(item.baseURL)
      : template?.baseURL;
  if (custom && !baseURL) return null;

  const providerOptions = isPlainRecord(item.providerOptions) ? item.providerOptions : undefined;

  return {
    providerId: template ? template.id : providerId as `custom:${string}`,
    providerLabel: item.providerLabel?.trim() || template?.label || providerId.replace(/^custom:/, ''),
    apiKey,
    model,
    ...(baseURL ? { baseURL } : {}),
    ...(providerOptions ? { providerOptions } : {}),
  };
}

export function legacyConfigToAgent(config?: Partial<ProviderConfig> | null): AiAgentApiKey | null {
  if (!config?.apiKey?.trim()) return null;

  if (config.provider === 'openrouter') {
    return {
      providerId: 'custom:openrouter',
      providerLabel: 'OpenRouter',
      apiKey: config.apiKey.trim(),
      model: config.model || 'openai/gpt-4o-mini',
      baseURL: normalizeBaseURL(config.baseUrl || 'https://openrouter.ai/api/v1'),
    };
  }

  if (config.provider === 'ollama') {
    return {
      providerId: 'custom:ollama',
      providerLabel: 'Ollama',
      apiKey: config.apiKey.trim() || 'ollama',
      model: config.model || 'llama3',
      baseURL: normalizeBaseURL(config.baseUrl || 'http://localhost:11434/v1'),
    };
  }

  if (config.provider === 'custom') {
    const baseURL = normalizeBaseURL(config.baseUrl || '');
    if (!baseURL) return null;
    return {
      providerId: `custom:${slugifyProvider(baseURL)}`,
      providerLabel: 'Custom',
      apiKey: config.apiKey.trim(),
      model: config.model || 'gpt-4o-mini',
      baseURL,
    };
  }

  const providerId = config.provider === 'gemini' ? 'google' : config.provider;
  const template = getProviderTemplate(providerId || '');
  if (!template) return null;

  return {
    providerId: template.id,
    providerLabel: template.label,
    apiKey: config.apiKey.trim(),
    model: config.model || template.defaultModel,
    ...(config.baseUrl ? { baseURL: normalizeBaseURL(config.baseUrl) } : {}),
  };
}

export function agentToLegacyConfig(agent: AiAgentApiKey | null): ProviderConfig {
  if (!agent) {
    return {
      provider: 'openai',
      apiKey: '',
      model: DEFAULT_PROVIDER_TEMPLATE.defaultModel,
      maxTokens: 2048,
      temperature: 0.7,
    };
  }

  const provider = agent.providerId === 'google'
    ? 'gemini'
    : agent.providerId.startsWith('custom:')
      ? agent.providerId === 'custom:openrouter'
        ? 'openrouter'
        : agent.providerId === 'custom:ollama'
          ? 'ollama'
          : 'custom'
      : agent.providerId;

  return {
    provider,
    apiKey: agent.apiKey,
    model: agent.model,
    baseUrl: agent.baseURL,
    maxTokens: 2048,
    temperature: 0.7,
  };
}

export function getStaticModelsForAgent(agent: AiAgentApiKey | null) {
  if (!agent) return DEFAULT_PROVIDER_TEMPLATE.staticModels;
  const template = getProviderTemplate(agent.providerId);
  const preset = getCompatiblePreset(agent.providerId);
  return uniqueModels([agent.model, template?.defaultModel, ...(template?.staticModels || []), preset?.defaultModel, ...(preset?.staticModels || [])]);
}

export function getAgentKey(agent: Pick<AiAgentApiKey, 'providerId' | 'baseURL'>) {
  return `${agent.providerId}:${normalizeBaseURL(agent.baseURL || '')}`;
}

export function agentToDisplayLabel(agent: AiAgentApiKey) {
  return agent.providerLabel || agent.providerId.replace(/^custom:/, '');
}

export function uniqueModels(models: Array<string | undefined>) {
  return Array.from(new Set(models.map((model) => model?.trim()).filter(Boolean) as string[]));
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
