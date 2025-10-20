import axios from "axios";
import { api } from "../api";

/** ===== Tipos base (alineados con AuthContextBase) ===== */
export type Rol = { id: string; slug: string; nombre: string };

export type Usuario = {
  id: string;
  nombres: string;
  apellidos: string;
  correo: string;
  roles: Rol[];
};

export type LoginResponse = {
  token?: string;
  user?: Usuario;
  message?: string;
};

/** ===== Tipos backend (responsable/evaluador) ===== */
export type PerfilResponsableResponse = {
  id: string | number;
  nombres: string;
  apellidos?: string;
  correo: string;
};
export type PerfilEvaluadorResponse = {
  id: string | number;
  nombres: string;
  apellidos?: string;
  correo: string;
};

/** ===== Constantes de storage ===== */
const TOKEN_KEY = "ohsansi_token";
const USER_KEY = "usuario";
const AUTH_KIND_KEY = "auth_kind"; // "admin" | "responsable" | "evaluador"

export type AuthKind = "admin" | "responsable" | "evaluador";

/** ===== Utils ===== */
const norm = (s?: string): string => String(s ?? "").trim();

function rolesNormalized(arr: unknown): Rol[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((raw) => {
    const r = raw as Partial<Rol>;
    const slug = norm(r.slug).toUpperCase();
    const id = norm((r.id as string) || slug || "ROLE");
    const nombre = norm((r.nombre as string) || slug);
    return { id, slug, nombre };
  });
}

function sanitizeUser(user: Usuario): Usuario {
  return {
    id: norm(user.id),
    nombres: user.nombres ?? "",
    apellidos: user.apellidos ?? "",
    correo: user.correo ?? "",
    roles: rolesNormalized(user.roles),
  };
}

function responsableToUsuario(payload: PerfilResponsableResponse): Usuario {
  return {
    id: String(payload.id),
    nombres: payload.nombres ?? "",
    apellidos: payload.apellidos ?? "",
    correo: payload.correo ?? "",
    roles: [{ id: "RESPONSABLE", slug: "RESPONSABLE", nombre: "Responsable Académico" }],
  };
}

function evaluadorToUsuario(payload: PerfilEvaluadorResponse): Usuario {
  return {
    id: String(payload.id),
    nombres: payload.nombres ?? "",
    apellidos: payload.apellidos ?? "",
    correo: payload.correo ?? "",
    roles: [{ id: "EVALUADOR", slug: "EVALUADOR", nombre: "Evaluador" }],
  };
}

/** Detecta el tipo de sesión según roles */
function detectAuthKind(u: Usuario): AuthKind {
  const slugs = (u.roles || []).map((r) => (r.slug || "").toUpperCase());
  if (slugs.includes("RESPONSABLE")) return "responsable";
  if (slugs.includes("EVALUADOR")) return "evaluador";
  return "admin"; // usuarios del sistema (ADMIN/otros) via Sanctum
}

/** ===== Storage helpers ===== */
export function setToken(token?: string): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    localStorage.removeItem(TOKEN_KEY);
    delete api.defaults.headers.common.Authorization;
  }
}

export function initAuthFromStorage(): void {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export function getAuthKind(): AuthKind | null {
  const k = localStorage.getItem(AUTH_KIND_KEY);
  return k === "admin" || k === "responsable" || k === "evaluador" ? k : null;
}

export function setAuthKind(kind?: AuthKind): void {
  if (kind) localStorage.setItem(AUTH_KIND_KEY, kind);
  else localStorage.removeItem(AUTH_KIND_KEY);
}

export function getStoredUser(): Usuario | null {
  const raw = localStorage.getItem(USER_KEY);
  try {
    return raw ? (JSON.parse(raw) as Usuario) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user?: Usuario | null): void {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
}

/** ===== Login (ÚNICO endpoint backend) =====
 * Backend:
 *  - Admin/Usuarios sistema: password normal (Sanctum)
 *  - Responsable: CI como "password" (genera token plano responsable)
 *  - Evaluador: (según backend) token emitido por Admin o CI si lo cambiaste.
 *    Igual recibes siempre { token, user } y aquí solo persistimos.
 */
export async function login(correo: string, passwordOrCI: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/auth/login", {
    correo: norm(correo),
    password: passwordOrCI,
    device: "web",
  });

  const token = data?.token;
  const userRaw = data?.user;
  if (!token || !userRaw) {
    throw new Error(data?.message ?? "No se recibió token o usuario del backend.");
  }

  // Normaliza usuario y detecta tipo de sesión
  const clean = sanitizeUser(userRaw);
  const kind = detectAuthKind(clean);

  // Persistir TODO antes de cualquier refresh
  setToken(token);
  setAuthKind(kind);
  setStoredUser(clean);

  return { token, user: clean, message: data.message };
}

/** ===== Perfil con fallback entre 3 rutas =====
 * /auth/perfil (Sanctum), /responsable/perfil (token plano), /evaluador/perfil (token plano)
 */
function isAxios401(err: unknown) {
  return axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 419);
}

export async function perfil(): Promise<Usuario> {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) throw new Error("No hay token");

  // Asegura header en este ciclo
  api.defaults.headers.common.Authorization = `Bearer ${token}`;

  const kind = getAuthKind();

  const getAdmin = async () => {
    const { data } = await api.get<Usuario>("/auth/perfil");
    return sanitizeUser(data);
  };
  const getResp = async () => {
    const { data } = await api.get<PerfilResponsableResponse>("/responsable/perfil");
    return responsableToUsuario(data);
  };
  const getEval = async () => {
    const { data } = await api.get<PerfilEvaluadorResponse>("/evaluador/perfil");
    return evaluadorToUsuario(data);
  };

  let me: Usuario;

  // Si ya sabemos el tipo, prioriza esa ruta; si falla 401, prueba las demás
  if (kind === "responsable") {
    try {
      me = await getResp();
    } catch (e1) {
      if (!isAxios401(e1)) throw e1;
      try {
        me = await getEval();
        setAuthKind("evaluador");
      } catch (e2) {
        if (!isAxios401(e2)) throw e2;
        me = await getAdmin();
        setAuthKind("admin");
      }
    }
  } else if (kind === "evaluador") {
    try {
      me = await getEval();
    } catch (e1) {
      if (!isAxios401(e1)) throw e1;
      try {
        me = await getResp();
        setAuthKind("responsable");
      } catch (e2) {
        if (!isAxios401(e2)) throw e2;
        me = await getAdmin();
        setAuthKind("admin");
      }
    }
  } else {
    // kind === "admin" o sin pista: intenta admin -> responsable -> evaluador
    try {
      me = await getAdmin();
      setAuthKind("admin");
    } catch (e1) {
      if (!isAxios401(e1)) throw e1;
      try {
        me = await getResp();
        setAuthKind("responsable");
      } catch (e2) {
        if (!isAxios401(e2)) throw e2;
        me = await getEval();
        setAuthKind("evaluador");
      }
    }
  }

  setStoredUser(me);
  return me;
}

/** ===== Logout ===== */
export async function logout(): Promise<void> {
  try {
    // Intenta cerrar sesión en backend (si falla, no bloquea)
    await api.post("/auth/logout");
  } catch {
    // no-op
  } finally {
    // Limpieza local SIEMPRE
    setToken(undefined);
    setStoredUser(null);
    setAuthKind(undefined);
  }
}
