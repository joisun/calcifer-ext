import { Readability } from '@mozilla/readability';
import TurndownService from 'turndown';
import type { PageContext } from '../../../shared/types';

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
});

export async function extractPageContent(): Promise<PageContext> {
  const documentClone = document.cloneNode(true) as Document;
  const reader = new Readability(documentClone);
  const article = reader.parse();

  if (!article) {
    return {
      title: document.title,
      url: window.location.href,
      markdown: document.body.innerText.slice(0, 8000),
      wordCount: document.body.innerText.split(/\s+/).length,
    };
  }

  const markdown = turndownService.turndown(article.content);

  return {
    title: article.title,
    url: window.location.href,
    markdown,
    wordCount: article.length,
    siteName: article.siteName || undefined,
  };
}
