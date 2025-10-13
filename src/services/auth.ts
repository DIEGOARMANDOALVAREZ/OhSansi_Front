// src/services/auth.ts
import { api, setToken } from "../api";

export type Rol = { id: string; nombre: string; slug: string };
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

export async function login(correo: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/auth/login", {
    correo,
    password,
    device: "web",
  });

  if (data?.token) setToken(data.token);
  if (data?.user) localStorage.setItem("usuario", JSON.stringify(data.user));
  return data;
}

export async function perfil(): Promise<Usuario> {
  const { data } = await api.get<Usuario>("/auth/perfil");
  localStorage.setItem("usuario", JSON.stringify(data));
  return data;
}

/**
 * Logout 100% local: limpia token y cache sin llamar al backend.
 * Esto evita cualquier 401 en consola al cerrar sesión.
 */
export async function logout(): Promise<void> {
  setToken(undefined);
  localStorage.removeItem("usuario");
}
