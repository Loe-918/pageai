/**
 * PageAI — Background Service Worker
 * Handles extension lifecycle, context menu, and API proxying.
 */

// ============== Install & Update ==============
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[PageAI] Installed:', details.reason);

  // Create context menu
  chrome.contextMenus.create({
    id: 'summarize-page',
    title: '🧠 Summarize this page',
    contexts: ['page'],
  });
  chrome.contextMenus.create({
    id: 'translate-selection',
    title: '🌐 Translate selection',
    contexts: ['selection'],
  });
  chrome.contextMenus.create({
    id: 'extract-data',
    title: '📊 Extract data from page',
    contexts: ['page'],
  });

  // Open welcome page on install
  if (details.reason === 'install') {
    chrome.tabs.create({ url: 'https://pageai.dev/welcome' });
  }
});

// ============== Context Menu Handler ==============
chrome.contextMenus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
    case 'summarize-page':
      // Opens popup which auto-summarizes
      chrome.action.openPopup();
      break;
    case 'translate-selection':
      chrome.action.openPopup();
      break;
    case 'extract-data':
      chrome.action.openPopup();
      break;
  }
});

// ============== Message Relay ==============
// For future: relay messages between popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_PAGE_TEXT') {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          func: () => document.body.innerText,
        },
        (results) => {
          sendResponse({ text: results?.[0]?.result || '' });
        }
      );
    });
    return true; // Keep channel open for async response
  }
});
