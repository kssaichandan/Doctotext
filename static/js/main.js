'use strict';

/* ═══ SECTION 1: STATE ══════════════════════ */

let uploadedFiles = [];      // Array of File objects
let extractedText = '';      // Full combined extracted text
let currentTheme = 'dark';   // 'dark' | 'light'

const CLOUD_MODEL_OPTIONS = {
  gemini: [
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' }
  ],
  openai: [
    { value: 'gpt-4o-mini', label: 'GPT-4o mini' },
    { value: 'gpt-4o', label: 'GPT-4o' }
  ],
  anthropic: [
    { value: 'claude-3-5-sonnet-latest', label: 'Claude 3.5 Sonnet' },
    { value: 'claude-3-7-sonnet-latest', label: 'Claude 3.7 Sonnet' }
  ]
};

/* ═══ SECTION 2: DOM READY ══════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initApiKey();
  initEventListeners();
});

/* ═══ SECTION 3: THEME ══════════════════════ */

function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  setTheme(savedTheme);
}

function setTheme(theme) {
  currentTheme = theme;
  document.body.classList.toggle('light', theme === 'light');
  localStorage.setItem('theme', theme);

  const themeIcon = theme === 'light' ? '☀️' : '🌙';
  const themeText = theme === 'light' ? 'Light' : 'Dark';

  const themeToggleBtn = document.getElementById('themeToggleBtn');
  if (themeToggleBtn) themeToggleBtn.textContent = themeIcon;

  const themeToggleSettings = document.getElementById('themeToggleSettings');
  if (themeToggleSettings) themeToggleSettings.textContent = `${themeIcon} ${themeText}`;
}

/* ═══ SECTION 4: API KEY ════════════════════ */

function initApiKey() {
  const apiKey = getApiKey();
  const provider = getAiProvider();
  const providerSelect = document.getElementById('aiProviderSelect');
  const localUrlInput = document.getElementById('localLlmUrlInput');
  const localModelInput = document.getElementById('localLlmModelInput');

  if (providerSelect) providerSelect.value = provider;
  if (localUrlInput) localUrlInput.value = getLocalLlmUrl();
  if (localModelInput) renderLocalModelOptions([getLocalLlmModel()], getLocalLlmModel());
  refreshCloudModelSelect();
  updateAiProviderUI();
  loadLocalLlmModels(false);

  if (apiKey) {
    document.getElementById('apiKeyInput').value = apiKey;
    document.getElementById('apiBanner').classList.add('hidden');
  } else if (provider !== 'local') {
    document.getElementById('apiBanner').classList.remove('hidden');
  } else {
    document.getElementById('apiBanner').classList.add('hidden');
  }
}

function getApiKey() {
  return localStorage.getItem('geminiApiKey') || '';
}

function getAiProvider() {
  return localStorage.getItem('aiProvider') || 'cloud';
}

function getLocalLlmUrl() {
  return localStorage.getItem('localLlmUrl') || 'http://localhost:11434';
}

function getLocalLlmModel() {
  return localStorage.getItem('localLlmModel') || '';
}

function getCloudProviderFromKey(key = getApiKey()) {
  if (key.startsWith('sk-ant')) return 'anthropic';
  if (key.startsWith('sk-')) return 'openai';
  return 'gemini';
}

function getCloudAiModel() {
  const provider = getCloudProviderFromKey(document.getElementById('apiKeyInput')?.value.trim() || getApiKey());
  return localStorage.getItem(`cloudModel:${provider}`) || CLOUD_MODEL_OPTIONS[provider][0].value;
}

function refreshCloudModelSelect() {
  const select = document.getElementById('cloudModelSelect');
  if (!select) return;

  const key = document.getElementById('apiKeyInput')?.value.trim() || getApiKey();
  const provider = getCloudProviderFromKey(key);
  const selectedModel = localStorage.getItem(`cloudModel:${provider}`) || CLOUD_MODEL_OPTIONS[provider][0].value;

  select.innerHTML = '';
  CLOUD_MODEL_OPTIONS[provider].forEach(option => {
    const optionEl = document.createElement('option');
    optionEl.value = option.value;
    optionEl.textContent = option.label;
    select.appendChild(optionEl);
  });
  select.value = selectedModel;
}

/* ═══ SECTION 5: EVENT LISTENERS ════════════ */

