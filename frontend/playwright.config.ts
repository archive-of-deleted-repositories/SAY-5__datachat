import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  workers: 1,
  projects: [
    { name: "development", use: { baseURL: "http://127.0.0.1:4179" } },
    { name: "production", use: { baseURL: "http://127.0.0.1:4180" } },
  ],
  use: {
    serviceWorkers: "block",
    launchOptions: {
      args: ["--enable-unsafe-swiftshader"],
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    },
  },
  webServer: [{
    command: "npm run dev -- --host 127.0.0.1 --port 4179 --strictPort --mode test",
    url: "http://127.0.0.1:4179/tests/fixtures/plotly.html",
    reuseExistingServer: false,
  }, {
    command: "vite build --config tests/fixture-build.config.ts && vite preview --outDir test-dist --host 127.0.0.1 --port 4180 --strictPort",
    url: "http://127.0.0.1:4180/tests/fixtures/plotly.html",
    reuseExistingServer: false,
  }],
});
