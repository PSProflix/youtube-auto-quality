# YouTube Auto Quality

A Chrome extension that automatically sets your preferred YouTube video quality.

## Features

✨ **Automatic Quality Selection** - Automatically sets your preferred video quality when you watch YouTube videos

✨ **Persistent Preferences** - Your quality preference is saved and remembered across sessions

✨ **Easy-to-Use Interface** - Simple popup menu to change quality preferences with a single click

✨ **Quick Toggle** - Enable/disable the extension directly from the popup

✨ **Lightweight** - Minimal resource usage, works seamlessly in the background

## Installation

### From Source (Development Mode)

1. Clone this repository or download it as a ZIP file
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked"
5. Select the extension folder
6. The extension will appear in your extensions list

### From Compiled Version (Ready to Use)

Download the `compiled/youtube-auto-quality.crx` file from the releases and drag it into Chrome, or follow the developer mode instructions above with the `dist/` folder.

## Usage

1. Click the extension icon in your Chrome toolbar
2. Select your preferred video quality (360p, 480p, 720p, 1080p, 1440p, or 2160p)
3. Click "Save Preferences"
4. The extension will automatically apply your preference to all YouTube videos

## How It Works

- The extension monitors YouTube pages using a content script
- When a video loads, it automatically opens the quality settings menu
- It selects your preferred quality from the available options
- If your preferred quality isn't available, it selects the highest quality available
- The preference is stored locally using Chrome's storage API

## Supported Quality Levels

- 360p
- 480p
- 720p (Recommended)
- 1080p
- 1440p (2K)
- 2160p (4K)

## Technical Details

### Files

- `manifest.json` - Extension configuration and permissions
- `content.js` - Content script that runs on YouTube pages
- `background.js` - Background service worker for managing storage
- `popup.html` - User interface for the extension popup
- `popup.js` - JavaScript for popup interaction
- `popup.css` - Styling for the popup interface

### Permissions Used

- `storage` - To save and retrieve user preferences
- `scripting` - To run scripts on YouTube pages
- `host_permissions` - Access to YouTube URLs

## Troubleshooting

**The quality doesn't change:**
- Make sure the extension is enabled (toggle should be ON)
- Refresh the YouTube page
- Check that your preferred quality is available for the video
- Try selecting a different quality preference

**The extension doesn't work after an update:**
- Go to `chrome://extensions/`
- Disable and re-enable the extension
- Refresh YouTube pages

## Version History

### v1.0.0 (Initial Release)
- Initial release with automatic quality selection
- Popup interface for settings
- Chrome storage integration
- Support for all YouTube quality levels

## License

MIT License - Feel free to use and modify this extension.

## Support

If you encounter any issues, please report them on the GitHub repository.

---

**Note:** This extension uses YouTube's native quality settings and complies with YouTube's terms of service.