function initEventListeners() {
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');

  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      fileInput.click();
    }
  });
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragging');
  });
  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragging');
  });
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragging');
    addFiles(e.dataTransfer.files);
  });
  fileInput.addEventListener('change', (e) => {
    addFiles(e.target.files);
    e.target.value = ''; // Allow re-selecting the same file
  });
  document.getElementById('pasteClipboardBtn').addEventListener('click', pasteFromClipboard);
  document.getElementById('addPastedTextBtn').addEventListener('click', addPastedText);
  document.addEventListener('paste', handleClipboardPaste);

  document.getElementById('extractBtn').addEventListener('click', extractAll);
  document.getElementById('copyBtn').addEventListener('click', copyText);
  document.getElementById('downloadTxtBtn').addEventListener('click', downloadTxt);
  document.getElementById('downloadDocxBtn').addEventListener('click', downloadDocx);
  document.getElementById('downloadMdBtn').addEventListener('click', downloadMd);
  document.getElementById('splitBtn').addEventListener('click', openChunksModal);
  document.getElementById('clearAllBtn').addEventListener('click', clearAll);
  document.getElementById('clearFilesBtn').addEventListener('click', clearFiles);
  document.getElementById('fullscreenBtn').addEventListener('click', toggleFullscreen);

  document.getElementById('settingsOpenBtn').addEventListener('click', openSettings);
  document.getElementById('settingsCloseBtn').addEventListener('click', closeSettings);
  document.getElementById('settingsOverlay').addEventListener('click', closeSettings);

  document.getElementById('bannerSettingsBtn').addEventListener('click', openSettings);
  document.getElementById('bannerCloseBtn').addEventListener('click', () => {
    document.getElementById('apiBanner').classList.add('hidden');
  });

  document.getElementById('themeToggleBtn').addEventListener('click', () => setTheme(currentTheme === 'dark' ? 'light' : 'dark'));
  document.getElementById('themeToggleSettings').addEventListener('click', () => setTheme(currentTheme === 'dark' ? 'light' : 'dark'));

  document.getElementById('toggleKeyVisBtn').addEventListener('click', toggleKeyVisibility);
  document.getElementById('apiKeyInput').addEventListener('input', refreshCloudModelSelect);
  document.getElementById('cloudModelSelect').addEventListener('change', saveCloudModel);
  document.getElementById('testKeyBtn').addEventListener('click', testApiKey);
  document.getElementById('saveKeyBtn').addEventListener('click', saveApiKey);
  document.getElementById('deleteKeyBtn').addEventListener('click', deleteApiKey);
  document.getElementById('aiProviderSelect').addEventListener('change', saveAiProvider);
  document.getElementById('localLlmUrlInput').addEventListener('blur', () => loadLocalLlmModels(false));
  document.getElementById('refreshLocalModelsBtn').addEventListener('click', () => loadLocalLlmModels(true));
  document.getElementById('testLocalLlmBtn').addEventListener('click', testLocalLlm);
  document.getElementById('saveLocalLlmBtn').addEventListener('click', saveLocalLlm);

  document.getElementById('chunksCloseBtn').addEventListener('click', closeChunksModal);
  document.getElementById('chunksOverlay').addEventListener('click', closeChunksModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeSettings();
      closeChunksModal();
    }
  });
}

/* ═══ SECTION 6: FILE MANAGEMENT ════════════ */

const ALLOWED_TYPES = ['pdf', 'docx', 'pptx', 'jpg', 'jpeg', 'png', 'txt', 'md'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes

function addPastedText() {
  const pasteInput = document.getElementById('pasteTextInput');
  const text = pasteInput.value.trim();
  if (!text) {
    showToast('Paste text first', 'warning');
    return;
  }

  const file = new File([text], `pasted-text-${Date.now()}.txt`, { type: 'text/plain' });
  addFiles([file]);
  pasteInput.value = '';
  showToast('Pasted text added', 'success');
}

function handleClipboardPaste(event) {
  const clipboard = event.clipboardData;
  if (!clipboard) return;

  const files = Array.from(clipboard.files || []);
  if (files.length > 0) {
    event.preventDefault();
    addFiles(files.map(renameClipboardFile));
    showToast(`${files.length} pasted item(s) added`, 'success');
    return;
  }

  const text = clipboard.getData('text/plain');
  const pasteInput = document.getElementById('pasteTextInput');
  const active = document.activeElement;
  if (text && active !== pasteInput && active.tagName !== 'INPUT' && active.tagName !== 'TEXTAREA') {
    pasteInput.value = text;
    showToast('Text pasted into the paste box', 'success');
  }
}

async function pasteFromClipboard() {
  if (!navigator.clipboard || !navigator.clipboard.read) {
    showToast('Use Ctrl+V while this page is focused', 'warning');
    return;
  }

  try {
    const items = await navigator.clipboard.read();
    const files = [];
    let text = '';

    for (const item of items) {
      for (const type of item.types) {
        if (type.startsWith('image/')) {
          const blob = await item.getType(type);
          const ext = type.split('/')[1] || 'png';
          files.push(new File([blob], `clipboard-image-${Date.now()}.${ext}`, { type }));
        } else if (type === 'text/plain') {
          const blob = await item.getType(type);
          text += await blob.text();
        }
      }
    }

    if (files.length > 0) addFiles(files);
    if (text.trim()) document.getElementById('pasteTextInput').value = text.trim();

    if (files.length === 0 && !text.trim()) {
      showToast('Clipboard has no supported content', 'warning');
    } else {
      showToast('Clipboard loaded', 'success');
    }
  } catch (err) {
    showToast('Clipboard access blocked. Use Ctrl+V instead', 'warning');
  }
}

function renameClipboardFile(file) {
  if (file.name) return file;
  const ext = (file.type || 'image/png').split('/')[1] || 'png';
  return new File([file], `clipboard-image-${Date.now()}.${ext}`, { type: file.type });
}

function addFiles(fileList) {
  const files = Array.from(fileList);
  let filesAdded = false;

  files.forEach(file => {
    const extension = file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_TYPES.includes(extension)) {
      showToast(`Invalid file type: ${file.name}`, 'error');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      showToast(`File too large: ${file.name}`, 'error');
      return;
    }
    if (uploadedFiles.some(f => f.name === file.name)) {
      showToast(`Duplicate file: ${file.name}`, 'warning');
      return;
    }
    uploadedFiles.push(file);
    filesAdded = true;
  });

  if (filesAdded) {
    renderFileList();
    document.getElementById('fileListSection').classList.remove('hidden');
    document.getElementById('extractWrapper').classList.remove('hidden');
    document.getElementById('extractBtn').disabled = false;
  }
}

