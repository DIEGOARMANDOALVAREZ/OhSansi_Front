import { createContext } from "react";

export type Rol = { id: string; nombre: string; slug: string };
export type Usuario = {
  id: string;
  nombres: string;
  apellidos: string;
  correo: string;
  roles: Rol[];
};

export type Ctx = {
  user: Usuario | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (slug: string) => boolean;
  hasAnyRole: (slugs: string[]) => boolean;
};

// Solo contexto y tipos (no componentes, no hooks)
export const AuthContext = createContext<Ctx | null>(null);
