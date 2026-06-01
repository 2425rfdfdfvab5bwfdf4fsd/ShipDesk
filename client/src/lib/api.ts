import axios from "axios";

// All hooks already include /api/ in their paths (e.g. "/api/projects").
// In dev the Vite proxy intercepts /api/* and forwards to localhost:3000, so
// baseURL must be "" — adding "/api" here doubles the prefix → /api/api/...
// In production, VITE_API_BASE_URL is the backend host with NO trailing slash
// and NO /api suffix (e.g. "https://backend.railway.app"). Axios then combines
// it with the hook path: "https://backend.railway.app" + "/api/projects" ✓
function normalizeBaseUrl(url: string): string {
  if (!url) return "";
  const trimmed = url.replace(/\/$/, "");
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}

const SESSION_KEY = "shipdesk_client_session_token";

export function storeClientSessionToken(token: string) {
  try { sessionStorage.setItem(SESSION_KEY, token); } catch { /* ignore */ }
}

export function clearClientSessionToken() {
  try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
}

function getClientSessionToken(): string | null {
  try { return sessionStorage.getItem(SESSION_KEY); } catch { return null; }
}

// Module-level reference to Clerk's getToken function.
// Registered by TokenSync before any routes render; the interceptor awaits it
// directly so every request always carries a fresh, valid JWT regardless of
// when the component tree mounts.
let _getToken: (() => Promise<string | null>) | null = null;

export function registerTokenGetter(fn: (() => Promise<string | null>) | null) {
  _getToken = fn;
}

// Kept for backward compat — still used by AdminPage to warm the cache.
export function setApiToken(token: string) {
  (window as { __clerkToken?: string }).__clerkToken = token;
}

export const api = axios.create({
  baseURL: import.meta.env.PROD
    ? normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL ?? "")
    : "",
  withCredentials: true,
});

api.interceptors.request.use(async (config) => {
  if (typeof window !== "undefined") {
    let token: string | null = null;

    if (_getToken) {
      // Preferred path: call getToken() directly — Clerk serves from its
      // internal cache (fast) and auto-refreshes when the JWT nears expiry.
      token = await _getToken();
    }

    // Fallback: use the cached value written by setApiToken (AdminPage path)
    if (!token) {
      token = (window as { __clerkToken?: string }).__clerkToken ?? null;
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // Keep the cache warm for non-interceptor consumers
      (window as { __clerkToken?: string }).__clerkToken = token;
    }

    const sessionToken = getClientSessionToken();
    if (sessionToken) {
      config.headers["X-Client-Session-Token"] = sessionToken;
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => {
    const contentType = (res.headers["content-type"] as string) || "";
    if (contentType.includes("text/html")) {
      return Promise.reject(
        new Error("API unreachable — set VITE_API_BASE_URL to your backend URL")
      );
    }
    return res;
  },
  (err) => {
    if (err.response?.status === 401) {
      const errorCode = err.response?.data?.error;
      const isPortalRoute = err.config?.url?.includes("/api/portal/");
      // Only redirect dev users to sign-in on session expiry, never portal clients
      if (errorCode === "SESSION_EXPIRED" && !isPortalRoute) {
        window.location.href = "/?session=expired";
      }
    }
    return Promise.reject(err);
  }
);
