import { fileURLToPath } from "node:url";
import { mergeConfig } from "vite";
import baseConfig from "../vite.config";

export default mergeConfig(baseConfig, {
  build: {
    outDir: "test-dist",
    rollupOptions: {
      input: fileURLToPath(new URL("./fixtures/plotly.html", import.meta.url)),
    },
  },
});
