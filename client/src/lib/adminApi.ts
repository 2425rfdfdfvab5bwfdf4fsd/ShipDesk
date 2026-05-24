import axios from "axios";

const ADMIN_KEY_STORAGE = "shipdesk_admin_key";
const ADMIN_EMAIL_STORAGE = "shipdesk_admin_email";

export function getAdminKey(): string | null {
  try { return sessionStorage.getItem(ADMIN_KEY_STORAGE); } catch { return null; }
}
export function getAdminEmail(): string | null {
  try { return sessionStorage.getItem(ADMIN_EMAIL_STORAGE); } catch { return null; }
}
export function setAdminCredentials(key: string, email: string) {
  try {
    sessionStorage.setItem(ADMIN_KEY_STORAGE, key);
    sessionStorage.setItem(ADMIN_EMAIL_STORAGE, email);
  } catch { /* ignore */ }
}
export function clearAdminCredentials() {
  try {
    sessionStorage.removeItem(ADMIN_KEY_STORAGE);
    sessionStorage.removeItem(ADMIN_EMAIL_STORAGE);
  } catch { /* ignore */ }
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
  const email = getAdminEmail();
  if (key) config.headers["X-Admin-Key"] = key;
  if (email) config.headers["X-Admin-Email"] = email;
  return config;
});
