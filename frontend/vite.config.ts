import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { plotlyAttributionPatch } from "./security/plotly-attribution-patch.mjs";

export default defineConfig({
  plugins: [plotlyAttributionPatch(), react()],
  server: {
    port: 5173,
    proxy: {
      "/v1": "http://127.0.0.1:8080",
      "/healthz": "http://127.0.0.1:8080",
    },
  },
});
