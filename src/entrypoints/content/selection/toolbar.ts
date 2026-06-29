export function createSelectionToolbar() {
  let toolbar: HTMLDivElement | null = null;
  let hideTimeout: number | null = null;

  const handleSelection = () => {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }

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
        top: ${Math.max(10, rect.top - 50)}px;
        left: ${rect.left + rect.width / 2}px;
        transform: translateX(-50%);
        background: #2b2b2d;
        border: 1px solid rgba(255,255,255,0.10);
        border-radius: 8px;
        padding: 4px;
        display: flex;
        gap: 4px;
        box-shadow: none;
        z-index: 999999;
        animation: slideUp 0.16s ease-out;
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Arial, sans-serif;
      }
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(2px);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }
      button {
        height: 28px;
        padding: 0 8px;
        background: transparent;
        color: rgba(255,255,255,0.78);
        border: 1px solid transparent;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
        transition: background-color 0.15s, color 0.15s, border-color 0.15s;
        white-space: nowrap;
      }
      button:hover {
        background: #3a3a3c;
        color: #fff;
        border-color: rgba(255,255,255,0.08);
      }
      button:active {
        background: rgba(249,115,22,0.18);
        color: #fb923c;
      }
    `;

    const container = document.createElement('div');
    container.className = 'toolbar';

    const buttons = [
      { text: 'Ask', action: () => openSidePanelWithText(text, 'ask') },
      { text: 'Translate', action: () => openSidePanelWithText(text, 'translate') },
      { text: 'Explain', action: () => openSidePanelWithText(text, 'explain') }
    ];

    buttons.forEach(({ text: btnText, action }) => {
      const btn = document.createElement('button');
      btn.textContent = btnText;
      btn.onclick = () => {
        action();
        if (toolbar) {
          toolbar.remove();
          toolbar = null;
        }
      };
      container.appendChild(btn);
    });

    shadow.appendChild(style);
    shadow.appendChild(container);
    document.body.appendChild(toolbar);
  };

  document.addEventListener('mouseup', handleSelection);
  document.addEventListener('keyup', (e) => {
    if (e.key === 'Escape' && toolbar) {
      toolbar.remove();
      toolbar = null;
    }
  });

  document.addEventListener('mousedown', (e) => {
    if (toolbar && !toolbar.contains(e.target as Node)) {
      hideTimeout = window.setTimeout(() => {
        if (toolbar) {
          toolbar.remove();
          toolbar = null;
        }
      }, 200);
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
