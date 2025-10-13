import { useMemo } from "react";

export default function useAuth() {
  const user = useMemo(() => {
    try {
      const raw = localStorage.getItem("usuario");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);
  return { user };
}
