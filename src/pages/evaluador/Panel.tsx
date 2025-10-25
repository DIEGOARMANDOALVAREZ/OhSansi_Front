import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function EvaluadorPanel() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const nombre =
    `${user?.nombres ?? ""} ${user?.apellidos ?? ""}`.trim() || "Evaluador";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 text-white">
      {/* 🔹 Barra superior de navegación */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-900/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="rounded-lg border border-white/10 bg-slate-800/70 p-2 text-slate-200 hover:bg-slate-700/70"
              title="Volver atrás"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M15 6l-6 6 6 6"
                  stroke="#22d3ee"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <Link
              to="/dashboard"
              className="rounded-lg border border-white/10 bg-slate-800/70 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700/70"
              title="Ir al dashboard"
            >
              Dashboard
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-300 truncate max-w-[150px]">
              Hola, <strong>{nombre}</strong>
            </span>
            <button
              onClick={() => void logout()}
              className="rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-rose-400"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      {/* 🔹 Contenido principal */}
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
        <h1 className="mb-6 text-xl font-bold">Panel del Evaluador</h1>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Ingresar notas */}
          <Link
            to="/evaluador/ingresar-notas"
            className="group rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-2xl transition hover:border-cyan-400/40 hover:bg-slate-900/80"
          >
            <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-cyan-500/20">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M9 17l-3-3 1.5-1.5L9 14l7.5-7.5L18 8"
                  stroke="#22d3ee"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h2 className="text-lg font-semibold">Ingresar notas y concepto</h2>
            <p className="mt-1 text-sm text-slate-300">
              Carga de notas (0.00–100.00), concepto y motivo si corresponde.
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-cyan-300">
              Abrir
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                className="translate-x-0 transition group-hover:translate-x-0.5"
              >
                <path
                  d="M5 12h14M13 5l7 7-7 7"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </Link>

          {/* Mis asignaciones */}
          <Link
            to="/evaluador/asignaciones"
            className="group rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-2xl transition hover:border-cyan-400/40 hover:bg-slate-900/80"
          >
            <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-cyan-500/20">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M3 6h18M6 10h12M6 14h12M3 18h18"
                  stroke="#22d3ee"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h2 className="text-lg font-semibold">Mis asignaciones</h2>
            <p className="mt-1 text-sm text-slate-300">
              Ver competidores asignados por área/nivel.
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-cyan-300">
              Abrir
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                className="translate-x-0 transition group-hover:translate-x-0.5"
              >
                <path
                  d="M5 12h14M13 5l7 7-7 7"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </Link>
        </div>
      </main>
    </div>
  );
}
