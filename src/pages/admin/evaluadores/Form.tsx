import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createEvaluador,
  getEvaluador,
  updateEvaluador,
  emitirTokenEvaluador,
  revocarTokensEvaluador,
  type Evaluador as EvaluadorSrv,
} from "../../../services/evaluadores";
import { fetchAreas, fetchNiveles, type Area, type Nivel } from "../../../services/catalogos";
import AdminShell from "../../../components/AdminShell";

// Tipo Evaluador (frontend)
export type Evaluador = {
  id?: string;
  nombres: string;
  apellidos: string;
  ci: string;
  correo: string;
  telefono?: string | null;
  rol: "EVALUADOR";
  area_id: number[];
  nivel_id: string | number;
  asociaciones: Array<{ area_id: string; nivel_id?: string | null }>;
};

// Badge de áreas seleccionadas
function SelectedAreaBadge({
  area,
  onRemove,
}: {
  area: Area;
  onRemove: (id: number) => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full bg-cyan-500/15 text-cyan-200 border border-cyan-500/30">
      {area.nombre}
      <button
        type="button"
        onClick={() => onRemove(area.id)}
        className="ml-1 -mr-1 h-4 w-4 flex items-center justify-center rounded-full text-cyan-200 hover:text-white hover:bg-cyan-600/50 transition"
        aria-label={`Eliminar área ${area.nombre}`}
      >
        &times;
      </button>
    </span>
  );
}

