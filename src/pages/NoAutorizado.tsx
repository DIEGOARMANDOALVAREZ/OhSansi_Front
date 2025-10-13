// src/pages/NoAutorizado.tsx
export default function NoAutorizado() {
  return (
    <div className="min-h-screen grid place-items-center bg-slate-950 px-6">
      <div className="max-w-md rounded-3xl border border-white/10 bg-slate-900/70 backdrop-blur-xl p-8 text-center text-slate-200">
        <div className="mx-auto mb-4 h-12 w-12 grid place-items-center rounded-2xl bg-rose-500/20">
          <span className="text-rose-300 text-2xl">!</span>
        </div>
        <h1 className="text-xl font-bold mb-2">No autorizado</h1>
        <p className="text-slate-400">
          No tienes permisos para acceder a esta sección.
        </p>
      </div>
    </div>
  );
}
