import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": { target: "http://localhost:4173", changeOrigin: true }
    }
  },
  build: {
    outDir: "../web",
    // apps/web is a deployable artifact, not an append-only build history.
    // Clearing it prevents stale hashed bundles from producing cached white screens.
    emptyOutDir: true,
    assetsDir: "assets"
  }
});
