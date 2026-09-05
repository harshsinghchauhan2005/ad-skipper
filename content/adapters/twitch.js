// content/adapters/twitch.js
// NOTE: Twitch's ad DOM changes more often than YouTube's, and it actively
// fights ad-blocking extensions. Treat these selectors as a starting point —
// verify them yourself in DevTools (Inspect Element while an ad is playing)
// before relying on this adapter.

window.__adSkipperAdapters = window.__adSkipperAdapters || [];

window.__adSkipperAdapters.push({
  id: "twitch.tv",
  matches: () => location.hostname.endsWith("twitch.tv"),

  findSkipButton(selectors) {
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.offsetParent !== null) return el;
    }
    return null;
  },

  isAdPlaying(selectors) {
    return selectors.some((sel) => document.querySelector(sel));
  },

  getChannelName() {
    const el = document.querySelector('[data-a-target="stream-title"]');
    return el ? el.textContent.trim() : null;
  },

  getVideoElement() {
    return document.querySelector("video");
  },
});