function renderFileList() {
  const fileListEl = document.getElementById('fileList');
  const fileCountEl = document.getElementById('fileCount');

  fileCountEl.textContent = uploadedFiles.length;
  fileListEl.innerHTML = '';

  uploadedFiles.forEach(file => {
    const extension = file.name.split('.').pop().toLowerCase();
    let icon = '📄';
    if (extension === 'pdf') icon = '📕';
    else if (extension === 'docx') icon = '📘';
    else if (extension === 'pptx') icon = '📙';
    else if (['jpg', 'jpeg', 'png'].includes(extension)) icon = '🖼️';
    else if (['txt', 'md'].includes(extension)) icon = 'TXT';

    const fileCard = document.createElement('div');
    fileCard.className = 'file-card';
    fileCard.dataset.filename = file.name;

    fileCard.innerHTML = `
      <div class="file-icon">${icon}</div>
      <div class="file-info">
        <div class="file-name">${file.name}</div>
        <div class="file-meta">${formatSize(file.size)}</div>
      </div>
      <div class="file-status ready">Ready</div>
      <button class="file-remove" aria-label="Remove file">✕</button>
      <div class="file-progress"><div class="file-progress-bar"></div></div>
    `;

    fileCard.querySelector('.file-remove').addEventListener('click', () => removeFile(file.name));
    fileListEl.appendChild(fileCard);
  });
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function removeFile(filename) {
  uploadedFiles = uploadedFiles.filter(f => f.name !== filename);
  renderFileList();
  if (uploadedFiles.length === 0) {
    document.getElementById('fileListSection').classList.add('hidden');
    document.getElementById('extractWrapper').classList.add('hidden');
    document.getElementById('extractBtn').disabled = true;
  }
}

/* ═══ SECTION 7: EXTRACTION ═════════════════ */

async function extractAll() {
  if (uploadedFiles.length === 0) return;

  const extractBtn = document.getElementById('extractBtn');
  const btnText = extractBtn.querySelector('.btn-text');
  const btnSpinner = extractBtn.querySelector('.btn-spinner');

  extractBtn.disabled = true;
  btnText.textContent = 'Extracting...';
  btnSpinner.classList.remove('hidden');

  // ── TIMER SETUP ──────────────────────────────
  const timerDisplay = document.getElementById('timerDisplay');
  const timerEta = document.getElementById('timerEta');
  const timerElapsed = document.getElementById('timerElapsed');
  const timerBarFill = document.getElementById('timerBarFill');
  const timerFileIdx = document.getElementById('timerFileIndex');
  const timerFileTotal = document.getElementById('timerFileTotal');
  const timerFileName = document.getElementById('timerFileName');

  timerDisplay.classList.remove('hidden');
  timerFileTotal.textContent = uploadedFiles.length;

  const totalBytes = uploadedFiles.reduce((sum, f) => sum + f.size, 0);
  let extractionStart = Date.now();
  let elapsedSeconds = 0;
  let bytesProcessed = 0;

  const timerInterval = setInterval(() => {
    elapsedSeconds = Math.floor((Date.now() - extractionStart) / 1000);
    timerElapsed.textContent = formatElapsed(elapsedSeconds);

    // Update ETA based on bytes-per-second rate so far
    if (bytesProcessed > 0 && bytesProcessed < totalBytes) {
      const rate = bytesProcessed / (Date.now() - extractionStart); // bytes per ms
      const remainingBytes = totalBytes - bytesProcessed;
      const etaMs = remainingBytes / rate;
      timerEta.textContent = formatEta(etaMs);
    } else if (bytesProcessed === 0) {
      timerEta.textContent = 'Estimating...';
    }
  }, 1000);

  // ── STATE ────────────────────────────────────
  uploadedFiles.forEach(file => setFileCardStatus(file.name, 'queued'));

  const allResults = [];
  let combinedText = '';
  let totalWords = 0;
  let totalFailed = 0;
  let totalPartial = 0;
  const apiKey = getApiKey();
  const aiProvider = getAiProvider();
  const localLlmUrl = getLocalLlmUrl();
  const localLlmModel = getLocalLlmModel();
  const cloudAiModel = getCloudAiModel();

  try {
    // Process queue with a concurrency limit to prevent freezing browser or hitting rate limits instantly
    const CONCURRENCY_LIMIT = 3;
    let queueIndex = 0;

    async function worker() {
      while (queueIndex < uploadedFiles.length) {
        const i = queueIndex++;
        const file = uploadedFiles[i];
        
        // Mark as actively processing right before sending request
        setFileCardStatus(file.name, 'processing');

        try {
          const formData = new FormData();
          formData.append('files', file);

          const response = await fetch('/extract', {
            method: 'POST',
            headers: {
              'X-AI-API-Key': apiKey,
              'X-Gemini-API-Key': apiKey,
              'X-AI-Provider': aiProvider,
              'X-Cloud-AI-Model': cloudAiModel,
              'X-Local-LLM-URL': localLlmUrl,
              'X-Local-LLM-Model': localLlmModel
            },
            body: formData
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `HTTP ${response.status}`);
          }

          const data = await response.json();
          const result = data.results[0];

          bytesProcessed += file.size;

          if (result.error) {
            setFileCardStatus(file.name, 'failed');
            totalFailed++;
            allResults[i] = result;
          } else {
            if (result.partial || result.warning) {
              setFileCardStatus(file.name, 'partial');
              totalPartial++;
            } else {
              setFileCardStatus(file.name, 'done');
            }
            allResults[i] = result;

            timerFileName.textContent = file.name;
            const completed = allResults.filter(r => r).length;
            timerFileIdx.textContent = completed;
            timerBarFill.style.width = (completed / uploadedFiles.length * 100) + '%';
          }

        } catch (fileErr) {
          bytesProcessed += file.size;
          setFileCardStatus(file.name, 'failed');
          totalFailed++;
          showToast(`❌ Failed: ${file.name}`, 'error');
          allResults[i] = { error: fileErr.message, filename: file.name };
        }
      }
    }

    // Launch worker pool
    const workers = [];
    const poolSize = Math.min(CONCURRENCY_LIMIT, uploadedFiles.length);
    for (let w = 0; w < poolSize; w++) {
      workers.push(worker());
    }

    // Wait for all workers in the pool to deplete the queue
    await Promise.all(workers);

    // Reconstruct the text exactly in the original order
    allResults.forEach((result, i) => {
      if (result && !result.error && result.text) {
        const sep = '═'.repeat(60);
        if (combinedText) {
          combinedText += `\n\n${sep}\n📄 ${result.filename}\n${sep}\n\n`;
        }
        combinedText += result.text;
        totalWords += result.word_count;
      }
    });


    // Fill bar to 100% on completion
    timerBarFill.style.width = '100%';
    timerEta.textContent = '✅ Done!';

    extractedText = combinedText;
    const totalChars = combinedText.length;
    const totalTokens = Math.floor(totalChars / 4);

    if (combinedText) {
      document.getElementById('outputText').value = combinedText;
      document.getElementById('outputSection').classList.remove('hidden');
      document.getElementById('statsBar').classList.remove('hidden');
      document.getElementById('actionBar').classList.remove('hidden');

      updateStats({
        total_words: totalWords,
        total_chars: totalChars,
        total_tokens: totalTokens,
        files_processed: allResults.length - totalFailed
      });

      showToast(`✅ Done in ${formatElapsed(elapsedSeconds)} — ${allResults.length - totalFailed} file(s) extracted`, 'success');
    }

    if (totalFailed > 0) {
      showToast(`⚠️ ${totalFailed} file(s) failed`, 'warning');
    }

    if (totalPartial > 0) {
      showToast(`⚠️ ${totalPartial} file(s) extracted with image OCR skipped`, 'warning');
    }

  } catch (err) {
    uploadedFiles.forEach(f => setFileCardStatus(f.name, 'failed'));
    showToast(`❌ ${err.message}`, 'error');

  } finally {
    clearInterval(timerInterval);
    setTimeout(() => {
      timerDisplay.classList.add('hidden');
      timerBarFill.style.width = '0%';
    }, 2000); // keep visible 2s after done so user sees "✅ Done!"
    extractBtn.disabled = false;
    btnText.textContent = 'Extract All Text';
    btnSpinner.classList.add('hidden');
  }
}

/* ═══ SECTION 8: STATS ══════════════════════ */

function updateStats(data) {
  document.getElementById('statWords').textContent = data.total_words.toLocaleString();
  document.getElementById('statChars').textContent = data.total_chars.toLocaleString();
  document.getElementById('statTokens').textContent = data.total_tokens.toLocaleString();
  document.getElementById('outputMeta').textContent = `${data.files_processed} file(s) · ${data.total_words.toLocaleString()} words`;

  const CHATGPT_LIMIT = 128000;
  const CLAUDE_LIMIT = 200000;
  const GEMINI_LIMIT = 1000000;

  const badgeChatGPT = document.getElementById('badgeChatGPT');
  const badgeClaude = document.getElementById('badgeClaude');
  const badgeGemini = document.getElementById('badgeGemini');

  const updateBadge = (badge, limit, name) => {
    if (data.total_tokens <= limit) {
      badge.classList.add('fits');
      badge.classList.remove('overfits');
      badge.textContent = `✅ ${name}`;
    } else {
      badge.classList.add('overfits');
      badge.classList.remove('fits');
      badge.textContent = `❌ ${name}`;
    }
  };

  updateBadge(badgeChatGPT, CHATGPT_LIMIT, 'ChatGPT 4o (128k)');
  updateBadge(badgeClaude, CLAUDE_LIMIT, 'Claude (200k)');
  updateBadge(badgeGemini, GEMINI_LIMIT, 'Gemini (1M)');
}

/* ═══ SECTION 9: COPY & DOWNLOAD ═══════════ */

async function copyText() {
  if (!extractedText) return;
  try {
    await navigator.clipboard.writeText(extractedText);
    const copyBtn = document.getElementById('copyBtn');
    const originalText = copyBtn.innerHTML;
    copyBtn.innerHTML = '✅ Copied!';
    showToast('Copied to clipboard!', 'success');
    setTimeout(() => {
      copyBtn.innerHTML = originalText;
    }, 2000);
  } catch (err) {
    showToast('Copy failed — try selecting manually', 'error');
  }
}

async function downloadFile(url, body) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error('Download failed');

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = downloadUrl;

    const contentDisposition = response.headers.get('content-disposition');
    let filename = body.filename;
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch.length > 1) {
        filename = filenameMatch[1];
      }
    }
    a.download = filename;

    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    a.remove();
  } catch (error) {
    showToast('Download failed', 'error');
  }
}

