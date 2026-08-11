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

  bar.append(icon, text, close);
  (document.body ?? document.documentElement).appendChild(bar);
}

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "SHOPSHIELD_ALERT") showAlert(message.payload);
});
