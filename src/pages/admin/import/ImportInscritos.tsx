import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { simulateImportInscritos, commitImportInscritos } from "../../../services/inscritos"; // Importa las funciones reales

export type ImportError = { row: number; cause: string };
export type ImportSummary = { total: number; inserted: number; rejected: number; errors: ImportError[]; log?: string };

// ======= Ajusta esto a true para usar simulación en el cliente (sin backend)
const USE_LOCAL_SIM = false;  // Cambia a false cuando quieras usar el backend

function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.replace(/\r/g, "").split("\n").filter(l => l.trim().length > 0);
  if (!lines.length) return { headers: [], rows: [] };
  const split = (line: string) => line.split(",").map(s => s.trim());
  const headers = split(lines[0]);
  const rows = lines.slice(1).map(split);
  return { headers, rows };
}

export default function ImportInscritos() {
  const [file, setFile] = useState<File | null>(null);
  const [noDuplicateKey, setNoDuplicateKey] = useState(true);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [loading, setLoading] = useState<"simulate" | "commit" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [csvData, setCsvData] = useState<{ headers: string[]; rows: string[][] } | null>(null);  // Estado para almacenar los datos del CSV

  const canSimulate = useMemo(() => !!file, [file]);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      setFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        const parsedData = parseCsv(text);
        setCsvData(parsedData);  // Establecer los datos parseados en el estado
      };
      reader.readAsText(file);
    }
  }

  async function handleSimulate() {
    if (!file) return;

    setMessage(null);
    setLoading("simulate");

    try {
      const res = await simulateImportInscritos(file, noDuplicateKey);
      setSummary(res);
    } catch (err: any) {
      setMessage(err?.message || "Error al simular la importación.");
      setSummary(null);
    } finally {
      setLoading(null);
    }
  }

  async function handleCommit() {
    if (!file) return;

    setMessage(null);
    setLoading("commit");

    try {
      const res = await commitImportInscritos(file, noDuplicateKey);
      setSummary(res);
      setMessage("✅ Importación confirmada.");
    } catch (err: any) {
      setMessage(err?.message || "Error al confirmar la importación.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-900/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
          <div>
            <h1 className="text-lg font-bold text-white">ID:3 Importar inscritos desde CSV</h1>
            <p className="text-xs text-slate-400">Validación + reporte por fila + resumen + log</p>
          </div>
          <Link
            to="/admin"
            className="rounded-xl bg-cyan-600/80 px-3 py-1.5 text-sm font-semibold text-white shadow hover:bg-cyan-500"
          >
            ← Volver al Admin
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
        {/* Carga */}
        <section className="mb-8 rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-xl">
          <h2 className="mb-3 text-xl font-bold text-white">Archivo CSV</h2>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="block">
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}  // Manejador de cambio de archivo
                className="block w-full cursor-pointer rounded-xl border border-white/10 bg-slate-800/70 p-2 text-slate-200 file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-600/90 file:px-4 file:py-2 file:text-white hover:file:bg-cyan-500"
              />
            </label>

            <button
              onClick={handleSimulate}
              disabled={!canSimulate || loading !== null}
              className="rounded-xl bg-cyan-600/90 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading === "simulate" ? "Simulando..." : "Subir (simulado)"}
            </button>
          </div>

          <p className="mt-3 text-sm text-slate-400">
            Encabezados esperados:{" "}
            <span className="font-mono text-slate-300">
              documento,nombres,apellidos,unidad,area,nivel
            </span>
          </p>

          <label className="mt-4 inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={noDuplicateKey}
              onChange={(e) => setNoDuplicateKey(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-slate-800 text-cyan-500 focus:ring-cyan-400"
            />
            <span className="text-sm text-slate-300">No duplicar: documento + área/nivel</span>
          </label>

          {message && <p className="mt-4 text-sm text-cyan-300">{message}</p>}
        </section>

        {/* Previsualización de datos */}
        {csvData && (
          <section className="mb-8">
            <h3 className="mb-3 text-xl font-extrabold text-white">Previsualización de datos</h3>

            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/70 p-5">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-slate-900/80">
                  <tr>
                    {csvData.headers.map((header, idx) => (
                      <th key={idx} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 bg-slate-900/60">
                  {csvData.rows.map((row, idx) => (
                    <tr key={idx}>
                      {row.map((cell, cellIdx) => (
                        <td key={cellIdx} className="px-4 py-2 text-sm text-slate-200">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Resumen de la importación */}
        {summary && (
          <section className="mb-8">
            <h3 className="mb-3 text-xl font-extrabold text-white">Resumen de importación {USE_LOCAL_SIM && "(simulado)"}</h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
                <p className="text-xs uppercase tracking-wide text-slate-400">Total filas</p>
                <p className="mt-1 text-3xl font-bold text-white">{summary.total}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
                <p className="text-xs uppercase tracking-wide text-slate-400">Insertados</p>
                <p className="mt-1 text-3xl font-bold text-emerald-300">{summary.inserted}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
                <p className="text-xs uppercase tracking-wide text-slate-400">Rechazados</p>
                <p className="mt-1 text-3xl font-bold text-rose-300">{summary.rejected}</p>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={handleCommit}
                disabled={!file || loading === "commit"}
                className="rounded-xl bg-emerald-600/90 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading === "commit" ? "Confirmando..." : `Confirmar importación (${summary.inserted} registros)`}
              </button>

              {summary.log && (
                <span className="text-xs text-slate-400">
                  {summary.log}
                </span>
              )}
            </div>

            {/* Tabla de errores */}
            {summary.errors.length > 0 && (
              <div className="mt-8 overflow-hidden rounded-2xl border border-white/10">
                <table className="min-w-full divide-y divide-white/10">
                  <thead className="bg-slate-900/80">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400"># Fila</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Causa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 bg-slate-900/60">
                    {summary.errors.map((e, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2 text-sm text-slate-200">{e.row}</td>
                        <td className="px-4 py-2 text-sm text-slate-300">{e.cause}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
