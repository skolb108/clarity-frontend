// src/track.js — fire analytics events, silent fail
const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://clarity-backend-production-108.up.railway.app";

export function track(name) {
  try {
    fetch(`${API_URL}/api/event`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ name }),
    }).catch(() => {});
  } catch (_) {}
}
