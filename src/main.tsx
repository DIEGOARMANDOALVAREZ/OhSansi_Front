import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { setToken } from "./api";
import "./index.css"; 
// Recupera token (si usas Bearer). Si usas solo cookies Sanctum, no pasa nada.
const token = localStorage.getItem("ohsansi_token");
if (token) setToken(token);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
