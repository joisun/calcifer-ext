import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { ChatStatus, UIMessage } from 'ai';
import { ChevronDown, History, Languages, MessageSquareText, Plus, Sparkles, X } from 'lucide-react';
import { useChatStore } from '../../../stores/chat';
import { useConfigStore } from '../../../stores/config';
import { useFeatureStore } from '../../../stores/features';
import { useToastStore } from '../../../stores/toast';
import { agentToDisplayLabel, getAgentKey } from '../../../ai/providers';
import ConversationDrawer from '../../../components/chat/ConversationDrawer';
import { AgentChat } from '../../../components/agent-elements/agent-chat';
import { InputBar, type InputBarProps } from '../../../components/agent-elements/input-bar';

type AgentChatMode = 'chat' | 'summary';

const SUMMARY_PROMPT = 'Summarize this webpage. Focus on the main claim, key details, and any actionable takeaways.';

const languages = [
  { code: 'zh-CN', name: '中文' },
  { code: 'zh-TW', name: '繁中' },
  { code: 'en', name: 'English' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
];

const DEFAULT_SELECTION_TRANSLATION_LANG = 'zh-CN';

type PendingSelectionAction = {
  text: string;
  action: 'ask' | 'translate' | 'explain';
  createdAt: number;
};

export default function Chat() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<AgentChatMode>('chat');
  const [selectedText, setSelectedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pendingSelectionHandledRef = useRef(false);
  const { messages, addMessage, upsertStreamingAssistantMessage, currentConversationId, createConversation, loadConversation } = useChatStore();
  const { config, agents, setPrimaryAgent, saveConfig } = useConfigStore();
  const imageMode = useFeatureStore((state) => state.flags.imageUnderstanding);
  const { addToast } = useToastStore();
  const activeAgent = agents[0] || null;
  const activeProviderKey = activeAgent ? getAgentKey(activeAgent) : '';
  const providerOptions = useMemo(() => agents.map((agent) => ({
    key: getAgentKey(agent),
    label: agentToDisplayLabel(agent),
    model: agent.model,
  })), [agents]);
  const agentMessages = useMemo<UIMessage[]>(() => messages
    .filter((message) => message.role === 'user' || message.role === 'assistant')
    .map((message, index) => ({
      id: `${message.timestamp}-${index}`,
      role: message.role as 'user' | 'assistant',
      createdAt: new Date(message.timestamp),
      parts: [{ type: 'text', text: message.content }],
    } as UIMessage)), [messages]);
  const chatStatus = (loading ? 'streaming' : 'ready') as ChatStatus;

  useEffect(() => {
    if (!currentConversationId) {
      createConversation().then((id) => loadConversation(id));
    }
  }, [currentConversationId, createConversation, loadConversation]);

  useEffect(() => {
    let cancelled = false;

    async function loadPendingSelection() {
      if (pendingSelectionHandledRef.current) return;
      const result = await chrome.storage.local.get('pendingSelectionAction');
      const pending = result.pendingSelectionAction as PendingSelectionAction | undefined;
      if (cancelled || !pending?.text) return;

      if (pending.action === 'ask') {
        pendingSelectionHandledRef.current = true;
        await chrome.storage.local.remove('pendingSelectionAction');
        setMode('chat');
        setSelectedText(pending.text);
        return;
      }

      pendingSelectionHandledRef.current = true;
      await chrome.storage.local.remove('pendingSelectionAction');
      setMode('chat');
      setSelectedText(pending.text);
      if (pending.action === 'translate') {
        await handleSelectedTextAction('translate', pending.text);
      } else {
        await handleSelectedTextAction('explain', pending.text);
      }
    }

    void loadPendingSelection();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.apiKey, agents.length]);

  async function handleNew() {
    const id = await createConversation();
    loadConversation(id);
    addToast('New chat created', 'success');
  }

  async function handleProviderChange(providerKey: string) {
    const nextAgent = agents.find((agent) => getAgentKey(agent) === providerKey);
    if (!nextAgent || getAgentKey(nextAgent) === activeProviderKey) return;
    setPrimaryAgent(nextAgent);
    await saveConfig();
  }

  async function handleSubmit(message?: { role: 'user'; content: string }) {
    if (loading) return;

    const draft = message?.content.trim() || input.trim();
    const question = mode === 'summary' ? SUMMARY_PROMPT : draft;
    if (!question) return;
    if (!config.apiKey) {
      addToast('Please configure your API key in Settings', 'error');
      return;
    }

    if (mode === 'chat') setInput('');
    await askPage(question, mode === 'summary' ? 'Summarize this page' : question, mode === 'summary' ? 'summary' : 'chat');
  }

  async function handleSelectedTextAction(action: 'translate' | 'explain', text = selectedText) {
    const normalizedText = text.trim();
    if (!normalizedText || loading) return;
    if (!config.apiKey && !agents.length) return;
    if (!config.apiKey) {
      addToast('Please configure your API key in Settings', 'error');
      return;
    }

    const targetLang = languages.find((item) => item.code === DEFAULT_SELECTION_TRANSLATION_LANG)?.name || '中文';
    const question = action === 'translate'
      ? `Translate the selected text into ${targetLang}. Preserve meaning and formatting.\n\nSelected text:\n${normalizedText}`
      : `Explain the selected text in the context of the current webpage. Clarify meaning, intent, and implications.\n\nSelected text:\n${normalizedText}`;

    await askPage(question, action === 'translate' ? 'Translate selected text' : 'Explain selected text', 'selection');
  }

  async function askPage(question: string, visiblePrompt: string, task: 'chat' | 'summary' | 'selection' = 'chat') {
    await addMessage({ role: 'user', content: visiblePrompt });
    setLoading(true);

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const pageContext = await chrome.tabs.sendMessage(tab.id!, {
        type: 'EXTRACT_PAGE',
        imageMode,
      });

      const port = chrome.runtime.connect({ name: 'ai-stream' });
      let assistantMessage = '';

      port.postMessage({
        type: 'ASK_AI',
        config,
        pageContext,
        question,
        task,
        imageMode,
      });

      port.onMessage.addListener(async (msg) => {
        if (msg.type === 'CHUNK') {
          assistantMessage += msg.chunk;
          await upsertStreamingAssistantMessage(assistantMessage);
          return;
        }

        if (msg.type === 'DONE') {
          setLoading(false);
          port.disconnect();
          return;
        }

        if (msg.type === 'ERROR') {
          await addMessage({ role: 'assistant', content: `Error: ${msg.error}` });
          setLoading(false);
          port.disconnect();
        }
      });
    } catch (error: any) {
      await addMessage({ role: 'assistant', content: `Error: ${error.message}` });
      setLoading(false);
    }
  }

  return (
    <>
      <ConversationDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <div className="flex h-full flex-col bg-background">
        <AgentChat
          messages={agentMessages}
          status={chatStatus}
          onSend={handleSubmit}
          onStop={() => setLoading(false)}
          showCopyToolbar
          initialScrollBehavior="bottom"
          classNames={{
            root: 'min-h-0 bg-background',
            inputBar: 'px-3 pb-3',
            userMessage: 'bg-primary/15 text-foreground shadow-none',
          }}
          slots={{
            InputBar: (props) => (
              <CalciferInputBar
                {...props}
                value={input}
                mode={mode}
                disabled={loading}
                selectedText={selectedText}
                providers={providerOptions}
                activeProviderKey={activeProviderKey}
                onChange={setInput}
                onModeChange={setMode}
                onProviderChange={handleProviderChange}
                onNewChat={handleNew}
                onOpenHistory={() => setDrawerOpen(true)}
                onClearSelection={() => setSelectedText('')}
                onSelectionAction={handleSelectedTextAction}
              />
            ),
          }}
        />
      </div>
    </>
  );
}

