import { streamAIResponse } from '../../ai/router';
import { buildContext } from '../../ai/context-builder';

export default defineBackground(() => {
  console.log('Calcifer background service worker started');

  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

  chrome.runtime.onConnect.addListener((port) => {
    if (port.name === 'ai-stream') {
      port.onMessage.addListener(async (msg) => {
        if (msg.type === 'ASK_AI') {
          try {
            const { config, pageContext, question, imageMode } = msg;
            const content = buildContext(pageContext, question, imageMode);
            const messages = [{ role: 'user', content }];

            for await (const chunk of streamAIResponse(config, messages)) {
              port.postMessage({ type: 'CHUNK', chunk });
            }
            port.postMessage({ type: 'DONE' });
          } catch (error: any) {
            port.postMessage({ type: 'ERROR', error: error.message });
          }
        }
      });
    }

    if (port.name === 'translate-stream') {
      port.onMessage.addListener(async (msg) => {
        if (msg.type === 'TRANSLATE') {
          try {
            const result = await chrome.storage.local.get('providerConfig');
            const config = result.providerConfig;

            if (!config) {
              port.postMessage({ type: 'ERROR', error: 'No config found' });
              return;
            }

            const messages = [{
              role: 'user',
              content: `Translate the following text to ${msg.targetLang}. Only output the translation, no explanations:\n\n${msg.text}`
            }];

            for await (const chunk of streamAIResponse(config, messages)) {
              port.postMessage({ type: 'CHUNK', chunk });
            }
            port.postMessage({ type: 'DONE' });
          } catch (error: any) {
            port.postMessage({ type: 'ERROR', error: error.message });
          }
        }
      });
    }
  });
});
