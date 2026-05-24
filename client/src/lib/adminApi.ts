import axios from "axios";

let _tokenGetter: (() => Promise<string | null>) | null = null;

export function setAdminTokenGetter(fn: () => Promise<string | null>) {
  _tokenGetter = fn;
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

adminApi.interceptors.request.use(async (config) => {
  if (_tokenGetter) {
    const token = await _tokenGetter();
    if (token) config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});
