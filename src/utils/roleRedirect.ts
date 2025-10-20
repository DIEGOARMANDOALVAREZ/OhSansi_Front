// utils/roleRedirect.ts
import type { Usuario } from "../context/AuthContextBase";

const norm = (s?: string) => String(s ?? "").trim().toUpperCase();

export function pathSegunRoles(user?: Usuario | null): string {
  const slugs = (user?.roles ?? []).map((r) => norm(r.slug));

  if (slugs.includes("ADMIN") || slugs.includes("ADMINISTRADOR")) return "/admin";
  if (slugs.includes("RESPONSABLE") || slugs.includes("RESPONSABLE_ACADEMICO"))
    return "/responsable/panel";
  if (slugs.includes("EVALUADOR")) return "/evaluador/panel";
  if (slugs.includes("COMUNICACIONES")) return "/comunicaciones";

  return "/dashboard"; // último recurso
}

export function hasAnyRole(user: Usuario | null | undefined, ...targets: string[]): boolean {
  const slugs = (user?.roles ?? []).map((r) => norm(r.slug));
  return targets.map(norm).some((t) => slugs.includes(t));
}
