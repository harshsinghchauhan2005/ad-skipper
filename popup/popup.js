// popup/popup.js

async function render() {
  const { stats, settings } = await chrome.storage.local.get(["stats", "settings"]);

  document.getElementById("enabledToggle").checked = !!settings?.enabled;
  document.getElementById("adsSkipped").textContent = stats?.adsSkipped ?? 0;

  const seconds = stats?.secondsSaved ?? 0;
  const label =
    seconds >= 60 ? `${Math.floor(seconds / 60)}m ${seconds % 60}s` : `${seconds}s`;
  document.getElementById("timeSaved").textContent = label;

  const list = document.getElementById("whitelistItems");
  list.innerHTML = "";
  (settings?.whitelist || []).forEach((channel) => {
    const li = document.createElement("li");
    li.textContent = channel;

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "×";
    removeBtn.onclick = async () => {
      const { settings } = await chrome.storage.local.get("settings");
      settings.whitelist = settings.whitelist.filter((c) => c !== channel);
      await chrome.storage.local.set({ settings });
      render();
    };

    li.appendChild(removeBtn);
    list.appendChild(li);
  });
}

document.getElementById("enabledToggle").addEventListener("change", async (e) => {
  const { settings } = await chrome.storage.local.get("settings");
  settings.enabled = e.target.checked;
  await chrome.storage.local.set({ settings });
});

document.getElementById("addChannel").addEventListener("click", async () => {
  const input = document.getElementById("channelInput");
  const name = input.value.trim();
  if (!name) return;

  const { settings } = await chrome.storage.local.get("settings");
  settings.whitelist = [...(settings.whitelist || []), name];
  await chrome.storage.local.set({ settings });
  input.value = "";
  render();
});

render();
