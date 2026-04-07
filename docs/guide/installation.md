# Installation

## Chrome Web Store

Install claude-nexus from the official Chrome Web Store listing:

- https://chromewebstore.google.com/detail/claude-nexus/mjlaeohblnaalakaflnchcmpoojjejka

## Manual installation

1. Clone the repository.

```bash
git clone https://github.com/Qiuner/claude-nexus.git
cd claude-nexus
```

2. Install dependencies.

```bash
yarn install
```

3. Build the Chrome extension.

```bash
yarn build:chrome
```

4. Load the unpacked extension in Chrome.

- Open `chrome://extensions`
- Enable **Developer mode**
- Click **Load unpacked**
- Select the `dist_chrome` folder

## Notes

- The extension injects into `https://claude.ai/*`
- Data such as folders and prompts is stored locally in the browser
- claude-nexus is available on the Chrome Web Store, and manual installation remains useful for local development builds
