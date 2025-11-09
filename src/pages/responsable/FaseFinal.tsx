// src/pages/responsable/FaseFinal.tsx
import { useEffect, useMemo, useState } from "react";
import AdminShell from "../../components/AdminShell";
import {
  listarFinalistas,
  listarSnapshots,
  promoverPorFiltro,
  type FinalistaRow,
  type Page,
  type SnapshotRow,
} from "../../services/faseFinal";
import {
  getOpcionesFiltros,
  type OpcionCatalogo, // <- usamos este tipo
} from "../../services/clasificacion";

type Tab = "finalistas" | "snapshots";

export default function FaseFinal() {
  // ⬇⬇ Reemplazo: ya no usamos fetchAreas/fetchNiveles (Sanctum)
  const [areas, setAreas] = useState<OpcionCatalogo[]>([]);
  const [niveles, setNiveles] = useState<OpcionCatalogo[]>([]);

  const [areaId, setAreaId] = useState<string>("");
  const [nivelId, setNivelId] = useState<string>("");

  const [tab, setTab] = useState<Tab>("finalistas");
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);

  const [finalistas, setFinalistas] = useState<Page<FinalistaRow> | null>(null);
  const [snapshots, setSnapshots] = useState<Page<SnapshotRow> | null>(null);

  // Catálogos seguros (AuthResponsable)
  useEffect(() => {
    let on = true;
    (async () => {
      try {
        const { areas, niveles } = await getOpcionesFiltros();
        if (!on) return;
        setAreas(areas);
        setNiveles(niveles);
      } catch {
        if (!on) return;
        setAreas([]);
        setNiveles([]);
      }
    })();
    return () => { on = false; };
  }, []);

  // Helpers mostrar nombre por id
  const areaNombre = (id: number | null) =>
    (id == null ? "—" : (areas.find(a => Number(a.id) === Number(id))?.nombre ?? id));
  const nivelNombre = (id: number | null) =>
    (id == null ? "—" : (niveles.find(n => Number(n.id) === Number(id))?.nombre ?? id));

  // Listado Finalistas
  const filtros = useMemo(() => ({
    area_id: areaId ? Number(areaId) : undefined,
    nivel_id: nivelId ? Number(nivelId) : undefined,
  }), [areaId, nivelId]);

  async function loadFinalistas(page = 1) {
    setLoading(true);
    try {
      const data = await listarFinalistas({ page, ...filtros });
      setFinalistas(data);
    } finally {
      setLoading(false);
    }
  }

  // Listado Snapshots
  async function loadSnapshots(page = 1) {
    setLoading(true);
    try {
      const data = await listarSnapshots(page);
      setSnapshots(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (tab === "finalistas") {
      void loadFinalistas(1);
    } else {
      void loadSnapshots(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, filtros.area_id, filtros.nivel_id]);

  async function handlePreparar() {
    setWorking(true);
    try {
      const res = await promoverPorFiltro({
        area_id: filtros.area_id ?? "",
        nivel_id: filtros.nivel_id ?? ""
      });
      alert(res.message + (res.total != null ? ` (Total: ${res.total})` : ""));
      await loadFinalistas(1);
      setTab("finalistas");
    } catch (e: unknown) {
      const msg = (e as any)?.response?.data?.message ?? "No se pudo preparar el entorno.";
      alert(msg);
    } finally {
      setWorking(false);
    }
  }

  return (
    <AdminShell
      title="Fase Final — Preparar entorno"
      subtitle="Promueve a los clasificados confirmados a la fase final y consulta el historial."
      backTo="/responsable"
    >
      <div className="rounded-3xl bg-white p-4 md:p-6 text-slate-900 space-y-6">
        {/* Filtros + Acción */}
        <div className="grid md:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm text-slate-600 mb-1">Área</label>
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
              value={areaId}
              onChange={(e) => setAreaId(e.target.value)}
            >
              <option value="">Todas</option>
              {areas.map(a => (
                <option key={String(a.id)} value={String(a.id)}>{a.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Nivel</label>
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
              value={nivelId}
              onChange={(e) => setNivelId(e.target.value)}
            >
              <option value="">Todos</option>
              {niveles.map(n => (
                <option key={String(n.id)} value={String(n.id)}>{n.nombre}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              className="w-full rounded-xl bg-emerald-600 text-white font-semibold px-4 py-2 hover:bg-emerald-500 disabled:opacity-60"
              onClick={handlePreparar}
              disabled={working}
              title="Promover a finalistas desde evaluaciones aprobadas y finalizadas"
            >
              {working ? "Preparando..." : "Preparar finalistas"}
            </button>
          </div>
          <div className="flex items-end">
            <button
              className="w-full rounded-xl border border-slate-300 px-4 py-2 hover:bg-slate-50"
              onClick={() => { setAreaId(""); setNivelId(""); if (tab === "finalistas") void loadFinalistas(1); }}
            >
              Limpiar filtros
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            className={`px-4 py-2 rounded-xl border ${tab === "finalistas" ? "bg-slate-900 text-white border-slate-900" : "border-slate-300"}`}
            onClick={() => setTab("finalistas")}
          >
            Finalistas
          </button>
          <button
            className={`px-4 py-2 rounded-xl border ${tab === "snapshots" ? "bg-slate-900 text-white border-slate-900" : "border-slate-300"}`}
            onClick={() => setTab("snapshots")}
          >
            Snapshots
          </button>
        </div>

        {/* Contenido */}
        {tab === "finalistas" ? (
          <div className="space-y-3">
            <div className="rounded-2xl border border-slate-200 overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-3 py-2">Inscrito</th>
                    <th className="text-left px-3 py-2">Área</th>
                    <th className="text-left px-3 py-2">Nivel</th>
                    <th className="text-left px-3 py-2">Habilitado</th>
                    <th className="text-left px-3 py-2">Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} className="px-3 py-6 text-center text-slate-500">Cargando…</td></tr>
                  ) : finalistas && finalistas.data.length ? finalistas.data.map((f) => {
                    const nombre = f.inscrito ? `${f.inscrito.apellidos}, ${f.inscrito.nombres}` : "—";
                    return (
                      <tr key={f.id} className="border-t">
                        <td className="px-3 py-2">{nombre}</td>
                        <td className="px-3 py-2">{areaNombre(f.area_id ?? f.inscrito?.area_id ?? null)}</td>
                        <td className="px-3 py-2">{nivelNombre(f.nivel_id ?? f.inscrito?.nivel_id ?? null)}</td>
                        <td className="px-3 py-2">{new Date(f.habilitado_at).toLocaleString()}</td>
                        <td className="px-3 py-2 text-xs break-all">{f.origen_hash}</td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan={5} className="px-3 py-6 text-center text-slate-500">Sin finalistas.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div>Total: {finalistas?.total ?? 0}</div>
              <div className="space-x-2">
                <button
                  className="rounded-lg border px-3 py-1 disabled:opacity-50"
                  disabled={!finalistas || finalistas.current_page <= 1}
                  onClick={() => void loadFinalistas((finalistas?.current_page ?? 2) - 1)}
                >
                  Anterior
                </button>
                <span>Página {finalistas?.current_page ?? 1} de {finalistas?.last_page ?? 1}</span>
                <button
                  className="rounded-lg border px-3 py-1 disabled:opacity-50"
                  disabled={!finalistas || finalistas.current_page >= (finalistas.last_page ?? 1)}
                  onClick={() => void loadFinalistas((finalistas?.current_page ?? 0) + 1)}
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-2xl border border-slate-200 overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-3 py-2">Origen</th>
                    <th className="text-left px-3 py-2">Meta</th>
                    <th className="text-left px-3 py-2">Total</th>
                    <th className="text-left px-3 py-2">Creado</th>
                    <th className="text-left px-3 py-2">Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} className="px-3 py-6 text-center text-slate-500">Cargando…</td></tr>
                  ) : snapshots && snapshots.data.length ? snapshots.data.map((s) => {
                    const metaTxt = `Área: ${s.payload?.meta?.area_id ?? "—"}, Nivel: ${s.payload?.meta?.nivel_id ?? "—"}`;
                    return (
                      <tr key={s.id} className="border-t">
                        <td className="px-3 py-2">{s.origen}</td>
                        <td className="px-3 py-2">{metaTxt}</td>
                        <td className="px-3 py-2">{s.payload?.total ?? 0}</td>
                        <td className="px-3 py-2">{new Date(s.creado_at).toLocaleString()}</td>
                        <td className="px-3 py-2 text-xs break-all">{s.origen_hash}</td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan={5} className="px-3 py-6 text-center text-slate-500">Sin snapshots.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div>Total: {snapshots?.total ?? 0}</div>
              <div className="space-x-2">
                <button
                  className="rounded-lg border px-3 py-1 disabled:opacity-50"
                  disabled={!snapshots || snapshots.current_page <= 1}
                  onClick={() => void loadSnapshots((snapshots?.current_page ?? 2) - 1)}
                >
                  Anterior
                </button>
                <span>Página {snapshots?.current_page ?? 1} de {snapshots?.last_page ?? 1}</span>
                <button
                  className="rounded-lg border px-3 py-1 disabled:opacity-50"
                  disabled={!snapshots || snapshots.current_page >= (snapshots.last_page ?? 1)}
                  onClick={() => void loadSnapshots((snapshots?.current_page ?? 0) + 1)}
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
