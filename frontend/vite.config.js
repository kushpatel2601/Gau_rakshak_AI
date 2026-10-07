import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command, mode }) => {
  if (command === "build") {
    const { VITE_API_URL } = loadEnv(mode, process.cwd(), "VITE_");
    let api;
    try {
      api = new URL(VITE_API_URL);
    } catch {
      throw new Error("Set VITE_API_URL to the backend HTTPS origin before building.");
    }
    const local = ["localhost", "127.0.0.1"].includes(api.hostname);
    if ((api.protocol !== "https:" && !(local && api.protocol === "http:")) ||
        api.username || api.password || api.search || api.hash || api.pathname !== "/") {
      throw new Error("VITE_API_URL must be an HTTPS origin (HTTP is allowed only for localhost).");
    }
  }
  return {
    plugins: [react()],
    server: {
      host: true,
      port: 5173,
    },
  };
});
