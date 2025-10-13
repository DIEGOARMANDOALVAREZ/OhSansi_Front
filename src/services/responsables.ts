import { api } from "../api";

/** Tipado de modelo principal */
export type Responsable = {
  id?: number;
  nombres: string;
  apellidos: string;
  ci: string;
  correo: string;
  telefono?: string | null;
  area_id: number;
  nivel_id?: number | null;
  activo: boolean;
};

/** Filtros opcionales para listar responsables */
export type ResponsableFilters = {
  search?: string;
  area_id?: number | string;
  nivel_id?: number | string;
  estado?: "activo" | "inactivo" | string;
  page?: number;
  per_page?: number;
};

/** Estructura esperada del paginado de Laravel */
export type ResponsablePagination = {
  data: Responsable[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  meta?: unknown;
};

/** Obtener lista paginada */
export async function fetchResponsables(
  params: ResponsableFilters = {}
): Promise<ResponsablePagination> {
  const { data } = await api.get<ResponsablePagination>("/responsables", { params });
  return data;
}

/** Obtener un responsable por ID (show devuelve el objeto directo) */
export async function getResponsable(id: string | number): Promise<Responsable> {
  const { data } = await api.get<Responsable>(`/responsables/${id}`);
  return data;
}

/** Crear nuevo responsable (store devuelve { message, data }) */
export async function createResponsable(payload: Responsable): Promise<Responsable> {
  const { data } = await api.post<{ message?: string; data: Responsable }>("/responsables", payload);
  return data.data; // 👈 desenvuelve
}

/** Actualizar responsable (update devuelve { message, data }) */
export async function updateResponsable(
  id: string | number,
  payload: Partial<Responsable>
): Promise<Responsable> {
  const { data } = await api.put<{ message?: string; data: Responsable }>(`/responsables/${id}`, payload);
  return data.data; // 👈 desenvuelve
}

/** Inactivar (DELETE lógico) un responsable */
export async function inactivarResponsable(id: string | number): Promise<{ message?: string }> {
  const { data } = await api.delete<{ message?: string }>(`/responsables/${id}`);
  return data;
}

/** Verifica si ya existe un responsable activo en el área/nivel indicado */
export async function checkActivo(
  area_id: number,
  nivel_id?: number | null
): Promise<Responsable | null> {
  const params: ResponsableFilters = {
    area_id,
    nivel_id: nivel_id ?? undefined,
    estado: "activo",
    per_page: 1,
  };
  const res = await fetchResponsables(params);
  return res?.data?.[0] ?? null;
}


export async function eliminarResponsable(id: number, hard = false): Promise<{ message?: string }> {
  const { data } = await api.delete<{ message?: string }>(`/responsables/${id}`, {
    params: hard ? { hard: 1 } : undefined,
  });
  return data;
}