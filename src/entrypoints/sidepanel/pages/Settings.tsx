import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Eye, EyeOff, Loader2, Save, Settings as SettingsIcon, Sparkles, Trash2 } from 'lucide-react';
import { useConfigStore } from '../../../stores/config';
import { useFeatureStore } from '../../../stores/features';
import { useToastStore } from '../../../stores/toast';
import { fetchModels } from '../../../lib/models';
import { Input } from '../../../components/ui/input';
import { Checkbox } from '../../../components/ui/checkbox';
import {
  AI_PROVIDER_TEMPLATES,
  COMPATIBLE_PROVIDER_PRESETS,
  DEFAULT_PROVIDER_TEMPLATE,
  getCompatiblePreset,
  getAgentKey,
  getProviderTemplate,
  normalizeBaseURL,
  slugifyProvider,
  type AIProviderId,
  type AiAgentApiKey,
} from '../../../ai/providers';

type ProviderChoice = {
  id: string;
  label: string;
  providerId: AIProviderId | `custom:${string}`;
  defaultModel: string;
  staticModels: string[];
  baseURL?: string;
  kind: 'built-in' | 'compatible' | 'custom';
};

const CUSTOM_PROVIDER_ID = 'custom';
const providerChoices: ProviderChoice[] = [
  ...AI_PROVIDER_TEMPLATES.map((template) => ({
    id: template.id,
    label: template.label,
    providerId: template.id,
    defaultModel: template.defaultModel,
    staticModels: template.staticModels,
    baseURL: template.baseURL,
    kind: 'built-in' as const,
  })),
  ...COMPATIBLE_PROVIDER_PRESETS.map((preset) => ({
    ...preset,
    kind: 'compatible' as const,
  })),
  {
    id: CUSTOM_PROVIDER_ID,
    label: 'Custom',
    providerId: 'custom:provider',
    defaultModel: 'gpt-4o-mini',
    staticModels: ['gpt-4o-mini', 'gpt-4o', 'o4-mini'],
    baseURL: '',
    kind: 'custom',
  },
];

