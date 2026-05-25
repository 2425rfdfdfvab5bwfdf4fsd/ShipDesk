import axios, { AxiosError } from "axios";

let _tokenGetter: (() => Promise<string | null>) | null = null;

export function setAdminTokenGetter(fn: () => Promise<string | null>) {
  _tokenGetter = fn;
}

function normalizeBaseUrl(url: string): string {
  if (!url) return "";
  const trimmed = url.replace(/\/$/, "");
  return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
}

const resolvedBaseUrl = import.meta.env.PROD
  ? normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL ?? "")
  : "";

if (import.meta.env.PROD && !resolvedBaseUrl) {
  console.error("[adminApi] VITE_API_BASE_URL is not set — API calls will fail. Redeploy after adding the variable to Vercel.");
}

export const adminApi = axios.create({
  baseURL: resolvedBaseUrl,
});

adminApi.interceptors.request.use(async (config) => {
  if (_tokenGetter) {
    const token = await _tokenGetter();
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    } else {
      console.warn("[adminApi] getToken() returned null — request will be sent without auth header.");
    }
  }
  return config;
});

adminApi.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    const status = err.response?.status;
    const data = err.response?.data as Record<string, unknown> | undefined;

    if (!err.response) {
      console.error("[adminApi] Network error or CORS block — could not reach", resolvedBaseUrl || "(same origin)");
    } else if (status === 401) {
      console.error("[adminApi] 401 Unauthorized — token missing, expired, or CLERK_SECRET_KEY mismatch on the server.");
    } else if (status === 403) {
      console.error("[adminApi] 403 Forbidden — signed-in user's email does not match ADMIN_EMAIL on the server. Error:", data?.error);
    } else {
      console.error(`[adminApi] ${status} error on ${err.config?.url}:`, data);
    }

    return Promise.reject(err);
  }
);

export function getAdminApiDiagnostics() {
  return {
    baseUrl: resolvedBaseUrl || "(empty — same origin)",
    isProd: import.meta.env.PROD,
    viteApiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "(not set)",
  };
}
