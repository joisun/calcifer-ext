export function createSelectionToolbar() {
  let toolbar: HTMLDivElement | null = null;

  document.addEventListener('mouseup', () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (toolbar) {
      toolbar.remove();
      toolbar = null;
    }

    if (!text || text.length < 3) return;

    const range = selection!.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    toolbar = document.createElement('div');
    toolbar.className = 'calcifer-selection-toolbar';

    const shadow = toolbar.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = `
      .toolbar {
        position: fixed;
        top: ${rect.top - 45}px;
        left: ${rect.left}px;
        background: #1f2937;
        border: 1px solid #374151;
        border-radius: 6px;
        padding: 4px;
        display: flex;
        gap: 4px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        z-index: 999999;
      }
      button {
        padding: 6px 12px;
        background: #374151;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 13px;
      }
      button:hover {
        background: #4b5563;
      }
    `;

    const container = document.createElement('div');
    container.className = 'toolbar';

    const buttons = [
      { text: 'Ask AI', action: () => openSidePanelWithText(text, 'ask') },
      { text: 'Translate', action: () => openSidePanelWithText(text, 'translate') },
      { text: 'Explain', action: () => openSidePanelWithText(text, 'explain') }
    ];

    buttons.forEach(({ text: btnText, action }) => {
      const btn = document.createElement('button');
      btn.textContent = btnText;
      btn.onclick = action;
      container.appendChild(btn);
    });

    shadow.appendChild(style);
    shadow.appendChild(container);
    document.body.appendChild(toolbar);
  });

  document.addEventListener('mousedown', (e) => {
    if (toolbar && !toolbar.contains(e.target as Node)) {
      toolbar.remove();
      toolbar = null;
    }
  });
}

function openSidePanelWithText(text: string, action: string) {
  chrome.runtime.sendMessage({
    type: 'OPEN_SIDEPANEL_WITH_TEXT',
    text,
    action
  });
}
