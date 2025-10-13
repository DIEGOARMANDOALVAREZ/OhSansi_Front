import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthProvider from "./context/AuthProvider";

import AdminResponsablesList from "./pages/admin/responsables/List";
import AdminResponsableForm from "./pages/admin/responsables/Form";

import { RequireAuth, RequireRole, RedirectIfAuth } from "./routes/guards";
import LoginPage from "./views/LoginPage";
import Dashboard from "./views/Dashboard";
import AdminPage from "./views/AdminPage";
import EvalPage from "./views/EvalPage";
import NotAuth from "./views/NotAuth";
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

            {/* Por rol */}
            <Route element={<RequireRole role="administrador" />}>
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/admin/responsables" element={<AdminResponsablesList />} />
              <Route path="/admin/responsables/nuevo" element={<AdminResponsableForm />} />
              <Route path="/admin/responsables/:id" element={<AdminResponsableForm />} />
            </Route>

            <Route element={<RequireRole role="responsable" />}>
              <Route path="/responsable" element={<EvalPage />} />
            </Route>

            <Route element={<RequireRole role="evaluador" />}>
              <Route path="/evaluador" element={<EvalPage />} />
            </Route>
          </Route>

          {/* Catch-all opcional */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
