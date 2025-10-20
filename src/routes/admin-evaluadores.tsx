// src/routes/admin-evaluadores.tsx
import { lazy } from "react";
import { Navigate } from "react-router-dom";
import RequireRole from "../shared/RequireRole";

const EvaluadoresList = lazy(() => import("../pages/admin/evaluadores/List"));
const EvaluadorForm = lazy(() => import("../pages/admin/evaluadores/Form"));

export default [
  {
    path: "/admin/evaluadores",
    element: (
      <RequireRole roles={["ADMIN", "administrador"]} fallbackToReadOnly>
        <EvaluadoresList />
      </RequireRole>
    ),
  },
  {
    path: "/admin/evaluadores/:id",
    element: (
      <RequireRole roles={["ADMIN", "administrador"]} fallbackToReadOnly>
        <EvaluadorForm />
      </RequireRole>
    ),
  },
  {
    path: "/admin/evaluadores/nuevo",
    element: (
      <RequireRole roles={["ADMIN", "administrador"]}>
        <EvaluadorForm />
      </RequireRole>
    ),
  },
  { path: "/admin/evaluadores/*", element: <Navigate to="/admin/evaluadores" replace /> },
];
