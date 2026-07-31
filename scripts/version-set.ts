import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateSemver } from "../sdk/manifest-schema";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const version = process.argv[2];
if (!version || !validateSemver(version)) {
  throw new Error("Usage: npm run version:set -- <valid-semver>");
}
const packagePath = path.join(root, "package.json");
const manifestPath = path.join(root, "src", "plugin.manifest.ts");
const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8")) as {
  version: string;
};
pkg.version = version;
const manifest = fs.readFileSync(manifestPath, "utf8");
const nextManifest = manifest.replace(
  /(\n\s*version:\s*")[^"]+(",)/,
  `$1${version}$2`,
);
if (nextManifest === manifest) {
  throw new Error("Could not locate manifest version field");
}
fs.writeFileSync(`${packagePath}.tmp`, `${JSON.stringify(pkg, null, 2)}\n`);
fs.writeFileSync(`${manifestPath}.tmp`, nextManifest);
fs.renameSync(`${packagePath}.tmp`, packagePath);
fs.renameSync(`${manifestPath}.tmp`, manifestPath);
console.log(`Set package and source manifest version to ${version}`);
