// content/adapters/youtube.js
// Each adapter just describes ITS site to the shared engine (engine.js).
// It never touches the DOM-watching logic itself — that's the engine's job.

window.__adSkipperAdapters = window.__adSkipperAdapters || [];

window.__adSkipperAdapters.push({
  id: "youtube.com",
  matches: () => location.hostname.endsWith("youtube.com"),

  // Called on every DOM mutation tick — return the clickable skip button, or null
  findSkipButton(selectors) {
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.offsetParent !== null) return el; // visible + in layout
    }
    return null;
  },

  // Used for the "unskippable ad" speed-up feature (Phase 7)
  isAdPlaying(selectors) {
    return selectors.some((sel) => document.querySelector(sel));
  },

  // Try to identify the current channel name, for the whitelist feature
  getChannelName() {
    const el = document.querySelector("ytd-channel-name a, #channel-name a");
    return el ? el.textContent.trim() : null;
  },

  getVideoElement() {
    return document.querySelector("video.html5-main-video");
  },
});
