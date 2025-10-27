
import { Link } from "react-router-dom";
import AdminResponsableForm from "../../pages/admin/responsables/Form";

export default function ResponsablesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 text-slate-100">
      {/* ===== TOPBAR ===== */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-900/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
          <div>
            <h1 className="text-lg font-bold text-white">
              ID:1 Registrar responsable académico por área
            </h1>
            <p className="text-xs text-slate-400">
              Cobertura UI: validaciones HTML5, unicidad por área/nivel (activo),
              control de rol y auditoría.
            </p>
          </div>

          <Link
            to="/admin/responsables"
            className="rounded-xl bg-cyan-600/80 px-3 py-1.5 text-sm font-semibold text-white shadow hover:bg-cyan-500 transition"
          >
            ← Volver a listado
          </Link>
        </div>
      </header>

      {/* ===== CONTENIDO PRINCIPAL ===== */}
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
        {/* === FORMULARIO === */}
        <section className="mb-8">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-2xl backdrop-blur-xl">
            {/* Fondo decorativo */}
            <div className="pointer-events-none absolute -inset-1 -z-10 rounded-3xl bg-gradient-to-tr from-cyan-400/20 to-indigo-500/20 opacity-30 blur-2xl" />

            <h2 className="text-xl font-bold text-white">Formulario</h2>
            <p className="mt-1 text-sm text-slate-300">
              Complete los datos del responsable. El sistema asegura un responsable{" "}
              <em>activo</em> por combinación área/nivel.
            </p>

            <div className="mt-5">
              <AdminResponsableForm />
            </div>
          </div>
        </section>

        {/* === CRITERIOS DE ACEPTACIÓN === */}
        <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 text-sm text-slate-300 shadow-lg backdrop-blur-xl">
          <h3 className="mb-3 text-white/90 font-semibold text-base">
            Criterios de aceptación (resumen)
          </h3>
          <ol className="list-decimal space-y-1 pl-6 leading-relaxed">
            <li>
              Campos y validaciones: nombres, apellidos, CI/ID, correo, teléfono,
              área y (si aplica) nivel.
            </li>
            <li>
              Un (1) responsable activo por área/nivel. El resto, rechazado con
              mensaje claro.
            </li>
            <li>Editar datos y cambiar estado sin perder historial.</li>
            <li>
              Registrar auditoría (usuario, fecha/hora, cambio realizado).
            </li>
            <li>
              Solo el <strong>Administrador</strong> puede crear/editar; otros roles
              solo lectura.
            </li>
            <li>
              Búsqueda y filtro por nombre/área/estado, con paginación (en la lista).
            </li>
          </ol>
        </section>
      </main>
    </div>
  );
}
