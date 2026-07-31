#!/usr/bin/env tsx
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pluginManifest } from "../src/plugin.manifest";
import {
  manifestIdentity,
  validateIdentityProjections,
} from "../sdk/manifest-schema";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(
  fs.readFileSync(path.join(root, "package.json"), "utf8"),
) as { version?: string };
const identity = manifestIdentity(pluginManifest);
const validation = validateIdentityProjections(identity, [
  { source: "package", version: pkg.version },
]);
if (!validation.valid) {
  throw new Error(validation.errors.join("; "));
}

const output = `${JSON.stringify(pluginManifest, null, 2)}\n`;
const publicManifest = path.join(root, "public", "manifest.json");
fs.mkdirSync(path.dirname(publicManifest), { recursive: true });
fs.writeFileSync(publicManifest, output, "utf8");
console.log(`Generated ${publicManifest} from src/plugin.manifest.ts`);
