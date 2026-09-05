// content/engine.js
// Site-agnostic. Loads config from chrome.storage, finds the adapter that
// matches the current site, and watches the DOM for a skip button.

(async function main() {
  const { adSkipperConfig, settings } = await chrome.storage.local.get([
    "adSkipperConfig",
    "settings",
  ]);

  if (!settings?.enabled) return;
  if (!adSkipperConfig) {
    console.warn("[Ad Skipper] no config loaded yet, skipping this page load");
    return;
  }

  const adapter = (window.__adSkipperAdapters || []).find((a) => a.matches());
  if (!adapter) return;

  const siteConfig = adSkipperConfig.sites[adapter.id];
  if (!siteConfig) return;

  function isChannelWhitelisted() {
    const channel = adapter.getChannelName?.();
    if (!channel) return false;
    return (settings.whitelist || []).some(
      (w) => w.toLowerCase() === channel.toLowerCase()
    );
  }

  // --- Unskippable ad handling (Phase 7) ---
  // If there's no skip button but an ad is confirmed playing, speed the
  // video element up so the (unskippable) ad finishes almost instantly,
  // then restore the user's normal playback rate once it's done.
  let speedingUp = false;
  let originalRate = 1;

  function handleUnskippableAd() {
    const video = adapter.getVideoElement?.();
    if (!video) return;

    const adPlaying = adapter.isAdPlaying(siteConfig.adPlayingSelectors || []);

    if (adPlaying && !speedingUp) {
      speedingUp = true;
      originalRate = video.playbackRate || 1;
      video.playbackRate = 16; // max most players allow
      video.muted = true;
    }

    if (!adPlaying && speedingUp) {
      speedingUp = false;
      video.playbackRate = originalRate;
      video.muted = false;
    }
  }

  function trySkip() {
    if (isChannelWhitelisted()) {
      handleUnskippableAd_restoreIfNeeded();
      return; // let ads play for supported creators
    }

    const btn = adapter.findSkipButton(siteConfig.skipButtonSelectors);
    if (btn) {
      btn.click();
      chrome.runtime.sendMessage({ type: "AD_SKIPPED", secondsSaved: 5 });
      return;
    }

    // No skip button available — check if we should speed through instead
    handleUnskippableAd();
  }

  function handleUnskippableAd_restoreIfNeeded() {
    if (speedingUp) {
      const video = adapter.getVideoElement?.();
      if (video) {
        video.playbackRate = originalRate;
        video.muted = false;
      }
      speedingUp = false;
    }
  }

  // MutationObserver: fires whenever the page's DOM changes (ads inject/remove
  // elements constantly), which is how we notice a skip button appearing
  // without polling on a timer.
  const observer = new MutationObserver(() => trySkip());
  observer.observe(document.body, { childList: true, subtree: true });

  // YouTube/Twitch are single-page apps — navigating between videos doesn't
  // reload the page, so we also watch for URL changes to re-check state.
  let lastUrl = location.href;
  setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      trySkip();
    }
  }, 1000);

  // Initial check in case an ad is already showing when the script loads
  trySkip();
})();
