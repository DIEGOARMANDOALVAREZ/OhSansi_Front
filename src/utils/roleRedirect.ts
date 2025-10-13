import type { Usuario } from "../context/AuthContextBase";

export function pathSegunRoles(user: Usuario): string {
  const slugs = (user.roles || []).map(r => r.slug);
  if (slugs.includes("administrador")) return "/admin";
  if (slugs.includes("responsable"))   return "/responsable";
  if (slugs.includes("evaluador"))     return "/evaluador";
  if (slugs.includes("comunicaciones"))return "/comunicaciones";
  return "/dashboard";
}
