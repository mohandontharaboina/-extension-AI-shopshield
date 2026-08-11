import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

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

export async function apiInsert(table, rows) {
  const session = await getValidSession();
  if (!session) throw new Error("Not signed in");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(rows),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.message || "Request failed");
  return body;
}
