/**
 * PageAI — Content Script
 * Injected into every page. Provides page text extraction and overlay UI.
 */

// Listen for messages from popup or background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'EXTRACT_TEXT') {
    const text = document.body.innerText;
    sendResponse({ text: text.substring(0, 10000) });
  }

  if (message.type === 'GET_SELECTION') {
    const selection = window.getSelection()?.toString() || '';
    sendResponse({ text: selection });
  }

  if (message.type === 'SHOW_OVERLAY') {
    showOverlay(message.content);
    sendResponse({ success: true });
  }

  return true;
});

// ============== Result Overlay ==============
function showOverlay(content) {
  // Remove existing overlay if any
  const existing = document.getElementById('pageai-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'pageai-overlay';

  overlay.innerHTML = `
    <div class="pageai-overlay-content">
      <div class="pageai-overlay-header">
        <span>🧠 PageAI</span>
        <button class="pageai-close-btn" id="pageai-close">✕</button>
      </div>
      <div class="pageai-overlay-body">${content}</div>
      <div class="pageai-overlay-footer">
        <button class="pageai-copy-btn">📋 Copy</button>
        <span class="pageai-brand">Powered by PageAI</span>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Event listeners
  overlay.querySelector('#pageai-close').addEventListener('click', () => overlay.remove());
  overlay.querySelector('.pageai-copy-btn').addEventListener('click', () => {
    navigator.clipboard.writeText(content);
    overlay.querySelector('.pageai-copy-btn').textContent = '✅ Copied!';
  });

  // Click outside to close
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
}

console.log('[PageAI] Content script loaded');
