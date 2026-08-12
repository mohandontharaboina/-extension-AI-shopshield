import { signIn, signOut, getValidSession } from "./auth.js";
import { analyzeUrl } from "./scan-engine.js";
import { APP_URL } from "./config.js";

const loginView = document.getElementById("login-view");
const statusView = document.getElementById("status-view");
const form = document.getElementById("login-form");
const errorEl = document.getElementById("error");
const submit = document.getElementById("submit");
const verdict = document.getElementById("verdict");
const pill = document.getElementById("auth-pill");
const pillText = document.getElementById("auth-pill-text");

document.getElementById("signup-link").href = `${APP_URL}/signup`;

async function renderVerdict() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url || !/^https?:/i.test(tab.url)) {
    verdict.textContent = "No website to check in this tab.";
    return;
  }
  try {
    const analysis = analyzeUrl(tab.url);
    verdict.className =
      "verdict " +
      (analysis.classification === "SAFE" ? "safe" : analysis.classification === "SUSPICIOUS" ? "warn" : "high");
    verdict.textContent = `${analysis.domain} — ${analysis.classification} (risk ${analysis.riskScore}/100)`;
  } catch {
    verdict.textContent = "This page cannot be analysed.";
  }
}

async function render() {
  const session = await getValidSession();
  const signedIn = Boolean(session?.user);
  pill.className = "pill " + (signedIn ? "pill--in" : "pill--out");
  pillText.textContent = signedIn ? `Signed in — ${session.user.email ?? "protection active"}` : "Signed out — not protected";
  loginView.hidden = signedIn;
  statusView.hidden = !signedIn;
  if (signedIn) {
    document.getElementById("user-email").textContent = session.user.email ?? "";
    await renderVerdict();
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorEl.hidden = true;
  submit.disabled = true;
  submit.textContent = "Signing in…";
  try {
    await signIn(document.getElementById("email").value, document.getElementById("password").value);
    await chrome.runtime.sendMessage({ type: "SHOPSHIELD_RECHECK_ACTIVE" });
    await render();
  } catch (error) {
    errorEl.textContent = error instanceof Error ? error.message : "Sign in failed";
    errorEl.hidden = false;
  } finally {
    submit.disabled = false;
    submit.textContent = "Sign in";
  }
});

document.getElementById("recheck").addEventListener("click", async () => {
  verdict.textContent = "Re-checking…";
  await chrome.runtime.sendMessage({ type: "SHOPSHIELD_RECHECK_ACTIVE" });
  await renderVerdict();
});

document.getElementById("dashboard").addEventListener("click", () => {
  chrome.tabs.create({ url: `${APP_URL}/dashboard` });
});

document.getElementById("signout").addEventListener("click", async () => {
  await signOut();
  await render();
});

void render();
