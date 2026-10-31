# JETLAG ZERO — Personal beta

A mobile-first personal jet-lag planning app. Static files, no accounts, no backend, and no paid API.

## Publish with GitHub Pages
1. Create a new **public** repository named `jetlag-zero` on GitHub.
2. Choose **Add file → Upload files** and upload `index.html`, `sw.js`, `manifest.webmanifest`, `icon.svg` to the repository root (not the containing folder).
3. Select **Commit changes**.
4. Go to **Settings → Pages → Build and deployment**, select **Deploy from a branch**, branch **main**, folder **/(root)**, then **Save**.
5. After deployment, visit `https://YOUR_USERNAME.github.io/jetlag-zero/` in Safari. Share → Add to Home Screen.
6. Load the app online once, then test airplane mode with the page reopened.

## Important limitations
- This is an experimental general-wellness prototype, **not a validated circadian phase-response algorithm**. Flight events are heuristic and cannot guarantee jet-lag prevention.
- The planner currently supports one direct flight segment at a time. It supports selected cities and their daylight-saving rules through Intl time zones.
- Service worker caches the static app after its first online visit; availability in iOS offline mode depends on Safari's caching and storage policy.
- Audio uses local Web Audio noise generation or an uploaded file. Audio while screen-locked or in the background is **not guaranteed** on iPhone.
- MP3 uploads are held in memory during the current page session, **not permanently saved**; reselect the file after reopening.
- Checklists and flight plans use localStorage. They can be lost if browser storage is cleared or the app is removed. No cloud backup.
- No background push notifications. Open the app to see current recommendations.
- For travel, always prioritize adequate sleep, hydration, safe movement and medical guidance if needed.
