#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const manifestPath = path.join(root, "public", "manifest.json");
const distManifest = path.join(root, "dist", "manifest.json");

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
manifest.version = pkg.version;
fs.mkdirSync(path.dirname(distManifest), { recursive: true });
fs.writeFileSync(distManifest, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`Wrote ${distManifest} at version ${manifest.version}`);
