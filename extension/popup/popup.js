/**
 * PageAI — Popup Script
 * Handles UI interactions and communicates with background service worker.
 */

// ============== State ==============
const API_BASE = 'https://api.pageai.dev'; // Replace with your deployed backend
const STORAGE_KEY = 'pageai_usage';

// ============== DOM Refs ==============
const $ = (sel) => document.querySelector(sel);
const btnSummarize = $('#btnSummarize');
const btnTranslate = $('#btnTranslate');
const btnExtract  = $('#btnExtract');
const btnAsk      = $('#btnAsk');
const btnCopy     = $('#btnCopy');
const resultSection = $('#resultSection');
const resultContent = $('#resultContent');
const resultTitle   = $('#resultTitle');
const statusText    = $('#statusText');
const usageInfo     = $('#usageInfo');
const upgradeBanner = $('#upgradeBanner');
const customPrompt  = $('#customPrompt');
const planBadge     = $('#planBadge');

// ============== Usage Tracking ==============
async function getUsage() {
  const today = new Date().toISOString().split('T')[0];
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  const data = stored[STORAGE_KEY] || { date: today, count: 0 };
  if (data.date !== today) {
    return { date: today, count: 0 };
  }
  return data;
}

async function incrementUsage() {
  const usage = await getUsage();
  usage.count += 1;
  await chrome.storage.local.set({ [STORAGE_KEY]: usage });
  return usage;
}

async function updateUsageDisplay() {
  const usage = await getUsage();
  const limit = 10; // Free tier daily limit
  const remaining = Math.max(0, limit - usage.count);
  usageInfo.textContent = `${remaining}/${limit} uses remaining today`;

  if (remaining <= 0) {
    upgradeBanner.style.display = 'block';
    planBadge.textContent = 'Limit Reached';
    planBadge.style.color = '#f87171';
  } else if (remaining <= 3) {
    planBadge.textContent = `${remaining} left`;
  }
}

// ============== API Call ==============
async function callAI(action, payload = {}) {
  const usage = await getUsage();
  if (usage.count >= 10) {
    throw new Error('DAILY_LIMIT');
  }

  // Get current tab info
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  setLoading(true);
  setStatus('Working...');

  try {
    const response = await fetch(`${API_BASE}/api/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: tab.url,
        title: tab.title,
        ...payload,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `HTTP ${response.status}`);
    }

    const data = await response.json();
    await incrementUsage();
    await updateUsageDisplay();
    return data;

  } catch (err) {
    if (err.message === 'DAILY_LIMIT') {
      showLimitReached();
    }
    throw err;
  } finally {
    setLoading(false);
    setStatus('Ready');
  }
}

// ============== UI Helpers ==============
function setLoading(show) {
  if (show) {
    resultSection.style.display = 'block';
    resultContent.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
        <span>AI is thinking...</span>
      </div>`;
  }
}

function showResult(title, content) {
  resultSection.style.display = 'block';
  resultTitle.textContent = title;
  resultContent.innerHTML = '';
  resultContent.textContent = content;
}

function showError(msg) {
  resultSection.style.display = 'block';
  resultTitle.textContent = 'Error';
  resultContent.innerHTML = `<div class="error">${msg}</div>`;
}

function showLimitReached() {
  resultSection.style.display = 'none';
  upgradeBanner.style.display = 'block';
}

function setStatus(msg) {
  statusText.textContent = msg;
}

// ============== Action Handlers ==============
btnSummarize.addEventListener('click', async () => {
  try {
    // Inject content script to extract page text
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const [{ result: pageText }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => document.body.innerText.substring(0, 8000),
    });

    const data = await callAI('summarize', { text: pageText });
    showResult('📝 Page Summary', data.result);
  } catch (err) {
    if (err.message !== 'DAILY_LIMIT') {
      showError('Failed to summarize. Make sure the backend is running.\n\n' + err.message);
    }
  }
});

btnTranslate.addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const [{ result: selected }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection()?.toString() || '',
    });

    if (!selected) {
      showError('Please select some text on the page first, then click Translate.');
      return;
    }

    const data = await callAI('translate', { text: selected.substring(0, 3000) });
    showResult('🌐 Translation', data.result);
  } catch (err) {
    if (err.message !== 'DAILY_LIMIT') {
      showError('Translation failed: ' + err.message);
    }
  }
});

btnExtract.addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const [{ result: pageText }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => document.body.innerText.substring(0, 8000),
    });

    const data = await callAI('extract', { text: pageText });
    showResult('📊 Extracted Data', data.result);
  } catch (err) {
    if (err.message !== 'DAILY_LIMIT') {
      showError('Extraction failed: ' + err.message);
    }
  }
});

btnAsk.addEventListener('click', async () => {
  const question = customPrompt.value.trim();
  if (!question) {
    showError('Please type a question first.');
    return;
  }

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const [{ result: pageText }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => document.body.innerText.substring(0, 6000),
    });

    const data = await callAI('ask', {
      text: pageText,
      question: question,
    });
    showResult('💬 Answer', data.result);
  } catch (err) {
    if (err.message !== 'DAILY_LIMIT') {
      showError('Failed: ' + err.message);
    }
  }
});

// Copy to clipboard
btnCopy.addEventListener('click', async () => {
  const text = resultContent.textContent;
  if (text && !text.includes('AI is thinking')) {
    await navigator.clipboard.writeText(text);
    setStatus('Copied!');
    setTimeout(() => setStatus('Ready'), 1500);
  }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'S') {
    e.preventDefault();
    btnSummarize.click();
  }
});

// Enter to send custom question
customPrompt.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    btnAsk.click();
  }
});

// ============== Init ==============
async function init() {
  await updateUsageDisplay();
  setStatus('Ready');
}

init();
