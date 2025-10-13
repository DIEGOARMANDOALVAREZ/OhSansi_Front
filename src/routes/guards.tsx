// src/routes/guards.tsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function Loader() {
  return (
    <div className="min-h-[40vh] grid place-items-center p-6">
      <div className="flex items-center gap-3 text-slate-300">
        <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse" />
        <span className="text-sm">Cargando…</span>
      </div>
    </div>
  );
}

export function RequireAuth() {
  const { loading, user } = useAuth();
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function RequireRole({ role }: { role: string }) {
  const { loading, user, hasRole } = useAuth();
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;
  if (!hasRole(role)) return <Navigate to="/no-autorizado" replace />;
  return <Outlet />;
}

export function RequireAnyRole({ roles }: { roles: string[] }) {
  const { loading, user, hasAnyRole } = useAuth();
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;
  if (!hasAnyRole(roles)) return <Navigate to="/no-autorizado" replace />;
  return <Outlet />;
}

/** Evita que un usuario logueado vea /login */
export function RedirectIfAuth({ to = "/dashboard" }: { to?: string }) {
  const { loading, user } = useAuth();
  if (loading) return <Loader />;
  if (user) return <Navigate to={to} replace />;
  return <Outlet />;
}
