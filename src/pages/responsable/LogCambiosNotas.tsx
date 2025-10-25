import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchLog,
  exportLogCSV,
  exportLogXLSX,
  type LogEntry,
  type LogPagination,
  type LogQuery,
} from "../../services/logNotas";
import {
  getOpcionesFiltros,
  type OpcionCatalogo,
} from "../../services/clasificacion";

/** Helpers */
function toIntOrUndef(v: string): number | undefined {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
function todayISO(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}
function addDaysISO(baseISO: string, delta: number): string {
  const d = new Date(baseISO + "T00:00:00");
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

export default function LogCambiosNotas() {
  // Filtros
  const [qCompetidor, setQCompetidor] = useState("");
  const [qEvaluador, setQEvaluador] = useState("");
  const [areas, setAreas] = useState<OpcionCatalogo[]>([]);
  const [niveles, setNiveles] = useState<OpcionCatalogo[]>([]);
  const [areaSel, setAreaSel] = useState("");
  const [nivelSel, setNivelSel] = useState("");
  const [dateTo, setDateTo] = useState(todayISO());
  const [dateFrom, setDateFrom] = useState(addDaysISO(todayISO(), -30));

  // Paginación
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);

  // Estado de datos
  const [tabla, setTabla] = useState<LogPagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<"csv" | "xlsx" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Cargar combos de área/nivel
  useEffect(() => {
    (async () => {
      try {
        const opts = await getOpcionesFiltros();
        setAreas(opts.areas ?? []);
        setNiveles(opts.niveles ?? []);
      } catch {
        setAreas([]);
        setNiveles([]);
      }
    })();
  }, []);

  const query: LogQuery = useMemo(
    () => ({
      q_competidor: qCompetidor || undefined,
      q_evaluador: qEvaluador || undefined,
      area_id: toIntOrUndef(areaSel),
      nivel_id: toIntOrUndef(nivelSel),
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      page,
      per_page: perPage,
      sort_by: "occurred_at",
      sort_dir: "desc",
    }),
    [qCompetidor, qEvaluador, areaSel, nivelSel, dateFrom, dateTo, page, perPage]
  );

  async function buscar() {
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetchLog(query);
      setTabla(res);
    } catch {
      setTabla(null);
      setError("No se pudo cargar el log de cambios.");
    } finally {
      setLoading(false);
    }
  }

  // Cargar inicialmente
  useEffect(() => {
    void buscar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Si cambia paginado, refetch
  useEffect(() => {
    if (tabla) void buscar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage]);

  type TablaLike = {
    data:
      | LogEntry[]
      | {
          data: LogEntry[];
          current_page?: number;
          last_page?: number;
        };
    current_page?: number;
    last_page?: number;
    meta?: { current_page?: number; last_page?: number };
  };

  const norm: TablaLike | null = (tabla as unknown as TablaLike) ?? null;

  const rows: LogEntry[] = useMemo(() => {
    if (!norm) return [];
    if (Array.isArray(norm.data)) return norm.data;
    if (norm.data && Array.isArray(norm.data.data)) return norm.data.data;
    return [];
  }, [norm]);

  const current =
    (norm?.current_page ??
      norm?.meta?.current_page ??
      (norm?.data && !Array.isArray(norm.data)
        ? norm.data.current_page
        : undefined)) ?? page;

  const last =
    (norm?.last_page ??
      norm?.meta?.last_page ??
      (norm?.data && !Array.isArray(norm.data)
        ? norm.data.last_page
        : undefined)) ?? 1;

  function triggerDownload(blob: Blob, filename: string, mime: string) {
    const file = new Blob([blob], { type: mime });
    const href = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(href);
  }

  function isAxiosErrorWithStatus(e: unknown, status: number): boolean {
    return (
      typeof e === "object" &&
      e !== null &&
      "response" in e &&
      (e as { response?: { status?: number } }).response?.status === status
    );
  }

  async function handleExport(kind: "csv" | "xlsx") {
    setInfo(null);
    try {
      setDownloading(kind);
      if (kind === "csv") {
        const blob = await exportLogCSV(query);
        triggerDownload(blob, "log_cambios_notas.csv", "text/csv;charset=utf-8");
      } else {
        try {
          const blob = await exportLogXLSX(query);
          triggerDownload(
            blob,
            "log_cambios_notas.xlsx",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          );
        } catch (err) {
          if (isAxiosErrorWithStatus(err, 501)) {
            setInfo("XLSX no disponible. Se descargará CSV como alternativa.");
            const blobCsv = await exportLogCSV(query);
            triggerDownload(
              blobCsv,
              "log_cambios_notas.csv",
              "text/csv;charset=utf-8"
            );
          } else {
            throw err;
          }
        }
      }
    } catch {
      setError(
        kind === "csv" ? "No se pudo exportar CSV." : "No se pudo exportar Excel."
      );
    } finally {
      setDownloading(null);
    }
  }

  function resetear() {
    setQCompetidor("");
    setQEvaluador("");
    setAreaSel("");
    setNivelSel("");
    setDateTo(todayISO());
    setDateFrom(addDaysISO(todayISO(), -30));
    setPage(1);
    setInfo(null);
    setError(null);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 text-slate-100">
      {/* Topbar */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-900/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
          <div>
            <div className="text-xs text-slate-400">
              <Link to="/responsable/panel" className="hover:underline">
                Responsable
              </Link>{" "}
              / Auditoría
            </div>
            <h1 className="text-lg font-bold">ID:8 Log de cambios de notas</h1>
          </div>
          <Link
            to="/responsable/panel"
            className="rounded-xl border border-white/10 bg-slate-800/60 px-3 py-1.5 text-sm hover:border-cyan-400/40"
          >
            Volver al panel
          </Link>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        {/* Filtros */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          {/* Competidor */}
          <div>
            <label className="mb-1 block text-sm text-slate-300">
              Competidor
            </label>
            <input
              className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 outline-none focus:border-cyan-400/40"
              placeholder="Nombre o documento"
              value={qCompetidor}
              onChange={(e) => setQCompetidor(e.target.value)}
            />
          </div>

          {/* Área / Nivel */}
          <div>
            <label className="mb-1 block text-sm text-slate-300">
              Área / Nivel
            </label>
            <div className="flex gap-2">
              <select
                className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-2 py-2 outline-none focus:border-cyan-400/40"
                value={areaSel}
                onChange={(e) => setAreaSel(e.target.value)}
              >
                <option value="">(área)</option>
                {areas.map((a) => (
                  <option key={`area-${a.id}`} value={String(a.id)}>
                    {a.nombre}
                  </option>
                ))}
              </select>
              <select
                className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-2 py-2 outline-none focus:border-cyan-400/40"
                value={nivelSel}
                onChange={(e) => setNivelSel(e.target.value)}
              >
                <option value="">(nivel)</option>
                {niveles.map((n) => (
                  <option key={`nivel-${n.id}`} value={String(n.id)}>
                    {n.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Evaluador */}
          <div>
            <label className="mb-1 block text-sm text-slate-300">
              Evaluador
            </label>
            <input
              className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 outline-none focus:border-cyan-400/40"
              placeholder="Nombre/correo"
              value={qEvaluador}
              onChange={(e) => setQEvaluador(e.target.value)}
            />
          </div>

          {/* Fechas */}
          <div>
            <label className="mb-1 block text-sm text-slate-300">
              Rango de fechas
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-2 py-2 outline-none focus:border-cyan-400/40"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
              <span className="text-slate-400">—</span>
              <input
                type="date"
                className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-2 py-2 outline-none focus:border-cyan-400/40"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              setPage(1);
              void buscar();
            }}
            disabled={loading}
            className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-900 shadow hover:bg-cyan-400 disabled:opacity-60"
          >
            {loading ? "Buscando…" : "Buscar"}
          </button>

          <button
            onClick={resetear}
            disabled={loading}
            className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm hover:border-cyan-400/40"
          >
            Limpiar
          </button>

          <div className="ml-auto flex gap-2">
            <button
              onClick={() => void handleExport("csv")}
              disabled={downloading !== null}
              className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm hover:border-cyan-400/40 disabled:opacity-60"
            >
              {downloading === "csv" ? "Exportando…" : "Exportar CSV"}
            </button>
            <button
              onClick={() => void handleExport("xlsx")}
              disabled={downloading !== null}
              className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm hover:border-cyan-400/40 disabled:opacity-60"
            >
              {downloading === "xlsx" ? "Exportando…" : "Exportar Excel"}
            </button>
          </div>
        </div>

        {/* Mensajes */}
        {info && (
          <div className="mt-4 rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
            {info}
          </div>
        )}
        {error && (
          <div className="mt-4 rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {error}
          </div>
        )}

        {/* Tabla */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-950/70">
                <tr className="text-left">
                  <th className="px-4 py-3 font-semibold">Fecha/Hora</th>
                  <th className="px-4 py-3 font-semibold">Usuario</th>
                  <th className="px-4 py-3 font-semibold">Competidor</th>
                  <th className="px-4 py-3 font-semibold">Campo</th>
                  <th className="px-4 py-3 font-semibold">Anterior</th>
                  <th className="px-4 py-3 font-semibold">Nuevo</th>
                  <th className="px-4 py-3 font-semibold">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(6)].map((_, i) => (
                    <tr key={`sk-${i}`} className="border-t border-white/5">
                      <td className="px-4 py-3" colSpan={7}>
                        <div className="h-5 w-full animate-pulse rounded bg-slate-800/60" />
                      </td>
                    </tr>
                  ))
                ) : rows.length > 0 ? (
                  rows.map((r) => (
                    <tr key={r.id} className="border-t border-white/5">
                      <td className="px-4 py-3">
                        {new Date(r.occurred_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">{r.usuario?.email ?? "—"}</td>
                      <td className="px-4 py-3">
                        {r.competidor?.nombre_completo ?? "—"}
                      </td>
                      <td className="px-4 py-3">{r.campo}</td>
                      <td className="px-4 py-3">{String(r.anterior ?? "—")}</td>
                      <td className="px-4 py-3">{String(r.nuevo ?? "—")}</td>
                      <td className="px-4 py-3">{r.motivo ?? "—"}</td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-t border-white/5">
                    <td
                      className="px-4 py-6 text-center text-slate-300"
                      colSpan={7}
                    >
                      Sin resultados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="flex items-center justify-between border-t border-white/10 bg-slate-900/50 px-4 py-3 text-sm">
            <div className="flex items-center gap-2">
              <span>
                Página <span className="font-semibold text-white">{current}</span>{" "}
                de <span className="font-semibold text-white">{last}</span>
              </span>
              <select
                className="rounded-lg border border-white/10 bg-slate-900/60 px-2 py-1 outline-none"
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
              >
                {[10, 15, 20, 30].map((n) => (
                  <option key={`pp-${n}`} value={n}>
                    {n}/pág
                  </option>
                ))}
              </select>
            </div>
            <div className="space-x-2">
              <button
                className="rounded-lg border border-white/10 px-3 py-1 disabled:opacity-50"
                disabled={current <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </button>
              <button
                className="rounded-lg border border-white/10 px-3 py-1 disabled:opacity-50"
                disabled={current >= last || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>

        {/* Aviso de inmutabilidad */}
        <div className="mt-3 text-xs text-slate-400">
          Bloqueo de borrado:{" "}
          <span className="text-slate-200">
            no se pueden eliminar registros del log.
          </span>
        </div>
      </main>
    </div>
  );
}
