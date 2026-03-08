import { useState } from 'react';
import { Languages } from 'lucide-react';

export default function Translate() {
  const [targetLang, setTargetLang] = useState('zh-CN');
  const [translating, setTranslating] = useState(false);

  const handleTranslate = async () => {
    setTranslating(true);
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.tabs.sendMessage(tab.id!, {
      type: 'TRANSLATE_PAGE',
      targetLang
    });
    setTranslating(false);
  };

  return (
    <div className="h-full p-4 space-y-4">
      <div className="flex items-center gap-2 text-orange-500">
        <Languages size={24} />
        <h2 className="text-lg font-semibold">Page Translation</h2>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Target Language</label>
          <select
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded"
          >
            <option value="zh-CN">Chinese (Simplified)</option>
            <option value="en">English</option>
            <option value="ja">Japanese</option>
            <option value="ko">Korean</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
          </select>
        </div>

        <button
          onClick={handleTranslate}
          disabled={translating}
          className="w-full py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 rounded"
        >
          {translating ? 'Translating...' : 'Translate Page'}
        </button>
      </div>

      <div className="text-sm text-gray-400">
        <p>Translations will appear below each paragraph on the page.</p>
        <p className="mt-2">Refresh the page to remove translations.</p>
      </div>
    </div>
  );
}
