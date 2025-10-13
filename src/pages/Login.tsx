import { useEffect, useMemo, useState } from "react";
import { api, setToken } from "../api";
import { isAxiosError } from "axios";

// ==== Tipos de dominio ====
type RolSlug = "administrador" | "responsable" | "evaluador" | "comunicaciones" | "auditor";

interface UsuarioDTO {
  id: string;
  nombres: string;
  apellidos: string;
  correo: string;
  roles: RolSlug[];
}

interface LoginResponse {
  token: string;
  usuario: UsuarioDTO;
}

interface ApiErrorBody {
  message?: string;
  errors?: Record<string, string[]>;
}

type Conn = "checking" | "ok" | "error";

export default function Login() {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPass, setMostrarPass] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [conn, setConn] = useState<Conn>("checking");

  // Derivados UI
  const correoValido = useMemo(() => /.+@.+\..+/.test(correo), [correo]);
  const puedeEnviar = correoValido && password.length >= 6 && !cargando;

  // 🔌 Ping al backend al montar + cada 6s
  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const res = await api.get("/api/ping");
        if (!mounted) return;
        setConn(res.status === 200 ? "ok" : "error");
      } catch {
        if (!mounted) return;
        setConn("error");
      }
    };
    check();
    const id = setInterval(check, 6000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  const redirSegunRol = (roles: RolSlug[]) => {
    if (roles.includes("administrador")) location.href = "/admin";
    else if (roles.includes("responsable")) location.href = "/responsable";
    else if (roles.includes("evaluador")) location.href = "/evaluador";
    else location.href = "/";
  };

  const validar = () => {
    if (!correo || !password) {
      setError("Completa tu correo y contraseña.");
      return false;
    }
    if (!correoValido) {
      setError("Ingresa un correo válido.");
      return false;
    }
    return true;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validar()) return;

    setCargando(true);
    try {
      // ⚠️ IMPORTANTE: prefijo /api
      const { data } = await api.post<LoginResponse>("/api/auth/login", { correo: correo.trim(), password });
      setToken(data.token);
      localStorage.setItem("token", data.token);
      localStorage.setItem("usuario", JSON.stringify(data.usuario));
      redirSegunRol(data.usuario.roles);
    } catch (err: unknown) {
      let msg = "Error de red. Intenta nuevamente.";
      if (isAxiosError<ApiErrorBody>(err)) {
        msg = err.response?.data?.message ?? "Credenciales inválidas.";
      }
      setError(msg);
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      <div className="min-h-screen grid place-items-center bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 px-4 py-8">
        <form
          onSubmit={onSubmit}
          className="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/70 backdrop-blur-xl shadow-2xl px-6 py-7 md:px-8 md:py-9"
          aria-labelledby="login-title"
        >
          {/* Glow decorativo */}
          <div className="pointer-events-none absolute -inset-1 -z-10 rounded-3xl bg-gradient-to-tr from-cyan-400 to-indigo-500 opacity-30 blur-2xl" />

          {/* Header */}
          <div className="mb-7 text-center">
            <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-cyan-500/20">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 3l7 4v6c0 4-3 7-7 8-4-1-7-4-7-8V7l7-4z" stroke="#22d3ee" strokeWidth="1.5" />
                <path d="M9 12h6" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <h1 id="login-title" className="text-2xl font-black tracking-tight text-white">
              Ingresar al sistema
            </h1>
            <p className="text-slate-300">OH SanSi – Evaluación y Clasificación</p>
          </div>

          {/* Correo */}
          <label htmlFor="correo" className="mb-1 block text-sm text-slate-300">
            Correo institucional
          </label>
          <div className="relative mb-4">
            <input
              id="correo"
              required
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="usuario@ejemplo.edu"
              className={`w-full rounded-xl border px-4 py-3 pr-10 text-white outline-none transition focus:ring-2 ${
                correo.length === 0
                  ? "bg-slate-900/60 border-white/10 focus:ring-cyan-400"
                  : correoValido
                  ? "bg-slate-900/60 border-emerald-500/40 focus:ring-emerald-400"
                  : "bg-slate-900/60 border-rose-500/40 focus:ring-rose-400"
              }`}
              autoComplete="email"
              autoFocus
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M4 4h16v16H4z" />
                <path d="M22 6l-10 7L2 6" />
              </svg>
            </span>
          </div>

          {/* Contraseña */}
          <label htmlFor="password" className="mb-1 block text-sm text-slate-300">
            Contraseña
          </label>
          <div className="relative mb-2">
            <input
              id="password"
              required
              type={mostrarPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyUp={(e: React.KeyboardEvent<HTMLInputElement>) => setCapsOn(e.getModifierState?.("CapsLock"))}
              placeholder="••••••••"
              className="w-full rounded-xl bg-slate-900/60 border border-white/10 text-white px-4 py-3 pr-12 outline-none transition focus:ring-2 focus:ring-cyan-400"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setMostrarPass((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-300 hover:text-white"
              aria-label={mostrarPass ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {mostrarPass ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.46-1.06 1.13-2.06 2-2.94" />
                  <path d="M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-3.42" />
                  <path d="M22 12c-.46 1.06-1.13 2.06-2 2.94" />
                  <path d="M2 2l20 20" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          {capsOn && (
            <div className="mb-3 rounded-lg border border-amber-700 bg-amber-900/30 px-3 py-2 text-xs text-amber-300">
              Bloq Mayús activado.
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg border border-rose-700 bg-rose-900/30 px-3 py-2 text-rose-200" role="alert" aria-live="polite">
              {error}
            </div>
          )}

          <button
            disabled={!puedeEnviar}
            className="w-full rounded-xl bg-cyan-500 px-4 py-3 font-bold text-slate-900 shadow-lg transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cargando ? "Validando…" : "Entrar"}
          </button>

          <p className="mt-4 text-center text-xs text-slate-400">
            Acceso por roles: Administrador, Responsable Académico, Evaluador.
          </p>
        </form>

        {/* Badge de conexión */}
        <div
          className={`fixed bottom-4 right-4 z-[9999] flex items-center gap-2 rounded-full px-3.5 py-2 text-white shadow-2xl
            ${conn === "ok" ? "bg-emerald-600" : conn === "error" ? "bg-rose-600" : "bg-amber-500"}`}
        >
          <span className="h-2.5 w-2.5 rounded-full bg-white/90 animate-pulse" />
          <span className="text-xs font-semibold">
            {conn === "ok" ? "Conectado al backend" : conn === "error" ? "Sin conexión" : "Verificando..."}
          </span>
        </div>
      </div>
    </>
  );
}
