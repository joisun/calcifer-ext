import { useState, useEffect } from 'react';
import { useConfigStore } from '../../stores/config';
import { useFeatureStore } from '../../stores/features';
import { ThemeProvider, useTheme } from '../../components/theme/ThemeProvider';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import Toast from '../../components/ui/Toast';
import ErrorBoundary from '../../components/ui/ErrorBoundary';
import { MessageSquare, Settings as SettingsIcon, Flame, Moon, Sun, Monitor } from 'lucide-react';

type Page = 'chat' | 'settings';

const pages: Array<{ id: Page; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = [
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

function AppShell() {
  const [currentPage, setCurrentPage] = useState<Page>('chat');
  const loadConfig = useConfigStore((state) => state.loadConfig);
  const loadFlags = useFeatureStore((state) => state.loadFlags);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    loadConfig();
    loadFlags();
  }, [loadConfig, loadFlags]);

  return (
    <ErrorBoundary>
      <Toast />
      <div className="flex h-full flex-col overflow-hidden bg-background text-foreground">
        <header className="shrink-0 border-b bg-background/95">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2">
              <Flame size={18} className="shrink-0 text-primary" />
              <div className="min-w-0 leading-tight">
                <h1 className="font-display text-[14px] font-semibold">Calcifer</h1>
              </div>
            </div>

            <nav className="ml-auto flex items-center gap-1 rounded-md border bg-surface p-0.5">
              {pages.map((page) => {
                const Icon = page.icon;
                const active = currentPage === page.id;
                return (
                  <button
                    key={page.id}
                    type="button"
                    onClick={() => setCurrentPage(page.id)}
                    title={page.label}
                    aria-label={page.label}
                    className={`flex h-7 w-7 items-center justify-center rounded-[5px] transition-colors ${
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-surface-3 hover:text-foreground'
                    }`}
                  >
                    <Icon size={15} />
                  </button>
                );
              })}
            </nav>

            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark')}
              className="flex h-8 w-8 items-center justify-center rounded-md border bg-surface text-muted-foreground transition-colors hover:bg-surface-3 hover:text-foreground"
              title={`Theme: ${theme}`}
              aria-label={`Theme: ${theme}`}
            >
              {theme === 'dark' ? <Moon size={15} /> : theme === 'light' ? <Sun size={15} /> : <Monitor size={15} />}
            </button>
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-hidden">
          {currentPage === 'chat' && <Chat />}
          {currentPage === 'settings' && <Settings />}
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}
