// YouTube Auto Quality - Background Service Worker
// Handles storage and communication between components

chrome.runtime.onInstalled.addListener(() => {
  // Set default preferences on first install
  chrome.storage.sync.get(['quality', 'enabled'], (result) => {
    if (!result.quality) {
      chrome.storage.sync.set({ quality: '720', enabled: true });
    }
  });
});

// Listen for tab updates to trigger quality setting
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url?.includes('youtube.com')) {
    chrome.storage.sync.get(['enabled'], (result) => {
      if (result.enabled !== false) {
        // Send message to content script to apply quality
        chrome.tabs.sendMessage(tabId, { action: 'applyQuality' }).catch(() => {
          // Silently fail if content script not ready yet
        });
      }
    });
  }
});
