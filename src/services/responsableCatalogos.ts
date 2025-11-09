import { api } from "../api";

export type OpcionesFiltros = {
  areas: Array<{ id: number; nombre: string; activo?: boolean }>;
  niveles: Array<{ id: number; nombre: string }>;
};

export async function fetchOpcionesResponsable(): Promise<OpcionesFiltros> {
  const { data } = await api.get<OpcionesFiltros>("/responsable/opciones-filtros");
  return data;
}
