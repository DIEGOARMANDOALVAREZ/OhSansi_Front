import React, { useCallback, useEffect, useState } from "react";
import { AuthContext, type Usuario } from "./AuthContextBase";
import { perfil, logout as svcLogout } from "../services/auth";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  const hasRole = (slug: string) => !!user?.roles?.some(r => r.slug === slug);
  const hasAnyRole = (slugs: string[]) => !!user?.roles?.some(r => slugs.includes(r.slug));

  const refresh = useCallback(async () => {
    const token = localStorage.getItem("ohsansi_token");
    if (!token) { setUser(null); return; } // no llames perfil sin token
    try {
      const me = await perfil();
      setUser(me);
    } catch {
      setUser(null);
    }
  }, []);

  const logout = useCallback(async () => {
    await svcLogout(); // limpia token/storage en el servicio
    setUser(null);
  }, []);

  useEffect(() => {
    const cached = localStorage.getItem("usuario");
    if (cached) { try { setUser(JSON.parse(cached)); } catch { /* ignore parse error */ } }
    (async () => {
      setLoading(true);
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  return (
    <AuthContext.Provider value={{ user, loading, refresh, logout, hasRole, hasAnyRole }}>
      {children}
    </AuthContext.Provider>
  );
}
