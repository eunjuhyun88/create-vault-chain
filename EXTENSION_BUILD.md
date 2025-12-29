# PlayArts Wallet Chrome Extension - Build Guide

## Overview
This project is designed to work as both a web application and a Chrome extension.

## Building the Chrome Extension

### Prerequisites
- Node.js 18+
- npm or bun

### Build Steps

1. **Clone or export the repository from GitHub**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

4. **Prepare extension files**
   
   After building, copy the following files to your extension directory:
   
   ```
   dist/
   ├── index.html          # Popup UI
   ├── assets/             # Built React app assets
   ├── manifest.json       # Extension manifest (from public/)
   ├── background.js       # Background service worker (from public/)
   ├── content-script.js   # Content script (from public/)
   ├── content-style.css   # Content script styles (from public/)
   └── icons/              # Extension icons
       ├── icon16.png
       ├── icon32.png
       ├── icon48.png
       └── icon128.png
   ```

5. **Add extension icons**
   
   Create PNG icons in the following sizes and place them in `public/icons/`:
   - `icon16.png` (16x16 pixels)
   - `icon32.png` (32x32 pixels)
   - `icon48.png` (48x48 pixels)
   - `icon128.png` (128x128 pixels)

### Loading the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `dist` folder from your build

### Development Mode

For development with hot reload:

1. Run the dev server:
   ```bash
   npm run dev
   ```

2. The popup can be tested at `http://localhost:5173`

3. For testing content scripts:
   - Build the project
   - Load the extension
   - Navigate to supported AI sites (ChatGPT, Midjourney, etc.)

## Supported AI Services

The extension monitors and captures content from:

- **ChatGPT** - chat.openai.com, chatgpt.com
- **Midjourney** - midjourney.com, Discord channels
- **DALL-E** - labs.openai.com
- **Stable Diffusion** - stability.ai, dreamstudio.ai
- **Runway** - runway.ml
- **Adobe Firefly** - firefly.adobe.com
- **Google Veo** - labs.google

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  Popup (React)                   │
│  - Wallet UI                                     │
│  - Asset management                              │
│  - Minting interface                             │
└─────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────┐
│            Background Service Worker             │
│  - State management                              │
│  - Tab monitoring                                │
│  - Storage handling                              │
│  - API communication                             │
└─────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────┐
│              Content Script (per tab)            │
│  - DOM observation                               │
│  - Image/prompt capture                          │
│  - Visual feedback                               │
└─────────────────────────────────────────────────┘
```

## Permissions

The extension requires:

- `activeTab` - Access to the active tab for scanning
- `storage` - Store captured assets and settings
- `scripting` - Inject content scripts
- `tabs` - Monitor tab changes

## Troubleshooting

### Extension not loading
- Ensure all required files are in the dist folder
- Check for errors in `chrome://extensions/`

### Content script not running
- Verify the site is in the `host_permissions` list
- Check console for errors on the AI site

### Assets not capturing
- Some sites use lazy loading; scroll to load images
- Check if the image URL matches the selector patterns

## Security Notes

- The extension only captures publicly visible content
- No authentication data is accessed
- All captured assets are stored locally until explicitly uploaded
