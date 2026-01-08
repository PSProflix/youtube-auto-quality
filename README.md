# YouTube Auto Quality

A Chrome extension that automatically sets the **best available YouTube video quality**, with an optional preferred target (e.g., prefer 1440p, otherwise choose 1080p, otherwise 720p...).

## Features
- Auto-selects the best available quality below your preferred option.
- Works when the video loads and when switching videos.
- Saves preferences via `chrome.storage.sync`.
- No tracking, no analytics, no network requests.

## Install (developer mode)
1. Download the repo as ZIP and extract it.
2. Go to `chrome://extensions/`.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the project folder.

## Build a ZIP (for Chrome Web Store)
Chrome Web Store expects a ZIP package with icons included.

### Option A: Local build
1. Install Python 3.
2. Run:
   - `pip install -r requirements.txt`
   - `python tools/build_dist.py`
3. Upload `release/youtube-auto-quality.zip` to the Chrome Web Store.

### Option B: GitHub Actions
- Run the workflow **Build Chrome ZIP** (manual trigger) and download the generated artifact.

## Privacy
See [PRIVACY.md](PRIVACY.md).
