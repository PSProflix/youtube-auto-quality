// YouTube Auto Quality - Content Script
// This script runs on YouTube pages and automatically sets video quality

let qualityPreference = '720'; // Default to 720p
let isAutoQualityEnabled = true;
let attemptCount = 0;
const MAX_ATTEMPTS = 30;

// Load user preferences from storage
chrome.storage.sync.get(['quality', 'enabled'], (result) => {
  if (result.quality) qualityPreference = result.quality;
  if (result.enabled !== undefined) isAutoQualityEnabled = result.enabled;
});

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'setQuality') {
    qualityPreference = request.quality;
    chrome.storage.sync.set({ quality: qualityPreference });
    sendResponse?.({ status: 'Quality preference updated' });
    return;
  }

  if (request.action === 'setEnabled') {
    isAutoQualityEnabled = request.enabled;
    chrome.storage.sync.set({ enabled: isAutoQualityEnabled });
    if (isAutoQualityEnabled) {
      attemptCount = 0;
      applyQuality();
    }
    sendResponse?.({ status: 'Extension toggled' });
    return;
  }

  if (request.action === 'getStatus') {
    sendResponse?.({
      enabled: isAutoQualityEnabled,
      quality: qualityPreference,
      currentAttempt: attemptCount
    });
    return;
  }

  // Background can ping this to force re-apply
  if (request.action === 'applyQuality') {
    if (isAutoQualityEnabled) {
      attemptCount = 0;
      applyQuality();
    }
    sendResponse?.({ status: 'Applied' });
  }
});

function parseQualityP(text) {
  // Examples: "2160p", "1440p HD", "1080p60", etc.
  const m = String(text).match(/(\d{3,4})p/i);
  if (!m) return null;
  const p = parseInt(m[1], 10);
  return Number.isFinite(p) ? p : null;
}

function pickBestQuality(qualityItems, preferredP) {
  const parsed = qualityItems
    .map((el) => ({ el, p: parseQualityP(el.textContent) }))
    .filter((x) => x.p);

  if (parsed.length === 0) return null;

  // Sort by resolution descending
  parsed.sort((a, b) => b.p - a.p);

  // 1) Exact match
  const exact = parsed.find((x) => x.p === preferredP);
  if (exact) return exact.el;

  // 2) Highest quality BELOW preferred (e.g., prefer 1440p -> pick 1080p if 1440p not available)
  const below = parsed.find((x) => x.p < preferredP);
  if (below) return below.el;

  // 3) Otherwise, just pick the highest available
  return parsed[0].el;
}

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

  const qualityButton = document.querySelector('.ytp-settings-button');
  if (!qualityButton) {
    if (attemptCount < MAX_ATTEMPTS) {
      attemptCount++;
      setTimeout(applyQuality, 500);
    }
    return;
  }

  const preferredP = parseInt(qualityPreference, 10);

  // Click settings button
  setTimeout(() => {
    qualityButton.click();

    // Wait for menu to appear
    setTimeout(() => {
      const qualityOption = document.querySelector('[aria-label*="Quality"], [aria-label*="qualidade" i]');
      if (!qualityOption) {
        // Close menu
        qualityButton.click();
        return;
      }

      qualityOption.click();

      // Wait for quality submenu
      setTimeout(() => {
        const qualityItems = Array.from(document.querySelectorAll('.ytp-menuitem')).filter((el) =>
          /\dp/i.test(el.textContent)
        );

        const best = pickBestQuality(qualityItems, preferredP);

        if (best) {
          const chosenP = parseQualityP(best.textContent);
          best.click();
          if (chosenP) {
            console.log(`YouTube Auto Quality: Set to ${chosenP}p (preferred ${qualityPreference}p)`);
          } else {
            console.log('YouTube Auto Quality: Set to best available quality');
          }
        }

        // Close menu (toggle back)
        setTimeout(() => {
          document.querySelector('.ytp-settings-button')?.click();
        }, 200);
      }, 300);
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

// Initial attempts
window.addEventListener('load', () => {
  attemptCount = 0;
  setTimeout(applyQuality, 1000);
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    attemptCount = 0;
    setTimeout(applyQuality, 1000);
  });
} else {
  attemptCount = 0;
  setTimeout(applyQuality, 1000);
}
