import { useEffect, useMemo, useState } from "react";
import {api} from "../api";

type Status = "checking" | "ok" | "error";

export default function BackendStatus() {
  const [status, setStatus] = useState<Status>("checking");

  const styles = useMemo(() => {
    const base: React.CSSProperties = {
      position: "fixed",
      right: 16,
      bottom: 16,
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 12px",
      borderRadius: 999,
      color: "#fff",
      fontSize: 13,
      fontWeight: 600,
      boxShadow: "0 8px 24px rgba(0,0,0,.25)",
      zIndex: 9999,
      userSelect: "none",
    };
    const dot: React.CSSProperties = {
      width: 10, height: 10, borderRadius: 999, background: "#fff", opacity: .9,
      animation: "pulse 1.4s ease-in-out infinite",
    };
    if (status === "ok") return { box: { ...base, background: "#16a34a" }, dot };
    if (status === "error") return { box: { ...base, background: "#dc2626" }, dot };
    return { box: { ...base, background: "#f59e0b" }, dot }; // checking
  }, [status]);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const res = await api.get("/api/ping");
        if (!mounted) return;
        setStatus(res.status === 200 ? "ok" : "error");
      } catch {
        if (!mounted) return;
        setStatus("error");
      }
    };
    // primera verificación
    check();
    // polling cada 6s
    const id = setInterval(check, 6000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  return (
    <>
      <style>
        {`@keyframes pulse {0%{transform:scale(.9);opacity:.6}50%{transform:scale(1);opacity:1}100%{transform:scale(.9);opacity:.6}}`}
      </style>
      <div style={styles.box}>
        <div style={styles.dot} />
        {status === "ok" ? "Conectado al backend" : status === "error" ? "Sin conexión" : "Verificando..."}
      </div>
    </>
  );
}
