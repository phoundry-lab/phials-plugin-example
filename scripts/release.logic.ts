import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";
import { parseManifest } from "@phoundry/phials-plugin-sdk/manifest";

const coreAssets = new Set(["manifest.json", "main.js", "styles.css"]);
const themeAsset = /^theme-([a-z0-9][a-z0-9-]*)\.(json|css)$/;

export function sha256(content: Uint8Array | string): string {
  return createHash("sha256").update(content).digest("hex");
}

export function checksumCandidate(files: readonly { name: string; content: Uint8Array }[]): string {
  const hash = createHash("sha256");
  for (const file of [...files].sort((a, b) => a.name.localeCompare(b.name))) {
    hash.update(file.name);
    hash.update(new Uint8Array([0]));
    hash.update(String(file.content.byteLength));
    hash.update(new Uint8Array([0]));
    hash.update(file.content);
    hash.update(new Uint8Array([0]));
  }
  return hash.digest("hex");
}

// These filenames are the host's release format, not a CSS or dependency policy.
export function readCandidateFiles(dist: string): { name: string; content: Buffer }[] {
  const files = fs
    .readdirSync(dist, { withFileTypes: true })
    .map((entry) => {
      if (!entry.isFile() || (!coreAssets.has(entry.name) && !themeAsset.test(entry.name))) {
        throw new Error(`Unsupported host release asset: ${entry.name}`);
      }
      return { name: entry.name, content: fs.readFileSync(path.join(dist, entry.name)) };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
  for (const required of ["main.js", "manifest.json"]) {
    if (!files.some((file) => file.name === required)) throw new Error(`Missing ${required}`);
  }
  for (const file of files) {
    const theme = themeAsset.exec(file.name);
    if (
      theme &&
      !files.some(
        (other) => other.name === `theme-${theme[1]}.${theme[2] === "json" ? "css" : "json"}`,
      )
    ) {
      throw new Error(`Theme ${theme[1]} requires both JSON and CSS assets`);
    }
  }
  return files;
}

export async function loadPlugin(mainJs: string) {
  // This runs the author's own bundle, not untrusted code in a sandbox.
  const module: unknown = await import(`${pathToFileURL(mainJs).href}?build=${Date.now()}`);
  if (!module || typeof module !== "object" || !("manifest" in module) || !("default" in module)) {
    throw new Error("Export a manifest and default plugin definition from src/main.ts");
  }
  const { manifest, errors } = parseManifest(JSON.stringify(module.manifest));
  if (!manifest) throw new Error(`Invalid manifest: ${errors.join("; ")}`);
  const definition: unknown =
    typeof module.default === "function" ? module.default() : module.default;
  if (
    !definition ||
    typeof definition !== "object" ||
    !("id" in definition) ||
    !("version" in definition) ||
    definition.id !== manifest.id ||
    definition.version !== manifest.version ||
    !("providers" in definition) ||
    !Array.isArray(definition.providers)
  ) {
    throw new Error("Plugin definition must match its manifest and contain providers");
  }
  return manifest;
}

export function createReleaseInventory(dist: string) {
  const files = readCandidateFiles(dist);
  const { manifest, errors } = parseManifest(
    fs.readFileSync(path.join(dist, "manifest.json"), "utf8"),
  );
  if (!manifest) throw new Error(`Invalid manifest: ${errors.join("; ")}`);
  return {
    schemaVersion: 1,
    identity: {
      id: manifest.id,
      version: manifest.version,
      minAppVersion: manifest.minAppVersion,
      pluginApiVersion: manifest.pluginApiVersion,
    },
    candidate: {
      sha256: checksumCandidate(files),
      files: files.map((file) => ({
        name: file.name,
        size: file.content.byteLength,
        sha256: sha256(file.content),
      })),
    },
  };
}

export async function verifyRelease(root: string) {
  const dist = path.join(root, "dist");
  const inventory: unknown = JSON.parse(
    fs.readFileSync(path.join(root, "release/release-inventory.json"), "utf8"),
  );
  const expected = createReleaseInventory(dist);
  if (!isDeepStrictEqual(inventory, expected))
    throw new Error("Release inventory differs from the built candidate");
  const manifest = await loadPlugin(path.join(dist, "main.js"));
  const emitted: unknown = JSON.parse(fs.readFileSync(path.join(dist, "manifest.json"), "utf8"));
  if (!isDeepStrictEqual(emitted, manifest))
    throw new Error("Built manifest differs from the bundled manifest");
  return expected;
}
