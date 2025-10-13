import React from "react";
import { Link } from "react-router-dom";

type Props = {
  title: string;
  subtitle?: string;
  backTo?: string;        // ruta “volver”
  actions?: React.ReactNode; // botones extra a la derecha del título (ej. “Nuevo”)
  children: React.ReactNode;
};

export default function AdminShell({ title, subtitle, backTo = "/dashboard", actions, children }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-900/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
          <div>
            <h1 className="text-lg font-bold text-white">{title}</h1>
            {subtitle ? <p className="text-xs text-slate-400">{subtitle}</p> : null}
          </div>
          <Link
            to={backTo}
            className="rounded-xl bg-cyan-600/80 px-3 py-1.5 text-sm font-semibold text-white shadow hover:bg-cyan-500"
          >
            ← Volver
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
        {actions ? (
          <div className="mb-4 flex items-center justify-between">
            <div />
            <div className="flex gap-2">{actions}</div>
          </div>
        ) : null}
        {children}
      </main>
    </div>
  );
}
