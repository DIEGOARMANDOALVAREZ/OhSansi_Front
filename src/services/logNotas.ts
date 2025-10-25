import { api } from "../api"; // 👈 igual que en clasificacion.ts

export type LogEntry = {
  id: number;
  occurred_at: string; // ISO
  usuario: { id: number; email: string; nombre: string } | null;
  competidor:
    | { id: number; nombre_completo: string; documento?: string | null }
    | null;
  campo: string;
  anterior: string | number | null;
  nuevo: string | number | null;
  motivo: string | null;
};

export type LogPagination = {
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

export type LogQuery = {
  q_competidor?: string;
  q_evaluador?: string;
  area_id?: number;
  nivel_id?: number;
  date_from?: string; // YYYY-MM-DD
  date_to?: string;   // YYYY-MM-DD
  page?: number;
  per_page?: number;
  sort_by?: "occurred_at" | "campo" | "usuario" | "competidor";
  sort_dir?: "asc" | "desc";
};

/** Lee el token del responsable para fallback ?token=... */
function getResponsableToken(): string | null {
  // Usa la misma key que en tu proyecto. Pruebo varias comunes.
  return (
    localStorage.getItem("ohsansi_token") ||
    localStorage.getItem("responsableToken") ||
    localStorage.getItem("token") ||
    null
  );
}

/** Fusiona params con ?token=... para que el middleware lo acepte aunque no llegue Authorization */
function withTokenParam<T extends Record<string, unknown>>(params: T): T & { token?: string } {
  const t = getResponsableToken();
  return t ? { ...params, token: t } : params;
}

/** Cargar log (tabla) */
export async function fetchLog(query: LogQuery): Promise<LogPagination> {
  const { data } = await api.get<LogPagination>("/responsable/log-notas", {
    // 👇 va con ?token=... además del Authorization que agregue tu api.ts (si lo hace)
    params: withTokenParam(query),
  });
  return data;
}

/** Exportar CSV */
export async function exportLogCSV(query: LogQuery): Promise<Blob> {
  const res = await api.get("/responsable/log-notas/export", {
    params: withTokenParam(query),
    responseType: "blob",
  });
  return res.data as Blob;
}

/** Exportar XLSX (si backend devuelve 501, tu front ya hace fallback a CSV) */
export async function exportLogXLSX(query: LogQuery): Promise<Blob> {
  const res = await api.get("/responsable/log-notas/export-xlsx", {
    params: withTokenParam(query),
    responseType: "blob",
  });
  return res.data as Blob;
}