type ProviderOption = {
  key: string;
  label: string;
  model: string;
};

type CalciferInputBarProps = InputBarProps & {
  mode: AgentChatMode;
  selectedText: string;
  providers: ProviderOption[];
  activeProviderKey: string;
  onModeChange: (mode: AgentChatMode) => void;
  onProviderChange: (providerKey: string) => void;
  onNewChat: () => void;
  onOpenHistory: () => void;
  onClearSelection: () => void;
  onSelectionAction: (action: 'translate' | 'explain') => void;
};

function CalciferInputBar({
  mode,
  selectedText,
  providers,
  activeProviderKey,
  onModeChange,
  onProviderChange,
  onNewChat,
  onOpenHistory,
  onClearSelection,
  onSelectionAction,
  ...props
}: CalciferInputBarProps) {
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [providerMenuOpen, setProviderMenuOpen] = useState(false);
  const activeProvider = providers.find((provider) => provider.key === activeProviderKey);

  return (
    <div className="px-3 pb-3">
      {selectedText && (
        <div className="mb-2 rounded-md bg-surface-2/80 px-3 py-2 shadow-[inset_0_0_0_1px_hsl(var(--border)/0.35)]">
          <div className="mb-2 flex items-start gap-2">
            <span className="line-clamp-2 min-w-0 flex-1 text-[12px] leading-5 text-muted-foreground">
              {selectedText}
            </span>
            <button
              type="button"
              onClick={onClearSelection}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-surface-3 hover:text-foreground"
              title="Clear selection"
            >
              <X size={13} />
            </button>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onSelectionAction('translate')}
              disabled={props.disabled}
              className="flex h-7 items-center gap-2 rounded-md bg-primary/15 px-2 text-[12px] text-primary hover:bg-primary/20 disabled:opacity-50"
            >
              <Languages size={13} />
              Translate
            </button>
            <button
              type="button"
              onClick={() => onSelectionAction('explain')}
              disabled={props.disabled}
              className="flex h-7 items-center gap-2 rounded-md bg-surface-3/80 px-2 text-[12px] text-foreground hover:bg-surface-3 disabled:opacity-50"
            >
              <MessageSquareText size={13} />
              Understand
            </button>
          </div>
        </div>
      )}
      <InputBar
        {...props}
        className="p-0"
        placeholder={mode === 'summary' ? 'Summarize the current page...' : 'Ask about the current page...'}
        leftActions={
          <>
            <IconButton title="History" onClick={onOpenHistory}>
              <History size={14} />
            </IconButton>
            <IconButton title="New chat" onClick={onNewChat}>
              <Plus size={14} />
            </IconButton>
            <div className="relative">
              <button
                type="button"
                onClick={() => setActionMenuOpen((open) => !open)}
                className="flex h-8 items-center gap-1 rounded-md px-2 text-[12px] text-an-foreground-muted hover:bg-an-background-secondary hover:text-an-foreground"
              >
                {mode === 'summary' ? <Sparkles size={14} /> : <MessageSquareText size={14} />}
                <span>{mode === 'summary' ? 'Summary' : 'Chat'}</span>
                <ChevronDown size={13} />
              </button>
              {actionMenuOpen && (
                <div className="absolute bottom-9 left-0 z-20 w-44 rounded-md bg-surface p-1 shadow-[0_12px_36px_hsl(0_0%_0%/0.28),inset_0_0_0_1px_hsl(var(--border)/0.45)]">
                  <MenuButton
                    active={mode === 'chat'}
                    icon={<MessageSquareText size={14} />}
                    label="Chat with page"
                    onClick={() => {
                      onModeChange('chat');
                      setActionMenuOpen(false);
                    }}
                  />
                  <MenuButton
                    active={mode === 'summary'}
                    icon={<Sparkles size={14} />}
                    label="Summarize page"
                    onClick={() => {
                      onModeChange('summary');
                      setActionMenuOpen(false);
                    }}
                  />
                </div>
              )}
            </div>
          </>
        }
        rightActions={
          <div className="relative">
            <button
              type="button"
              onClick={() => setProviderMenuOpen((open) => !open)}
              className="flex h-8 max-w-[150px] items-center gap-1 rounded-md px-2 text-[12px] text-an-foreground-muted hover:bg-an-background-secondary hover:text-an-foreground"
              title={activeProvider ? `${activeProvider.label} · ${activeProvider.model}` : 'No provider configured'}
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span className="truncate">{activeProvider?.label || 'Provider'}</span>
              <ChevronDown size={13} className="shrink-0" />
            </button>
            {providerMenuOpen && (
              <div className="absolute bottom-9 right-0 z-20 w-56 rounded-md bg-surface p-1 shadow-[0_12px_36px_hsl(0_0%_0%/0.28),inset_0_0_0_1px_hsl(var(--border)/0.45)]">
                {providers.length ? providers.map((provider) => (
                  <MenuButton
                    key={provider.key}
                    active={provider.key === activeProviderKey}
                    label={provider.label}
                    description={provider.model}
                    onClick={() => {
                      void onProviderChange(provider.key);
                      setProviderMenuOpen(false);
                    }}
                  />
                )) : (
                  <div className="px-2 py-2 text-[12px] text-muted-foreground">Configure providers in Settings</div>
                )}
              </div>
            )}
          </div>
        }
      />
    </div>
  );
}

function IconButton({ title, onClick, children }: { title: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-md text-an-foreground-muted hover:bg-an-background-secondary hover:text-an-foreground"
    >
      {children}
    </button>
  );
}

function MenuButton({
  active,
  icon,
  label,
  description,
  onClick,
}: {
  active: boolean;
  icon?: ReactNode;
  label: string;
  description?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-[12px] text-foreground hover:bg-surface-2"
    >
      {icon && <span className="text-primary">{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block truncate">{label}</span>
        {description && <span className="block truncate text-[11px] text-muted-foreground">{description}</span>}
      </span>
      {active && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
    </button>
  );
}
