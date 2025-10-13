import { useContext } from "react";
import { AuthContext, type Ctx } from "../context/AuthContextBase";

export function useAuth(): Ctx {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
