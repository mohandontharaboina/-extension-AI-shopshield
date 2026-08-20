/* ShopShield AI — injects the bottom red alert bar on unsafe sites. */

const BAR_ID = "shopshield-ai-alert-bar";

function removeBar() {
  document.getElementById(BAR_ID)?.remove();
}

function showAlert(data) {
  removeBar();
  const high = data.classification === "HIGH RISK";

  const bar = document.createElement("div");
  bar.id = BAR_ID;
  bar.className = high ? "shopshield-bar shopshield-bar--high" : "shopshield-bar shopshield-bar--warn";
  bar.setAttribute("role", "alert");

  const icon = document.createElement("div");
  icon.className = "shopshield-icon";
  icon.textContent = "!";

  const text = document.createElement("div");
  text.className = "shopshield-text";

  const title = document.createElement("div");
  title.className = "shopshield-title";
  title.textContent = high
    ? `Warning: ${data.domain} looks like a FAKE website (risk ${data.riskScore}/100)`
    : `Caution: ${data.domain} looks suspicious (risk ${data.riskScore}/100)`;

  const body = document.createElement("div");
  body.className = "shopshield-body";
  body.textContent = data.threats?.length
    ? `${data.recommendation} Signals: ${data.threats.join(", ")}.`
    : data.recommendation;

  text.append(title, body);

  const close = document.createElement("button");
  close.className = "shopshield-close";
  close.type = "button";
  close.setAttribute("aria-label", "Dismiss ShopShield alert");
  close.textContent = "×";
  close.addEventListener("click", removeBar);

  const barDetails = document.createElement("button");
  barDetails.className = "shopshield-bar-details";
  barDetails.type = "button";
  barDetails.textContent = "Scan details";
  barDetails.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "SHOPSHIELD_OPEN_DETAILS", scanId: data.scanId }, () => void chrome.runtime.lastError);
  });

  bar.append(icon, text, barDetails, close);
  (document.body ?? document.documentElement).appendChild(bar);
}

/* --- Shopping page detection from the live DOM --- */
function detectShoppingPage() {
  try {
    if (document.querySelector('[itemtype*="schema.org/Product" i], [class*="add-to-cart" i], [id*="add-to-cart" i], [class*="addtocart" i], [data-testid*="add-to-cart" i]')) return true;
    const text = (document.body?.innerText ?? "").slice(0, 20000).toLowerCase();
    const hits = ["add to cart", "add to bag", "buy now", "checkout", "shopping cart", "free shipping", "in stock", "proceed to pay"].filter((k) => text.includes(k));
    const hasPrice = /(?:[₹$€£]\s?\d|(?:rs\.?|usd|inr)\s?\d)/i.test(text);
    return hits.length >= 2 || (hits.length >= 1 && hasPrice);
  } catch {
    return false;
  }
}

/* --- Floating risk-score pill for shopping sites --- */
const PILL_ID = "shopshield-ai-score-pill";

function showScore(data) {
  document.getElementById(PILL_ID)?.remove();
  const level = data.classification === "SAFE" ? "safe" : data.classification === "SUSPICIOUS" ? "warn" : "high";

  const pill = document.createElement("div");
  pill.id = PILL_ID;
  pill.className = `shopshield-pill shopshield-pill--${level}`;
  pill.title = `ShopShield AI — ${data.domain}: risk ${data.riskScore}/100, trust ${data.trustScore}/100`;

  const dot = document.createElement("span");
  dot.className = "shopshield-pill-dot";

  const label = document.createElement("span");
  label.className = "shopshield-pill-label";
  label.textContent = `Risk ${data.riskScore}/100 · ${data.classification}`;

  const details = document.createElement("button");
  details.className = "shopshield-pill-details";
  details.type = "button";
  details.textContent = "Scan details";
  details.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "SHOPSHIELD_OPEN_DETAILS", scanId: data.scanId }, () => void chrome.runtime.lastError);
  });

  const close = document.createElement("button");
  close.className = "shopshield-pill-close";
  close.type = "button";
  close.setAttribute("aria-label", "Hide ShopShield score");
  close.textContent = "×";
  close.addEventListener("click", () => pill.remove());

  pill.append(dot, label, details, close);
  (document.body ?? document.documentElement).appendChild(pill);
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "SHOPSHIELD_ALERT") showAlert(message.payload);
  if (message?.type === "SHOPSHIELD_SCORE") showScore(message.payload);
  if (message?.type === "SHOPSHIELD_DETECT_SHOP") {
    sendResponse({ isShop: detectShoppingPage() });
    return true;
  }
  return undefined;
});

/* Status bridge: lets the ShopShield web app confirm the extension is installed and signed in. */
window.addEventListener("message", (event) => {
  if (event.source !== window || event.data?.type !== "SHOPSHIELD_STATUS_REQUEST") return;
  chrome.runtime.sendMessage({ type: "SHOPSHIELD_STATUS" }, (response) => {
    void chrome.runtime.lastError;
    window.postMessage(
      {
        type: "SHOPSHIELD_STATUS_RESPONSE",
        payload: { installed: true, signedIn: Boolean(response?.signedIn), email: response?.email ?? null },
      },
      "*",
    );
  });
});