async function downloadTxt() {
  if (!extractedText) return;
  const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = window.URL.createObjectURL(blob);
  a.download = 'doctotext_output.txt';
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(a.href);
  a.remove();
  showToast('Downloading TXT...', 'success');
}

async function downloadDocx() {
  if (!extractedText) return;
  showToast('Downloading DOCX...', 'success');
  await downloadFile('/download-docx', { text: extractedText, filename: 'doctotext_output.docx' });
}

function downloadMd() {
  if (!extractedText) return;
  // Fallback direct download locally since MD doesn't need binary packaging
  const blob = new Blob([extractedText], { type: 'text/markdown;charset=utf-8' });
  const a = document.createElement('a');
  a.href = window.URL.createObjectURL(blob);
  a.download = 'doctotext_output.md';
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(a.href);
  a.remove();
  showToast('Downloading Markdown...', 'success');
}


/* ═══ SECTION 10: SPLIT CHUNKS ══════════════ */

function openChunksModal() {
  if (!extractedText) return;

  const chunkInput = document.getElementById('chunkSizeInput');
  const chunkSize = chunkInput ? parseInt(chunkInput.value) || 4000 : 4000;
  const charsPerChunk = chunkSize * 4;

  let chunks = [];
  let currentPos = 0;
  while (currentPos < extractedText.length) {
    let endPos = currentPos + charsPerChunk;
    if (endPos >= extractedText.length) {
      chunks.push(extractedText.substring(currentPos));
      break;
    }

    let lastSpace = extractedText.lastIndexOf(' ', endPos);
    let splitPos = (lastSpace > currentPos) ? lastSpace : endPos;

    chunks.push(extractedText.substring(currentPos, splitPos).trim());
    currentPos = splitPos + 1;
  }

  const chunksModal = document.getElementById('chunksModal');
  const chunksOverlay = document.getElementById('chunksOverlay');
  const chunksList = document.getElementById('chunksList');

  document.getElementById('chunksInfo').textContent = `${chunks.length} chunks · ${chunkSize.toLocaleString()} tokens each`;
  chunksList.innerHTML = '';

  chunks.forEach((chunk, index) => {
    const chunkItem = document.createElement('div');
    chunkItem.className = 'chunk-item';
    chunkItem.innerHTML = `
      <div class="chunk-header">
        <span class="chunk-label">Chunk ${index + 1} of ${chunks.length}</span>
        <button class="chunk-copy">📋 Copy</button>
      </div>
      <div class="chunk-text">${chunk.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
    `;
    chunkItem.querySelector('.chunk-copy').addEventListener('click', (e) => {
      navigator.clipboard.writeText(chunk);
      const btn = e.target;
      btn.textContent = '✅ Copied!';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = '📋 Copy';
        btn.classList.remove('copied');
      }, 2000);
    });
    chunksList.appendChild(chunkItem);
  });

  chunksOverlay.classList.remove('hidden');
  chunksModal.classList.remove('hidden');
  setTimeout(() => chunksModal.classList.add('open'), 10);
}

