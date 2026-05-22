import axios from "axios";

// All hooks already include /api/ in their paths (e.g. "/api/projects").
// In dev the Vite proxy intercepts /api/* and forwards to localhost:3000, so
// baseURL must be "" — adding "/api" here doubles the prefix → /api/api/...
// In production, VITE_API_BASE_URL is the backend host with NO trailing slash
// and NO /api suffix (e.g. "https://backend.railway.app"). Axios then combines
// it with the hook path: "https://backend.railway.app" + "/api/projects" ✓
export const api = axios.create({
  baseURL: import.meta.env.PROD
    ? (import.meta.env.VITE_API_BASE_URL ?? "")
    : "",
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
