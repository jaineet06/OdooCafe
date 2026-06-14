import axios from "axios";
import toast from "react-hot-toast";
import { STORAGE_KEYS } from "./constants.js";
import { getErrorMessage } from "./errors.js";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const kdsToken = localStorage.getItem(STORAGE_KEYS.KDS_TOKEN);
  const token = kdsToken || localStorage.getItem(STORAGE_KEYS.TOKEN);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let onUnauthorized = null;
let onSessionClosed = null;

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

export function setSessionClosedHandler(handler) {
  onSessionClosed = handler;
}

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;
    error.userMessage = getErrorMessage(error);

    if (status === 401 && onUnauthorized) {
      onUnauthorized();
    } else if (status === 409 && onSessionClosed && /session is closed/i.test(error.response?.data?.message || "")) {
      onSessionClosed();
    } else if (status === 403) {
      toast.error(error.userMessage || "You do not have permission for this action");
    } else if (!error.response) {
      toast.error("Network error — check your connection");
    }

    return Promise.reject(error);
  }
);

export function unwrap(response) {
  return response.data?.data ?? response.data;
}

export default api;