function closeChunksModal() {
  const chunksModal = document.getElementById('chunksModal');
  chunksModal.classList.remove('open');
  setTimeout(() => {
    document.getElementById('chunksOverlay').classList.add('hidden');
    chunksModal.classList.add('hidden');
  }, 250);
}

/* ═══ SECTION 11: SETTINGS ══════════════════ */

function openSettings() {
  document.getElementById('settingsOverlay').classList.remove('hidden');
  document.getElementById('settingsPanel').classList.add('open');
  document.getElementById('apiKeyInput').value = getApiKey();
  // Basic focus trapping
  const focusableElements = document.querySelectorAll('#settingsPanel button, #settingsPanel input, #settingsPanel select, #settingsPanel a');
  focusableElements[0].focus();
}

function closeSettings() {
  const settingsPanel = document.getElementById('settingsPanel');
  settingsPanel.classList.remove('open');
  setTimeout(() => {
    document.getElementById('settingsOverlay').classList.add('hidden');
  }, 350);
}

function toggleKeyVisibility() {
  const apiKeyInput = document.getElementById('apiKeyInput');
  const toggleBtn = document.getElementById('toggleKeyVisBtn');
  if (apiKeyInput.type === 'password') {
    apiKeyInput.type = 'text';
    toggleBtn.textContent = '🙈';
  } else {
    apiKeyInput.type = 'password';
    toggleBtn.textContent = '👁';
  }
}

