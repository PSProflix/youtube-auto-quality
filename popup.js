// YouTube Auto Quality - Popup Script
// Handles UI interaction and user preferences

const qualitySelect = document.getElementById('qualitySelect');
const enableToggle = document.getElementById('enableToggle');
const saveButton = document.getElementById('saveButton');
const resetButton = document.getElementById('resetButton');
const statusText = document.getElementById('statusText');

// Load current preferences
chrome.storage.sync.get(['quality', 'enabled'], (result) => {
  if (result.quality) {
    qualitySelect.value = result.quality;
  }
  if (result.enabled !== undefined) {
    enableToggle.checked = result.enabled;
  }
});

// Save preferences
saveButton.addEventListener('click', () => {
  const quality = qualitySelect.value;
  const enabled = enableToggle.checked;

  chrome.storage.sync.set({ quality, enabled }, () => {
    statusText.textContent = '✓ Preferences saved!';
    statusText.style.color = '#4CAF50';

    // Notify content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url?.includes('youtube.com')) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'setQuality',
          quality: quality
        }).catch(() => {});

        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'setEnabled',
          enabled: enabled
        }).catch(() => {});
      }
    });

    setTimeout(() => {
      statusText.textContent = 'Ready';
      statusText.style.color = '#666';
    }, 2000);
  });
});

// Reset to default
resetButton.addEventListener('click', () => {
  qualitySelect.value = '720';
  enableToggle.checked = true;
  chrome.storage.sync.set({ quality: '720', enabled: true });
  statusText.textContent = '✓ Reset to default!';
  statusText.style.color = '#4CAF50';

  setTimeout(() => {
    statusText.textContent = 'Ready';
    statusText.style.color = '#666';
  }, 2000);
});

// Toggle enabled/disabled
enableToggle.addEventListener('change', () => {
  saveButton.click();
});
