import tailwindcss from "@tailwindcss/vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
	plugins: [tailwindcss(), svelte()],
	resolve: {
		alias: {
			"$app/environment": resolve(__dirname, "src/shims/app-environment.ts"),
		},
	},
	build: {
		outDir: "dist",
		emptyOutDir: true,
		lib: {
			entry: resolve(__dirname, "src/main.ts"),
			formats: ["es"],
			fileName: () => "main.js",
		},
		rollupOptions: {
			output: {
				assetFileNames: (assetInfo) => {
					const n = assetInfo.names?.[0] ?? assetInfo.name ?? "";
					if (typeof n === "string" && n.endsWith(".css")) return "styles.css";
					return "assets/[name][extname]";
				},
			},
		},
		cssCodeSplit: false,
	},
});