async function testApiKey() {
  const key = document.getElementById('apiKeyInput').value.trim();
  const keyStatus = document.getElementById('keyStatus');
  const testBtn = document.getElementById('testKeyBtn');

  if (!key) {
    keyStatus.className = 'status-msg error';
    keyStatus.textContent = '❌ Please enter an API key first.';
    return;
  }

  // Show loading state on button
  testBtn.disabled = true;
  testBtn.textContent = '⏳ Testing...';
  keyStatus.className = 'status-msg info';
  keyStatus.textContent = 'Sending a test request to AI API...';

  try {
    const response = await fetch('/test-api-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: key, cloud_model: getCloudAiModel() })
    });
    const data = await response.json();

    if (data.valid) {
      keyStatus.className = 'status-msg success';
      keyStatus.textContent = data.message;
      showToast('✅ API key verified!', 'success');
    } else {
      keyStatus.className = 'status-msg error';
      keyStatus.textContent = data.error || '❌ Key validation failed.';
    }
  } catch (err) {
    keyStatus.className = 'status-msg error';
    keyStatus.textContent = `❌ Network error: ${err.message}`;
  } finally {
    testBtn.disabled = false;
    testBtn.textContent = '✅ Test Key';
  }
}

function saveApiKey() {
  const key = document.getElementById('apiKeyInput').value.trim();
  const keyStatus = document.getElementById('keyStatus');

  if (!key) {
    keyStatus.textContent = 'Cannot save an empty key.';
    keyStatus.className = 'status-msg error';
    return;
  }

  localStorage.setItem('geminiApiKey', key);
  localStorage.setItem('aiProvider', 'cloud');
  document.getElementById('aiProviderSelect').value = 'cloud';
  saveCloudModel(false);
  updateAiProviderUI();
  document.getElementById('apiBanner').classList.add('hidden');
  keyStatus.textContent = '✅ Key saved to browser!';
  keyStatus.className = 'status-msg success';

  setTimeout(() => {
    keyStatus.textContent = '';
    keyStatus.className = 'status-msg';
  }, 3000);
}

function deleteApiKey() {
  localStorage.removeItem('geminiApiKey');
  document.getElementById('apiKeyInput').value = '';
  if (getAiProvider() !== 'local') {
    document.getElementById('apiBanner').classList.remove('hidden');
  }
  
  const keyStatus = document.getElementById('keyStatus');
  keyStatus.textContent = '🗑️ Key removed from browser!';
  keyStatus.className = 'status-msg success';
  
  setTimeout(() => {
    keyStatus.textContent = '';
    keyStatus.className = 'status-msg';
  }, 3000);
}

/* ═══ SECTION 12: CLEAR ════════════════════ */

