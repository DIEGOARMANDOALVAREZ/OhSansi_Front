import { lazy } from "react";
import { Navigate } from "react-router-dom";
import RequireRole from "../shared/RequireRole";

const ResponsablesList = lazy(() => import("../pages/admin/responsables/List"));
const ResponsableForm = lazy(() => import("../pages/admin/responsables/Form"));

export default [
  {
    path: "/admin/responsables",
    element: (
      <RequireRole roles={["ADMIN", "administrador"]} fallbackToReadOnly>
        <ResponsablesList />
      </RequireRole>
    ),
  },
  {
    path: "/admin/responsables/:id",
    element: (
      <RequireRole roles={["ADMIN", "administrador"]} fallbackToReadOnly>
        <ResponsableForm />
      </RequireRole>
    ),
  },
  {
    path: "/admin/responsables/nuevo",
    element: (
      <RequireRole roles={["ADMIN", "administrador"]}>
        <ResponsableForm />
      </RequireRole>
    ),
  },
  { path: "/admin/responsables/*", element: <Navigate to="/admin/responsables" replace /> },
];
