// src/api.ts
import axios, { AxiosError, AxiosHeaders } from "axios";

/**
 * Axios para OhSansi (API JSON con Bearer)
 * - baseURL: VITE_API_URL o '/api'
 * - Siempre Accept: application/json
 * - Bearer token desde localStorage en cada request
 * - Manejo de 401/403/419 y respuestas HTML (redir a /login del SPA)
 * - Patch: NO patear al login por errores de /responsable/fase-final/*
 */

export const baseURL = import.meta.env.VITE_API_URL || "/api";

export const api = axios.create({
  baseURL,
  withCredentials: false,
  headers: {
    Accept: "application/json",
  },
});

// ====== Claves de storage ======
const TOKEN_KEY = "ohsansi_token";
const USER_KEY = "usuario";
const AUTH_KIND_KEY = "auth_kind"; // "admin" | "responsable" | "evaluador"

// ====== Helpers token ======
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token?: string): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    localStorage.removeItem(TOKEN_KEY);
    delete api.defaults.headers.common.Authorization;
  }
}

/** Limpia toda la sesión local (token, usuario y tipo de sesión) */
function hardClearSession(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(AUTH_KIND_KEY);
    delete api.defaults.headers.common.Authorization;
  } catch {
    // no-op
  }
}

// Cargar token al iniciar (si existe)
const saved = getToken();
if (saved) {
  api.defaults.headers.common.Authorization = `Bearer ${saved}`;
}

// ====== Interceptor de REQUEST ======
api.interceptors.request.use((config) => {
  const headers =
    config.headers instanceof AxiosHeaders
      ? config.headers
      : new AxiosHeaders(config.headers);

  // Token
  const token = getToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  } else {
    headers.delete("Authorization");
  }

  // Accept
  headers.set("Accept", "application/json");

  // Content-Type (solo si no es FormData)
  const isFormData =
    config.data &&
    typeof FormData !== "undefined" &&
    config.data instanceof FormData;

  if (!isFormData) {
    const method = (config.method || "").toLowerCase();
    if (["post", "put", "patch"].includes(method) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
  }

  config.headers = headers;
  return config;
});

// ====== Interceptor de RESPONSE ======
type ValidationErrors = Record<string, string[]>;
type ValidationErrorShape = {
  status: 422;
  message?: string;
  errors?: ValidationErrors;
};

// ✅ Rutas seguras que NO deben patear la sesión si dan 401/403/419
const SAFE_NO_LOGOUT_REGEX = /^\/responsable\/fase-final\//; // <— SOLO FASE FINAL

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    const res = error?.response;
    const status = res?.status;
    const reqUrl = String(error?.config?.url || "");

    // Log útil para depurar
    console.error("API ERROR", {
      url: error?.config?.url,
      method: error?.config?.method,
      status: res?.status,
      headers: res?.headers,
      data: res?.data,
    });

    if (!res) return Promise.reject(error);

    // 🚫 Evitar limpiar sesión en rutas de autenticación (handshake)
    const isHandshake =
      /\/auth\/login$/.test(reqUrl) ||
      /\/auth\/perfil$/.test(reqUrl) ||
      /\/responsable\/perfil$/.test(reqUrl) ||
      /\/evaluador\/perfil$/.test(reqUrl);

    // 🚫 Evitar patear si el error proviene de Fase Final (solo este módulo)
    const isSafeNoLogout = SAFE_NO_LOGOUT_REGEX.test(reqUrl);

    // HTML/Unauthorized → limpiar sesión (excepto en rutas seguras o handshake)
    const data = res.data as unknown;
    const isHtml =
      typeof data === "string" &&
      (data.toLowerCase().includes("<!doctype html") ||
        data.toLowerCase().includes("<html") ||
        data.includes("Unauthorized."));

    if ((status === 401 || status === 403 || status === 419 || isHtml) && !isHandshake && !isSafeNoLogout) {
      hardClearSession();
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    // 🎯 Si es 422, devolvemos un objeto tipado
    if (status === 422) {
      const payload = res.data as { message?: string; errors?: ValidationErrors } | undefined;
      const vErr: ValidationErrorShape = {
        status: 422,
        message: payload?.message,
        errors: payload?.errors,
      };
      return Promise.reject(vErr);
    }

    return Promise.reject(error);
  }
);