function updateAiProviderUI() {
  const provider = getAiProvider();
  const localBox = document.getElementById('localLlmSettings');
  const apiKeyInput = document.getElementById('apiKeyInput');
  const keyRow = apiKeyInput ? apiKeyInput.closest('.input-row') : null;
  const cloudModelRow = document.getElementById('cloudModelRow');
  const cloudModelLabel = document.querySelector('label[for="cloudModelSelect"]');
  const keyButtons = document.getElementById('testKeyBtn').closest('.btn-row');
  const keyStatus = document.getElementById('keyStatus');
  const infoBox = apiKeyInput ? apiKeyInput.closest('.settings-section').querySelector('.info-box') : null;

  [keyRow, cloudModelRow, cloudModelLabel, keyButtons, keyStatus, infoBox].forEach(row => {
    if (row) row.classList.toggle('hidden', provider === 'local');
  });
  if (localBox) localBox.classList.toggle('hidden', provider !== 'local');

  const banner = document.getElementById('apiBanner');
  if (provider === 'local' || getApiKey()) {
    banner.classList.add('hidden');
  } else {
    banner.classList.remove('hidden');
  }
}

function saveAiProvider() {
  const provider = document.getElementById('aiProviderSelect').value;
  localStorage.setItem('aiProvider', provider);
  refreshCloudModelSelect();
  updateAiProviderUI();
  showToast(provider === 'local' ? 'Local LLM enabled' : 'Cloud OCR enabled', 'success');
}

function saveCloudModel(showSavedToast = true) {
  const select = document.getElementById('cloudModelSelect');
  if (!select) return;

  const provider = getCloudProviderFromKey(document.getElementById('apiKeyInput').value.trim());
  localStorage.setItem(`cloudModel:${provider}`, select.value);

  if (showSavedToast) {
    showToast('Cloud model saved', 'success');
  }
}

function renderLocalModelOptions(models, selectedModel = getLocalLlmModel()) {
  const select = document.getElementById('localLlmModelInput');
  if (!select) return;

  const cleanModels = [...new Set((models || []).filter(Boolean))];
  select.innerHTML = '';

  if (cleanModels.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'No local models found';
    select.appendChild(option);
    select.disabled = true;
    return;
  }

  cleanModels.forEach(model => {
    const option = document.createElement('option');
    option.value = model;
    option.textContent = model;
    select.appendChild(option);
  });

  select.disabled = false;
  if (selectedModel && cleanModels.includes(selectedModel)) {
    select.value = selectedModel;
  } else {
    select.value = cleanModels[0];
    localStorage.setItem('localLlmModel', cleanModels[0]);
  }
}

async function loadLocalLlmModels(showToastOnSuccess = false) {
  const status = document.getElementById('localLlmStatus');
  const refreshBtn = document.getElementById('refreshLocalModelsBtn');
  const url = document.getElementById('localLlmUrlInput').value.trim() || 'http://localhost:11434';

  if (refreshBtn) {
    refreshBtn.disabled = true;
    refreshBtn.textContent = 'Loading...';
  }

  try {
    const response = await fetch('/local-llm-models', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base_url: url })
    });
    const data = await response.json();

    if (!data.success) {
      renderLocalModelOptions([], '');
      if (status) {
        status.textContent = data.error || 'Could not load local models.';
        status.className = 'status-msg error';
      }
      return;
    }

    renderLocalModelOptions(data.models, getLocalLlmModel());

    if (status) {
      if (data.models.length > 0) {
        status.textContent = `${data.models.length} local model(s) found.`;
        status.className = 'status-msg success';
      } else {
        status.textContent = 'No local models found. Run: ollama pull llama3.2-vision';
        status.className = 'status-msg error';
      }
    }

    if (showToastOnSuccess) {
      showToast(data.models.length > 0 ? 'Local models refreshed' : 'No local models found', data.models.length > 0 ? 'success' : 'warning');
    }
  } catch (err) {
    renderLocalModelOptions([], '');
    if (status) {
      status.textContent = `Could not load local models: ${err.message}`;
      status.className = 'status-msg error';
    }
  } finally {
    if (refreshBtn) {
      refreshBtn.disabled = false;
      refreshBtn.textContent = 'Refresh';
    }
  }
}

function saveLocalLlm() {
  const url = document.getElementById('localLlmUrlInput').value.trim() || 'http://localhost:11434';
  const model = document.getElementById('localLlmModelInput').value.trim();
  const status = document.getElementById('localLlmStatus');

  if (!model) {
    status.textContent = 'No local model selected. Install one with: ollama pull llama3.2-vision';
    status.className = 'status-msg error';
    showToast('No local model selected', 'warning');
    return false;
  }

  localStorage.setItem('aiProvider', 'local');
  localStorage.setItem('localLlmUrl', url);
  localStorage.setItem('localLlmModel', model);
  document.getElementById('aiProviderSelect').value = 'local';
  updateAiProviderUI();

  status.textContent = 'Local LLM settings saved.';
  status.className = 'status-msg success';
  showToast('Local LLM settings saved', 'success');
  return true;
}

