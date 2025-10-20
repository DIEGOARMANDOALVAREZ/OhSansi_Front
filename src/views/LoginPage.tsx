import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../hooks/useAuth";
import { login, setToken } from "../services/auth";
import { pathSegunRoles } from "../utils/roleRedirect";

type AccessKind = "admin" | "responsable" | "evaluador";

function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const msg = (err.response?.data as { message?: string } | undefined)?.message;
    return msg ?? err.message;
  }
  if (err instanceof Error) return err.message;
  return "Ha ocurrido un error inesperado";
}

export default function LoginPage() {
  const nav = useNavigate();
  const { refresh } = useAuth();

  const [accessKind, setAccessKind] = useState<AccessKind>("admin");
  const [correo, setCorreo] = useState("");
  const [secret, setSecret] = useState(""); // password (admin) o CI (responsable/evaluador)
  const [verPass, setVerPass] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const correoValido = useMemo(() => /.+@.+\..+/.test(correo), [correo]);

  const puedeEnviar = useMemo(() => {
    if (loading) return false;
    if (!correoValido) return false;
    if (accessKind === "admin") return secret.length >= 6; // mínimo contraseña
    return secret.trim().length >= 3; // CI mínima
  }, [loading, correoValido, accessKind, secret]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);

    if (!puedeEnviar) {
      setErr("Verifica tus credenciales.");
      return;
    }

    setLoading(true);
    try {
      // /auth/login debe manejar: admin (password) y responsable/evaluador (CI)
      const data = await login(correo.trim(), secret);

      if (!data.token || !data.user) throw new Error("No se recibió token/usuario del servidor.");

      // Asegura Authorization en axios
      setToken(data.token);

      // Refresca el perfil con el token recién guardado
      await refresh();

      // Redirige según roles del usuario devuelto
      nav(pathSegunRoles(data.user), { replace: true });
    } catch (error: unknown) {
      setErr(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    document.body.classList.add("bg-slate-950");
    return () => document.body.classList.remove("bg-slate-950");
  }, []);

  const esAdmin = accessKind === "admin";
  const etiquetaSecret = esAdmin ? "Contraseña" : (accessKind === "responsable" ? "CI (Responsable)" : "CI (Evaluador)");
  const placeholderSecret = esAdmin ? "••••••••" : "Ej: 12345678";
  const tipoSecret = esAdmin ? (verPass ? "text" : "password") : "text";
  const autoCompleteSecret = esAdmin ? "current-password" : "off";

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 px-4 py-8">
      <form
        onSubmit={onSubmit}
        aria-label="Formulario de acceso al sistema OH SanSi"
        className="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/70 backdrop-blur-xl shadow-2xl px-6 py-7 md:px-8 md:py-9"
      >
        <div className="pointer-events-none absolute -inset-1 -z-10 rounded-3xl bg-gradient-to-tr from-cyan-400 to-indigo-500 opacity-30 blur-2xl" />

        {/* Selector de tipo de acceso */}
        <div className="mb-5 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setAccessKind("admin")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition border ${
              accessKind === "admin"
                ? "bg-cyan-500 text-slate-900 border-cyan-400"
                : "bg-slate-800/60 text-slate-200 border-white/10 hover:border-cyan-400/40"
            }`}
          >
            Administrador
          </button>
          <button
            type="button"
            onClick={() => setAccessKind("responsable")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition border ${
              accessKind === "responsable"
                ? "bg-cyan-500 text-slate-900 border-cyan-400"
                : "bg-slate-800/60 text-slate-200 border-white/10 hover:border-cyan-400/40"
            }`}
          >
            Responsable
          </button>
          <button
            type="button"
            onClick={() => setAccessKind("evaluador")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition border ${
              accessKind === "evaluador"
                ? "bg-cyan-500 text-slate-900 border-cyan-400"
                : "bg-slate-800/60 text-slate-200 border-white/10 hover:border-cyan-400/40"
            }`}
          >
            Evaluador
          </button>
        </div>

        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-cyan-500/20">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 3l7 4v6c0 4-3 7-7 8-4-1-7-4-7-8V7l7-4z" stroke="#22d3ee" strokeWidth="1.5" />
              <path d="M9 12h6" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Ingresar al sistema</h1>
          <p className="mt-1 text-sm text-slate-300">OH SanSi — Evaluación y Clasificación</p>
        </div>

        <label htmlFor="correo" className="mb-1 block text-sm text-slate-300">
          Correo institucional
        </label>
        <div className="relative mb-4">
          <input
            id="correo"
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="usuario@ejemplo.edu"
            autoComplete="email"
            autoFocus
            className={`w-full rounded-xl border px-4 py-3 pr-10 text-white outline-none transition focus:ring-2 ${
              correo.length === 0
                ? "bg-slate-900/60 border-white/10 focus:ring-cyan-400"
                : correoValido
                ? "bg-slate-900/60 border-emerald-500/40 focus:ring-emerald-400"
                : "bg-slate-900/60 border-rose-500/40 focus:ring-rose-400"
            }`}
          />
        </div>

        <label htmlFor="secret" className="mb-1 block text-sm text-slate-300">
          {etiquetaSecret}
        </label>
        <div className="relative mb-2">
          <input
            id="secret"
            type={tipoSecret}
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            onKeyUp={(e) => esAdmin && setCapsOn(e.getModifierState?.("CapsLock"))}
            placeholder={placeholderSecret}
            autoComplete={autoCompleteSecret}
            className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 pr-12 text-white outline-none transition focus:ring-2 focus:ring-cyan-400"
          />
          {esAdmin && (
            <button
              type="button"
              onClick={() => setVerPass((v) => !v)}
              aria-label={verPass ? "Ocultar contraseña" : "Mostrar contraseña"}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-300 hover:text-white"
            >
              {verPass ? "👁️" : "👁️‍🗨️"}
            </button>
          )}
        </div>

        {esAdmin && capsOn && (
          <div className="mb-3 rounded-lg border border-amber-700 bg-amber-900/30 px-3 py-2 text-xs text-amber-300">
            Bloq Mayús activado.
          </div>
        )}

        {err && (
          <div
            className="mb-4 rounded-lg border border-rose-700 bg-rose-900/30 px-3 py-2 text-rose-200"
            role="alert"
            aria-live="polite"
          >
            {err}
          </div>
        )}

        <button
          type="submit"
          disabled={!puedeEnviar}
          className="inline-flex w-full items-center justify-center rounded-xl bg-cyan-500 px-4 py-3 font-bold text-slate-900 shadow-lg transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? "Validando…"
            : accessKind === "admin"
            ? "Entrar (Admin)"
            : accessKind === "responsable"
            ? "Entrar (Responsable)"
            : "Entrar (Evaluador)"}
        </button>

        <p className="mt-4 text-center text-xs text-slate-400">
          Acceso por roles: Administrador, Responsable Académico, Evaluador.
        </p>
      </form>
    </div>
  );
}
