import { extractPageContent } from './extractor/text';
import { extractImages } from './extractor/image';
import { injectTranslation } from './translator/renderer';
import { createSelectionToolbar } from './selection/toolbar';

export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    console.log('Calcifer content script loaded');

    chrome.storage.local.get('featureFlags', (result) => {
      if (result.featureFlags?.selectionToolbar) {
        createSelectionToolbar();
      }
    });

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'EXTRACT_PAGE') {
        (async () => {
          const pageContext = await extractPageContent();
          const images = await extractImages(message.imageMode || false);
          sendResponse({ ...pageContext, images });
        })();
        return true;
      }

      if (message.type === 'TRANSLATE_PAGE') {
        (async () => {
          const article = document.querySelector('article') || document.querySelector('main') || document.body;
          const elements = article.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li');

          for (const el of Array.from(elements)) {
            const text = (el as HTMLElement).textContent?.trim();
            if (!text || text.length < 10) continue;

            const port = chrome.runtime.connect({ name: 'translate-stream' });
            let translation = '';
            let translationEl: HTMLElement | null = null;

            port.postMessage({
              type: 'TRANSLATE',
              text,
              targetLang: message.targetLang
            });

            port.onMessage.addListener((msg) => {
              if (msg.type === 'CHUNK') {
                translation += msg.chunk;
                if (!translationEl) {
                  translationEl = injectTranslation(el as HTMLElement, translation);
                } else {
                  translationEl.textContent = translation;
                }
              } else if (msg.type === 'DONE') {
                port.disconnect();
              }
            });

            await new Promise(resolve => setTimeout(resolve, 100));
          }

          sendResponse({ success: true });
        })();
        return true;
      }
    });
  },
});
