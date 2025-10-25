import { api } from "../api";

/** Envoltorio común { message?, data } que devuelve el backend */
type ApiEnvelope<T> = { message?: string; data: T };

/** Tipado de asociación área-nivel */
export type EvaluadorAsociacion = {
  area_id: string | number;
  nivel_id?: string | number | null;
};

/** Tipado de modelo principal (form/front) */
export type Evaluador = {
  id?: string | number;
  nombres: string;
  apellidos: string;
  ci?: string;
  correo: string;
  telefono?: string | null;
  rol: "EVALUADOR";
  asociaciones: EvaluadorAsociacion[];

  // Propiedades solo de UI (form)
  area_id?: number[];
  nivel_id?: string | number | null;
};

/** Filtros de listado */
export type EvaluadorFilters = {
  search?: string;
  area_id?: string | number;
  nivel_id?: string | number;
  page?: number;
  per_page?: number;
};

/** Fila para listados */
export type EvaluadorRow = {
  id: string | number;
  nombres: string;
  apellidos: string;
  ci?: string;
  correo: string;
  telefono?: string | null;
  rol: "EVALUADOR";
  asociaciones: EvaluadorAsociacion[];
  area: { nombre: string };
  nivel: { nombre: string } | null;
};

export type PaginationMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export type EvaluadorPagination = PaginationMeta & {
  data: EvaluadorRow[];
};

type RawEvaluadorAPI = {
  id: string | number;
  nombres: string;
  apellidos: string;
  ci?: string | null;
  correo: string;
  telefono?: string | null;
  asociaciones?: Array<{ area_id: string | number; nivel_id?: string | number | null }>;
};

function deriveAreaNivelStrings(asociaciones: EvaluadorAsociacion[] | undefined) {
  if (!asociaciones || asociaciones.length === 0) {
    return { area: "—", nivel: "—" };
  }
  const areas = asociaciones.map((a) => String(a.area_id)).join(", ");
  const niveles = asociaciones.map((a) => (a.nivel_id ?? "—")).join(", ");
  return { area: areas, nivel: niveles };
}

export async function fetchEvaluadores(
  params: EvaluadorFilters = {}
): Promise<EvaluadorPagination> {
  const { data } = await api.get<PaginationMeta & { data: RawEvaluadorAPI[] }>(
    "/evaluadores",
    { params }
  );

  const rows: EvaluadorRow[] = data.data.map((raw) => {
    const asociaciones: EvaluadorAsociacion[] = Array.isArray(raw.asociaciones)
      ? raw.asociaciones
      : [];

    const { area, nivel } = deriveAreaNivelStrings(asociaciones);

    return {
      id: raw.id,
      nombres: raw.nombres,
      apellidos: raw.apellidos,
      ci: (raw.ci ?? "") as string,
      correo: raw.correo,
      telefono: raw.telefono ?? null,
      rol: "EVALUADOR",
      asociaciones,
      area: { nombre: area },
      nivel: { nombre: nivel },
    };
  });

  return {
    current_page: data.current_page,
    last_page: data.last_page,
    per_page: data.per_page,
    total: data.total,
    data: rows,
  };
}

export async function getEvaluador(id: string | number): Promise<Evaluador> {
  const { data } = await api.get<Evaluador>(`/evaluadores/${id}`);
  const asociaciones = data.asociaciones ?? [];
  const area_id = asociaciones.map((a) => Number(a.area_id)).filter((n) => !Number.isNaN(n));
  const nivel_id = asociaciones.length > 0 ? asociaciones[0].nivel_id ?? null : null;

  return { ...data, area_id, nivel_id };
}

function asociacionesFromForm(e: Evaluador): EvaluadorAsociacion[] {
  if (Array.isArray(e.area_id) && e.area_id.length > 0) {
    return e.area_id.map((a) => ({
      area_id: a,
      nivel_id: e.nivel_id ?? null,
    }));
  }
  return e.asociaciones ?? [];
}

export async function createEvaluador(payload: Evaluador): Promise<Evaluador> {
  const asociaciones = asociacionesFromForm(payload);
  const body = { ...payload, asociaciones };
  const { data } = await api.post<ApiEnvelope<Evaluador>>("/evaluadores", body);
  return data.data;
}

export async function updateEvaluador(
  id: string | number,
  payload: Partial<Evaluador>
): Promise<Evaluador> {
  const asociaciones = payload.asociaciones ?? asociacionesFromForm(payload as Evaluador);
  const body = { ...payload, asociaciones };
  const { data } = await api.put<ApiEnvelope<Evaluador>>(`/evaluadores/${id}`, body);
  return data.data;
}

export async function eliminarEvaluador(
  id: string | number,
  hard?: boolean
): Promise<{ message?: string }> {
  const { data } = await api.delete<{ message?: string }>(`/evaluadores/${id}`, {
    params: hard ? { hard: 1 } : undefined,
  });
  return data;
}

/** (Admin) Tokens: opcional */
export async function emitirTokenEvaluador(
  id: string | number,
  options?: { rotar?: boolean; name?: string }
): Promise<{ message?: string; token: string }> {
  const { data } = await api.post<{ message?: string; token: string }>(
    `/admin/evaluadores/${id}/emitir-token`,
    options ?? {}
  );
  return data;
}

export async function revocarTokensEvaluador(
  id: string | number
): Promise<{ message?: string }> {
  const { data } = await api.post<{ message?: string }>(
    `/admin/evaluadores/${id}/revocar-tokens`
  );
  return data;
}
