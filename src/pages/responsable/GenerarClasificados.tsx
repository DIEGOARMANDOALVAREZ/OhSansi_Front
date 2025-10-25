// src/pages/responsable/GenerarClasificados.tsx
import { useEffect, useMemo, useState } from "react";
import {
  getPreview,
  confirmClasificacion,
  getLista,
  getOpcionesFiltros,
  type Cierre,
  type ClasificadosPagination,
  type OpcionCatalogo,
} from "../../services/clasificacion";
import { Link, useLocation } from "react-router-dom";
import { api } from "../../api";

function Card({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 shadow-xl">
      <div className="text-sm text-slate-400">{title}</div>
      <div className="mt-2 text-3xl font-extrabold text-white">{value}</div>
    </div>
  );
}

// Convierte string -> number si es un entero válido; si no, undefined (no se envía)
function toIntOrUndef(v: string): number | undefined {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

type SortBy = "documento" | "apellidos" | "nombres" | "nota_final" | "concepto";
type SortDir = "asc" | "desc";

interface InscritoRow {
  documento?: string;
  apellidos?: string;
  nombres?: string;
}

export interface ClasificadoRow {
  id: number;
  inscrito?: InscritoRow;
  nota_final?: number;
  concepto?: string;
}

/** Estructuras de paginación que puede devolver el backend (formas toleradas) */
type TablaLike = {
  data?:
    | ClasificadoRow[]
    | {
        data?: ClasificadoRow[];
        current_page?: number;
        last_page?: number;
      };
  current_page?: number;
  last_page?: number;
  meta?: { current_page?: number; last_page?: number };
};

function usePrefKey() {
  const loc = useLocation();
  // Si esta misma pantalla se usa para evaluador/responsable, separar preferencias por ruta
  return `clasificados.sort.pref:${loc.pathname}`;
}

export default function GenerarClasificados() {
  // Opciones (id siempre numérico en el service)
  const [areas, setAreas] = useState<OpcionCatalogo[]>([]);
  const [niveles, setNiveles] = useState<OpcionCatalogo[]>([]);

  // Filtros
  const [areaSel, setAreaSel] = useState<string>("");
  const [nivelSel, setNivelSel] = useState<string>("");
  const [minima, setMinima] = useState<number>(70);

  // Orden (con preferencia)
  const prefKey = usePrefKey();
  const [sortBy, setSortBy] = useState<SortBy>(() => {
    const saved = localStorage.getItem(prefKey);
    if (saved) {
      try {
        const p = JSON.parse(saved) as { sortBy?: SortBy };
        return p.sortBy ?? "apellidos";
      } catch {
        /* ignore */
      }
    }
    return "apellidos";
  });
  const [sortDir, setSortDir] = useState<SortDir>(() => {
    const saved = localStorage.getItem(prefKey);
    if (saved) {
      try {
        const p = JSON.parse(saved) as { sortDir?: SortDir };
        return p.sortDir ?? "asc";
      } catch {
        /* ignore */
      }
    }
    return "asc";
  });

  const [preview, setPreview] = useState<{
    conteos: { clasificados: number; no_clasificados: number; desclasificados: number };
    confirmado: Cierre | null;
  } | null>(null);

  const [tabla, setTabla] = useState<ClasificadosPagination | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);

  const [loading, setLoading] = useState(false);
  const [loadingTabla, setLoadingTabla] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [downloading, setDownloading] = useState<"csv" | "xlsx" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cargar opciones de filtros
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

  async function doPreview() {
    setLoading(true);
    setError(null);
    try {
      const data = await getPreview({
        area_id: toIntOrUndef(areaSel),
        nivel_id: toIntOrUndef(nivelSel),
        minima,
      });
      setPreview({ conteos: data.conteos, confirmado: data.confirmado });
      setPage(1);
      await loadTabla(1, perPage);
    } catch {
      setError("No se pudo calcular la simulación.");
    } finally {
      setLoading(false);
    }
  }

  async function loadTabla(nextPage = page, nextPer = perPage) {
    setLoadingTabla(true);
    try {
      const params = {
        area_id: toIntOrUndef(areaSel),
        nivel_id: toIntOrUndef(nivelSel),
        minima,
        page: nextPage,
        per_page: nextPer,
        sort_by: sortBy,
        sort_dir: sortDir,
      };
      const data = await getLista(params as Parameters<typeof getLista>[0]);
      setTabla(data);
    } catch {
      setTabla(null);
    } finally {
      setLoadingTabla(false);
    }
  }

  // Paginación/orden reactivo cuando ya hay preview
  useEffect(() => {
    if (preview) void loadTabla(page, perPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage, sortBy, sortDir]);

  async function doConfirm() {
    setConfirming(true);
    setError(null);
    try {
      const cierre = await confirmClasificacion({
        area_id: toIntOrUndef(areaSel),
        nivel_id: toIntOrUndef(nivelSel),
        minima,
      });
      setPreview((p) => (p ? { ...p, confirmado: cierre } : p));
    } catch {
      setError("No se pudo confirmar la clasificación.");
    } finally {
      setConfirming(false);
    }
  }

  function savePreference() {
    localStorage.setItem(prefKey, JSON.stringify({ sortBy, sortDir }));
  }

  async function download(kind: "csv" | "xlsx") {
    try {
      setDownloading(kind);
      const url =
        kind === "csv"
          ? "/responsable/clasificacion/export"
          : "/responsable/clasificacion/export-xlsx";
      const res = await api.get(url, {
        params: {
          area_id: toIntOrUndef(areaSel),
          nivel_id: toIntOrUndef(nivelSel),
          minima,
          sort_by: sortBy,
          sort_dir: sortDir,
        },
        responseType: "blob",
      });

      const mime =
        kind === "csv"
          ? "text/csv;charset=utf-8"
          : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      const blob = new Blob([res.data], { type: mime });
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = kind === "csv" ? "clasificados.csv" : "clasificados.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
    } catch {
      setError(kind === "csv" ? "No se pudo exportar CSV." : "No se pudo exportar Excel.");
    } finally {
      setDownloading(null);
    }
  }

  const disabledConfirm = useMemo(() => !preview, [preview]);

  // Limpiar preview/tabla al cambiar filtros para forzar recálculo
  useEffect(() => {
    setPreview(null);
    setTabla(null);
    setPage(1);
  }, [areaSel, nivelSel, minima]);

  // ===== Normalización segura de la respuesta paginada =====
  const t: TablaLike = (tabla as unknown as TablaLike) ?? {};

  const rawRows: ClasificadoRow[] = Array.isArray(t.data)
    ? (t.data as ClasificadoRow[])
    : t.data && typeof t.data === "object" && Array.isArray((t.data as { data?: unknown }).data)
    ? (((t.data as { data?: ClasificadoRow[] }).data) ?? [])
    : [];

  const current =
    t.current_page ??
    t.meta?.current_page ??
    (typeof t.data === "object" && t.data
      ? (t.data as { current_page?: number }).current_page
      : undefined) ??
    page;

  const last =
    t.last_page ??
    t.meta?.last_page ??
    (typeof t.data === "object" && t.data
      ? (t.data as { last_page?: number }).last_page
      : undefined) ??
    1;

  /** Orden local (fallback si el backend aún no ordena) */
  const dataRows: ClasificadoRow[] = useMemo(() => {
    const rows = [...rawRows];
    const val = (r: ClasificadoRow): string | number => {
      switch (sortBy) {
        case "documento":
          return r.inscrito?.documento ?? "";
        case "apellidos":
          return r.inscrito?.apellidos ?? "";
        case "nombres":
          return r.inscrito?.nombres ?? "";
        case "nota_final":
          return Number(r.nota_final ?? 0);
        case "concepto":
          return r.concepto ?? "";
      }
    };
    rows.sort((a, b) => {
      const va = val(a);
      const vb = val(b);
      if (typeof va === "number" && typeof vb === "number") return va - vb;
      return String(va).localeCompare(String(vb), "es", { sensitivity: "base" });
    });
    if (sortDir === "desc") rows.reverse();
    return rows;
  }, [rawRows, sortBy, sortDir]);

  // UI helpers
  const headerBtn = (label: string, key: SortBy) => {
    const active = sortBy === key;
    const arrow = active ? (sortDir === "asc" ? "▲" : "▼") : "↕";
    return (
      <button
        className={`inline-flex items-center gap-1 hover:underline ${active ? "text-cyan-300" : ""}`}
        onClick={() => {
          if (active) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
          else {
            setSortBy(key);
            setSortDir("asc");
          }
        }}
        title="Ordenar por esta columna"
      >
        {label} <span className="text-xs opacity-80">{arrow}</span>
      </button>
    );
  };

  return (
    <div
      id="clasificados-page"
      className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 text-slate-100"
    >
      {/* Estilos locales para <select> nativo en tema oscuro */}
      <style>{`
        #clasificados-page select { color:#f8fafc; background-color:#0f172a; }
        #clasificados-page select option { color:#0f172a; background:#e5e7eb; }
        #clasificados-page select:focus { outline:none; border-color:#22d3ee; box-shadow:0 0 0 1px #22d3ee; }
      `}</style>

      {/* Topbar */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-900/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
          <div>
            <div className="text-xs text-slate-400">
              <Link to="/responsable/panel" className="hover:underline">
                Responsable
              </Link>{" "}
              / Clasificación
            </div>
            <h1 className="text-lg font-bold">ID:6 Generar lista de clasificados</h1>
          </div>
          <Link
            to="/responsable/panel"
            className="rounded-xl border border-white/10 bg-slate-800/60 px-3 py-1.5 text-sm hover:border-cyan-400/40"
          >
            Volver al panel
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        {/* Filtros */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <div className="mb-1 text-sm text-slate-300">Área / Nivel</div>
            <div className="flex gap-2">
              {/* Área */}
              <select
                className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-2 py-2 outline-none focus:border-cyan-400/40"
                value={areaSel}
                onChange={(e) => setAreaSel(e.target.value)}
              >
                <option value="">(todas)</option>
                {areas.map((a) => (
                  <option key={`area-${a.id}`} value={String(a.id)}>
                    {a.nombre}
                  </option>
                ))}
              </select>

              {/* Nivel */}
              <select
                className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-2 py-2 outline-none focus:border-cyan-400/40"
                value={nivelSel}
                onChange={(e) => setNivelSel(e.target.value)}
              >
                <option value="">(todos)</option>
                {niveles.map((n) => (
                  <option key={`nivel-${n.id}`} value={String(n.id)}>
                    {n.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="mb-1 text-sm text-slate-300">Nota mínima (suficiencia)</div>
            <input
              className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 outline-none focus:border-cyan-400/40"
              value={minima}
              onChange={(e) =>
                setMinima(Math.max(0, Math.min(100, Number((e.target.value || "0").replace(",", ".")))))
              }
              inputMode="decimal"
            />
          </div>

          {/* Ordenar por */}
          <div>
            <div className="mb-1 text-sm text-slate-300">Ordenar por</div>
            <div className="flex gap-2">
              <select
                className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-2 py-2 outline-none focus:border-cyan-400/40"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
              >
                <option value="apellidos">Apellidos (A–Z)</option>
                <option value="nombres">Nombres (A–Z)</option>
                <option value="documento">Documento</option>
                <option value="nota_final">Nota</option>
                <option value="concepto">Concepto</option>
              </select>
              <select
                className="rounded-xl border border-white/10 bg-slate-900/60 px-2 py-2 outline-none focus:border-cyan-400/40"
                value={sortDir}
                onChange={(e) => setSortDir(e.target.value as SortDir)}
                title="Dirección de orden"
              >
                <option value="asc">Asc</option>
                <option value="desc">Desc</option>
              </select>
            </div>
            <div className="mt-2 flex gap-2">
              <button
                onClick={savePreference}
                className="rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm hover:border-cyan-400/40"
              >
                Guardar preferencia
              </button>
              <button
                onClick={doPreview}
                disabled={loading}
                className="rounded-xl bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-900 shadow hover:bg-cyan-400 disabled:opacity-60"
              >
                {loading ? "Calculando…" : "Aplicar"}
              </button>
            </div>
          </div>
        </div>

        {/* Resultado */}
        <div className="mt-6">
          {error && (
            <div className="mb-3 rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {error}
            </div>
          )}

          {preview && (
            <>
              <div className="mb-3">
                <span className="rounded-full border border-white/10 bg-slate-800/60 px-3 py-1 text-xs text-slate-300">
                  Reglas éticas: sin desclasificados
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Card title="Clasificados" value={preview.conteos.clasificados} />
                <Card title="No clasificados" value={preview.conteos.no_clasificados} />
                <Card title="Desclasificados" value={preview.conteos.desclasificados} />
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => void download("csv")}
                  disabled={downloading !== null}
                  className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm hover:border-cyan-400/40 disabled:opacity-60"
                >
                  {downloading === "csv" ? "Exportando…" : "Exportar CSV"}
                </button>

                <button
                  onClick={() => void download("xlsx")}
                  disabled={downloading !== null}
                  className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm hover:border-cyan-400/40 disabled:opacity-60"
                >
                  {downloading === "xlsx" ? "Exportando…" : "Exportar Excel"}
                </button>

                <button
                  onClick={doConfirm}
                  disabled={confirming || disabledConfirm}
                  className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-amber-300 disabled:opacity-60"
                >
                  {confirming ? "Confirmando…" : "Confirmar responsable"}
                </button>
              </div>

              {preview.confirmado && (
                <div className="mt-4 text-xs text-slate-300">
                  Confirmado {new Date(preview.confirmado.confirmado_at).toLocaleString()} — hash:{" "}
                  <span className="font-mono">{preview.confirmado.hash.slice(0, 8)}…</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Tabla */}
        {preview && (
          <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-950/70">
                  <tr className="text-left">
                    <th className="px-4 py-3 font-semibold">
                      {headerBtn("Documento", "documento")}
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      {headerBtn("Apellidos", "apellidos")}
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      {headerBtn("Nombres", "nombres")}
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      {headerBtn("Nota", "nota_final")}
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      {headerBtn("Concepto", "concepto")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loadingTabla ? (
                    [...Array(6)].map((_, k) => (
                      <tr key={`skeleton-${k}`} className="border-t border-white/5">
                        <td className="px-4 py-3" colSpan={5}>
                          <div className="h-5 w-full animate-pulse rounded bg-slate-800/60" />
                        </td>
                      </tr>
                    ))
                  ) : dataRows.length > 0 ? (
                    dataRows.map((r: ClasificadoRow) => (
                      <tr key={`row-${r.id}`} className="border-t border-white/5">
                        <td className="px-4 py-3">{r.inscrito?.documento ?? "—"}</td>
                        <td className="px-4 py-3">{r.inscrito?.apellidos ?? "—"}</td>
                        <td className="px-4 py-3">{r.inscrito?.nombres ?? "—"}</td>
                        <td className="px-4 py-3">{r.nota_final}</td>
                        <td className="px-4 py-3">{r.concepto}</td>
                      </tr>
                    ))
                  ) : (
                    <tr className="border-t border-white/5">
                      <td className="px-4 py-6 text-center text-slate-300" colSpan={5}>
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
                  Página <span className="font-semibold text-white">{current}</span> de{" "}
                  <span className="font-semibold text-white">{last}</span>
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
                  disabled={current <= 1 || loadingTabla}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </button>
                <button
                  className="rounded-lg border border-white/10 px-3 py-1 disabled:opacity-50"
                  disabled={current >= last || loadingTabla}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
