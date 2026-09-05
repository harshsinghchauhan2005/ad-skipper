# Ad Skipper

A browser extension that automatically clicks the "Skip Ad" button the moment
it becomes available — with multi-site support and a self-healing config
system so selector fixes ship without a full extension update.

## Why this one's different

- **Adapter architecture** — each supported site (YouTube, Twitch, ...) is a
  small self-contained adapter. Adding a new site means writing one file, not
  touching the core engine.
- **Remote, self-healing selectors** — the DOM selectors that identify a skip
  button live in a JSON file fetched from GitHub, not hardcoded in the
  extension. When a site changes its markup, update the JSON — no store
  resubmission needed.
- **Creator whitelist** — let ads play for specific channels/creators you
  want to support; everything else gets auto-skipped.
- **Transparent stats** — see how many ads you've skipped and roughly how
  much time you've saved.
- **Zero telemetry** — no analytics, no remote logging beyond the one public
  config fetch. Fully open source.

## Status

🚧 Early build — YouTube + Twitch skip-button detection, popup stats
dashboard, and whitelist are working. Unskippable-ad auto-speed-up is not
built yet (see Roadmap).

## Architecture

```
ad-skipper/
├── manifest.json           # Manifest V3 config
├── background.js           # service worker: config fetch + stats
├── content/
│   ├── engine.js            # site-agnostic: watches DOM, clicks skip button
│   └── adapters/
│       ├── youtube.js
│       └── twitch.js
├── popup/                  # stats dashboard + toggle + whitelist UI
└── config/
    └── selectors.json      # local fallback selector config
```

The engine never knows anything about a specific site. It asks
`window.__adSkipperAdapters` which adapter matches the current page, then
asks that adapter to find the skip button using selectors pulled from
config (local file first, then a remote override fetched by `background.js`).

## Running it locally

1. Clone this repo
2. Go to `chrome://extensions`, enable **Developer mode**
3. Click **Load unpacked**, select the `ad-skipper` folder
4. Visit YouTube or Twitch and play a video with ads

## Adding support for a new site

1. Add a `sites.<hostname>` entry to `config/selectors.json` with the current
   skip-button selector(s) — inspect the live DOM via DevTools to find them
2. Create `content/adapters/<site>.js` following `youtube.js` as a template
3. Add the file to `content_scripts.js` and `host_permissions` in
   `manifest.json`

## Roadmap

- [x] Core DOM-watching engine
- [x] YouTube adapter
- [x] Twitch adapter (selectors need live verification)
- [x] Remote self-healing config
- [x] Stats dashboard
- [x] Creator whitelist
- [ ] Auto-mute / speed-up during unskippable ads
- [ ] Firefox port
- [ ] Chrome Web Store listing

## Privacy

This extension makes exactly one network request beyond your normal
browsing: a periodic fetch of `config/selectors.json` from this repo, to
keep skip-button selectors up to date. No browsing data, video history, or
personal information is collected, stored, or transmitted anywhere.

## License

MIT
