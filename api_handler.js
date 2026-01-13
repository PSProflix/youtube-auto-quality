// YouTube Auto Quality - API Handler
// This script is injected into the page and interacts with the YouTube Player API

function setQuality(player, preferredQuality) {
  const availableQualities = player.getAvailableQualityLevels();
  if (!availableQualities || availableQualities.length === 0) return;

  // Normalize to string representations like "1080p"
  const availableStrings = availableQualities.map((q) => q.split('p')[0]);
  const preferred = String(preferredQuality);

  let targetQuality = '';

  // 1. Exact match
  if (availableStrings.includes(preferred)) {
    targetQuality = availableQualities.find((q) => q.startsWith(preferred));
  }
  // 2. Best quality below preferred
  else {
    const sorted = availableQualities
      .map((q) => parseInt(q, 10))
      .filter(Number.isFinite)
      .sort((a, b) => b - a);

    const below = sorted.find((q) => q < parseInt(preferred, 10));
    if (below) {
      targetQuality = availableQualities.find((q) => q.startsWith(String(below)));
    }
    // 3. Highest available
    else if (sorted.length > 0) {
      targetQuality = availableQualities.find((q) => q.startsWith(String(sorted[0])));
    }
  }

  if (targetQuality) {
    player.setPlaybackQuality(targetQuality);
  }
}

function handlePlayer(player) {
  // Listen for messages from content script
  window.addEventListener('message', (event) => {
    if (event.source === window && event.data.type === 'SET_QUALITY') {
      const { quality } = event.data.payload;
      setQuality(player, quality);
    }
  });

  // Initial quality check
  chrome.storage.sync.get(['quality', 'enabled'], (result) => {
    if (result.enabled !== false && result.quality) {
      setQuality(player, result.quality);
    }
  });
}

// YT player is globally accessible as `ytplayer`
function checkForPlayer() {
  const player = document.getElementById('movie_player');
  if (player?.getAvailableQualityLevels) {
    handlePlayer(player);
  } else {
    setTimeout(checkForPlayer, 500);
  }
}

// Start polling for the player
checkForPlayer();
