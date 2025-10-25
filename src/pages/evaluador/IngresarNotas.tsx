// src/pages/evaluador/IngresarNotas.tsx
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import {
  getAsignadas,
  guardarEvaluacion,
  finalizarEvaluacion,
  type Concepto,
  type InscritoAsignado,
  toDecimal2,
} from "../../services/evaluaciones";

// ====== Configurables ======
const APROBADO_DESDE = 70; // Nota mínima para "APROBADO"

// ====== Tipos de estado por fila ======
type RowState = {
  nota_final: string;                 // como string (permitir coma)
  concepto: Concepto | "";            // valor del select
  conceptoManual: boolean;            // true si el usuario lo cambió manualmente
  desclasificar: boolean;             // toggle
  observaciones: string;              // motivo si desclasifica
  estado: "borrador" | "finalizado" | "";
  saving?: boolean;
  error?: string | null;
};

const CONCEPTOS: Concepto[] = ["APROBADO", "DESAPROBADO", "DESCLASIFICADO"];

// Helpers UI
function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}
function nombreCompleto(i: InscritoAsignado) {
  return `${i.apellidos ?? ""} ${i.nombres ?? ""}`.trim();
}
// Acepta relación {id,nombre} o string llano
function getAreaNombre(i: InscritoAsignado): string {
  if (i.area && typeof i.area === "object") return i.area.nombre;
  if (typeof i.area === "string") return i.area;
  return "—";
}
function getNivelNombre(i: InscritoAsignado): string {
  if (i.nivel && typeof i.nivel === "object") return i.nivel.nombre;
  if (typeof i.nivel === "string") return i.nivel;
  return "—";
}

