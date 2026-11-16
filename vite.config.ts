import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";
import { resolve } from "node:path";
import { pluginArtifacts } from "./scripts/build.plugin.ts";

export default defineConfig({
  plugins: [svelte(), pluginArtifacts(import.meta.dirname)],
  publicDir: false,
  resolve: {
    alias: {
      "$app/environment": resolve(import.meta.dirname, "src/shims/app-environment.ts"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    lib: {
      entry: resolve(import.meta.dirname, "src/main.ts"),
      formats: ["es"],
      fileName: () => "main.js",
      cssFileName: "styles",
    },
    cssCodeSplit: false,
  },
});