async function testLocalLlm() {
  if (!saveLocalLlm()) return;
  const status = document.getElementById('localLlmStatus');
  const testBtn = document.getElementById('testLocalLlmBtn');

  testBtn.disabled = true;
  testBtn.textContent = 'Testing...';
  status.textContent = 'Sending a test request to the local model...';
  status.className = 'status-msg info';

  try {
    const response = await fetch('/test-local-llm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        base_url: getLocalLlmUrl(),
        model: getLocalLlmModel()
      })
    });
    const data = await response.json();

    if (data.valid) {
      status.textContent = data.message;
      status.className = 'status-msg success';
      showToast('Local LLM connected', 'success');
    } else {
      status.textContent = data.error || 'Local LLM test failed.';
      status.className = 'status-msg error';
    }
  } catch (err) {
    status.textContent = `Network error: ${err.message}`;
    status.className = 'status-msg error';
  } finally {
    testBtn.disabled = false;
    testBtn.textContent = 'Test Local';
  }
}

function toggleFullscreen() {
  const outputSection = document.getElementById('outputSection');
  const btn = document.getElementById('fullscreenBtn');
  if (outputSection.classList.contains('fullscreen')) {
    outputSection.classList.remove('fullscreen');
    btn.textContent = '⤢';
    btn.title = 'Toggle Fullscreen';
    document.body.style.overflow = '';
  } else {
    outputSection.classList.add('fullscreen');
    btn.textContent = '⤣';
    btn.title = 'Exit Fullscreen';
    document.body.style.overflow = 'hidden';
  }
}

function clearAll() {
  uploadedFiles = [];
  extractedText = '';
  document.getElementById('outputText').value = '';

  document.getElementById('outputSection').classList.add('hidden');
  document.getElementById('statsBar').classList.add('hidden');
  document.getElementById('actionBar').classList.add('hidden');

  clearFiles();
  showToast('Cleared', 'success');
}

function clearFiles() {
  uploadedFiles = [];
  document.getElementById('fileList').innerHTML = '';
  document.getElementById('fileCount').textContent = '0';
  document.getElementById('fileListSection').classList.add('hidden');
  document.getElementById('extractWrapper').classList.add('hidden');
  document.getElementById('extractBtn').disabled = true;
}

/* ═══ SECTION 13: TOAST ════════════════════ */

function showToast(message, type = 'success') {
  const toastContainer = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  let icon = '✅';
  if (type === 'error') icon = '❌';
  if (type === 'warning') icon = '⚠️';

  toast.innerHTML = `${icon} ${message}`;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('hiding');
    toast.addEventListener('transitionend', () => toast.remove());
  }, 3000);
}

function setFileCardStatus(filename, status) {
  const cards = document.querySelectorAll('.file-card');
  cards.forEach(card => {
    if (card.dataset.filename === filename) {
      const badge = card.querySelector('.file-status');
      const bar = card.querySelector('.file-progress-bar');
      // Remove all status classes
      card.classList.remove('queued', 'processing', 'done', 'partial', 'failed');
      badge.classList.remove('ready', 'queued', 'processing', 'done', 'partial', 'failed');
      bar.classList.remove('indeterminate');

      if (status === 'queued') {
        card.classList.add('queued');
        badge.classList.add('queued');
        badge.textContent = 'Queued...';
      } else if (status === 'processing') {
        card.classList.add('processing');
        badge.classList.add('processing');
        badge.textContent = 'Processing';
        bar.classList.add('indeterminate');
      } else if (status === 'done') {
        card.classList.add('done');
        badge.classList.add('done');
        badge.textContent = '✅ Done';
        bar.style.width = '100%';
      } else if (status === 'partial') {
        card.classList.add('partial');
        badge.classList.add('partial');
        badge.textContent = '⚠️ Partial';
        bar.style.width = '100%';
      } else if (status === 'failed') {
        card.classList.add('failed');
        badge.classList.add('failed');
        badge.textContent = '❌ Failed';
        bar.style.width = '0%';
      }
    }
  });
}

function initChunkControls() {
  const slider = document.getElementById('chunkSizeSlider');
  const input = document.getElementById('chunkSizeInput');
  const hint = document.getElementById('chunkSizeHint');
  const presetBtns = document.querySelectorAll('.chunk-preset-btn');

  function updateChunkUI(value) {
    const v = Math.max(500, Math.min(32000, parseInt(value) || 4000));
    slider.value = v;
    input.value = v;
    const chars = v * 4;
    const pages = Math.round(chars / 1500);
    hint.textContent = `≈ ${chars.toLocaleString()} characters · ~${pages} page${pages !== 1 ? 's' : ''}`;
    // Update active preset button
    presetBtns.forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.value) === v);
    });
    // Save to localStorage
    localStorage.setItem('chunkSize', v);
  }

  slider.addEventListener('input', () => updateChunkUI(slider.value));
  input.addEventListener('input', () => updateChunkUI(input.value));
  input.addEventListener('blur', () => updateChunkUI(input.value));

  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => updateChunkUI(btn.dataset.value));
  });

  // Load saved value
  const saved = localStorage.getItem('chunkSize') || '4000';
  updateChunkUI(saved);
}

initChunkControls();
