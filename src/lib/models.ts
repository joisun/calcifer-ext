import {
  COMPATIBLE_PROVIDER_PRESETS,
  getProviderTemplate,
  normalizeBaseURL,
  uniqueModels,
  type AiAgentApiKey,
} from '../ai/providers';

type ModelConfig = {
  provider: string;
  apiKey: string;
  baseUrl?: string;
  modelsUrl?: string;
  model?: string;
}

export async function fetchModels(config: ModelConfig | AiAgentApiKey): Promise<string[]> {
  const normalized = normalizeModelConfig(config);
  const { provider, apiKey, baseUrl, modelsUrl } = normalized;

  try {
    let url = modelsUrl;

    if (!url) {
      switch (provider) {
        case 'openai':
          url = `${baseUrl || 'https://api.openai.com/v1'}/models`;
          break;
        case 'anthropic':
          url = `${baseUrl || 'https://api.anthropic.com/v1'}/models`;
          break;
        case 'gemini':
        case 'google':
          url = `${baseUrl || 'https://generativelanguage.googleapis.com/v1beta'}/models`;
          break;
        case 'deepseek':
          url = `${baseUrl || 'https://api.deepseek.com/v1'}/models`;
          break;
        case 'ollama':
          url = `${baseUrl || 'http://localhost:11434/v1'}/models`;
          break;
        case 'openrouter':
          url = 'https://openrouter.ai/api/v1/models';
          break;
        default:
          return [];
      }
    }

    const response = await fetchModelEndpoint(provider, url, apiKey);

    if (!response.ok) throw new Error('Failed to fetch models');

    const data = await response.json();

    if (provider === 'google' || provider === 'gemini') {
      return uniqueModels(data.models?.map((m: any) => String(m.name || '').replace(/^models\//, '')) || []);
    }

    return uniqueModels([
      ...(data.data?.map((m: any) => m.id) || []),
      ...(data.models?.map((m: any) => m.id || m.name) || []),
    ]);
  } catch (error) {
    console.error('Failed to fetch models:', error);
    return getFallbackModels(normalized);
  }
}

function normalizeModelConfig(config: ModelConfig | AiAgentApiKey): ModelConfig {
  if ('providerId' in config) {
    const customPreset = COMPATIBLE_PROVIDER_PRESETS.find((preset) => preset.providerId === config.providerId);
    const provider = config.providerId === 'google'
      ? 'google'
      : config.providerId.startsWith('custom:')
        ? customPreset?.id || 'custom'
        : config.providerId;
    return {
      provider,
      apiKey: config.apiKey,
      model: config.model,
      baseUrl: config.baseURL,
    };
  }

  return config;
}

function fetchModelEndpoint(provider: string, url: string, apiKey: string) {
  if (provider === 'google' || provider === 'gemini') {
    const separator = url.includes('?') ? '&' : '?';
    return fetch(`${url}${separator}key=${encodeURIComponent(apiKey)}`);
  }

  if (provider === 'anthropic') {
    return fetch(url, {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
    });
  }

  return fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });
}

function getFallbackModels(config: ModelConfig) {
  const provider = config.provider === 'gemini' ? 'google' : config.provider;
  const template = getProviderTemplate(provider);
  const preset = COMPATIBLE_PROVIDER_PRESETS.find((item) => item.id === provider);
  return uniqueModels([
    config.model,
    template?.defaultModel,
    ...(template?.staticModels || []),
    preset?.defaultModel,
    ...(preset?.staticModels || []),
  ]);
}
