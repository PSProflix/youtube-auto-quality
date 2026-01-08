// YouTube Auto Quality - Popup Script
// Handles UI interaction and user preferences

const enableToggle = document.getElementById('enableToggle');
const saveButton = document.getElementById('saveButton');
const resetButton = document.getElementById('resetButton');
const statusText = document.getElementById('statusText');

// Custom dropdown
const dropdown = document.getElementById('qualityDropdown');
const dropdownBtn = document.getElementById('qualityDropdownBtn');
const dropdownMenu = document.getElementById('qualityDropdownMenu');
const dropdownValueEl = document.getElementById('qualityDropdownValue');
const dropdownItems = Array.from(document.querySelectorAll('.dropdownItem'));

let selectedQuality = '720';

function labelForQuality(q) {
  const map = {
    '360': '360p',
    '480': '480p',
    '720': '720p',
    '1080': '1080p',
    '1440': '1440p (2K)',
    '2160': '2160p (4K)'
  };
  return map[String(q)] || `${q}p`;
}

function setSelectedQuality(q) {
  selectedQuality = String(q);
  dropdownValueEl.textContent = labelForQuality(selectedQuality);

  dropdownItems.forEach((btn) => {
    const isSelected = btn.dataset.value === selectedQuality;
    btn.classList.toggle('selected', isSelected);
    btn.setAttribute('aria-selected', isSelected ? 'true' : 'false');
  });
}

function openMenu() {
  dropdownMenu.classList.add('open');
  dropdownBtn.setAttribute('aria-expanded', 'true');
}

function closeMenu() {
  dropdownMenu.classList.remove('open');
  dropdownBtn.setAttribute('aria-expanded', 'false');
}

function toggleMenu() {
  if (dropdownMenu.classList.contains('open')) closeMenu();
  else openMenu();
}

// Load current preferences
chrome.storage.sync.get(['quality', 'enabled'], (result) => {
  if (result.quality) setSelectedQuality(result.quality);
  else setSelectedQuality('720');

  if (result.enabled !== undefined) enableToggle.checked = result.enabled;
});

// Dropdown interactions
dropdownBtn.addEventListener('click', (e) => {
  e.preventDefault();
  toggleMenu();
});

dropdownItems.forEach((btn) => {
  btn.addEventListener('click', () => {
    setSelectedQuality(btn.dataset.value);
    closeMenu();
  });
});

// Close when clicking outside
document.addEventListener('click', (e) => {
  if (!dropdown.contains(e.target)) closeMenu();
});

// Close with ESC
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeMenu();
});

function setStatus(msg, ok = true) {
  statusText.textContent = msg;
  statusText.style.color = ok ? '#4CAF50' : '#ff6b6b';
  setTimeout(() => {
    statusText.textContent = 'Ready';
    statusText.style.color = '';
  }, 2000);
}

// Save preferences
saveButton.addEventListener('click', () => {
  const quality = selectedQuality;
  const enabled = enableToggle.checked;

  chrome.storage.sync.set({ quality, enabled }, () => {
    setStatus('✓ Preferences saved!');

    // Notify content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url?.includes('youtube.com')) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'setQuality',
          quality
        }).catch(() => {});

        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'setEnabled',
          enabled
        }).catch(() => {});
      }
    });
  });
});

// Reset to default
resetButton.addEventListener('click', () => {
  setSelectedQuality('720');
  enableToggle.checked = true;

  chrome.storage.sync.set({ quality: '720', enabled: true }, () => {
    setStatus('✓ Reset to default!');
  });
});

// Toggle enabled/disabled
enableToggle.addEventListener('change', () => {
  saveButton.click();
});
