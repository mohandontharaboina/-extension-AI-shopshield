import { signIn, signOut, getValidSession } from "./auth.js";
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
  const status = await chrome.runtime.sendMessage({ type: "SHOPSHIELD_GET_ACTIVE_SCAN" }).catch(() => null);
  const report = document.getElementById("report");
  report.hidden = true;
  if (!status || status.status === "unsupported") {
    verdict.className = "verdict";
    verdict.textContent = "No supported website is open in this tab.";
    return;
  }
  if (status.status === "signed-out") {
    verdict.className = "verdict";
    verdict.textContent = "Sign in to scan and save this website.";
    return;
  }
  if (status.status === "analyzing") {
    verdict.className = "verdict";
    verdict.textContent = `Analyzing ${new URL(status.url).hostname}…`;
    window.setTimeout(() => void renderVerdict(), 900);
    return;
  }
  if (status.status === "failed") {
    verdict.className = "verdict high";
    verdict.textContent = `Scan failed: ${status.error || "Please try again."}`;
    return;
  }
  if (status.status === "complete" && status.analysis) {
    const analysis = status.analysis;
    verdict.className =
      "verdict " +
      (analysis.classification === "SAFE" ? "safe" : analysis.classification === "SUSPICIOUS" ? "warn" : "high");
    verdict.textContent = `${analysis.domain} — ${analysis.classification} (risk ${analysis.riskScore}/100) · ${analysis.httpsEnabled ? "HTTPS" : "No HTTPS"}`;
    report.hidden = false;
    report.dataset.scanId = status.scanId;
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

document.getElementById("report").addEventListener("click", (event) => {
  const scanId = event.currentTarget.dataset.scanId;
  chrome.runtime.sendMessage({ type: "SHOPSHIELD_OPEN_DETAILS", scanId }, () => void chrome.runtime.lastError);
});

document.getElementById("signout").addEventListener("click", async () => {
  await signOut();
  await render();
});

void render();
