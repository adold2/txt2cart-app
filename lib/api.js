// Thin client for the txt2cart-backend REST API mounted at /api/app (src/appApi.js).
// See src/appApi.js in the txt2cart-backend repo for the authoritative route shapes --
// this file should stay in sync with it.
//
// Auth: POST /auth/request-code {phone} sends a 6-digit SMS code (reuses the same Twilio
// number as the SMS/WhatsApp channel). POST /auth/verify {phone, code} exchanges it for a
// signed JWT (30-day TTL) that every other route requires as `Authorization: Bearer <token>`.

const API_BASE_URL = "https://txt2cart-backend.onrender.com/api/app";

let authToken = null;

export function setAuthToken(token) {
  authToken = token;
}

export function getAuthToken() {
  return authToken;
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth && authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  let res;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    throw new Error("Can't reach Txt2Cart right now. Check your connection and try again.");
  }

  const isCsv = res.headers.get("content-type")?.includes("text/csv");
  if (isCsv) {
    if (!res.ok) throw new Error(`request failed (${res.status})`);
    return res.text();
  }

  let data;
  try {
    data = await res.json();
  } catch (parseErr) {
    throw new Error(`Unexpected response (${res.status})`);
  }

  if (!res.ok) {
    throw new Error(data?.error || `request failed (${res.status})`);
  }
  return data;
}

export const api = {
  // --- Auth ---
  requestCode: (phone) =>
    request("/auth/request-code", { method: "POST", body: { phone }, auth: false }),
  verifyCode: (phone, code) =>
    request("/auth/verify", { method: "POST", body: { phone, code }, auth: false }),

  // --- Sessions (task #815: multi-session view) ---
  listSessions: () => request("/sessions"),
  getSession: (code) => request(`/sessions/${encodeURIComponent(code)}`),
  createSession: ({ menuKey, forDate, cutoff, note }) =>
    request("/sessions", { method: "POST", body: { menuKey, forDate, cutoff, note } }),
  submitOrder: (code, text) =>
    request(`/sessions/${encodeURIComponent(code)}/order`, {
      method: "POST",
      body: { text },
    }),

  // --- Menus (task #814: richer browsing than SMS "menu" text) ---
  listMenus: () => request("/menus"),
  getMenu: (key) => request(`/menus/${encodeURIComponent(key)}`),

  // --- Org spend export (task #835 follow-up) ---
  orgSpendCsvUrl: (orgId, days) =>
    `${API_BASE_URL}/orgs/${orgId}/spend.csv${days ? `?days=${days}` : ""}`,
};

export default api;
