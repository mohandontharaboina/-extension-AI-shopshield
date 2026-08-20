import { analyzeUrl, isShoppingUrl } from "./scan-engine.js";
import { getValidSession, apiInsert } from "./auth.js";

const SKIP = /^(chrome|edge|about|chrome-extension|devtools|view-source|file):/i;
const RECHECK_MS = 5 * 60 * 1000;
const lastChecked = new Map();

function badge(tabId, analysis) {
  const color =
    analysis.classification === "SAFE" ? "#16a34a" : analysis.classification === "SUSPICIOUS" ? "#f59e0b" : "#dc2626";
  chrome.action.setBadgeBackgroundColor({ tabId, color });
  chrome.action.setBadgeText({ tabId, text: String(analysis.riskScore) });
}

async function persist(analysis, userId) {
  const rows = await apiInsert("website_scans", {
    user_id: userId,
    url: analysis.url,
    domain: analysis.domain,
    website_name: analysis.websiteName,
    risk_score: analysis.riskScore,
    trust_score: analysis.trustScore,
    classification: analysis.classification,
    domain_age_days: analysis.domainAgeDays,
    https_enabled: analysis.httpsEnabled,
    ai_explanation: analysis.aiExplanation,
    recommendation: analysis.recommendation,
    details: JSON.parse(JSON.stringify(analysis)),
  });
  const scan = Array.isArray(rows) ? rows[0] : rows;
  if (!scan?.id) return null;
  await apiInsert(
    "risk_indicators",
    analysis.indicators.map((indicator) => ({
      scan_id: scan.id,
      user_id: userId,
      name: indicator.name,
      category: indicator.category,
      status: indicator.status,
      weight: indicator.weight,
      detail: indicator.detail,
    })),
  );
  return scan;
}

/** Analyses one tab URL, stores the scan and alerts the page when unsafe. */
async function checkTab(tabId, url, { force = false } = {}) {
  if (!url || SKIP.test(url)) return;
  const session = await getValidSession();
  if (!session?.user?.id) {
    chrome.action.setBadgeText({ tabId, text: "" });
    return;
  }

  const key = `${tabId}:${new URL(url).origin}`;
  const previous = lastChecked.get(key);
  if (!force && previous && Date.now() - previous < RECHECK_MS) return;
  lastChecked.set(key, Date.now());

  let analysis;
  try {
    analysis = analyzeUrl(url);
  } catch {
    return;
  }

  badge(tabId, analysis);

  try {
    await persist(analysis, session.user.id);
  } catch (error) {
    console.warn("ShopShield: could not save scan", error);
  }

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

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
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
  return undefined;
});
