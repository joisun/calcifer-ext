import { useState, useEffect } from 'react';
import { useConfigStore } from '../../stores/config';
import { useFeatureStore } from '../../stores/features';
import Chat from './pages/Chat';
import Translate from './pages/Translate';
import Settings from './pages/Settings';

type Page = 'chat' | 'translate' | 'settings';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('chat');
  const loadConfig = useConfigStore((state) => state.loadConfig);
  const loadFlags = useFeatureStore((state) => state.loadFlags);

  useEffect(() => {
    loadConfig();
    loadFlags();
  }, [loadConfig, loadFlags]);

  return (
    <div className="flex flex-col h-full bg-gray-900">
      <header className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
        <h1 className="text-lg font-semibold text-orange-500">🔥 Calcifer</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage('chat')}
            className={`px-3 py-1 text-sm rounded ${
              currentPage === 'chat' ? 'bg-orange-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            Chat
          </button>
          <button
            onClick={() => setCurrentPage('translate')}
            className={`px-3 py-1 text-sm rounded ${
              currentPage === 'translate' ? 'bg-orange-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            Translate
          </button>
          <button
            onClick={() => setCurrentPage('settings')}
            className={`px-3 py-1 text-sm rounded ${
              currentPage === 'settings' ? 'bg-orange-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            Settings
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-hidden">
        {currentPage === 'chat' && <Chat />}
        {currentPage === 'translate' && <Translate />}
        {currentPage === 'settings' && <Settings />}
      </main>
    </div>
  );
}
