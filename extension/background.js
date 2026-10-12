import { isShoppingUrl } from "./scan-engine.js";
import { getValidSession, apiScan } from "./auth.js";
import { APP_URL } from "./config.js";

const SKIP = /^(chrome|edge|about|chrome-extension|devtools|view-source|file):/i;
const RECHECK_MS = 5 * 60 * 1000;
const lastChecked = new Map();
const inFlight = new Set();
const scanStorageKey = (tabId) => `shopshield_scan_${tabId}`;

async function saveTabState(tabId, state) {
  await chrome.storage.local.set({ [scanStorageKey(tabId)]: { ...state, tabId, checkedAt: Date.now() } });
}

function badge(tabId, analysis) {
  const color =
    analysis.classification === "SAFE" ? "#16a34a" : analysis.classification === "SUSPICIOUS" ? "#f59e0b" : "#dc2626";
  chrome.action.setBadgeBackgroundColor({ tabId, color });
  chrome.action.setBadgeText({ tabId, text: String(analysis.riskScore) });
}

/** Analyses one tab URL, stores the scan and alerts the page when unsafe. */
async function checkTab(tabId, url, { force = false } = {}) {
  if (!url || SKIP.test(url)) {
    await saveTabState(tabId, { status: "unsupported", url: url ?? "" });
    return;
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    await saveTabState(tabId, { status: "unsupported", url });
    return;
  }
  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    await saveTabState(tabId, { status: "unsupported", url });
    return;
  }

  const session = await getValidSession();
  if (!session?.user?.id) {
    chrome.action.setBadgeText({ tabId, text: "" });
    await saveTabState(tabId, { status: "signed-out", url });
    return;
  }

  const key = parsedUrl.href;
  const previous = lastChecked.get(key);
  if (!force && previous && Date.now() - previous < RECHECK_MS) return;
  if (inFlight.has(key)) return;
  inFlight.add(key);
  await saveTabState(tabId, { status: "analyzing", url });

  let analysis;
  let scanId;
  try {
    const scan = await apiScan(url);
    analysis = scan.details;
    scanId = scan.id;
    if (!analysis || !scanId) throw new Error("The scan result was incomplete.");
    lastChecked.set(key, Date.now());
    await saveTabState(tabId, { status: "complete", url, analysis, scanId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The scan could not be completed.";
    await saveTabState(tabId, { status: "failed", url, error: message });
    console.warn("ShopShield: scan failed", message);
    return;
  } finally {
    inFlight.delete(key);
  }

  badge(tabId, analysis);

  // Advanced: auto-detect shopping pages (URL heuristics + page DOM signals)
  const shopByUrl = isShoppingUrl(url);
  const shopByPage = await new Promise((resolve) => {
    let done = false;
    const finish = (v) => { if (!done) { done = true; resolve(v); } };
    setTimeout(() => finish(false), 800);
    try {
      chrome.tabs.sendMessage(tabId, { type: "SHOPSHIELD_DETECT_SHOP" }, (res) => {
        void chrome.runtime.lastError;
        finish(Boolean(res?.isShop));
      });
    } catch { finish(false); }
  });

  if (shopByUrl || shopByPage) {
    chrome.tabs.sendMessage(
      tabId,
      {
        type: "SHOPSHIELD_SCORE",
        payload: {
          classification: analysis.classification,
          riskScore: analysis.riskScore,
          trustScore: analysis.trustScore,
          domain: analysis.domain,
          scanId,
        },
      },
      () => void chrome.runtime.lastError,
    );
  }

  if (analysis.classification !== "SAFE") {
    chrome.tabs.sendMessage(
      tabId,
      {
        type: "SHOPSHIELD_ALERT",
        payload: {
          classification: analysis.classification,
          riskScore: analysis.riskScore,
          domain: analysis.domain,
          recommendation: analysis.recommendation,
          threats: analysis.detectedThreats.slice(0, 3),
          scanId,
        },
      },
      () => void chrome.runtime.lastError,
    );
  }
}

chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  if (info.status === "complete" && tab.url) void checkTab(tabId, tab.url);
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId);
  if (tab.url) void checkTab(tabId, tab.url);
});

chrome.alarms.create("shopshield-monitor", { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== "shopshield-monitor") return;
  const tabs = await chrome.tabs.query({ active: true });
  for (const tab of tabs) if (tab.id != null && tab.url) void checkTab(tab.id, tab.url);
});

function reportUrl(scanId) {
  return scanId ? `${APP_URL}/dashboard/report/${scanId}` : `${APP_URL}/dashboard/history`;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "SHOPSHIELD_OPEN_DETAILS") {
    chrome.tabs.create({ url: reportUrl(message.scanId) });
    return undefined;
  }
  if (message?.type === "SHOPSHIELD_STATUS") {
    (async () => {
      const session = await getValidSession();
      sendResponse({ signedIn: Boolean(session?.user), email: session?.user?.email ?? null });
    })();
    return true;
  }
  if (message?.type === "SHOPSHIELD_RECHECK_ACTIVE") {
    (async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id != null && tab.url) await checkTab(tab.id, tab.url, { force: true });
      sendResponse({ ok: true });
    })();
    return true;
  }
  if (message?.type === "SHOPSHIELD_GET_ACTIVE_SCAN") {
    (async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id == null || !tab.url) {
        sendResponse({ status: "unsupported", url: "" });
        return;
      }
      const stored = (await chrome.storage.local.get(scanStorageKey(tab.id)))[scanStorageKey(tab.id)];
      if (stored?.url === tab.url && stored.status !== "analyzing") {
        sendResponse(stored);
        return;
      }
      void checkTab(tab.id, tab.url);
      sendResponse({ status: "analyzing", url: tab.url });
    })();
    return true;
  }
  return undefined;
});