export default function IngresarNotas() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<InscritoAsignado[]>([]);
  const [meta, setMeta] = useState<{ current: number; last: number; total: number }>({
    current: 1,
    last: 1,
    total: 0,
  });
  const [local, setLocal] = useState<Record<number, RowState>>({});
  const [loading, setLoading] = useState(true);

  // Debounce búsqueda
  const debounceRef = useRef<number | null>(null);
  const debouncedSearch = (value: string) => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      setPage(1);
      setSearch(value);
    }, 300);
  };

  async function load() {
    setLoading(true);
    try {
      const res = await getAsignadas({ page, per_page: perPage, search: search || undefined });

      setRows(res.data);
      setMeta({ current: res.current_page, last: res.last_page, total: res.total });

      // Hidratar/sincronizar estado local
      setLocal((prev) => {
        const next: Record<number, RowState> = { ...prev };
        for (const i of res.data) {
          const srvEstado = (i.evaluacion?.estado as "borrador" | "finalizado" | null) ?? "";
          const srvNotaStr = i.evaluacion?.nota_final != null ? String(i.evaluacion.nota_final) : "";
          const srvConcepto = (i.evaluacion?.concepto as Concepto | null) ?? "";

          if (!next[i.id]) {
            const nf = toDecimal2(srvNotaStr);
            const conceptAuto: Concepto | "" =
              nf == null ? "" : nf >= APROBADO_DESDE ? "APROBADO" : "DESAPROBADO";

            next[i.id] = {
              nota_final: srvNotaStr,
              concepto: srvConcepto || conceptAuto,
              conceptoManual: !!srvConcepto && srvConcepto !== "APROBADO" && srvConcepto !== "DESAPROBADO",
              desclasificar: srvConcepto === "DESCLASIFICADO",
              observaciones: "",
              estado: srvEstado,
              error: null,
            };
          } else {
            next[i.id] = { ...next[i.id], estado: srvEstado || next[i.id].estado };
          }
        }
        return next;
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage, search]);

  function setField(inscritoId: number, patch: Partial<RowState>) {
    setLocal((prev) => ({ ...prev, [inscritoId]: { ...prev[inscritoId], ...patch } }));
  }

  // ====== Validaciones en cliente ======
  function validarFila(r: RowState, esFinalizado: boolean): string | null {
    if (r.desclasificar) {
      if (!r.observaciones || !r.observaciones.trim()) return "Ingrese el motivo si desclasifica.";
      return null; // nota no obligatoria si desclasifica (la enviaremos 0 para cumplir backend)
    }

    const nf = toDecimal2(r.nota_final);
    if (esFinalizado) {
      if (nf === null) return "Ingrese una nota válida.";
      if (nf < 0 || nf > 100) return "La nota debe estar entre 0.00 y 100.00.";
    } else if (r.nota_final) {
      if (nf === null || nf < 0 || nf > 100) return "La nota debe estar entre 0.00 y 100.00.";
    }
    if (!r.concepto) return "Seleccione un concepto.";
    return null;
  }

  // ====== Reacción a cambios de nota (auto concepto) ======
  function onChangeNota(id: number, value: string) {
    setLocal((prev) => {
      const curr = prev[id];
      if (!curr) return prev;

      let next: RowState = { ...curr, nota_final: value };

      if (!curr.conceptoManual && !curr.desclasificar) {
        const nf = toDecimal2(value);
        next = {
          ...next,
          concepto: nf == null ? "" : nf >= APROBADO_DESDE ? "APROBADO" : "DESAPROBADO",
        };
      }
      return { ...prev, [id]: next };
    });
  }

  // ====== Guardar (borrador) ======
  async function handleGuardar(i: InscritoAsignado) {
  const st = local[i.id];
  const err = validarFila(st, false);
  if (err) return setField(i.id, { error: err });

  const conceptoToSend: Concepto | null = st.desclasificar ? "DESCLASIFICADO" : (st.concepto || null);

  setField(i.id, { saving: true, error: null });
  try {
    await guardarEvaluacion(i.id, {
      nota_final: st.desclasificar ? null : st.nota_final === "" ? null : st.nota_final,
      concepto: conceptoToSend,
      observaciones: st.desclasificar ? st.observaciones : st.observaciones || null,
    });
    await load();
  } catch {
    setField(i.id, { error: "No se pudo guardar. Intenta nuevamente." });
  } finally {
    setField(i.id, { saving: false });
  }
}


  // ====== Finalizar ======
  async function handleFinalizar(i: InscritoAsignado) {
  const st = local[i.id];
  const err = validarFila(st, true);
  if (err) return setField(i.id, { error: err });

  if (!window.confirm("¿Finalizar evaluación? Ya no podrás editar hasta que el responsable la reabra.")) {
    return;
  }

  const conceptoToSend: Concepto = st.desclasificar
    ? "DESCLASIFICADO"
    : (st.concepto || (toDecimal2(st.nota_final) ?? 0) >= APROBADO_DESDE
        ? "APROBADO"
        : "DESAPROBADO");

  // Para cumplir 'required|numeric' cuando desclasifica:
  const notaParaEnviar = st.desclasificar
    ? (st.nota_final === "" ? 0 : st.nota_final)
    : st.nota_final;

  setField(i.id, { saving: true, error: null });

  try {
    await finalizarEvaluacion(i.id, {
      nota_final: notaParaEnviar,
      concepto: conceptoToSend,
      observaciones: st.desclasificar ? st.observaciones : st.observaciones || null,
      notas: [], //  ← **ARRAY vacío**, no {}
    });
    await load();
  } catch (err) {
    // si ya pusiste el api.ts mejorado, aquí podrás ver el campo exacto
    const v = err as { status?: number; errors?: Record<string, string[]>; message?: string };
    let msg = "No se pudo finalizar. Revisa los campos obligatorios.";
    if (v?.status === 422 && v.errors) {
      const k = Object.keys(v.errors)[0];
      if (k) msg = v.errors[k][0] ?? msg;
    }
    setField(i.id, { error: msg });
  } finally {
    // si load() lanzó error, no te quedas “Guardando…”
    setField(i.id, { saving: false });
  }
}


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 text-slate-100">
      {/* Topbar mínima con volver */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-900/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <Link
              to="/evaluador/panel"
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-slate-800/60 px-3 py-1.5 text-sm text-slate-200 hover:border-cyan-400/40"
              title="Volver al panel del evaluador"
            >
              <span aria-hidden>←</span> Volver
            </Link>
            <div>
              <h1 className="text-base font-bold text-white">Ingresar notas</h1>
              <p className="text-xs text-slate-400">Resultado conceptual y desclasificación</p>
            </div>
          </div>
          <div className="text-xs text-slate-300">
            Aprobado desde <span className="font-semibold text-white">{APROBADO_DESDE}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        {/* Toolbar */}
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="col-span-2">
            <div className="flex items-center gap-2">
              <div className="relative w-full">
                <input
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 outline-none placeholder:text-slate-400 focus:border-cyan-400/40"
                  placeholder="Buscar competidor (nombre, apellido o documento)…"
                  onChange={(e) => debouncedSearch(e.target.value)}
                />
                <div className="pointer-events-none absolute inset-y-0 right-2 grid place-items-center text-slate-400">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M21 21l-4.3-4.3m-2.7 1.3a7 7 0 1 1 0-14 7 7 0 0 1 0 14z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </div>
              </div>

              <select
                className="rounded-xl border border-white/10 bg-slate-900/60 px-2 py-2 text-sm outline-none focus:border-cyan-400/40"
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
                title="Filas por página"
              >
                {[10, 15, 20, 30].map((n) => (
                  <option key={n} value={n}>
                    {n}/pág
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end text-sm text-slate-300">
            <span className="rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2">
              Total: <span className="font-semibold text-white">{meta.total}</span>
            </span>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-950/80">
                <tr className="text-left">
                  <th className="px-4 py-3 font-semibold">Competidor</th>
                  <th className="px-4 py-3 font-semibold">Área / Nivel</th>
                  <th className="px-4 py-3 font-semibold">Nota</th>
                  <th className="px-4 py-3 font-semibold">Concepto</th>
                  <th className="px-4 py-3 font-semibold">Motivo (si desclasif.)</th>
                  <th className="px-4 py-3 font-semibold">Estado / Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, idx) => (
                    <tr key={idx} className="border-t border-white/5">
                      <td className="px-4 py-3" colSpan={6}>
                        <div className="h-5 w-full animate-pulse rounded bg-slate-800/60" />
                      </td>
                    </tr>
                  ))
                ) : rows.length ? (
                  rows.map((i, idx) => {
                    const st =
                      local[i.id] ??
                      ({
                        nota_final: "",
                        concepto: "",
                        conceptoManual: false,
                        desclasificar: false,
                        observaciones: "",
                        estado: "",
                        error: null,
                      } as RowState);

                    const disabled = st.saving || st.estado === "finalizado";
                    const isAuto = !st.conceptoManual && !st.desclasificar && !!st.concepto;

                    return (
                      <tr
                        key={i.id}
                        className={cn("border-t border-white/5", idx % 2 === 0 ? "bg-slate-900/20" : "bg-slate-900/10")}
                      >
                        {/* Competidor */}
                        <td className="px-4 py-3 align-top">
                          <div className="font-semibold text-white">{nombreCompleto(i)}</div>
                          <div className="text-xs text-slate-400">
                            Doc: <span className="font-medium text-slate-300">{i.documento ?? "—"}</span>
                          </div>
                        </td>

                        {/* Área / Nivel */}
                        <td className="px-4 py-3 align-top">
                          <div className="text-xs text-slate-300">
                            Área: <span className="font-medium text-white">{getAreaNombre(i)}</span>
                          </div>
                          <div className="text-xs text-slate-300">
                            Nivel: <span className="font-medium text-white">{getNivelNombre(i)}</span>
                          </div>
                          <div className="mt-1 text-[11px] text-slate-400">Aprobado desde {APROBADO_DESDE}.</div>
                        </td>

                        {/* Nota */}
                        <td className="px-4 py-3 align-top">
                          <input
                            className="w-28 rounded-lg border border-white/10 bg-slate-900/60 px-2 py-1 outline-none placeholder:text-slate-500 focus:border-cyan-400/40 disabled:opacity-60"
                            placeholder="0.00"
                            value={st.nota_final}
                            onChange={(e) => onChangeNota(i.id, e.target.value)}
                            disabled={disabled || st.desclasificar}
                            inputMode="decimal"
                          />
                        </td>

                        {/* Concepto (select + chip) */}
                        <td className="px-4 py-3 align-top">
                          <div className="flex items-center gap-2">
                            <select
                              className="rounded-lg border border-white/10 bg-slate-900/60 px-2 py-1 outline-none focus:border-cyan-400/40 disabled:opacity-60"
                              value={st.desclasificar ? "DESCLASIFICADO" : st.concepto}
                              onChange={(e) => {
                                const val = e.target.value as "" | Concepto;
                                if (val === "DESCLASIFICADO") {
                                  setField(i.id, {
                                    desclasificar: true,
                                    concepto: "DESCLASIFICADO",
                                    conceptoManual: true,
                                  });
                                } else {
                                  setField(i.id, {
                                    desclasificar: false,
                                    concepto: val,
                                    conceptoManual: true,
                                  });
                                }
                              }}
                              disabled={disabled}
                            >
                              <option value="">Seleccione…</option>
                              {CONCEPTOS.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>

                            {st.desclasificar ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-xs font-semibold text-rose-200 ring-1 ring-rose-500/30">
                                ● Desclasificado
                              </span>
                            ) : isAuto ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-200 ring-1 ring-emerald-500/30">
                                ● Aprobado (auto)
                              </span>
                            ) : st.concepto ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/15 px-2 py-0.5 text-xs font-semibold text-cyan-200 ring-1 ring-cyan-500/30">
                                ● {st.concepto}
                              </span>
                            ) : null}
                          </div>

                          {/* Toggle desclasificar */}
                          <label className="mt-2 inline-flex select-none items-center gap-2 text-xs text-slate-300">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-white/20 bg-slate-900/60"
                              checked={st.desclasificar}
                              onChange={(e) =>
                                setField(i.id, {
                                  desclasificar: e.target.checked,
                                  concepto: e.target.checked ? "DESCLASIFICADO" : st.concepto,
                                })
                              }
                              disabled={disabled}
                            />
                            Marcar como desclasificado
                          </label>
                        </td>

                        {/* Motivo */}
                        <td className="px-4 py-3 align-top">
                          <input
                            className={cn(
                              "w-72 rounded-lg border border-white/10 bg-slate-900/60 px-2 py-1 outline-none focus:border-cyan-400/40 disabled:opacity-60",
                              st.desclasificar && "placeholder:text-rose-300"
                            )}
                            placeholder={st.desclasificar ? "Obligatorio si desclasifica" : "—"}
                            value={st.observaciones}
                            onChange={(e) => setField(i.id, { observaciones: e.target.value })}
                            disabled={disabled || !st.desclasificar}
                          />
                        </td>

                        {/* Estado / Acciones */}
                        <td className="px-4 py-3 align-top">
                          <div className="mb-2">
                            {st.estado ? (
                              st.estado === "finalizado" ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-200 ring-1 ring-emerald-500/30">
                                  ● Finalizado
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/15 px-2 py-0.5 text-xs font-semibold text-yellow-200 ring-1 ring-yellow-500/30">
                                  ● Borrador
                                </span>
                              )
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              className="rounded-xl border border-white/10 px-3 py-1 text-sm hover:bg-white/10 disabled:opacity-50"
                              onClick={() => void handleGuardar(i)}
                              disabled={disabled}
                            >
                              {st.saving ? "Guardando…" : "Guardar"}
                            </button>
                            <button
                              className="rounded-xl bg-cyan-500 px-3 py-1 text-sm font-semibold text-slate-900 hover:bg-cyan-400 disabled:opacity-50"
                              onClick={() => void handleFinalizar(i)}
                              disabled={disabled}
                            >
                              {st.saving ? "…" : "Finalizar"}
                            </button>
                          </div>

                          {st.error ? <div className="mt-2 text-xs text-rose-300">{st.error}</div> : null}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr className="border-t border-white/5">
                    <td className="px-4 py-6 text-center text-slate-300" colSpan={6}>
                      Sin asignaciones
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="flex items-center justify-between border-t border-white/10 bg-slate-900/50 px-4 py-3 text-sm">
            <div>
              Página <span className="font-semibold text-white">{meta.current}</span> de{" "}
              <span className="font-semibold text-white">{meta.last}</span>
            </div>
            <div className="space-x-2">
              <button
                className="rounded-lg border border-white/10 px-3 py-1 disabled:opacity-50"
                disabled={meta.current <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </button>
              <button
                className="rounded-lg border border-white/10 px-3 py-1 disabled:opacity-50"
                disabled={meta.current >= meta.last || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
