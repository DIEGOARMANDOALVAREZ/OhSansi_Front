import React, { useCallback, useEffect, useState } from "react";
import { AuthContext, type Usuario } from "./AuthContextBase";
import {
  perfil,
  logout as svcLogout,
  initAuthFromStorage,
  getAuthKind,
} from "../services/auth";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  const hasRole = (slug: string) =>
    !!user?.roles?.some((r) => r.slug.toUpperCase() === slug.toUpperCase());

  const hasAnyRole = (slugs: string[]) => {
    const set = new Set(slugs.map((s) => s.toUpperCase()));
    return !!user?.roles?.some((r) => set.has(r.slug.toUpperCase()));
  };

  const refresh = useCallback(async () => {
    const token = localStorage.getItem("ohsansi_token");
    const kind = getAuthKind(); // "admin" | "responsable" | null

    if (!token || !kind) {
      setUser(null);
      return;
    }

    try {
      const me = await perfil(); // decide /auth/perfil vs /responsable/perfil
      setUser(me);
      localStorage.setItem("usuario", JSON.stringify(me));
    } catch {
      setUser(null);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await svcLogout();
    } finally {
      setUser(null);
      localStorage.removeItem("usuario");
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      initAuthFromStorage();

      const token = localStorage.getItem("ohsansi_token");
      const kind = getAuthKind();

      // Solo hidratar si hay token y tipo de sesión
      if (token && kind) {
        const cached = localStorage.getItem("usuario");
        if (cached) {
          try {
            setUser(JSON.parse(cached) as Usuario);
          } catch {
            localStorage.removeItem("usuario");
          }
        }

        // Verifica con backend
        await refresh();
      } else {
        // Sin token → limpiar por completo
        localStorage.removeItem("usuario");
        setUser(null);
      }

      setLoading(false);
    })();
  }, [refresh]);

  return (
    <AuthContext.Provider
      value={{ user, loading, refresh, logout, hasRole, hasAnyRole }}
    >
      {children}
    </AuthContext.Provider>
  );
}
