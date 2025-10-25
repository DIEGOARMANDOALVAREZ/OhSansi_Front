// src/services/evaluaciones.ts
import { api } from "../api";

export type Concepto = "APROBADO" | "DESAPROBADO" | "DESCLASIFICADO";
export type Notas = Record<string, number>;

export type EvaluacionLight = {
  id: number;
  estado: "borrador" | "finalizado";
  nota_final: number | null;
  concepto: Concepto | null;
  finalizado_at: string | null;
};

export type InscritoAsignado = {
  id: number;
  nombres: string;
  apellidos: string;

  documento?: string | null;

  // Relaciones normalizadas (aunque el origen sea string)
  area?: { id: number | null; nombre: string } | string | null;
  nivel?: { id: number | null; nombre: string } | string | null;

  // Fallbacks (por si algún endpoint trae ids sueltos)
  area_id?: number;
  nivel_id?: number | null;

  evaluacion: EvaluacionLight | null;
};

export type Paginado<T> = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  data: T[];
};

export type GuardarPayload = {
  notas?: Notas | null;
  nota_final?: number | string | null;
  concepto?: Concepto | null;
  observaciones?: string | null;
};

export type FinalizarPayload = {
  // Requerido por el backend; si no manejas criterios, envía []
  notas: Notas | [];
  nota_final: number | string;
  concepto: Concepto;
  observaciones?: string | null;
};

export function toDecimal2(n: string | number | null | undefined): number | null {
  if (n === null || n === undefined || n === "") return null;
  const s = String(n).replace(",", ".");
  const val = Number(s);
  if (Number.isNaN(val)) return null;
  return Math.round(val * 100) / 100;
}

type ApiResponse<T = Record<string, unknown>> = { message?: string; data: T };

// ---------- Helper de errores (sin any) ----------
type ApiErrorData = {
  message?: string;
  errors?: Record<string, string[]>;
};
type ApiErrorShape = {
  response?: { data?: ApiErrorData };
};

export function firstApiError(err: unknown): string | null {
  const e = err as ApiErrorShape;
  const data = e?.response?.data;
  if (!data) return null;

  if (data.errors && typeof data.errors === "object") {
    const firstField = Object.keys(data.errors)[0];
    const firstMsg = data.errors[firstField]?.[0];
    return String(firstMsg ?? data.message ?? "Error de validación");
  }
  if (data.message) return String(data.message);
  return null;
}

// ---------- API ----------
export async function getAsignadas(params?: {
  page?: number;
  per_page?: number;
  search?: string;
}) {
  const { data } = await api.get<Paginado<InscritoAsignado>>("/evaluaciones/asignadas", { params });
  return data;
}

export async function guardarEvaluacion(inscritoId: number | string, payload: GuardarPayload) {
  const body: GuardarPayload = {
    ...payload,
    // "" => null; string/number => decimal; undefined => no tocar
    nota_final:
      payload.nota_final === ""
        ? null
        : payload.nota_final !== undefined
        ? toDecimal2(payload.nota_final)
        : undefined,
    // normaliza concepto a UPPER (no obligatorio en guardar)
    concepto: payload.concepto ? (String(payload.concepto).toUpperCase() as Concepto) : null,
  };

  const { data } = await api.post<ApiResponse<EvaluacionLight>>(
    `/evaluaciones/${inscritoId}/guardar`,
    body
  );
  return data;
}

export async function finalizarEvaluacion(inscritoId: number | string, payload: FinalizarPayload) {
  // Normalizaciones estrictas para cumplir el Request del backend
  const concepto = String(payload.concepto).toUpperCase() as Concepto;

  // Si es DESCLASIFICADO, la nota puede ir null. En otros casos debe ser numérica.
  const nf = concepto === "DESCLASIFICADO" ? null : toDecimal2(payload.nota_final);

  // Validación temprana en front para evitar 422 innecesarios
  if (concepto !== "DESCLASIFICADO" && nf === null) {
    const err = new Error("La nota final es obligatoria y debe ser numérica.");
    // @ts-expect-error attach extra info opcional
    err.__validation = { nota_final: ["La nota final es obligatoria y debe ser numérica."] };
    throw err;
  }

  // Fuerza array vacío cuando no manejas criterios (el backend exige 'required|array')
  const body: {
    notas: [];
    nota_final: number | null;
    concepto: Concepto;
    observaciones: string | null;
  } = {
    notas: [], // ← **siempre array**, nunca {}
    nota_final: nf, // ← null si desclasifica; número si aprueba/desaprueba
    concepto,
    observaciones: payload.observaciones ?? null,
  };

  const { data } = await api.post<ApiResponse<EvaluacionLight>>(
    `/evaluaciones/${inscritoId}/finalizar`,
    body
  );
  return data;
}

export async function reabrirEvaluacion(inscritoId: number | string, motivo: string) {
  const { data } = await api.post<ApiResponse<EvaluacionLight>>(
    `/evaluaciones/${inscritoId}/reabrir`,
    { motivo }
  );
  return data;
}
