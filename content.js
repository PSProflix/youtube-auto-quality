// YouTube Auto Quality - Content Script
// This script runs on YouTube pages and automatically sets video quality

const QUALITY_LEVELS = {
  '360': 18,
  '480': 18,
  '720': 22,
  '1080': 18,
  '1440': 18,
  '2160': 18
};

let qualityPreference = '720'; // Default to 720p
let isAutoQualityEnabled = true;
let attemptCount = 0;
const MAX_ATTEMPTS = 30;

// Load user preferences from storage
chrome.storage.sync.get(['quality', 'enabled'], (result) => {
  if (result.quality) {
    qualityPreference = result.quality;
  }
  if (result.enabled !== undefined) {
    isAutoQualityEnabled = result.enabled;
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'setQuality') {
    qualityPreference = request.quality;
    chrome.storage.sync.set({ quality: qualityPreference });
    sendResponse({ status: 'Quality preference updated' });
  } else if (request.action === 'setEnabled') {
    isAutoQualityEnabled = request.enabled;
    chrome.storage.sync.set({ enabled: isAutoQualityEnabled });
    if (isAutoQualityEnabled) {
      attemptCount = 0;
      applyQuality();
    }
    sendResponse({ status: 'Extension toggled' });
  } else if (request.action === 'getStatus') {
    sendResponse({ 
      enabled: isAutoQualityEnabled,
      quality: qualityPreference,
      currentAttempt: attemptCount
    });
  }
});

// Function to apply quality setting
function applyQuality() {
  if (!isAutoQualityEnabled) return;

  const video = document.querySelector('video');
  if (!video) {
    if (attemptCount < MAX_ATTEMPTS) {
      attemptCount++;
      setTimeout(applyQuality, 500);
    }
    return;
  }

  // Try to access YouTube's player object
  const playerContainer = document.querySelector('.html5-video-container');
  if (!playerContainer) {
    if (attemptCount < MAX_ATTEMPTS) {
      attemptCount++;
      setTimeout(applyQuality, 500);
    }
    return;
  }

  // Get available quality options
  const qualityButton = document.querySelector('.ytp-settings-button');
  if (!qualityButton) {
    if (attemptCount < MAX_ATTEMPTS) {
      attemptCount++;
      setTimeout(applyQuality, 500);
    }
    return;
  }

  // Click settings button
  setTimeout(() => {
    qualityButton.click();
    
    // Wait for menu to appear
    setTimeout(() => {
      const qualityOption = document.querySelector('[aria-label*="Quality"]');
      if (qualityOption) {
        qualityOption.click();
        
        // Wait for quality submenu
        setTimeout(() => {
          const qualities = Array.from(
            document.querySelectorAll('.ytp-menuitem')
          ).filter(el => el.textContent.includes('p'));
          
          // Find and click the preferred quality
          const preferredQuality = qualities.find(el => 
            el.textContent.includes(qualityPreference)
          );
          
          if (preferredQuality) {
            preferredQuality.click();
            console.log(`YouTube Auto Quality: Set to ${qualityPreference}p`);
          } else {
            // Fallback to highest available quality
            if (qualities.length > 0) {
              qualities[0].click();
              console.log(`YouTube Auto Quality: Set to available quality`);
            }
          }
          
          // Close menu
          setTimeout(() => {
            document.querySelector('.ytp-settings-button')?.click();
          }, 200);
        }, 300);
      }
    }, 300);
  }, 100);
}

// Watch for video changes
const observer = new MutationObserver(() => {
  if (isAutoQualityEnabled) {
    attemptCount = 0;
    applyQuality();
  }
});

// Start observing for video player initialization
if (document.body) {
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Initial attempt
window.addEventListener('load', () => {
  attemptCount = 0;
  setTimeout(applyQuality, 1000);
});

// Also try on document ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    attemptCount = 0;
    setTimeout(applyQuality, 1000);
  });
} else {
  attemptCount = 0;
  setTimeout(applyQuality, 1000);
}
