import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseManifest } from "../sdk/manifest-schema";
import { pluginManifest } from "../src/plugin.manifest";
import {
  assertPhoundryUiCompatibility,
  assertSafeAuthoredCss,
  assertSafePluginCss,
  loadAndValidatePluginModule,
  listCandidateFiles,
} from "./lib/release-contract";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const packageJson = JSON.parse(
  fs.readFileSync(path.join(root, "package.json"), "utf8"),
) as { version?: string; devDependencies?: Record<string, string> };

const names = listCandidateFiles(dist);
const rawManifest = fs.readFileSync(path.join(dist, "manifest.json"), "utf8");
const { manifest, errors } = parseManifest(rawManifest);
if (!manifest) throw new Error(`Invalid manifest: ${errors.join("; ")}`);
if (manifest.id !== pluginManifest.id) {
  throw new Error(`Source/release manifest id mismatch`);
}
if (
  manifest.version !== pluginManifest.version ||
  manifest.version !== packageJson.version
) {
  throw new Error(`Package/source/release version mismatch`);
}
assertPhoundryUiCompatibility(root, packageJson);
assertSafeAuthoredCss(root);
if (names.includes("styles.css")) {
  assertSafePluginCss(
    fs.readFileSync(path.join(dist, "styles.css"), "utf8"),
    "dist/styles.css",
  );
}
await loadAndValidatePluginModule(path.join(dist, "main.js"), manifest);
if (
  /\b(?:import|export)\s*(?:\(|[^;]*?\bfrom\s*)["'][^"']+["']/.test(
    fs.readFileSync(path.join(dist, "main.js"), "utf8"),
  )
) {
  throw new Error("main.js contains an unresolved module or chunk import");
}
console.log(`validate-dist: OK (${names.join(", ")})`);
