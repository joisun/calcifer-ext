import { create } from 'zustand';
import type { FeatureFlags } from '../shared/types';

interface FeatureStore {
  flags: FeatureFlags;
  setFlag: (key: keyof FeatureFlags, value: boolean) => void;
  loadFlags: () => Promise<void>;
}

export const useFeatureStore = create<FeatureStore>((set, get) => ({
  flags: {
    imageUnderstanding: false,
    autoTranslate: false,
    selectionToolbar: true,
    streamingResponse: true,
    debugMode: false,
  },
  setFlag: (key, value) => {
    set((state) => ({
      flags: { ...state.flags, [key]: value }
    }));
    chrome.storage.local.set({ featureFlags: get().flags });
  },
  loadFlags: async () => {
    const result = await chrome.storage.local.get('featureFlags');
    if (result.featureFlags) {
      set({ flags: result.featureFlags });
    }
  },
}));
