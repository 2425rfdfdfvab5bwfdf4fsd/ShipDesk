import axios from "axios";

// In development the Vite dev-server proxy forwards /api → localhost:3000
// server-side, so we always use the relative path. VITE_API_BASE_URL is only
// meaningful in production builds (e.g. Vercel frontend → Railway backend).
export const api = axios.create({
  baseURL: import.meta.env.PROD
    ? import.meta.env.VITE_API_BASE_URL || "/api"
    : "/api",
  withCredentials: true,
});

api.interceptors.request.use(async (config) => {
  if (typeof window !== "undefined") {
    const clerkToken = (window as { __clerkToken?: string }).__clerkToken;
    if (clerkToken) {
      config.headers.Authorization = `Bearer ${clerkToken}`;
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
      if (errorCode === "SESSION_EXPIRED") {
        window.location.href = "/?session=expired";
      }
    }
    return Promise.reject(err);
  }
);

export function setApiToken(token: string) {
  (window as { __clerkToken?: string }).__clerkToken = token;
}
