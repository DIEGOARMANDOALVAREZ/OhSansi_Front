// src/services/clasificacion.ts
import { api } from "../api";

/* ===========================
   Tipos base
   =========================== */
export type Cierre = {
  id: number;
  area_id: number | null;
  nivel_id: number | null;
  minima: number;
  total_clasificados: number;
  total_no_clasificados: number;
  total_desclasificados: number;
  hash: string;
  confirmado_at: string;
};

export type PreviewResponse = {
  area_id: number | null;
  nivel_id: number | null;
  minima: number;
  conteos: {
    clasificados: number;
    no_clasificados: number;
    desclasificados: number;
  };
  confirmado: Cierre | null;
};

export type ClasificadoRow = {
  id: number;
  inscrito: {
    documento: string | null;
    apellidos: string;
    nombres: string;
  };
  nota_final: number;
  concepto: "APROBADO" | "DESAPROBADO" | "DESCLASIFICADO";
};

export type PaginationMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export type ClasificadosPagination = PaginationMeta & {
  data: ClasificadoRow[];
};

/** Opción normalizada para combos (id puede ser string o number) */
export type OpcionCatalogo = {
  id: string | number;
  nombre: string;
};

/* ===========================
   Helpers comunes
   =========================== */

/** Desenvuelve `{ data: ... }` o retorna el valor plano tal cual. */
function unwrap<T>(payload: unknown): T {
  if (typeof payload === "object" && payload !== null && "data" in payload) {
    const box = payload as { data: unknown };
    return box.data as T;
  }
  return payload as T;
}

/** Normaliza arrays del backend para combos */
function normalizeOptions(raw: unknown): OpcionCatalogo[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map<OpcionCatalogo | null>((item) => {
      if (typeof item === "string") {
        const s = item.trim();
        if (!s) return null;
        return { id: s, nombre: s };
      }

      if (typeof item === "object" && item !== null) {
        const o = item as Record<string, unknown>;

        const idCandidate =
          o.id ?? o.value ?? o.area_id ?? o.nivel_id ?? (o as any).slug ?? null;
        const nameCandidate =
          (o as any).nombre ?? (o as any).label ?? (o as any).name ?? (o as any).titulo ?? (o as any).text ?? null;

        const nombre = String(nameCandidate ?? "").trim();
        if (!nombre) return null;

        const idRaw = idCandidate ?? nombre;
        const asNum = Number(idRaw);
        const id = Number.isFinite(asNum) ? asNum : String(idRaw);

        return { id, nombre };
      }

      return null;
    })
    .filter((x): x is OpcionCatalogo => x !== null);
}

/** Token/BURL para export por <a> (cuando no quieres usar axios blob) */
function getBearer(): string | null {
  return localStorage.getItem("ohsansi_token");
}
function getBaseURL(): string {
  return (import.meta.env?.VITE_API_URL as string | undefined) || "/api";
}

/** Normaliza paginadores en formato:
 * 1) { data: [...], current_page, last_page, per_page, total }
 * 2) { data: [...], meta: { current_page, last_page, per_page, total } }
 * 3) { data: { data: [...], current_page, last_page, per_page, total } }
 */
function normalizePagination(payload: any): ClasificadosPagination {
  if (!payload) {
    return { data: [], current_page: 1, last_page: 1, per_page: 15, total: 0 };
  }

  // Caso 3: todo adentro de data
  if (payload?.data && !Array.isArray(payload.data) && typeof payload.data === "object") {
    const box = payload.data;
    return {
      data: Array.isArray(box?.data) ? box.data : [],
      current_page: box?.current_page ?? payload?.meta?.current_page ?? 1,
      last_page: box?.last_page ?? payload?.meta?.last_page ?? 1,
      per_page: box?.per_page ?? payload?.meta?.per_page ?? 15,
      total: box?.total ?? payload?.meta?.total ?? (Array.isArray(box?.data) ? box.data.length : 0),
    };
  }

  // Caso 2: meta separado
  if (payload?.meta) {
    return {
      data: Array.isArray(payload?.data) ? payload.data : [],
      current_page: payload.meta.current_page ?? 1,
      last_page: payload.meta.last_page ?? 1,
      per_page: payload.meta.per_page ?? 15,
      total: payload.meta.total ?? (Array.isArray(payload?.data) ? payload.data.length : 0),
    };
  }

  // Caso 1: todo en raíz
  return {
    data: Array.isArray(payload?.data) ? payload.data : (Array.isArray(payload) ? payload : []),
    current_page: payload?.current_page ?? 1,
    last_page: payload?.last_page ?? 1,
    per_page: payload?.per_page ?? 15,
    total: payload?.total ?? (Array.isArray(payload?.data) ? payload.data.length : 0),
  };
}

