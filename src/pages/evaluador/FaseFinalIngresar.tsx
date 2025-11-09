import { useEffect, useState } from "react";
import { listarFinalAsignadas, guardarFinal, finalizarFinal, type AsignadaFinal, type Page } from "../../services/faseFinal";
import EvaluadorShell from "../../components/EvaluadorShell"; // si no lo tienes, usa tu shell genérico
// Validación 0–100 con 2 decimales
const clampGrade = (v: string) => {
  const n = Math.max(0, Math.min(100, Number((v || "0").replace(",", "."))));
  return Math.round(n * 100) / 100;
};

export default function FaseFinalIngresar() {
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<Page<AsignadaFinal> | null>(null);
  const [editing, setEditing] = useState<number | null>(null); // finalista_id
  const [nota, setNota] = useState<string>("");
  const [notas, setNotas] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);

  async function load(p=1) {
    setLoading(true);
    try {
      const data = await listarFinalAsignadas(p);
      setList(data);
      setPage(data.current_page);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(1); }, []);

  function beginEdit(f: AsignadaFinal) {
    setEditing(f.id);
    setNota(String(f.nota_final ?? ""));
    setNotas(f.notas ?? {});
  }

  async function doSave() {
    if (editing == null) return;
    const n = clampGrade(nota);
    if (isNaN(n)) return alert("Nota inválida.");
    setSaving(true);
    try {
      await guardarFinal(editing, { nota_final: n, notas, concepto: "CALIFICADO" });
      alert("Guardado.");
      await load(page);
    } catch {
      alert("No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  async function doFinalize(fid: number) {
    if (!confirm("¿Finalizar este registro? Luego solo el responsable puede reabrirlo.")) return;
    try {
      await finalizarFinal(fid);
      alert("Finalizado.");
      await load(page);
      setEditing(null);
    } catch {
      alert("No se pudo finalizar.");
    }
  }

  return (
    <EvaluadorShell title="Fase final — Ingreso de notas" backTo="/evaluador">
      <div className="rounded-3xl bg-white p-4 md:p-6 text-slate-900">
        <div className="rounded-2xl border overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left">Inscrito</th>
                <th className="px-3 py-2 text-left">Área</th>
                <th className="px-3 py-2 text-left">Nivel</th>
                <th className="px-3 py-2 text-left">Estado</th>
                <th className="px-3 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-3 py-6 text-center text-slate-500">Cargando…</td></tr>
              ) : list?.data?.length ? list.data.map((f) => {
                const nom = f.inscrito ? `${f.inscrito.apellidos}, ${f.inscrito.nombres}` : "—";
                return (
                  <tr key={f.id} className="border-t">
                    <td className="px-3 py-2">{nom}</td>
                    <td className="px-3 py-2">{f.area_id ?? "—"}</td>
                    <td className="px-3 py-2">{f.nivel_id ?? "—"}</td>
                    <td className="px-3 py-2">{f.estado}</td>
                    <td className="px-3 py-2 text-right space-x-2">
                      {f.estado === "FINALIZADA" ? (
                        <span className="text-emerald-600 font-medium">Finalizada</span>
                      ) : (
                        <button className="rounded-lg border px-3 py-1" onClick={() => beginEdit(f)}>
                          Editar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={5} className="px-3 py-6 text-center text-slate-500">Sin asignaciones.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-3 flex items-center justify-between text-sm">
          <div>Total: {list?.total ?? 0}</div>
          <div className="space-x-2">
            <button className="btn" disabled={!list || list.current_page <= 1} onClick={() => void load((list?.current_page ?? 2) - 1)}>Anterior</button>
            <span>Página {list?.current_page ?? 1} de {list?.last_page ?? 1}</span>
            <button className="btn" disabled={!list || list.current_page >= (list?.last_page ?? 1)} onClick={() => void load((list?.current_page ?? 0) + 1)}>Siguiente</button>
          </div>
        </div>
      </div>

      {/* Editor simple */}
      {editing != null && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white p-5 text-slate-900 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Editar nota final</h3>
              <button onClick={() => setEditing(null)}>✕</button>
            </div>
            <div className="space-y-3">
              <label className="block text-sm">
                Nota final (0–100)
                <input
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  value={nota}
                  inputMode="decimal"
                  onChange={(e)=>setNota(e.target.value)}
                  placeholder="ej. 87.50"
                />
              </label>

              {/* Si necesitas campos de rúbrica, puedes manejarlo con un JSON editable */}
              {/* <label className="block text-sm">... </label> */}

              <div className="flex items-center justify-between">
                <button className="rounded-lg border px-4 py-2" disabled={saving} onClick={doSave}>
                  {saving ? "Guardando…" : "Guardar"}
                </button>
                <button className="rounded-lg bg-slate-900 text-white px-4 py-2" onClick={() => void doFinalize(editing)}>
                  Finalizar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </EvaluadorShell>
  );
}
