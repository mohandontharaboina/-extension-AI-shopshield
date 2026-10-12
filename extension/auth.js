import { APP_URL, SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

const STORAGE_KEY = "shopshield_session";

async function readSession() {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  return stored[STORAGE_KEY] ?? null;
}

async function writeSession(session) {
  if (!session) {
    await chrome.storage.local.remove(STORAGE_KEY);
    return null;
  }
  const value = {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at ?? Math.floor(Date.now() / 1000) + (session.expires_in ?? 3600),
    user: session.user ?? null,
  };
  await chrome.storage.local.set({ [STORAGE_KEY]: value });
  return value;
}

export async function signIn(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error_description || body.msg || body.message || "Sign in failed");
  return writeSession(body);
}

export async function signOut() {
  await writeSession(null);
}

async function refresh(session) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: session.refresh_token }),
  });
  if (!res.ok) {
    await writeSession(null);
    return null;
  }
  return writeSession(await res.json());
}

/** Returns a valid session, refreshing it when it is close to expiry. */
export async function getValidSession() {
  const session = await readSession();
  if (!session) return null;
  const now = Math.floor(Date.now() / 1000);
  if (session.expires_at - now < 120) return refresh(session);
  return session;
}

export async function apiScan(url) {
  const session = await getValidSession();
  if (!session) throw new Error("Not signed in");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(`${APP_URL}/api/public/website-scan`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url, source: "automatic_extension" }),
      signal: controller.signal,
    });
    const body = await res.json().catch(() => null);
    if (res.status === 401) {
      await writeSession(null);
      throw new Error("Your session expired. Sign in again to save scans.");
    }
    if (!res.ok || !body?.scan) throw new Error(body?.error || "The scan could not be completed.");
    return body.scan;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("The scan timed out. Check your connection and try again.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
