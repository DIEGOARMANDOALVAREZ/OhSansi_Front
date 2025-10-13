// src/api.ts
import axios from "axios";

/**
 * ======================================================
 * Axios para OhSansi (blindado para API JSON)
 * ======================================================
 * - baseURL: VITE_API_URL o '/api'
 * - Siempre Accept: application/json
 * - Bearer token desde localStorage en cada request
 * - Manejo de 401/403/419 y respuestas HTML (redir a /login del SPA)
 */

const baseURL = import.meta.env.VITE_API_URL || "/api";

export const api = axios.create({
  baseURL,
  withCredentials: false, // usamos Bearer token (no cookies)
  headers: {
    // Fuerza JSON para evitar redirecciones al login web
    Accept: "application/json",
  },
});

// ====== helpers token ======
const TOKEN_KEY = "ohsansi_token";
const USER_KEY = "usuario";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token?: string) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    localStorage.removeItem(TOKEN_KEY);
    delete api.defaults.headers.common.Authorization;
  }
}

// Cargar token al iniciar (si existe)
const saved = getToken();
if (saved) {
  api.defaults.headers.common.Authorization = `Bearer ${saved}`;
}

// ====== Interceptor de REQUEST ======
// Garantiza que SIEMPRE viaje el token más reciente y el JSON correcto
api.interceptors.request.use((config) => {
  // Asegura Accept JSON
  if (!config.headers) config.headers = new axios.AxiosHeaders();
  config.headers.Accept = "application/json";

  // Content-Type por defecto para POST/PUT/PATCH con JSON
  if (["post", "put", "patch"].includes((config.method || "").toLowerCase())) {
    if (!("Content-Type" in config.headers)) {
      config.headers["Content-Type"] = "application/json";
    }
  }

  // Relee el token por si cambió en otra pestaña
  const t = getToken();
  if (t) {
    config.headers.Authorization = `Bearer ${t}`;
  } else {
    delete config.headers.Authorization;
  }

  return config;
});

// ====== Interceptor de RESPONSE ======
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const res = error?.response;
    const status = res?.status;
    console.error("API ERROR", {
      url: error?.config?.url,
      method: error?.config?.method,
      status: error?.response?.status,
      headers: error?.response?.headers,
      data: error?.response?.data,
    });

    // Caso: backend respondió HTML (redirigido a /login), tratar como 401
    const isHtml =
      typeof res?.data === "string" &&
      (res.data.includes("<!DOCTYPE html") ||
        res.data.toLowerCase().includes("<html") ||
        res.data.includes("Unauthorized."));

    if (status === 401 || status === 403 || status === 419 || isHtml) {
      // Limpiar sesión local
      setToken(undefined);
      localStorage.removeItem(USER_KEY);

      // Redirigir al login del SPA (NO al /login del backend)
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export { baseURL };
