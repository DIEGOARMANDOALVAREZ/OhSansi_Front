import React from "react";
import { Link } from "react-router-dom";

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950">
      {/* Topbar */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-900/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
          <div>
            <h1 className="text-lg font-bold text-white">Panel de Administración</h1>
            <p className="text-xs text-slate-400">OH SanSi — Gestión institucional</p>
          </div>
          <Link
            to="/dashboard"
            className="rounded-xl bg-cyan-600/80 px-3 py-1.5 text-sm font-semibold text-white shadow hover:bg-cyan-500"
          >
            ← Volver al Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
        {/* Encabezado */}
        <section className="mb-8">
          <h2 className="text-2xl font-extrabold text-white mb-1">Administración general</h2>
          <p className="text-slate-400 text-sm">
            Gestiona usuarios, roles, responsables académicos, evaluadores y auditorías del sistema.
          </p>
        </section>

        {/* Tarjetas de módulos */}
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Responsables */}
          <Link
            to="/admin/responsables"
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-xl transition hover:border-cyan-400/40 hover:bg-slate-900/80"
          >
            <div className="pointer-events-none absolute -inset-1 -z-10 rounded-3xl bg-gradient-to-tr from-cyan-400/20 to-indigo-500/20 opacity-50 blur-2xl group-hover:opacity-80" />
            <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-cyan-500/20">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 12c2.5 0 4.5-2 4.5-4.5S14.5 3 12 3 7.5 5 7.5 7.5 9.5 12 12 12zM5 21v-1c0-2.5 3.5-4 7-4s7 1.5 7 4v1H5z" stroke="#22d3ee" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">Responsables académicos</h3>
            <p className="mt-1 text-sm text-slate-300">Registrar, editar y validar responsables por área o nivel.</p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-cyan-300">
              Entrar
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </span>
          </Link>

          {/* Evaluadores */}
          <Link
            to="/admin/evaluadores"
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-xl transition hover:border-cyan-400/40 hover:bg-slate-900/80"
          >
            <div className="pointer-events-none absolute -inset-1 -z-10 rounded-3xl bg-gradient-to-tr from-cyan-400/20 to-indigo-500/20 opacity-50 blur-2xl group-hover:opacity-80" />
            <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-cyan-500/20">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 12c2.5 0 4.5-2 4.5-4.5S14.5 3 12 3 7.5 5 7.5 7.5 9.5 12 12 12zM5 21v-1c0-2.5 3.5-4 7-4s7 1.5 7 4v1H5z" stroke="#22d3ee" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">Evaluadores</h3>
            <p className="mt-1 text-sm text-slate-300">Gestiona evaluadores y sus asignaciones a áreas y niveles.</p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-cyan-300">
              Entrar
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </span>
          </Link>

          {/* Importar inscritos (CSV) */}
          <Link
            to="/admin/importar-inscritos"
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-xl transition hover:border-cyan-400/40 hover:bg-slate-900/80"
          >
            <div className="pointer-events-none absolute -inset-1 -z-10 rounded-3xl bg-gradient-to-tr from-cyan-400/20 to-indigo-500/20 opacity-50 blur-2xl group-hover:opacity-80" />
            <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-cyan-500/20">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 4h16v4H4zM4 10h10v10H4zM16 14h4v6h-4z" stroke="#22d3ee" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">Importar inscritos (CSV)</h3>
            <p className="mt-1 text-sm text-slate-300">Carga masiva con validación y reporte de errores.</p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-cyan-300">
              Entrar
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </span>
          </Link>

          {/* Gestionar Inscritos */}
          <Link
            to="/admin/inscritos"
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-xl transition hover:border-cyan-400/40 hover:bg-slate-900/80"
          >
            <div className="pointer-events-none absolute -inset-1 -z-10 rounded-3xl bg-gradient-to-tr from-cyan-400/20 to-indigo-500/20 opacity-50 blur-2xl group-hover:opacity-80" />
            <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-cyan-500/20">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M3 5h18M5 5v14h14V5M12 10v6" stroke="#22d3ee" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">Gestión de Inscritos</h3>
            <p className="mt-1 text-sm text-slate-300">Visualiza y gestiona los inscritos registrados en el sistema.</p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-cyan-300">
              Entrar
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </span>
          </Link>
        </section>
      </main>
    </div>
  );
}