// ComboBox multi-Área
function AreaMultiCombo({
  options,
  value,
  onChange,
  placeholder = "Seleccionar…",
  disabled = false,
}: {
  options: Area[];
  value: number[];
  onChange: (selectedIds: number[]) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const [active, setActive] = useState(0);

  const selectedAreas = useMemo(() => options.filter((o) => value.includes(o.id)), [options, value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const availableOptions = options.filter((o) => !value.includes(o.id));
    if (!q) return availableOptions;
    return availableOptions.filter((o) => o.nombre.toLowerCase().includes(q));
  }, [options, query, value]);

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
        onChange([...value, choice.id]);
        setQuery("");
        setOpen(false);
        inputRef.current?.focus();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
    };
  }, []);

  useEffect(() => {
    if (open) setActive(0);
  }, [query, open]);

  const handleRemoveArea = (idToRemove: number) => {
    onChange(value.filter((id) => id !== idToRemove));
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedAreas.map((area) => (
          <SelectedAreaBadge key={area.id} area={area} onRemove={handleRemoveArea} />
        ))}
      </div>

      <div
        className={`mockup-combo flex items-center gap-2 ${disabled ? "opacity-60 pointer-events-none" : ""}`}
        onClick={() => {
          setOpen(true);
          inputRef.current?.focus();
        }}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={selectedAreas.length > 0 ? "Buscar más áreas..." : placeholder}
          disabled={disabled}
          className="flex-1 bg-transparent outline-none placeholder-slate-400 text-slate-100"
        />
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
                className={`px-3 py-2 cursor-pointer text-sm ${idx === active ? "bg-cyan-500/15 text-cyan-200" : "text-slate-200 hover:bg-white/5"}`}
                onMouseEnter={() => setActive(idx)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange([...value, o.id]);
                  setQuery("");
                  setOpen(false);
                  inputRef.current?.blur();
                }}
              >
                {o.nombre}
              </li>
            ))
          ) : (
            <li className="px-3 py-3 text-sm text-slate-400">
              {query ? "Sin resultados" : "Todas las áreas seleccionadas o no hay más opciones"}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

// FORMULARIO EVALUADOR
export default function EvaluadorForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<Evaluador>({
    nombres: "",
    apellidos: "",
    ci: "",
    correo: "",
    telefono: "",
    rol: "EVALUADOR",
    area_id: [],
    nivel_id: "",
    asociaciones: [],
  });

  const [areas, setAreas] = useState<Area[]>([]);
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [loading, setLoading] = useState<boolean>(!!isEdit);
  const [saving, setSaving] = useState(false);
  const [loadingCatalogos, setLoadingCatalogos] = useState(true);

  const [tokenPlain, setTokenPlain] = useState<string | null>(null);
  const [tokenModalOpen, setTokenModalOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [areasData, nivelesData] = await Promise.all([fetchAreas(), fetchNiveles()]);
      if (!mounted) return;
      setAreas(areasData);
      setNiveles(nivelesData);
      setLoadingCatalogos(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!isEdit || !id) return setLoading(false);
      try {
        const data = await getEvaluador(id);
        if (!mounted) return;
        setForm({
          ...(data as EvaluadorSrv),
          ci: data.ci ?? "",
          area_id: Array.isArray(data.area_id) ? data.area_id.map(Number) : [],
          nivel_id: data.nivel_id ?? "",
          asociaciones: data.asociaciones?.map((a) => ({
            area_id: String(a.area_id),
            nivel_id: a.nivel_id == null ? null : String(a.nivel_id),
          })) ?? [],
        } as Evaluador);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id, isEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAreaChange = (selectedAreas: number[]) => {
    setForm({ ...form, area_id: selectedAreas });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const asociaciones = form.area_id.map((aid) => ({
        area_id: String(aid),
        nivel_id: form.nivel_id === "" ? null : String(form.nivel_id),
      }));

      const payload = {
        ...form,
        nivel_id: form.nivel_id === "" ? null : Number(form.nivel_id),
        asociaciones,
      };

      if (isEdit && id) {
        await updateEvaluador(id, payload);
      } else {
        await createEvaluador(payload);
      }
      navigate("/admin/evaluadores");
    } catch (error) {
      console.error("Error al guardar el evaluador", error);
      alert("Ocurrió un error al guardar");
    } finally {
      setSaving(false);
    }
  };

  async function handleEmitirToken() {
    if (!isEdit || !id) return;
    try {
      const res = await emitirTokenEvaluador(id, { name: "panel-admin" });
      setTokenPlain(res.token);
      setTokenModalOpen(true);
    } catch (e) {
      alert("No se pudo emitir el token.");
      console.error(e);
    }
  }

  async function handleRevocarTokens() {
    if (!isEdit || !id) return;
    if (!confirm("Revocar TODOS los tokens emitidos para este evaluador?")) return;
    try {
      await revocarTokensEvaluador(id);
      alert("Tokens revocados.");
    } catch (e) {
      alert("No se pudo revocar los tokens.");
      console.error(e);
    }
  }

  if (loading || loadingCatalogos) {
    return (
      <AdminShell title="Evaluadores" backTo="/admin/evaluadores">
        <div className="p-6 text-slate-900">Cargando…</div>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      title={isEdit ? "Editar Evaluador" : "Nuevo Evaluador"}
      subtitle="Formulario para crear o editar evaluadores (múltiples áreas) — Login por CI"
      backTo="/admin/evaluadores"
    >
      <div className="rounded-3xl bg-white p-4 md:p-6">
        <section className="max-w-5xl mx-auto">
          <div className="mockup-card">
            <h2 className="mockup-title">Registrar Evaluador</h2>
            <p className="mockup-subtitle">Permite asignar múltiples áreas de evaluación y un nivel único.</p>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="mockup-label">Nombres</label>
                  <input
                    type="text"
                    name="nombres"
                    value={form.nombres}
                    onChange={handleChange}
                    className="mockup-input"
                    placeholder="Ej. Juan Carlos"
                    required
                  />
                </div>
                <div>
                  <label className="mockup-label">Apellidos</label>
                  <input
                    type="text"
                    name="apellidos"
                    value={form.apellidos}
                    onChange={handleChange}
                    className="mockup-input"
                    placeholder="Ej. Mamani Cruz"
                    required
                  />
                </div>

                <div>
                  <label className="mockup-label">CI</label>
                  <input
                    type="text"
                    name="ci"
                    value={form.ci}
                    onChange={handleChange}
                    className="mockup-input"
                    placeholder="Ej. 12345678"
                    required
                  />
                </div>

                <div>
                  <label className="mockup-label">Correo</label>
                  <input
                    type="email"
                    name="correo"
                    value={form.correo}
                    onChange={handleChange}
                    className="mockup-input"
                    placeholder="evaluador@ejemplo.edu"
                    required
                  />
                </div>
                <div>
                  <label className="mockup-label">Teléfono</label>
                  <input
                    type="text"
                    name="telefono"
                    value={form.telefono || ""}
                    onChange={handleChange}
                    className="mockup-input"
                    placeholder="Ej. 777902758"
                  />
                </div>

                {/* Áreas */}
                <div className="md:col-span-2">
                  <label className="mockup-label">Áreas de Evaluación</label>
                  <AreaMultiCombo
                    options={areas}
                    value={form.area_id}
                    onChange={handleAreaChange}
                    placeholder="Buscar o seleccionar área…"
                  />
                  <p className="mockup-help">El Evaluador puede pertenecer a múltiples áreas.</p>
                </div>

                {/* Nivel */}
                <div>
                  <label className="mockup-label">Nivel</label>
                  <div className="relative">
                    <select
                      name="nivel_id"
                      value={form.nivel_id || ""}
                      onChange={handleChange}
                      className="mockup-select-real"
                      required
                    >
                      <option value="" disabled>Seleccionar Nivel</option>
                      {niveles.map((nivel) => (
                        <option key={nivel.id} value={nivel.id}>
                          {nivel.nombre}
                        </option>
                      ))}
                    </select>
                    <span className="mockup-caret">▾</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap justify-between gap-4">
                <div className="flex gap-2">
                  {isEdit && (
                    <>
                      <button
                        type="button"
                        className="rounded-xl border border-white/10 bg-slate-800/60 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
                        onClick={handleEmitirToken}
                      >
                        Emitir token de acceso
                      </button>
                      <button
                        type="button"
                        className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-200 hover:bg-amber-500/20"
                        onClick={handleRevocarTokens}
                      >
                        Revocar tokens
                      </button>
                    </>
                  )}
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="btn-pill-primary" disabled={saving}>
                    {saving ? "Guardando..." : "Guardar"}
                  </button>
                  <button type="button" className="btn-pill" onClick={() => navigate("/admin/evaluadores")}>
                    Cancelar
                  </button>
                </div>
              </div>
            </form>

            {/* Modal token emitido */}
            {tokenModalOpen && (
              <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
                <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-5 text-white shadow-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold">Token emitido</h3>
                    <button onClick={() => setTokenModalOpen(false)} className="text-slate-300 hover:text-white">✕</button>
                  </div>
                  {tokenPlain ? (
                    <div className="space-y-3">
                      <p className="text-sm text-slate-300">
                        Comparte este token con el evaluador. Se usará junto con su correo para ingresar (si habilitas login por token).
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          readOnly
                          value={tokenPlain}
                          className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-white"
                        />
                        <button
                          className="rounded-lg bg-cyan-500 px-3 py-2 text-slate-900 font-semibold hover:bg-cyan-400"
                          onClick={() => navigator.clipboard.writeText(tokenPlain)}
                        >
                          Copiar
                        </button>
                      </div>
                      <p className="text-xs text-slate-400">⚠️ Por seguridad, este token no vuelve a mostrarse.</p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-300">No se obtuvo el token.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
