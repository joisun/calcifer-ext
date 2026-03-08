import type { PageContext } from '../shared/types';

export function buildContext(pageContext: PageContext, question: string, imageMode: boolean) {
  const content = [];

  content.push({
    type: 'text' as const,
    text: `Page: ${pageContext.title}\nURL: ${pageContext.url}\n\n${pageContext.markdown}`
  });

  if (imageMode && pageContext.images?.length) {
    pageContext.images.forEach((img, i) => {
      content.push({
        type: 'text' as const,
        text: `\n[Image ${i + 1}: ${img.alt}]`
      });
      content.push({
        type: 'image' as const,
        image: img.base64
      });
    });
  }

  content.push({
    type: 'text' as const,
    text: `\n\nUser question: ${question}`
  });

  return content;
}
