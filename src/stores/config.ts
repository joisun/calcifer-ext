import { create } from 'zustand';
import type { ProviderConfig } from '../shared/types';

interface ConfigStore {
  config: ProviderConfig;
  setConfig: (config: Partial<ProviderConfig>) => void;
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
  setConfig: (newConfig) => set((state) => ({
    config: { ...state.config, ...newConfig }
  })),
  loadConfig: async () => {
    const result = await chrome.storage.local.get('providerConfig');
    if (result.providerConfig) {
      set({ config: result.providerConfig });
    }
  },
  saveConfig: async () => {
    await chrome.storage.local.set({ providerConfig: get().config });
  },
}));
