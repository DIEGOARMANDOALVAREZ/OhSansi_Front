// shared/requiredrole.ts
import { useEffect } from "react";
import type { PropsWithChildren } from "react";
import useAuth from "./useAuth"; // ← si este archivo está en /shared, la ruta correcta es "./useAuth"

/** Rol puede venir como string o como objeto con slug/nombre */
type RoleLike = string | { slug?: string; nombre?: string };

type Props = PropsWithChildren<{
  /** Lista de roles permitidos (comparación case-insensitive) */
  roles?: string[];
  /** Si true, muestra children pero desactiva acciones (inyecta clase en <body>) */
  fallbackToReadOnly?: boolean;
}>;

function toUpperSafe(s?: string) {
  return (s ?? "").toUpperCase();
}

function roleToCandidates(r: RoleLike): string[] {
  if (typeof r === "string") return [toUpperSafe(r)];
  return [toUpperSafe(r.slug), toUpperSafe(r.nombre)];
}

export default function RequireRole({ roles = [], children, fallbackToReadOnly }: Props) {
  const { user } = useAuth();

  // Normalizamos los roles permitidos a mayúsculas para comparación
  const allowed = roles.map((x) => x.toUpperCase());

  const userRoles: RoleLike[] = (user?.roles as RoleLike[]) ?? [];
  const hasRole = allowed.length === 0
    ? true // si no piden roles, dejar pasar
    : userRoles.some((r) => roleToCandidates(r).some((c) => allowed.includes(c)));

  // Inyecta/remueve clase "read-only" SOLO cuando no tiene rol y se solicitó fallback
  useEffect(() => {
    // Evitar tocar el DOM si no existe (SSR)
    if (typeof document === "undefined") return;

    if (fallbackToReadOnly && !hasRole) {
      document.body.classList.add("read-only");
      return () => {
        document.body.classList.remove("read-only");
      };
    }

    // Asegurar limpieza cuando sí tiene rol o no hay fallback
    document.body.classList.remove("read-only");
    return;
  }, [hasRole, fallbackToReadOnly]);

  // Render según permisos/fallback (sin returns antes del hook)
  if (hasRole || fallbackToReadOnly) {
    return <>{children}</>;
  }

  // Bloquea el acceso
  return (
    <div className="max-w-xl mx-auto p-6 text-center">
      <h2 className="text-xl font-semibold mb-2">Acceso restringido</h2>
      <p className="text-gray-600">No tienes permisos para ver esta sección.</p>
    </div>
  );
}
