import { aiService } from '../../ai/service';

export default defineBackground(() => {
  console.log('Calcifer background service worker started');

  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

  // 开发模式下自动打开测试页面
  if (import.meta.env.DEV) {
    chrome.runtime.onInstalled.addListener(() => {
      chrome.tabs.create({ url: 'https://react.dev/learn' });
    });
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type !== 'OPEN_SIDEPANEL_WITH_TEXT') return;

    (async () => {
      await chrome.storage.local.set({
        pendingSelectionAction: {
          text: message.text,
          action: message.action,
          createdAt: Date.now(),
        },
      });

      if (sender.tab?.id) {
        await chrome.sidePanel.open({ tabId: sender.tab.id });
      }
      sendResponse({ success: true });
    })();

    return true;
  });

  chrome.runtime.onConnect.addListener((port) => {
    if (port.name === 'ai-stream') {
      let disconnected = false;
      const abortController = new AbortController();
      const postToPort = (message: unknown) => {
        if (disconnected) return;
        try {
          port.postMessage(message);
        } catch {
          disconnected = true;
        }
      };

      port.onDisconnect.addListener(() => {
        disconnected = true;
        abortController.abort();
      });

      port.onMessage.addListener(async (msg) => {
        if (msg.type === 'ASK_AI') {
          try {
            const { config, pageContext, question, imageMode, task } = msg;
            await aiService.streamPageChat({
              pageContext,
              question,
              task,
              imageMode,
              temperature: config?.temperature,
              maxTokens: config?.maxTokens,
              abortSignal: abortController.signal,
              onChunk: (chunk) => postToPort({ type: 'CHUNK', chunk }),
              onRetry: (attempt, maxRetries, error) => postToPort({ type: 'RETRY', attempt, maxRetries, error: error.message }),
            });
            postToPort({ type: 'DONE' });
          } catch (error: any) {
            postToPort({ type: 'ERROR', error: error.message });
          }
        }
      });
    }

  });
});