/* ===========================
   Servicios principales
   =========================== */

/** Opciones de filtros (áreas y niveles) */
export async function getOpcionesFiltros(): Promise<{
  areas: OpcionCatalogo[];
  niveles: OpcionCatalogo[];
}> {
  const res = await api.get<
    { areas: unknown; niveles: unknown } | { data: { areas: unknown; niveles: unknown } }
  >("/responsable/opciones-filtros");

  const body = unwrap<{ areas: unknown; niveles: unknown }>(res.data);
  return {
    areas: normalizeOptions(body.areas),
    niveles: normalizeOptions(body.niveles),
  };
}

/** Vista previa (conteos + último cierre) */
export async function getPreview(params: {
  area_id?: number | string;
  nivel_id?: number | string | null;
  minima: number;
}): Promise<PreviewResponse> {
  const res = await api.get<PreviewResponse | { data: PreviewResponse }>(
    "/responsable/clasificacion/preview",
    { params }
  );
  return unwrap<PreviewResponse>(res.data);
}

/** Confirmar cierre de clasificación */
export async function confirmClasificacion(params: {
  area_id?: number | string;
  nivel_id?: number | string | null;
  minima: number;
}): Promise<Cierre> {
  const res = await api.post<Cierre | { data: Cierre }>(
    "/responsable/clasificacion/confirm",
    params
  );
  return unwrap<Cierre>(res.data);
}

/** Lista paginada de clasificados (tabla) */
export async function getLista(params: {
  area_id?: number | string;
  nivel_id?: number | string | null;
  minima: number;
  page?: number;
  per_page?: number;
}): Promise<ClasificadosPagination> {
  const res = await api.get<any>("/responsable/clasificacion/list", { params });
  const raw = unwrap<any>(res.data);
  return normalizePagination(raw);
}

/* ===========================
   URLs de exportación (opcional)
   =========================== */
export function exportUrl(params: {
  area_id?: number | string;
  nivel_id?: number | string | null;
  minima: number;
}): string {
  const base = getBaseURL();
  const token = getBearer();
  const u = new URL(`${base}/responsable/clasificacion/export`, window.location.origin);

  if (params.area_id != null && params.area_id !== "")
    u.searchParams.set("area_id", String(params.area_id));
  if (params.nivel_id != null && params.nivel_id !== "")
    u.searchParams.set("nivel_id", String(params.nivel_id));
  u.searchParams.set("minima", String(params.minima));
  if (token) u.searchParams.set("token", token);

  return u.toString().replace(window.location.origin, "");
}

export function exportXlsxUrl(params: {
  area_id?: number | string;
  nivel_id?: number | string | null;
  minima: number;
}): string {
  const base = getBaseURL();
  const token = getBearer();
  const u = new URL(`${base}/responsable/clasificacion/export-xlsx`, window.location.origin);

  if (params.area_id != null && params.area_id !== "")
    u.searchParams.set("area_id", String(params.area_id));
  if (params.nivel_id != null && params.nivel_id !== "")
    u.searchParams.set("nivel_id", String(params.nivel_id));
  u.searchParams.set("minima", String(params.minima));
  if (token) u.searchParams.set("token", token);

  return u.toString().replace(window.location.origin, "");
}
