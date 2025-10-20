import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthProvider from "./context/AuthProvider";

import AdminResponsablesList from "./pages/admin/responsables/List";
import AdminResponsableForm from "./pages/admin/responsables/Form";

import AdminEvaluadoresList from "./pages/admin/evaluadores/List";
import AdminEvaluadorForm from "./pages/admin/evaluadores/Form";

import AdminImportarInscritos from "./pages/admin/import/ImportInscritos";
import AdminInscritosList from "./pages/admin/inscritos/List";

import { RequireAuth, RequireRole, RequireAnyRole, RedirectIfAuth } from "./routes/guards";
import LoginPage from "./views/LoginPage";
import Dashboard from "./views/Dashboard";
import AdminPage from "./views/AdminPage";
import EvalPage from "./views/EvalPage";
import NotAuth from "./views/NotAuth";

// HU4: Panel del responsable (listas de competidores)
import CompetidoresList from "./pages/responsable/CompetidoresList";
import ResponsablePanel from "./pages/responsable/ResponsablePanel";

import "./index.css";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Si ya hay sesión, evita /login y redirige al destino por defecto */}
          <Route element={<RedirectIfAuth to="/dashboard" />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

          {/* Público */}
          <Route path="/no-autorizado" element={<NotAuth />} />

          {/* Protegido (logueado) */}
          <Route element={<RequireAuth />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />

            {/* ADMINISTRADOR */}
            <Route element={<RequireRole role="ADMINISTRADOR" />}>
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/admin/responsables" element={<AdminResponsablesList />} />
              <Route path="/admin/responsables/nuevo" element={<AdminResponsableForm />} />
              <Route path="/admin/responsables/:id" element={<AdminResponsableForm />} />

              <Route path="/admin/evaluadores" element={<AdminEvaluadoresList />} />
              <Route path="/admin/evaluadores/nuevo" element={<AdminEvaluadorForm />} />
              <Route path="/admin/evaluadores/:id" element={<AdminEvaluadorForm />} />

              <Route path="/admin/importar-inscritos" element={<AdminImportarInscritos />} />
              <Route path="/admin/inscritos" element={<AdminInscritosList />} />
            </Route>

            {/* RESPONSABLE (acepta ambos slugs posibles) */}
            <Route element={<RequireAnyRole roles={["RESPONSABLE", "RESPONSABLE_ACADEMICO"]} />}>
              {/* redirige a su panel real */}
              <Route path="/responsable" element={<Navigate to="/responsable/panel" replace />} />
              <Route path="/responsable/panel" element={<ResponsablePanel />} />
              {/* la lista vive aparte */}
              <Route path="/responsable/competidores" element={<CompetidoresList />} />
            </Route>

            {/* EVALUADOR */}
            <Route element={<RequireRole role="EVALUADOR" />}>
              {/* redirección para mantener consistencia con pathSegunRoles */}
              <Route path="/evaluador" element={<Navigate to="/evaluador/panel" replace />} />
              <Route path="/evaluador/panel" element={<EvalPage />} />
            </Route>
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
