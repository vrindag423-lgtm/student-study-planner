/* =========================================================
   API helper — centralizes all fetch calls to the backend
   ========================================================= */

const API_BASE = "http://localhost:5000/api";

const getToken = () => localStorage.getItem("sp_token");
const setToken = (token) => localStorage.setItem("sp_token", token);
const clearToken = () => localStorage.removeItem("sp_token");

const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("sp_user"));
  } catch {
    return null;
  }
};
const setUser = (user) => localStorage.setItem("sp_user", JSON.stringify(user));
const clearUser = () => localStorage.removeItem("sp_user");

/**
 * Generic request wrapper. Automatically attaches JWT and handles JSON.
 */
async function apiRequest(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };

  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    if (res.status === 401 && auth) {
      // token invalid/expired -> force logout
      clearToken();
      clearUser();
      if (!window.location.pathname.includes("index.html") && window.location.pathname !== "/") {
        window.location.href = "index.html";
      }
    }
    throw new Error(data.message || "Something went wrong. Please try again.");
  }

  return data;
}

const API = {
  // ---- Auth ----
  register: (payload) => apiRequest("/auth/register", { method: "POST", body: payload, auth: false }),
  login: (payload) => apiRequest("/auth/login", { method: "POST", body: payload, auth: false }),
  logout: () => apiRequest("/auth/logout", { method: "POST" }),
  me: () => apiRequest("/auth/me"),

  // ---- Tasks ----
  getTasks: (queryString = "") => apiRequest(`/tasks${queryString}`),
  getTask: (id) => apiRequest(`/tasks/${id}`),
  createTask: (payload) => apiRequest("/tasks", { method: "POST", body: payload }),
  updateTask: (id, payload) => apiRequest(`/tasks/${id}`, { method: "PUT", body: payload }),
  toggleComplete: (id) => apiRequest(`/tasks/${id}/complete`, { method: "PATCH" }),
  deleteTask: (id) => apiRequest(`/tasks/${id}`, { method: "DELETE" }),
  getStats: () => apiRequest("/tasks/stats"),
  getUpcoming: () => apiRequest("/tasks/upcoming"),
};

/** Redirect to login if no token present. Call at top of protected pages. */
function requireAuth() {
  if (!getToken()) {
    window.location.href = "index.html";
  }
}

/** Simple toast notification */
function showToast(message, type = "success") {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.className = `toast ${type === "error" ? "error" : ""}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}