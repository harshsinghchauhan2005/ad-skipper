const REMOTE_CONFIG_URL =
  "https://raw.githubusercontent.com/harshsinghchauhan2005/ad-skipper/main/config/selectors.json";

const REFRESH_ALARM = "ad-skipper-refresh-config";

async function loadLocalConfig() {
  const url = chrome.runtime.getURL("config/selectors.json");
  const res = await fetch(url);
  return res.json();
}

async function loadRemoteConfig() {
  try {
    const res = await fetch(REMOTE_CONFIG_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const data = await res.json();
    if (!data.sites) throw new Error("malformed config");
    return data;
  } catch (err) {
    console.warn("[Ad Skipper] remote config fetch failed, using local:", err.message);
    return null;
  }
}

async function refreshConfig() {
  const local = await loadLocalConfig();
  const remote = await loadRemoteConfig();
  // Only accept remote if its version is newer than what we have locally.
  const config = remote && remote.version >= local.version ? remote : local;
  await chrome.storage.local.set({ adSkipperConfig: config });
  console.log("[Ad Skipper] config loaded, version:", config.version, remote ? "(remote)" : "(local)");
}

chrome.runtime.onInstalled.addListener(async () => {
  await refreshConfig();
  await chrome.storage.local.set({
    stats: { adsSkipped: 0, secondsSaved: 0 },
    settings: { enabled: true, whitelist: [] },
  });
  chrome.alarms.create(REFRESH_ALARM, { periodInMinutes: 360 }); // every 6h
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === REFRESH_ALARM) refreshConfig();
});

// Content scripts send this message every time they auto-skip an ad
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "AD_SKIPPED") {
    chrome.storage.local.get("stats", ({ stats }) => {
      const updated = {
        adsSkipped: (stats?.adsSkipped || 0) + 1,
        secondsSaved: (stats?.secondsSaved || 0) + (msg.secondsSaved || 5),
      };
      chrome.storage.local.set({ stats: updated });
    });
  }
  sendResponse({ ok: true });
  return true;
});
