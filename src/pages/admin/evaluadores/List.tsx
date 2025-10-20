// src/pages/admin/evaluadores/List.tsx
import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  fetchEvaluadores,
  inactivarEvaluador,
  eliminarEvaluador,
  emitirTokenEvaluador,
  revocarTokensEvaluador,
  type EvaluadorRow as EvaluadorRowSrv,
  type EvaluadorPagination,
} from "../../../services/evaluadores";
import { useAuth } from "../../../hooks/useAuth";
import AdminShell from "../../../components/AdminShell";

type BadgeColor = "green" | "red" | "gray";
function Badge({ children, color = "gray" }: { children: ReactNode; color?: BadgeColor }) {
  const map: Record<BadgeColor, string> = {
    green: "bg-emerald-200 text-emerald-900 border-emerald-300",
    red: "bg-rose-200 text-rose-900 border-rose-300",
    gray: "bg-gray-200 text-gray-900 border-gray-300",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${map[color]}`}>
      {children}
    </span>
  );
}

type EvaluadorRow = EvaluadorRowSrv;

type Filters = {
  search: string;
  area_id: string;
  estado: "" | "activo" | "inactivo";
};

function joinAsociaciones(
  values: Array<{ area_id?: string | number; nivel_id?: string | number | null }>,
  key: "area_id" | "nivel_id"
) {
  return values?.length ? values.map((v) => (v[key] ?? "—")).join(", ") : "—";
}

function Modal({
  open,
  onClose,
  children,
  title,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-5 text-white shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-slate-300 hover:text-white">✕</button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}

export default function AdminEvaluadoresList() {
  const { user } = useAuth();
  const isAdmin = user?.roles?.some((r: { slug?: string }) => r.slug?.toUpperCase() === "ADMIN");

  const [rows, setRows] = useState<EvaluadorRow[]>([]);
  const [meta, setMeta] = useState<EvaluadorPagination | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState<Filters>({ search: "", area_id: "", estado: "" });
  const [page, setPage] = useState<number>(1);
  const [workingId, setWorkingId] = useState<string | number | null>(null);

  // Modal Token (opcional)
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  const [lastToken, setLastToken] = useState<string | null>(null);
  const [tokenForName, setTokenForName] = useState<string>("");

  async function loadPage(signal?: AbortSignal) {
    setLoading(true);
    try {
      const res = await fetchEvaluadores({
        search: filters.search || undefined,
        area_id: filters.area_id || undefined,
        estado: filters.estado || undefined,
        page,
        per_page: 10,
      });
      if (signal?.aborted) return;
      setRows(res.data);
      setMeta(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    void loadPage(controller.signal);
    return () => controller.abort();
  }, [filters, page]);

  const total = meta?.total ?? rows.length;
  const currentPage = meta?.current_page ?? page;
  const lastPage = meta?.last_page ?? page;

  async function handleInactivar(id: string | number) {
    if (!isAdmin) return;
    if (!confirm("¿Estás seguro de inactivar este evaluador?")) return;
    setWorkingId(id);
    try {
      await inactivarEvaluador(id);
      await loadPage();
    } catch {
      alert("No se pudo inactivar. Revisa permisos o intenta más tarde.");
    } finally {
      setWorkingId(null);
    }
  }

  async function handleEliminar(id: string | number, nombreCompleto: string) {
    if (!isAdmin) return;
    const texto = prompt(
      `Esta acción es IRREVERSIBLE.\n\nEscribe ELIMINAR para confirmar la eliminación definitiva de: ${nombreCompleto}`
    );
    if ((texto || "").trim().toUpperCase() !== "ELIMINAR") return;

    setWorkingId(id);
    try {
      await eliminarEvaluador(id);
      alert("Evaluador eliminado definitivamente.");
      if (rows.length === 1 && currentPage > 1) {
        setPage((p) => p - 1);
      } else {
        await loadPage();
      }
    } catch {
      alert("No se pudo eliminar. Revisa permisos o intenta más tarde.");
    } finally {
      setWorkingId(null);
    }
  }

  async function handleEmitirToken(e: EvaluadorRow) {
    if (!isAdmin) return;
    setWorkingId(e.id);
    try {
      const res = await emitirTokenEvaluador(e.id, { name: "panel-admin" });
      setLastToken(res.token);
      setTokenForName(`${e.nombres} ${e.apellidos}`);
      setTokenModalOpen(true);
    } catch (err) {
      alert("No se pudo emitir el token.");
      console.error(err);
    } finally {
      setWorkingId(null);
    }
  }

  async function handleRevocarTokens(id: string | number) {
    if (!isAdmin) return;
    if (!confirm("Revocar TODOS los tokens emitidos para este evaluador?")) return;
    setWorkingId(id);
    try {
      await revocarTokensEvaluador(id);
      alert("Tokens revocados.");
    } catch (err) {
      alert("No se pudo revocar los tokens.");
      console.error(err);
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <AdminShell
      title="Evaluadores"
      subtitle="Listado, filtros, paginación y CI (con tokens opcionales)"
      backTo="/admin"
      actions={<Link to="/admin/evaluadores/nuevo" className="btn-primary">Nuevo</Link>}
    >
      <div className="rounded-3xl bg-white p-4 md:p-6 space-y-4 text-slate-900">
        <div className="card-dark p-4">
          <div className="grid md:grid-cols-4 gap-3">
            <input
              placeholder="Buscar por nombre/correo"
              className="input-dark"
              value={filters.search}
              onChange={(e) => { setFilters((f) => ({ ...f, search: e.target.value })); setPage(1); }}
            />
            <input
              placeholder="Área ID (opcional)"
              className="input-dark"
              value={filters.area_id}
              onChange={(e) => { setFilters((f) => ({ ...f, area_id: e.target.value })); setPage(1); }}
            />
            <select
              className="select-dark"
              value={filters.estado}
              onChange={(e) => { setFilters((f) => ({ ...f, estado: e.target.value as Filters["estado"] })); setPage(1); }}
            >
              <option value="">Estado…</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
            <button className="btn" onClick={() => { setFilters({ search: "", area_id: "", estado: "" }); setPage(1); }}>
              Limpiar
            </button>
          </div>
        </div>

        <div className="card-dark overflow-auto">
          <table className="table-dark">
            <thead>
              <tr><th className="text-left">Nombre</th><th className="text-left">CI</th><th className="text-left">Correo</th><th className="text-left">Área</th><th className="text-left">Nivel</th><th className="text-left">Estado</th><th className="text-right">Acciones</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-3 py-6 text-center text-slate-300">Cargando…</td></tr>
              ) : rows.length ? (
                rows.map((e) => {
                  const nombreCompleto = `${e.nombres} ${e.apellidos}`.trim();
                  const disabled = workingId === e.id;
                  return (
                    <tr key={e.id}>
                      <td>{nombreCompleto}</td><td>{e.ci ?? "—"}</td><td>{e.correo}</td>
                      <td>{joinAsociaciones(e.asociaciones, "area_id")}</td><td>{joinAsociaciones(e.asociaciones, "nivel_id")}</td>
                      <td>{e.estado ? <Badge color="green">Activo</Badge> : <Badge color="red">Inactivo</Badge>}</td>
                      <td className="text-right space-x-3">
                        <Link className="text-cyan-300 hover:underline" to={`/admin/evaluadores/${e.id}`}>Editar</Link>
                        {isAdmin && (
                          <>
                            <button className="text-emerald-300 hover:underline disabled:opacity-50" onClick={() => handleEmitirToken(e)} disabled={disabled} title="Emitir token de acceso (opcional)">
                              Emitir token
                            </button>
                            <button className="text-amber-300 hover:underline disabled:opacity-50" onClick={() => handleRevocarTokens(e.id)} disabled={disabled} title="Revocar todos los tokens (opcional)">
                              Revocar tokens
                            </button>
                            {e.estado ? (
                              <button className="text-amber-300 hover:underline disabled:opacity-50" onClick={() => handleInactivar(e.id)} disabled={disabled} title="Inactivar">
                                Inactivar
                              </button>
                            ) : null}
                            <button className="text-rose-300 hover:underline disabled:opacity-50" onClick={() => handleEliminar(e.id, nombreCompleto)} disabled={disabled} title="Eliminar definitivamente">
                              Eliminar
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={7} className="px-3 py-6 text-center text-slate-300">Sin resultados</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm">
          <div>Total: {total}</div>
          <div className="space-x-2">
            <button className="btn" disabled={currentPage <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</button>
            <span>Página {currentPage} de {lastPage}</span>
            <button className="btn" disabled={currentPage >= lastPage} onClick={() => setPage((p) => p + 1)}>Siguiente</button>
          </div>
        </div>
      </div>

      <Modal open={tokenModalOpen} onClose={() => setTokenModalOpen(false)} title="Token emitido para evaluador">
        {lastToken ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-300">Comparte este token con <span className="font-semibold text-white">{tokenForName}</span>.</p>
            <div className="flex items-center gap-2">
              <input readOnly value={lastToken} className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-white" />
              <button className="rounded-lg bg-cyan-500 px-3 py-2 text-slate-900 font-semibold hover:bg-cyan-400" onClick={() => navigator.clipboard.writeText(lastToken)}>
                Copiar
              </button>
            </div>
            <p className="text-xs text-slate-400">⚠️ Por seguridad, este token no vuelve a mostrarse.</p>
          </div>
        ) : (
          <p className="text-sm text-slate-300">No se obtuvo el token.</p>
        )}
      </Modal>
    </AdminShell>
  );
}
