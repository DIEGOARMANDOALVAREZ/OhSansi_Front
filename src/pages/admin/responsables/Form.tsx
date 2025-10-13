import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createResponsable,
  getResponsable,
  updateResponsable,
  checkActivo,
  inactivarResponsable,
} from "../../../services/responsables";
import type { Responsable } from "../../../services/responsables";
import { fetchAreas, fetchNiveles, type Area, type Nivel } from "../../../services/catalogos";
import { useAuth } from "../../../hooks/useAuth";
import AdminShell from "../../../components/AdminShell";

type BadgeColor = "green" | "red" | "gray";
function Badge({ children, color = "gray" }: { children: ReactNode; color?: BadgeColor }) {
  const map: Record<BadgeColor, string> = {
    green: "bg-emerald-200 text-emerald-900 border-emerald-300",
    red: "bg-rose-200 text-rose-900 border-rose-300",
    gray: "bg-gray-200 text-gray-900 border-gray-300",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${map[color]}`}>
      {children}
    </span>
  );
}

type RoleLike = { slug?: string } | string;

/* ===========================
   ComboBox buscable de Áreas
   =========================== */
function AreaCombo({
  options,
  value,
  onChange,
  placeholder = "Seleccionar…",
  disabled = false,
}: {
  options: Area[];
  value: number | "";
  onChange: (id: number) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const [active, setActive] = useState(0);

  const selected = options.find((o) => o.id === value);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.nombre.toLowerCase().includes(q));
  }, [options, query]);

  // Cerrar al hacer click fuera
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Navegación con teclado
  useEffect(() => {
    if (!open) return;
    setActive(0);
  }, [open, query]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      return;
    }
    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, filtered.length - 1));
      listRef.current?.children[Math.min(active + 1, filtered.length - 1)]?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
      listRef.current?.children[Math.max(active - 1, 0)]?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter") {
      e.preventDefault();
      const choice = filtered[active];
      if (choice) {
        onChange(choice.id);
        setQuery("");
        setOpen(false);
        inputRef.current?.blur();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`mockup-combo flex items-center gap-2 ${disabled ? "opacity-60 pointer-events-none" : ""}`}
        onClick={() => {
          setOpen(true);
          inputRef.current?.focus();
        }}
      >
        <input
          ref={inputRef}
          value={open ? query : selected?.nombre ?? ""}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
           placeholder={selected ? selected.nombre : placeholder}
          className="flex-1 bg-transparent outline-none placeholder-slate-400 text-slate-100"
        />
        {selected && !open && (
          <button
            type="button"
            className="rounded-md px-2 py-1 text-xs bg-slate-800/70 border border-white/10 hover:bg-slate-800/90"
            onClick={(e) => {
              e.stopPropagation();
              setQuery("");
              setOpen(true);
              inputRef.current?.focus();
            }}
            title="Buscar otra área"
          >
            Cambiar
          </button>
        )}
        <span className="mockup-caret">▾</span>
      </div>

      {open && (
        <ul
          ref={listRef}
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-white/10 bg-slate-900/95 shadow-2xl backdrop-blur-xl"
        >
          {filtered.length ? (
            filtered.map((o, idx) => (
              <li
                key={o.id}
                className={`px-3 py-2 cursor-pointer text-sm ${
                  idx === active ? "bg-cyan-500/15 text-cyan-200" : "text-slate-200 hover:bg-white/5"
                }`}
                onMouseEnter={() => setActive(idx)}
                onMouseDown={(e) => {
                  e.preventDefault(); // evita blur antes del click
                  onChange(o.id);
                  setQuery("");
                  setOpen(false);
                  inputRef.current?.blur();
                }}
              >
                {o.nombre}
              </li>
            ))
          ) : (
            <li className="px-3 py-3 text-sm text-slate-400">Sin resultados</li>
          )}
        </ul>
      )}
    </div>
  );
}

/* ===========================
   FORM
   =========================== */
export default function AdminResponsableForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id && id !== "nuevo";

  const { user } = useAuth();
  const isAdmin = useMemo(() => {
    const roles = ((user as { roles?: RoleLike[] } | undefined)?.roles) ?? [];
    return roles.some((r) => {
      const slug = (typeof r === "string" ? r : r.slug ?? "").toUpperCase();
      return slug === "ADMIN" || slug === "ADMINISTRADOR";
    });
  }, [user]);
  const readOnly = !isAdmin;

  const [form, setForm] = useState<Responsable>({
    nombres: "",
    apellidos: "",
    ci: "",
    correo: "",
    telefono: "",
    area_id: 0,
    nivel_id: null,
    activo: true,
  });

  const [areas, setAreas] = useState<Area[]>([]);
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [uniqWarn, setUniqWarn] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(!!isEdit);
  const [saving, setSaving] = useState(false);
  const [loadingCatalogos, setLoadingCatalogos] = useState(true);

  // Catálogos
  useEffect(() => {
    let mounted = true;
    (async () => {
      const [a, n] = await Promise.all([fetchAreas(), fetchNiveles()]);
      if (!mounted) return;
      setAreas(a);
      setNiveles(n);
      setLoadingCatalogos(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Carga de registro si es edición
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!isEdit) return setLoading(false);
      try {
        const data = (await getResponsable(id!)) as Responsable;
        if (!mounted) return;
        setForm({
          id: data.id,
          nombres: data.nombres,
          apellidos: data.apellidos,
          ci: data.ci,
          correo: data.correo,
          telefono: data.telefono ?? "",
          area_id: data.area_id,
          nivel_id: data.nivel_id ?? null,
          activo: !!data.activo,
        });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id, isEdit]);

  async function handleCheckActivo(aid: number, nid?: number | null) {
    setUniqWarn("");
    if (!aid) return;
    const activo = (await checkActivo(aid, nid ?? undefined)) as (Responsable & {
      nombres: string;
      apellidos: string;
      id?: number;
    }) | null;
    if (activo && (!isEdit || (isEdit && activo.id !== form.id))) {
      setUniqWarn(`Actualmente activo: ${activo.nombres} ${activo.apellidos}`);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (readOnly) return;
    setSaving(true);
    setUniqWarn("");
    try {
      const payload: Responsable = {
        ...form,
        area_id: Number(form.area_id || 0),
        nivel_id: form.nivel_id ? Number(form.nivel_id) : null,
      };
      if (isEdit && form.id != null) {
        await updateResponsable(form.id, payload);
      } else {
        await createResponsable(payload);
      }
      navigate("/admin/responsables");
    } catch (err) {
      const resp = (err as { response?: { status?: number; data?: { message?: string } } }).response;
      if (resp?.status === 409) {
        setUniqWarn(resp.data?.message || "Ya existe un responsable activo para esa combinación");
      } else {
        alert("Ocurrió un error al guardar");
      }
    } finally {
      setSaving(false);
    }
  }

  async function onInactivar() {
    if (!isEdit || readOnly || form.id == null) return;
    if (!confirm("¿Inactivar este responsable?")) return;
    await inactivarResponsable(form.id);
    navigate("/admin/responsables");
  }

  if (loading || loadingCatalogos) {
    return (
      <AdminShell title="Responsables académicos" backTo="/admin/responsables">
        <div className="p-6">Cargando…</div>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      title={`${isEdit ? "Editar" : "Nuevo"} responsable`}
      subtitle="Formulario con validaciones y unicidad por área/nivel"
      backTo="/admin/responsables"
      actions={
        isEdit && isAdmin ? (
          <button type="button" onClick={onInactivar} className="btn text-rose-600 border-rose-300">
            Inactivar
          </button>
        ) : null
      }
    >
      {/* Fondo blanco y card oscura tipo mockup */}
      <div className="rounded-3xl bg-white p-4 md:p-6">
        <section className="max-w-5xl mx-auto">
          <div className="mockup-card">
            <h2 className="mockup-title">Registrar responsable académico por área</h2>
            <p className="mockup-subtitle">
              Cobertura UI: validación HTML5, unicidad visual por área/nivel (activo), control de rol y auditoría.
            </p>

            <form onSubmit={onSubmit} className={`${readOnly ? "opacity-90 pointer-events-none select-none" : ""}`}>
              {/* 2 columnas */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mockup-label">Nombres</label>
                  <input
                    className="mockup-input"
                    placeholder="Ej. Ana María"
                    required
                    value={form.nombres}
                    onChange={(e) => setForm((f) => ({ ...f, nombres: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="mockup-label">Apellidos</label>
                  <input
                    className="mockup-input"
                    placeholder="Ej. Rojas Pérez"
                    required
                    value={form.apellidos}
                    onChange={(e) => setForm((f) => ({ ...f, apellidos: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="mockup-label">CI/ID</label>
                  <input
                    className="mockup-input"
                    placeholder="Ej. 7896543 LP"
                    required
                    pattern="^[A-Za-z0-9.\-]{5,20}$"
                    title="5–20 caracteres: números/letras/guiones/puntos."
                    value={form.ci}
                    onChange={(e) => setForm((f) => ({ ...f, ci: e.target.value }))}
                  />
                  <p className="mockup-help">5–20 caracteres: números/letras/guiones/puntos.</p>
                </div>
                <div>
                  <label className="mockup-label">Correo</label>
                  <input
                    className="mockup-input"
                    placeholder="responsable@ejemplo.edu"
                    required
                    type="email"
                    value={form.correo}
                    onChange={(e) => setForm((f) => ({ ...f, correo: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="mockup-label">Teléfono</label>
                  <input
                    className="mockup-input"
                    placeholder="Ej. 777-902-758 / +591 777902758"
                    inputMode="tel"
                    autoComplete="tel"
                    value={form.telefono || ""}
                    onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
                    />

                </div>

                {/* Área: Combo buscable */}
                <div>
                  <label className="mockup-label">Área</label>
                  <AreaCombo
                    options={areas}
                    value={form.area_id || ""}
                    onChange={async (idSel) => {
                      setForm((f) => ({ ...f, area_id: idSel }));
                      await handleCheckActivo(idSel, form.nivel_id);
                    }}
                    placeholder="Buscar o seleccionar área…"
                    disabled={readOnly}
                  />
                </div>

                {/* Nivel */}
                <div>
                  <label className="mockup-label">Nivel (si aplica)</label>
                  <div className="relative">
                    <select
                      className="mockup-select-real"
                      value={form.nivel_id ?? ""}
                      onChange={async (e) => {
                        const v = e.target.value ? Number(e.target.value) : null;
                        setForm((f) => ({ ...f, nivel_id: v }));
                        await handleCheckActivo(form.area_id, v);
                      }}
                    >
                      <option value="">—</option>
                      {niveles.map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.nombre}
                        </option>
                      ))}
                    </select>
                    <span className="mockup-caret">▾</span>
                  </div>
                </div>

                <div>
                  <label className="mockup-label">Estado</label>
                  <div className="flex items-center gap-6 pt-2">
                    <label className="inline-flex items-center gap-2 text-slate-100">
                      <input
                        type="radio"
                        className="radio-dark"
                        name="estado"
                        checked={!!form.activo}
                        onChange={() => setForm((f) => ({ ...f, activo: true }))}
                      />
                      Activo
                    </label>
                    <label className="inline-flex items-center gap-2 text-slate-100">
                      <input
                        type="radio"
                        className="radio-dark"
                        name="estado"
                        checked={!form.activo}
                        onChange={() => setForm((f) => ({ ...f, activo: false }))}
                      />
                      Inactivo
                    </label>
                  </div>
                </div>
              </div>

              {uniqWarn && (
                <div className="mt-4">
                  <Badge color="red">{uniqWarn}</Badge>
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap gap-2">
                  <span className="mockup-chip">Validaciones de formato activas</span>
                  <span className="mockup-chip subtle">*Un responsable activo por área/nivel (mensaje UI)</span>
                </div>
                <div className="flex items-center gap-2">
                  {!readOnly && (
                    <button disabled={saving} className="btn-pill-primary">
                      {saving ? "Guardando…" : "Guardar"}
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-pill"
                    onClick={() => (readOnly ? navigate(-1) : window.location.reload())}
                  >
                    Limpiar
                  </button>
                </div>
              </div>
            </form>
          </div>

          {isEdit && (
            <div className="mt-6 card-dark p-4 text-sm text-slate-300">
              <h3 className="text-white/90 font-semibold mb-1">Auditoría</h3>
              <p>Conecta el endpoint /audits para mostrar el historial aquí.</p>
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
