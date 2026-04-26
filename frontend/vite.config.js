import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/feed":      { target: "http://localhost:8000", changeOrigin: true },
      "/lookup":    { target: "http://localhost:8000", changeOrigin: true },
      "/pulses":    { target: "http://localhost:8000", changeOrigin: true },
      "/ml":        { target: "http://localhost:8000", changeOrigin: true },
      "/correlate": { target: "http://localhost:8000", changeOrigin: true },
    },
  },
});
