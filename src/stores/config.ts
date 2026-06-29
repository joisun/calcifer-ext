import { create } from 'zustand';
import type { ProviderConfig } from '../shared/types';
import {
  agentToLegacyConfig,
  getAgentKey,
  legacyConfigToAgent,
  normalizeAgentConfigs,
  type AiAgentApiKey,
} from '../ai/providers';

interface ConfigStore {
  config: ProviderConfig;
  agents: AiAgentApiKey[];
  aiMaxRetries: number;
  setConfig: (config: Partial<ProviderConfig>) => void;
  setPrimaryAgent: (agent: AiAgentApiKey | null) => void;
  setAgents: (agents: AiAgentApiKey[]) => void;
  setAiMaxRetries: (value: number) => void;
  loadConfig: () => Promise<void>;
  saveConfig: () => Promise<void>;
}

export const useConfigStore = create<ConfigStore>((set, get) => ({
  config: {
    provider: 'openai',
    apiKey: '',
    model: 'gpt-4o-mini',
    maxTokens: 2048,
    temperature: 0.7,
  },
  agents: [],
  aiMaxRetries: 2,
  setConfig: (newConfig) => set((state) => ({
    config: { ...state.config, ...newConfig }
  })),
  setPrimaryAgent: (agent) => set((state) => {
    const nextConfig = agentToLegacyConfig(agent);
    const nextAgents = agent
      ? [agent, ...state.agents.filter((item) => getAgentKey(item) !== getAgentKey(agent))]
      : [];

    return {
      agents: nextAgents,
      config: {
        ...nextConfig,
        temperature: state.config.temperature,
        maxTokens: state.config.maxTokens,
      },
    };
  }),
  setAgents: (agents) => set((state) => {
    const nextConfig = agentToLegacyConfig(agents[0] || null);
    return {
      agents,
      config: {
        ...nextConfig,
        temperature: state.config.temperature,
        maxTokens: state.config.maxTokens,
      },
    };
  }),
  setAiMaxRetries: (value) => set({ aiMaxRetries: Math.max(0, Math.min(5, Math.round(value))) }),
  loadConfig: async () => {
    const result = await chrome.storage.local.get(['providerConfig', 'agents', 'aiMaxRetries']);
    let agents = normalizeAgentConfigs(result.agents);

    if (!agents.length && result.providerConfig) {
      const migrated = legacyConfigToAgent(result.providerConfig);
      if (migrated) {
        agents = [migrated];
        await chrome.storage.local.set({ agents });
      }
    }

    const storedConfig = result.providerConfig as Partial<ProviderConfig> | undefined;
    const agentConfig = agents[0] ? agentToLegacyConfig(agents[0]) : null;

    set({
      agents,
      config: agentConfig
        ? {
            ...agentConfig,
            temperature: storedConfig?.temperature ?? get().config.temperature,
            maxTokens: storedConfig?.maxTokens ?? get().config.maxTokens,
          }
        : result.providerConfig || get().config,
      aiMaxRetries: Number.isFinite(Number(result.aiMaxRetries)) ? Number(result.aiMaxRetries) : get().aiMaxRetries,
    });
  },
  saveConfig: async () => {
    const state = get();
    await chrome.storage.local.set({
      providerConfig: state.config,
      agents: state.agents,
      aiMaxRetries: state.aiMaxRetries,
    });
  },
}));
