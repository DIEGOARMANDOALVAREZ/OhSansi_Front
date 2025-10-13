// ui/audittrail.tsx
import { useEffect, useState } from "react";
import { api } from "../api";

type AuditUser = {
  nombres?: string;
  apellidos?: string;
};

type AuditRow = {
  id?: number | string;
  created_at?: string; // ISO fecha/hora
  date?: string;       // alternativo
  user?: AuditUser | null;
  user_id?: number | string | null;
  action?: string;
  changes?: unknown;
};

type AuditPagination = {
  data: AuditRow[];
  current_page?: number;
  last_page?: number;
  total?: number;
};

function fmtDate(input?: string) {
  if (!input) return new Date().toLocaleString();
  const d = new Date(input);
  return isNaN(d.getTime()) ? new Date().toLocaleString() : d.toLocaleString();
}

export default function AuditTrail({
  entity,
  entityId,
}: {
  entity: string;
  entityId: number | string;
}) {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get<AuditPagination | AuditRow[]>("/audits", {
          params: { entity_type: entity, entity_id: entityId },
        });

        if (!mounted) return;

        if (Array.isArray(data)) {
          setRows(data);
        } else if (data && Array.isArray(data.data)) {
          setRows(data.data);
        } else {
          setRows([]);
        }
      } catch {
        // Podemos registrar o mostrar un toast aquí si deseas
        setRows([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [entity, entityId]);

  if (loading) return <p className="text-sm text-gray-500">Cargando auditoría…</p>;
  if (rows.length === 0) return <p className="text-sm text-gray-500">Sin registros</p>;

  return (
    <div className="mt-4 border rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left px-3 py-2">Fecha</th>
            <th className="text-left px-3 py-2">Usuario</th>
            <th className="text-left px-3 py-2">Acción</th>
            <th className="text-left px-3 py-2">Cambios</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const fecha = fmtDate(r.created_at ?? r.date);
            const usuario =
              r.user && (r.user.nombres || r.user.apellidos)
                ? `${r.user.nombres ?? ""} ${r.user.apellidos ?? ""}`.trim()
                : r.user_id ?? "—";
            return (
              <tr key={r.id ?? i} className="border-top border-t">
                <td className="px-3 py-2 whitespace-nowrap">{fecha}</td>
                <td className="px-3 py-2">{usuario}</td>
                <td className="px-3 py-2">{r.action ?? "—"}</td>
                <td className="px-3 py-2">
                  <pre className="text-xs bg-gray-50 p-2 rounded-lg overflow-auto max-h-48">
                    {JSON.stringify(r.changes ?? {}, null, 2)}
                  </pre>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
