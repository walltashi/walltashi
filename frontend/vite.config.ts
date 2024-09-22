import { TanStackRouterVite } from "@tanstack/router-vite-plugin";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), TanStackRouterVite(), wasm(), topLevelAwait()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./app"),
    },
  },
});
