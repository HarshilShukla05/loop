import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./index.css";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";

async function enableMocking() {
  if (import.meta.env.VITE_USE_MOCK !== "true") return;
  const { worker } = await import("./mocks/browser");
  await worker.start({ onUnhandledRequest: "bypass" });
}

enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <BrowserRouter basename={(import.meta.env.VITE_BASE_PATH || "/").replace(/\/+$/, "") || "/"}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
    </StrictMode>,
  );
});
