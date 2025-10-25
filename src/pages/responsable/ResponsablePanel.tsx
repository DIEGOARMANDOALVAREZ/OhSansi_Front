// src/pages/responsable/ResponsablePanel.tsx
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { hasAnyRole } from "../../utils/roleRedirect";

export default function ResponsablePanel() {
  const { user, logout } = useAuth();

  const puedeVer = hasAnyRole(
    user,
    "RESPONSABLE",
    "RESPONSABLE_ACADEMICO",
    "ADMIN",
    "ADMINISTRADOR"
  );

  if (!puedeVer) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-950 text-slate-200 p-6">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-bold">Acceso restringido</h1>
          <p className="mt-2 text-sm text-slate-400">
            No cuentas con permisos para este módulo.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex mt-4 items-center justify-center rounded-xl border border-white/10 bg-slate-900/70 px-4 py-2 text-sm font-semibold text-slate-200 shadow hover:bg-slate-900/80"
          >
            Volver al panel principal
          </Link>
        </div>
      </div>
    );
  }

  const nombre = user?.nombres ?? "Responsable";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950">
      {/* Topbar */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-900/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-500/20">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 3l7 4v6c0 4-3 7-7 8-4-1-7-4-7-8V7l7-4z" stroke="#22d3ee" strokeWidth="1.5" />
                <path d="M9 12h6" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-white">OH SanSi</h1>
              <p className="text-xs text-slate-400">Panel de Responsable</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/dashboard"
              className="hidden md:inline-flex rounded-xl border border-white/10 bg-slate-800/60 px-3 py-2 text-xs font-medium text-slate-200 hover:border-cyan-400/40"
            >
              Panel principal
            </Link>
            <button
              onClick={() => void logout()}
              className="rounded-xl bg-rose-500 px-3 py-2 text-xs font-semibold text-white shadow hover:bg-rose-400"
              title="Cerrar sesión"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
        <section className="mb-6">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl shadow-2xl">
            <div className="pointer-events-none absolute -inset-1 -z-10 rounded-3xl bg-gradient-to-tr from-cyan-400 to-indigo-500 opacity-20 blur-2xl" />
            <h2 className="text-xl font-extrabold tracking-tight text-white md:text-2xl">
              Bienvenido(a), {nombre}
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              Acciones rápidas del Responsable académico.
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {/* Lista de competidores */}
          <Link
            to="/responsable/competidores"
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-2xl transition hover:border-cyan-400/40 hover:bg-slate-900/80"
          >
            <div className="pointer-events-none absolute -inset-1 -z-10 rounded-3xl bg-gradient-to-br from-cyan-400/20 to-indigo-500/20 opacity-50 blur-2xl transition group-hover:opacity-80" />
            <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-cyan-500/20">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M9 17l-3-3 1.5-1.5L9 14l7.5-7.5L18 8" stroke="#22d3ee" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">Lista de Competidores</h3>
            <p className="mt-1 text-sm text-slate-300">
              Filtra y exporta tus inscritos por área, nivel y unidad.
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-cyan-300">
              Abrir
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="translate-x-0 transition group-hover:translate-x-0.5">
                <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </span>
          </Link>

          {/* HU6: Generar lista de clasificados */}
          <Link
            to="/responsable/clasificados"
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-2xl transition hover:border-cyan-400/40 hover:bg-slate-900/80"
          >
            <div className="pointer-events-none absolute -inset-1 -z-10 rounded-3xl bg-gradient-to-br from-cyan-400/20 to-indigo-500/20 opacity-50 blur-2xl transition group-hover:opacity-80" />
            <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-cyan-500/20">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 12h16M12 4v16" stroke="#22d3ee" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">Generar lista de clasificados</h3>
            <p className="mt-1 text-sm text-slate-300">
              Calcula por área y nivel, revisa conteos y confirma con sello/hashing.
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-cyan-300">
              Abrir
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="translate-x-0 transition group-hover:translate-x-0.5">
                <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </span>
          </Link>

          {/* HU8: Log de cambios de notas */}
          <Link
            to="/responsable/log-notas"
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-2xl transition hover:border-cyan-400/40 hover:bg-slate-900/80"
          >
            <div className="pointer-events-none absolute -inset-1 -z-10 rounded-3xl bg-gradient-to-br from-cyan-400/20 to-indigo-500/20 opacity-50 blur-2xl transition group-hover:opacity-80" />
            <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-cyan-500/20">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M7 7h10M7 12h10M7 17h6" stroke="#22d3ee" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">Log de cambios de notas</h3>
            <p className="mt-1 text-sm text-slate-300">
              Audita modificaciones de notas por usuario, área, nivel y fechas.
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-cyan-300">
              Abrir
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="translate-x-0 transition group-hover:translate-x-0.5">
                <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </span>
          </Link>
        </section>
      </main>
    </div>
  );
}
