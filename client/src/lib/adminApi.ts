import axios from "axios";

const ADMIN_KEY_STORAGE = "shipdesk_admin_key";

export function getAdminKey(): string | null {
  try { return sessionStorage.getItem(ADMIN_KEY_STORAGE); } catch { return null; }
}

export function setAdminKey(key: string) {
  try { sessionStorage.setItem(ADMIN_KEY_STORAGE, key); } catch { /* ignore */ }
}

export function clearAdminKey() {
  try { sessionStorage.removeItem(ADMIN_KEY_STORAGE); } catch { /* ignore */ }
}

function normalizeBaseUrl(url: string): string {
  if (!url) return "";
  const trimmed = url.replace(/\/$/, "");
  return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
}

export const adminApi = axios.create({
  baseURL: import.meta.env.PROD
    ? normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL ?? "")
    : "",
});

adminApi.interceptors.request.use((config) => {
  const key = getAdminKey();
  if (key) config.headers["X-Admin-Key"] = key;
  return config;
});
