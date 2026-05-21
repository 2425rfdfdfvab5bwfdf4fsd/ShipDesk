import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
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
  (res) => res,
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
