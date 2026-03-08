export function injectTranslation(element: HTMLElement, translation: string) {
  const wrapper = document.createElement('div');
  wrapper.className = 'calcifer-translation-wrapper';

  const shadow = wrapper.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = `
    .translation {
      color: #9ca3af;
      font-size: 0.9em;
      margin-top: 4px;
      padding-left: 8px;
      border-left: 2px solid #f97316;
      opacity: 0;
      animation: fadeIn 0.3s forwards;
    }
    @keyframes fadeIn {
      to { opacity: 1; }
    }
  `;

  const translationEl = document.createElement('p');
  translationEl.className = 'translation';
  translationEl.textContent = translation;

  shadow.appendChild(style);
  shadow.appendChild(translationEl);

  element.insertAdjacentElement('afterend', wrapper);

  return translationEl;
}

export function clearTranslations() {
  document.querySelectorAll('.calcifer-translation-wrapper').forEach(el => el.remove());
}
