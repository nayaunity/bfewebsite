const APP_URL_KEY = "bfeAppUrl";
const TOKEN_KEY = "bfeSyncToken";
const CONNECTIONS_KEY = "bfeCapturedConnections";

const appUrlInput = document.getElementById("appUrl");
const tokenInput = document.getElementById("token");
const statusBox = document.getElementById("status");
const scanButton = document.getElementById("scanButton");
const syncButton = document.getElementById("syncButton");

function setStatus(message, tone) {
  statusBox.textContent = message;
  statusBox.style.borderColor = tone === "error" ? "#fecaca" : tone === "success" ? "#bbf7d0" : "#ede3d6";
  statusBox.style.background = tone === "error" ? "#fff1f2" : tone === "success" ? "#f0fdf4" : "#fff";
  statusBox.style.color = tone === "error" ? "#be123c" : tone === "success" ? "#166534" : "#433f3b";
}

async function getStorage(keys) {
  return chrome.storage.local.get(keys);
}

async function setStorage(values) {
  return chrome.storage.local.set(values);
}

async function loadState() {
  const stored = await getStorage([APP_URL_KEY, TOKEN_KEY, CONNECTIONS_KEY]);
  appUrlInput.value = stored[APP_URL_KEY] || "https://www.theblackfemaleengineer.com";
  tokenInput.value = stored[TOKEN_KEY] || "";
  const count = Array.isArray(stored[CONNECTIONS_KEY]) ? stored[CONNECTIONS_KEY].length : 0;
  setStatus(count > 0 ? `Ready to sync ${count} captured connection(s).` : "No scan run yet.");
}

async function persistInputs() {
  await setStorage({
    [APP_URL_KEY]: appUrlInput.value.trim(),
    [TOKEN_KEY]: tokenInput.value.trim(),
  });
}

async function getActiveTabId() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab && typeof tab.id === "number" ? tab.id : null;
}

scanButton.addEventListener("click", async () => {
  try {
    await persistInputs();
    const tabId = await getActiveTabId();
    if (tabId == null) {
      setStatus("No active tab found.", "error");
      return;
    }

    const response = await chrome.tabs.sendMessage(tabId, { type: "collect-linkedin-connections" });
    const connections = Array.isArray(response?.connections) ? response.connections : [];
    await setStorage({ [CONNECTIONS_KEY]: connections });
    setStatus(`Captured ${connections.length} visible connection(s) from the current page.`, connections.length > 0 ? "success" : undefined);
  } catch (error) {
    setStatus(`Scan failed: ${error && error.message ? error.message : "No LinkedIn content script response."}`, "error");
  }
});

syncButton.addEventListener("click", async () => {
  try {
    await persistInputs();
    const appUrl = appUrlInput.value.trim().replace(/\/+$/, "");
    const token = tokenInput.value.trim();
    const stored = await getStorage([CONNECTIONS_KEY]);
    const connections = Array.isArray(stored[CONNECTIONS_KEY]) ? stored[CONNECTIONS_KEY] : [];

    if (!appUrl || !token) {
      setStatus("App URL and extension token are both required.", "error");
      return;
    }
    if (connections.length === 0) {
      setStatus("Scan a LinkedIn page before syncing.", "error");
      return;
    }

    const res = await fetch(`${appUrl}/api/referrals/linkedin/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        extensionVersion: chrome.runtime.getManifest().version,
        connections,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Sync failed");
    }

    setStatus(`Sync complete. ${data.upserted} connection(s) upserted.`, "success");
  } catch (error) {
    setStatus(`Sync failed: ${error && error.message ? error.message : "Unknown error"}`, "error");
  }
});

loadState().catch(() => {
  setStatus("Failed to load extension state.", "error");
});
