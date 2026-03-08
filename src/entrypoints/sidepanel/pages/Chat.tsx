import { useState } from 'react';
import { useChatStore } from '../../../stores/chat';
import { useConfigStore } from '../../../stores/config';
import { useFeatureStore } from '../../../stores/features';
import { Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function Chat() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messages = useChatStore((state) => state.messages);
  const addMessage = useChatStore((state) => state.addMessage);
  const config = useConfigStore((state) => state.config);
  const imageMode = useFeatureStore((state) => state.flags.imageUnderstanding);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    if (!config.apiKey) {
      alert('Please configure your API key in Settings');
      return;
    }

    const question = input;
    setInput('');
    addMessage({ role: 'user', content: question });
    setLoading(true);

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const pageContext = await chrome.tabs.sendMessage(tab.id!, {
        type: 'EXTRACT_PAGE',
        imageMode
      });

      const port = chrome.runtime.connect({ name: 'ai-stream' });
      let assistantMessage = '';

      port.postMessage({
        type: 'ASK_AI',
        config,
        pageContext,
        question,
        imageMode
      });

      port.onMessage.addListener((msg) => {
        if (msg.type === 'CHUNK') {
          assistantMessage += msg.chunk;
          addMessage({ role: 'assistant', content: assistantMessage });
        } else if (msg.type === 'DONE') {
          setLoading(false);
          port.disconnect();
        } else if (msg.type === 'ERROR') {
          addMessage({ role: 'assistant', content: `Error: ${msg.error}` });
          setLoading(false);
          port.disconnect();
        }
      });
    } catch (error: any) {
      addMessage({ role: 'assistant', content: `Error: ${error.message}` });
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-4 py-2 rounded-lg ${
              msg.role === 'user'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-700 text-gray-100'
            }`}>
              {msg.role === 'assistant' ? (
                <ReactMarkdown className="prose prose-invert prose-sm max-w-none">
                  {msg.content}
                </ReactMarkdown>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-700 px-4 py-2 rounded-lg">
              <span className="animate-pulse">🔥 Thinking...</span>
            </div>
          </div>
        )}
      </div>
      <div className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about this page..."
            disabled={loading}
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded focus:outline-none focus:border-orange-500"
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 rounded"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
