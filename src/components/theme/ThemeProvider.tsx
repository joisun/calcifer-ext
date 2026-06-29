import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  getStoredThemePreference,
  resolveEffectiveTheme,
  setStoredThemePreference,
  THEME_STORAGE_KEY,
  type ThemePreference,
} from '../../lib/theme';

type ThemeProviderState = {
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeProviderState>({
  theme: 'dark',
  setTheme: () => undefined,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>('dark');

  useEffect(() => {
    let cancelled = false;
    getStoredThemePreference().then((stored) => {
      if (!cancelled) setThemeState(stored);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolveEffectiveTheme(theme));
  }, [theme]);

  useEffect(() => {
    const onChromeStorage = (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
      if (areaName !== 'local') return;
      const next = changes[THEME_STORAGE_KEY]?.newValue;
      if (next === 'light' || next === 'dark' || next === 'system') {
        setThemeState(next);
      }
    };
    const onMedia = () => {
      if (theme === 'system') {
        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(resolveEffectiveTheme('system'));
      }
    };

    chrome.storage?.onChanged?.addListener(onChromeStorage);
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', onMedia);
    return () => {
      chrome.storage?.onChanged?.removeListener(onChromeStorage);
      media.removeEventListener('change', onMedia);
    };
  }, [theme]);

  const setTheme = (next: ThemePreference) => {
    setThemeState(next);
    void setStoredThemePreference(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
