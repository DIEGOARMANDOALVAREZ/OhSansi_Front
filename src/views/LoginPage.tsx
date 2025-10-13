import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../hooks/useAuth";
import { login } from "../services/auth";

function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return (err.response?.data as { message?: string } | undefined)?.message ?? err.message;
  }
  if (err instanceof Error) return err.message;
  return "Ha ocurrido un error inesperado";
}

export default function LoginPage() {
  const nav = useNavigate();
  const { refresh } = useAuth();

  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [verPass, setVerPass] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const correoValido = useMemo(() => /.+@.+\..+/.test(correo), [correo]);
  const puedeEnviar = correoValido && password.length >= 6 && !loading;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    if (!puedeEnviar) {
      setErr("Verifica tu correo y contraseña.");
      return;
    }
    setLoading(true);
    try {
      await login(correo.trim(), password);
      await refresh();
      nav("/");
    } catch (error: unknown) {
      setErr(getErrorMessage(error) || "Credenciales inválidas");
    } finally {
      setLoading(false);
    }
  }

  // Fondo acorde al mockup (oscuro)
  useEffect(() => {
    document.body.classList.add("bg-slate-950");
    return () => document.body.classList.remove("bg-slate-950");
  }, []);

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 px-4 py-8">
      {/* Contenedor principal (glass + glow) */}
      <form
        onSubmit={onSubmit}
        aria-label="Formulario de acceso al sistema OH SanSi"
        className="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/70 backdrop-blur-xl shadow-2xl px-6 py-7 md:px-8 md:py-9"
      >
        {/* Glow decorativo */}
        <div className="pointer-events-none absolute -inset-1 -z-10 rounded-3xl bg-gradient-to-tr from-cyan-400 to-indigo-500 opacity-30 blur-2xl" />

        {/* Encabezado */}
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

        {/* Correo */}
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
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-80">
              <path d="M4 4h16v16H4z" stroke="currentColor" strokeWidth="1.6" />
              <path d="M22 6l-10 7L2 6" stroke="currentColor" strokeWidth="1.6" />
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
            type={verPass ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyUp={(e) => setCapsOn(e.getModifierState?.("CapsLock"))}
            placeholder="••••••••"
            autoComplete="current-password"
            className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 pr-12 text-white outline-none transition focus:ring-2 focus:ring-cyan-400"
          />
          <button
            type="button"
            onClick={() => setVerPass((v) => !v)}
            aria-label={verPass ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-300 hover:text-white"
          >
            {verPass ? (
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

        {/* Error */}
        {err && (
          <div
            className="mb-4 rounded-lg border border-rose-700 bg-rose-900/30 px-3 py-2 text-rose-200"
            role="alert"
            aria-live="polite"
          >
            {err}
          </div>
        )}

        {/* Acciones */}
        <button
          type="submit"
          disabled={!puedeEnviar}
          className="inline-flex w-full items-center justify-center rounded-xl bg-cyan-500 px-4 py-3 font-bold text-slate-900 shadow-lg transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Validando…" : "Entrar"}
        </button>

        <p className="mt-4 text-center text-xs text-slate-400">
          Acceso por roles: Administrador, Responsable Académico, Evaluador.
        </p>
      </form>
    </div>
  );
}
