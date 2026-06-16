import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseManifest } from "../sdk/manifest-schema";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");

function fail(msg: string): never {
	console.error(msg);
	process.exit(1);
	throw new Error(msg);
}

const mainJs = path.join(dist, "main.js");
const manifestJson = path.join(dist, "manifest.json");

if (!fs.existsSync(mainJs)) fail(`Missing ${mainJs}`);
if (!fs.existsSync(manifestJson)) fail(`Missing ${manifestJson}`);

const raw = fs.readFileSync(manifestJson, "utf8");
const { manifest, errors } = parseManifest(raw);
if (!manifest) fail(`Invalid manifest: ${errors.join("; ")}`);

const mainSrc = fs.readFileSync(mainJs, "utf8");
if (!/\bexport\s+default\b/.test(mainSrc) && !/\bas\s+default\b/.test(mainSrc)) {
	fail("dist/main.js must include a default export");
}

if (manifest.id !== "example.community-demo") {
	fail(`Unexpected plugin id in dist manifest: ${manifest.id}`);
}

console.log("validate-dist: OK");
