import { useConfigStore } from '../../../stores/config';
import { useFeatureStore } from '../../../stores/features';
import { PROVIDERS } from '../../../shared/constants';

export default function Settings() {
  const { config, setConfig, saveConfig } = useConfigStore();
  const { flags, setFlag } = useFeatureStore();

  const handleSave = async () => {
    await saveConfig();
    alert('Settings saved!');
  };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-6">
      <section>
        <h2 className="text-lg font-semibold mb-3">AI Provider</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Provider</label>
            <select
              value={config.provider}
              onChange={(e) => setConfig({ provider: e.target.value as any })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded focus:outline-none focus:border-orange-500"
            >
              {Object.entries(PROVIDERS).map(([key, { name }]) => (
                <option key={key} value={key}>{name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">API Key</label>
            <input
              type="password"
              value={config.apiKey}
              onChange={(e) => setConfig({ apiKey: e.target.value })}
              placeholder="sk-..."
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded focus:outline-none focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Model</label>
            <select
              value={config.model}
              onChange={(e) => setConfig({ model: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded focus:outline-none focus:border-orange-500"
            >
              {PROVIDERS[config.provider].models.map((model) => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Temperature: {config.temperature}</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={config.temperature}
              onChange={(e) => setConfig({ temperature: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Max Tokens: {config.maxTokens}</label>
            <input
              type="range"
              min="256"
              max="8192"
              step="256"
              value={config.maxTokens}
              onChange={(e) => setConfig({ maxTokens: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Features</h2>
        <div className="space-y-3">
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={flags.imageUnderstanding}
              onChange={(e) => setFlag('imageUnderstanding', e.target.checked)}
              className="mt-1"
            />
            <div>
              <div className="text-sm font-medium">Image Understanding</div>
              <div className="text-xs text-gray-400">
                ⚠️ Uses 500-1500 additional tokens per image
              </div>
            </div>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={flags.selectionToolbar}
              onChange={(e) => setFlag('selectionToolbar', e.target.checked)}
            />
            <span className="text-sm">Selection Toolbar</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={flags.streamingResponse}
              onChange={(e) => setFlag('streamingResponse', e.target.checked)}
            />
            <span className="text-sm">Streaming Response</span>
          </label>
        </div>
      </section>

      <button
        onClick={handleSave}
        className="w-full py-2 bg-orange-600 hover:bg-orange-700 rounded font-medium"
      >
        Save Settings
      </button>
    </div>
  );
}