export default function Settings() {
  const { config, agents, aiMaxRetries, setConfig, setPrimaryAgent, setAgents, setAiMaxRetries, saveConfig } = useConfigStore();
  const { flags, setFlag } = useFeatureStore();
  const { addToast } = useToastStore();
  const [showApiKey, setShowApiKey] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(DEFAULT_PROVIDER_TEMPLATE.id);
  const [apiKey, setApiKey] = useState('');
  const [baseURL, setBaseURL] = useState('');
  const [model, setModel] = useState(DEFAULT_PROVIDER_TEMPLATE.defaultModel);
  const [models, setModels] = useState<string[]>(DEFAULT_PROVIDER_TEMPLATE.staticModels);
  const [providerOptionsText, setProviderOptionsText] = useState('');
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelError, setModelError] = useState('');

  const configuredAgent = useMemo(
    () => agents.find((agent) => resolveChoiceId(agent) === selectedProvider) || null,
    [agents, selectedProvider],
  );
  const selectedChoice = useMemo(
    () => providerChoices.find((choice) => choice.id === selectedProvider) || providerChoices[0],
    [selectedProvider],
  );
  const needsBaseURL = selectedChoice.kind !== 'built-in';
  const providerOptions = useMemo(() => parseProviderOptions(providerOptionsText), [providerOptionsText]);

  useEffect(() => {
    const choice = providerChoices.find((item) => item.id === selectedProvider) || providerChoices[0];
    const agent = configuredAgent;
    if (!agent) {
      setApiKey('');
      setBaseURL(choice.baseURL || '');
      setModel(choice.defaultModel);
      setModels(unique([choice.defaultModel, ...choice.staticModels]));
      setProviderOptionsText('');
      return;
    }

    setSelectedProvider(choice.id);
    setApiKey(agent.apiKey);
    setBaseURL(agent.baseURL || choice.baseURL || '');
    setModel(agent.model || choice.defaultModel);
    setModels(unique([agent.model, choice.defaultModel, ...choice.staticModels]));
    setProviderOptionsText(agent.providerOptions ? JSON.stringify(agent.providerOptions, null, 2) : '');
  }, [configuredAgent, selectedProvider]);

  useEffect(() => {
    if (!apiKey.trim()) {
      setModels(unique([model, selectedChoice.defaultModel, ...selectedChoice.staticModels]));
      setModelError('');
      return;
    }
    if (needsBaseURL && !baseURL.trim()) {
      setModelError('Base URL is required for this provider.');
      return;
    }

    const timer = window.setTimeout(async () => {
      const agent = buildAgent();
      if (!agent) return;
      setLoadingModels(true);
      setModelError('');
      try {
        const nextModels = await fetchModels(agent);
        setModels(nextModels.length ? nextModels : unique([model, selectedChoice.defaultModel, ...selectedChoice.staticModels]));
      } catch (error) {
        setModelError(error instanceof Error ? error.message : 'Model list unavailable.');
      } finally {
        setLoadingModels(false);
      }
    }, 450);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, baseURL, selectedProvider]);

  const canSave = Boolean(
    apiKey.trim()
    && model.trim()
    && (!needsBaseURL || baseURL.trim())
    && providerOptions.valid
  );

  function selectProvider(choiceId: string) {
    const choice = providerChoices.find((item) => item.id === choiceId) || providerChoices[0];
    setSelectedProvider(choice.id);
    setModelError('');
  }

  function buildAgent(): AiAgentApiKey | null {
    if (!apiKey.trim() || !model.trim()) return null;
    if (needsBaseURL && !baseURL.trim()) return null;
    if (!providerOptions.valid) return null;

    const customId = selectedChoice.kind === 'custom'
      ? `custom:${slugifyProvider(baseURL || selectedChoice.label)}` as const
      : selectedChoice.providerId;

    return {
      providerId: customId,
      providerLabel: selectedChoice.label,
      apiKey: apiKey.trim(),
      model: model.trim(),
      ...(needsBaseURL || selectedChoice.baseURL ? { baseURL: normalizeBaseURL(baseURL || selectedChoice.baseURL || '') } : {}),
      ...(providerOptions.value ? { providerOptions: providerOptions.value } : {}),
    };
  }

  async function handleSave() {
    const nextAgent = buildAgent();
    if (!nextAgent) {
      addToast('Provider configuration is incomplete', 'error');
      return;
    }

    setPrimaryAgent(nextAgent);
    setConfig({
      provider: nextAgent.providerId === 'google'
        ? 'gemini'
        : nextAgent.providerId.startsWith('custom:')
          ? nextAgent.providerId === 'custom:openrouter'
            ? 'openrouter'
            : nextAgent.providerId === 'custom:ollama'
              ? 'ollama'
              : 'custom'
          : nextAgent.providerId,
      apiKey: nextAgent.apiKey,
      baseUrl: nextAgent.baseURL,
      model: nextAgent.model,
    });
    await saveConfig();
    addToast('Settings saved', 'success');
  }

  async function handleClearProvider() {
    if (!configuredAgent) return;
    const nextAgents = agents.filter((agent) => getAgentKey(agent) !== getAgentKey(configuredAgent));
    setAgents(nextAgents);
    await saveConfig();
    setApiKey('');
    addToast('Provider cleared', 'info');
  }

  return (
    <div className="scrollbar-thin h-full space-y-4 overflow-y-auto bg-background p-4">
      <div className="flex items-center gap-2 border-b pb-3">
        <SettingsIcon size={15} className="text-primary" />
        <div>
          <h2 className="font-display text-[13px] font-semibold">Settings</h2>
          <p className="text-[11px] text-muted-foreground">Provider, generation, and feature controls.</p>
        </div>
      </div>

      <section className="calcifer-panel space-y-3 p-3">
        <SectionTitle icon={<Sparkles size={14} className="text-primary" />} title="AI Provider" />

        <Field label="Provider">
          <select
            value={selectedProvider}
            onChange={(event) => selectProvider(event.target.value)}
            className="h-8 w-full rounded-md border border-input bg-surface-2 px-3 text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {providerChoices.map((choice) => (
              <option key={choice.id} value={choice.id}>{choice.label}</option>
            ))}
          </select>
        </Field>

        {needsBaseURL && (
          <Field label="Base URL">
            <Input
              value={baseURL}
              onChange={(event) => setBaseURL(event.target.value)}
              placeholder="https://api.example.com/v1"
            />
          </Field>
        )}

        <Field label="API Key">
          <div className="relative">
            <Input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder="sk-..."
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-1 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:bg-surface-3 hover:text-foreground"
              aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
            >
              {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </Field>

        <Field label={loadingModels ? 'Model · loading' : 'Model'}>
          <div className="flex gap-2">
            <Input
              list="calcifer-model-options"
              value={model}
              onChange={(event) => setModel(event.target.value)}
              placeholder={selectedChoice.defaultModel}
              className="min-w-0 flex-1 font-mono"
            />
            <datalist id="calcifer-model-options">
              {models.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
            {loadingModels && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-surface">
                <Loader2 size={14} className="animate-spin text-primary" />
              </div>
            )}
          </div>
          {modelError && <p className="mt-1 text-[11px] text-warning">{modelError}</p>}
        </Field>

        {selectedChoice.kind === 'custom' && (
          <Field label="Provider Options JSON">
            <textarea
              value={providerOptionsText}
              onChange={(event) => setProviderOptionsText(event.target.value)}
              placeholder='{"headers":{}}'
              className="min-h-20 w-full resize-y rounded-md border border-input bg-surface-2 px-3 py-2 font-mono text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {!providerOptions.valid && <p className="mt-1 text-[11px] text-destructive">{providerOptions.error}</p>}
          </Field>
        )}
      </section>

      <section className="calcifer-panel space-y-3 p-3">
        <SectionTitle title="Generation" />
        <RangeField
          label="Temperature"
          value={config.temperature}
          min={0}
          max={1}
          step={0.1}
          onChange={(value) => setConfig({ temperature: value })}
        />
        <RangeField
          label="Max Tokens"
          value={config.maxTokens}
          min={256}
          max={8192}
          step={256}
          onChange={(value) => setConfig({ maxTokens: value })}
        />
        <RangeField
          label="Max Retries"
          value={aiMaxRetries}
          min={0}
          max={5}
          step={1}
          onChange={setAiMaxRetries}
        />
      </section>

      <section className="calcifer-panel space-y-3 p-3">
        <SectionTitle title="Features" />
        <FeatureToggle
          title="Image Understanding"
          description="Includes page images in context and uses more tokens."
          checked={flags.imageUnderstanding}
          onChange={(checked) => setFlag('imageUnderstanding', checked)}
        />
        <FeatureToggle
          title="Selection Toolbar"
          description="Shows compact quick actions when selecting text."
          checked={flags.selectionToolbar}
          onChange={(checked) => setFlag('selectionToolbar', checked)}
        />
        <FeatureToggle
          title="Streaming Response"
          description="Render responses as the provider streams output."
          checked={flags.streamingResponse}
          onChange={(checked) => setFlag('streamingResponse', checked)}
        />
      </section>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className="flex h-8 flex-1 items-center justify-center gap-2 rounded-md bg-primary px-3 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <Save size={14} />
          Save Settings
        </button>
        <button
          type="button"
          onClick={handleClearProvider}
          className="flex h-8 w-8 items-center justify-center rounded-md border bg-surface text-muted-foreground hover:bg-surface-3 hover:text-foreground"
          title="Clear provider"
          aria-label="Clear provider"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

function SectionTitle({ title, icon }: { title: string; icon?: ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-[12px] font-semibold">
      {icon}
      <span>{title}</span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function RangeField(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <div className="mb-1 flex items-center justify-between text-[12px]">
        <span className="text-muted-foreground">{props.label}</span>
        <span className="tabular-nums text-foreground">{props.value}</span>
      </div>
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        onChange={(event) => props.onChange(Number(event.target.value))}
        className="w-full accent-primary"
      />
    </label>
  );
}

function FeatureToggle(props: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 rounded-md border bg-surface-2 p-3">
      <Checkbox
        checked={props.checked}
        onCheckedChange={(checked) => props.onChange(Boolean(checked))}
      />
      <span className="min-w-0">
        <span className="block text-[13px] font-medium">{props.title}</span>
        <span className="block text-[11px] text-muted-foreground">{props.description}</span>
      </span>
    </label>
  );
}

function resolveChoiceId(agent: AiAgentApiKey) {
  const template = getProviderTemplate(agent.providerId);
  if (template) return template.id;
  const preset = getCompatiblePreset(agent.providerId);
  return preset?.id || CUSTOM_PROVIDER_ID;
}

function parseProviderOptions(text: string): { valid: true; value?: Record<string, unknown> } | { valid: false; error: string } {
  const trimmed = text.trim();
  if (!trimmed) return { valid: true };
  try {
    const parsed = JSON.parse(trimmed);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { valid: false, error: 'Provider options must be a JSON object.' };
    }
    return { valid: true, value: parsed };
  } catch {
    return { valid: false, error: 'Invalid JSON.' };
  }
}

function unique(values: Array<string | undefined>) {
  return Array.from(new Set(values.map((value) => value?.trim()).filter(Boolean) as string[]));
}
