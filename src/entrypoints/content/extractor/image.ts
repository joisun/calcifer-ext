import type { ImageContext } from '../../../shared/types';

function isContentImage(img: HTMLImageElement): boolean {
  const { width, height, src } = img;
  if (width < 100 || height < 100) return false;

  const skipPatterns = ['avatar', 'logo', 'icon', 'emoji', 'badge', 'button'];
  return !skipPatterns.some(pattern => src.toLowerCase().includes(pattern));
}

async function compressAndEncode(img: HTMLImageElement): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    const maxSize = 1024;
    let { width, height } = img;

    if (width > maxSize || height > maxSize) {
      if (width > height) {
        height = (height / width) * maxSize;
        width = maxSize;
      } else {
        width = (width / height) * maxSize;
        height = maxSize;
      }
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);

    resolve(canvas.toDataURL('image/jpeg', 0.85));
  });
}

export async function extractImages(enabled: boolean): Promise<ImageContext[]> {
  if (!enabled) return [];

  const article = document.querySelector('article') || document.querySelector('main') || document.body;
  const imgs = Array.from(article.querySelectorAll('img'));

  const validImages = imgs.filter(isContentImage).slice(0, 5);

  const results: ImageContext[] = [];
  for (const img of validImages) {
    try {
      const base64 = await compressAndEncode(img);
      results.push({
        alt: img.alt || img.title || '',
        base64,
        position: results.length
      });
    } catch (e) {
      console.warn('Failed to process image:', e);
    }
  }

  return results;
}
