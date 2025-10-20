// src/pages/admin/inscritos/List.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AdminShell from "../../../components/AdminShell";
import { api } from "../../../api"; // Instancia Axios con token

// 🧩 Tipo de datos de cada inscrito
interface Inscrito {
  id: number;
  documento: string;
  nombres: string;
  apellidos: string;
  unidad: string;
  area: string;
  nivel: string;
}

export default function AdminInscritosList() {
  const [inscritos, setInscritos] = useState<Inscrito[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // 🔍 Filtrado en frontend
  const filteredInscritos = useMemo(() => {
    if (!search.trim()) return inscritos;
    const s = search.toLowerCase();
    return inscritos.filter(
      (i) =>
        i.nombres.toLowerCase().includes(s) ||
        i.apellidos.toLowerCase().includes(s) ||
        i.documento.toLowerCase().includes(s)
    );
  }, [inscritos, search]);

  // 📦 Cargar inscritos al montar el componente
  useEffect(() => {
  const fetchInscritos = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<Inscrito[]>("/inscritos");

      const lista = Array.isArray(data)
        ? data.map((i) => ({
            id: i.id,
            documento: i.documento || "-",
            nombres: i.nombres || "",
            apellidos: i.apellidos || "",
            unidad: i.unidad || "",
            area: i.area || "",
            nivel: i.nivel || "",
          }))
        : [];

      setInscritos(lista);
    } catch (error) {
      if (error instanceof Error) {
        // Error genérico de JS (e.g., red, timeout)
        console.error("Error al cargar los inscritos:", error.message);
      } else if (
        typeof error === "object" &&
        error !== null &&
        "response" in error
      ) {
        // Error de Axios tipado parcialmente
        console.error("Error de API:", (error as { response?: unknown }).response);
      } else {
        console.error("Error desconocido al cargar inscritos:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  fetchInscritos();
}, []);


  // 🧹 Limpiar búsqueda
  const limpiar = () => setSearch("");

  return (
    <AdminShell
      title="Gestión de Inscritos"
      subtitle="Listado general de inscritos registrados en el sistema"
      backTo="/admin"
      actions={
        <Link
          to="/admin/importar-inscritos"
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
        >
          Volver a importar inscritos
        </Link>
      }
    >
      <div className="rounded-3xl bg-white p-4 md:p-6 space-y-4 text-slate-900 shadow-sm border border-slate-200">
        {/* 🔎 Filtros */}
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <input
            type="text"
            placeholder="Buscar por nombre, apellido o documento"
            className="flex-1 px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-cyan-400 focus:outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl border border-slate-300 transition-colors"
            onClick={limpiar}
          >
            Limpiar
          </button>
        </div>

        {/* 🧾 Tabla */}
        {loading ? (
          <div className="py-8 text-center text-slate-500">Cargando inscritos…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border border-slate-200 rounded-xl">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-4 py-2 text-left">Documento</th>
                  <th className="px-4 py-2 text-left">Nombres</th>
                  <th className="px-4 py-2 text-left">Apellidos</th>
                  <th className="px-4 py-2 text-left">Unidad</th>
                  <th className="px-4 py-2 text-left">Área</th>
                  <th className="px-4 py-2 text-left">Nivel</th>
                </tr>
              </thead>
              <tbody>
                {filteredInscritos.length ? (
                  filteredInscritos.map((inscrito) => (
                    <tr
                      key={inscrito.id}
                      className="border-t border-slate-200 hover:bg-slate-50 transition"
                    >
                      <td className="px-4 py-2">{inscrito.documento}</td>
                      <td className="px-4 py-2">{inscrito.nombres}</td>
                      <td className="px-4 py-2">{inscrito.apellidos}</td>
                      <td className="px-4 py-2">{inscrito.unidad}</td>
                      <td className="px-4 py-2">{inscrito.area}</td>
                      <td className="px-4 py-2">{inscrito.nivel}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-6 text-center text-slate-400 italic"
                    >
                      No hay inscritos con los filtros actuales
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
