// src/routes/guards.tsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

/** Loader visual para estados de carga */
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

/** Protege rutas que requieren sesión iniciada */
export function RequireAuth() {
  const { loading, user } = useAuth();

  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
}

/** Protege rutas que requieren un rol exacto (slug en mayúsculas) */
export function RequireRole({ role }: { role: string }) {
  const { loading, user, hasRole } = useAuth();

  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;

  const normalized = role.trim().toUpperCase();
  const match = hasRole(normalized);

  if (!match) return <Navigate to="/no-autorizado" replace />;

  return <Outlet />;
}

/** Protege rutas que aceptan varios roles */
export function RequireAnyRole({ roles }: { roles: string[] }) {
  const { loading, user, hasAnyRole } = useAuth();

  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;

  const normalized = roles.map((r) => r.trim().toUpperCase());
  const allowed = hasAnyRole(normalized);

  if (!allowed) return <Navigate to="/no-autorizado" replace />;

  return <Outlet />;
}

/** Evita que un usuario autenticado acceda al login */
export function RedirectIfAuth({ to = "/dashboard" }: { to?: string }) {
  const { loading, user } = useAuth();

  if (loading) return <Loader />;
  if (user) return <Navigate to={to} replace />;

  return <Outlet />;
}

/** Página genérica para accesos no autorizados (por si la quieres montar como ruta suelta) */
export function NoAutorizado() {
  return (
    <div className="min-h-screen grid place-items-center bg-slate-950 text-center p-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Acceso no autorizado</h1>
        <p className="text-slate-400 mb-6">
          No tienes permisos suficientes para acceder a esta sección.
        </p>
        <a
          href="/dashboard"
          className="rounded-xl bg-cyan-500 px-4 py-2 text-slate-900 font-semibold shadow hover:bg-cyan-400"
        >
          Volver al panel
        </a>
      </div>
    </div>
  );
}
