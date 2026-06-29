import { extractPageContent } from './extractor/text';
import { extractImages } from './extractor/image';
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

    });
  },
});
