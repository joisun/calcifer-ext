export type ThemePreference = 'light' | 'dark' | 'system';
export type EffectiveTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'calcifer-theme';

function normalizeTheme(value: unknown): ThemePreference | null {
  return value === 'light' || value === 'dark' || value === 'system' ? value : null;
}

export async function getStoredThemePreference(): Promise<ThemePreference> {
  try {
    const stored = await chrome.storage.local.get(THEME_STORAGE_KEY);
    const theme = normalizeTheme(stored[THEME_STORAGE_KEY]);
    if (theme) return theme;
  } catch {}
  return 'dark';
}

export async function setStoredThemePreference(theme: ThemePreference) {
  try {
    await chrome.storage.local.set({ [THEME_STORAGE_KEY]: theme });
  } catch {}
}

export function resolveEffectiveTheme(preference: ThemePreference): EffectiveTheme {
  if (preference === 'light' || preference === 'dark') return preference;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
