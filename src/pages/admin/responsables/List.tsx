import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { fetchResponsables, inactivarResponsable, eliminarResponsable } from "../../../services/responsables";
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

type RoleLike = { slug?: string } | string;

type PaginationMeta = {
  current_page: number;
  last_page: number;
  total: number;
};

type ResponsableRow = {
  id: number;
  nombres: string;
  apellidos: string;
  correo: string;
  area_id: number;
  area?: { nombre: string } | null;
  nivel_id?: number | null;
  nivel?: { nombre: string } | null;
  activo: boolean;
};

type FetchResponsablesResp = {
  data?: ResponsableRow[];
  meta?: PaginationMeta;
  current_page?: number;
  last_page?: number;
  total?: number;
};

type Filters = {
  search: string;
  area_id: string;
  estado: "" | "activo" | "inactivo";
};

export default function AdminResponsablesList() {
  const { user } = useAuth();

  const isAdmin = useMemo(() => {
    const roles = ((user as { roles?: RoleLike[] } | undefined)?.roles) ?? [];
    return roles.some((r) => {
      const slug = (typeof r === "string" ? r : r.slug ?? "").toUpperCase();
      return slug === "ADMIN" || slug === "ADMINISTRADOR";
    });
  }, [user]);

  const [rows, setRows] = useState<ResponsableRow[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState<Filters>({ search: "", area_id: "", estado: "" });
  const [page, setPage] = useState<number>(1);
  const [workingId, setWorkingId] = useState<number | null>(null); // deshabilita botones por fila

  async function loadPage(signal?: AbortSignal) {
    setLoading(true);
    try {
      const res = (await fetchResponsables({
        search: filters.search || undefined,
        area_id: filters.area_id || undefined,
        estado: filters.estado || undefined,
        page,
        per_page: 10,
      })) as FetchResponsablesResp;

      if (signal?.aborted) return;

      setRows(res.data ?? []);
      const m: PaginationMeta | null =
        res.meta ??
        (res.current_page && res.last_page && res.total
          ? { current_page: res.current_page, last_page: res.last_page, total: res.total }
          : null);
      setMeta(m);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    loadPage(controller.signal);
    return () => controller.abort();
  }, [filters, page]);

  const total = meta?.total ?? rows.length;
  const currentPage = meta?.current_page ?? page;
  const lastPage = meta?.last_page ?? page;

  async function handleInactivar(id: number) {
    if (!isAdmin) return;
    if (!confirm("¿Inactivar este responsable?")) return;
    setWorkingId(id);
    try {
      await inactivarResponsable(id);
      await loadPage();
    } catch {
      alert("No se pudo inactivar. Revisa permisos o intenta más tarde.");
    } finally {
      setWorkingId(null);
    }
  }

  async function handleEliminar(id: number, nombreCompleto: string) {
    if (!isAdmin) return;
    const texto = prompt(
      `Esta acción es IRREVERSIBLE.\n\nEscribe ELIMINAR para confirmar la eliminación definitiva de: ${nombreCompleto}`
    );
    if ((texto || "").trim().toUpperCase() !== "ELIMINAR") return;

    setWorkingId(id);
    try {
      await eliminarResponsable(id, true); // hard = true
      alert("Responsable eliminado definitivamente.");
      // si quedaste en última página sin elementos, retrocede una
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

  return (
    <AdminShell
      title="Responsables académicos"
      subtitle="Listado, filtros y paginación"
      backTo="/admin"
      actions={
        isAdmin ? (
          <Link to="/admin/responsables/nuevo" className="btn-primary">
            Nuevo
          </Link>
        ) : null
      }
    >
      {/* Fondo de página blanco */}
      <div className="rounded-3xl bg-white p-4 md:p-6 space-y-4 text-slate-900">
        {/* Filtros (tarjeta oscura) */}
        <div className="card-dark p-4">
          <div className="grid md:grid-cols-4 gap-3">
            <input
              placeholder="Buscar por nombre/correo"
              className="input-dark"
              value={filters.search}
              onChange={(e) => {
                setFilters((f) => ({ ...f, search: e.target.value }));
                setPage(1);
              }}
            />
            <input
              placeholder="Área ID (opcional)"
              className="input-dark"
              value={filters.area_id}
              onChange={(e) => {
                setFilters((f) => ({ ...f, area_id: e.target.value }));
                setPage(1);
              }}
            />
            <select
              className="select-dark"
              value={filters.estado}
              onChange={(e) => {
                setFilters((f) => ({ ...f, estado: e.target.value as Filters["estado"] }));
                setPage(1);
              }}
            >
              <option value="">Estado…</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
            <button
              className="btn"
              onClick={() => {
                setFilters({ search: "", area_id: "", estado: "" });
                setPage(1);
              }}
            >
              Limpiar
            </button>
          </div>
        </div>

        {/* Tabla (oscura) */}
        <div className="card-dark overflow-auto">
          <table className="table-dark">
            <thead>
              <tr>
                <th className="text-left">Nombre</th>
                <th className="text-left">Correo</th>
                <th className="text-left">Área</th>
                <th className="text-left">Nivel</th>
                <th className="text-left">Estado</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-slate-300">
                    Cargando…
                  </td>
                </tr>
              ) : rows.length ? (
                rows.map((r) => {
                  const nombreCompleto = `${r.nombres} ${r.apellidos}`.trim();
                  const disabled = workingId === r.id;
                  return (
                    <tr key={r.id}>
                      <td>{nombreCompleto}</td>
                      <td>{r.correo}</td>
                      <td>{r.area?.nombre ?? r.area_id}</td>
                      <td>{r.nivel?.nombre ?? (r.nivel_id ?? "—")}</td>
                      <td>{r.activo ? <Badge color="green">Activo</Badge> : <Badge color="red">Inactivo</Badge>}</td>
                      <td className="text-right space-x-3">
                        <Link className="text-cyan-300 hover:underline" to={`/admin/responsables/${r.id}`}>
                          Editar
                        </Link>
                        {isAdmin && (
                          <>
                            {r.activo ? (
                              <button
                                className="text-amber-300 hover:underline disabled:opacity-50"
                                onClick={() => handleInactivar(r.id)}
                                disabled={disabled}
                                title="Inactivar"
                              >
                                Inactivar
                              </button>
                            ) : null}
                            <button
                              className="text-rose-300 hover:underline disabled:opacity-50"
                              onClick={() => handleEliminar(r.id, nombreCompleto)}
                              disabled={disabled}
                              title="Eliminar definitivamente"
                            >
                              Eliminar
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-slate-300">
                    Sin resultados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación (clara) */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm">
          <div>Total: {total}</div>
          <div className="space-x-2">
            <button className="btn" disabled={currentPage <= 1} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </button>
            <span>
              Página {currentPage} de {lastPage}
            </span>
            <button className="btn" disabled={currentPage >= lastPage} onClick={() => setPage((p) => p + 1)}>
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
