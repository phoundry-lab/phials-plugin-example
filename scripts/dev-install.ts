import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pluginManifest } from "../src/plugin.manifest";
import type { ReleaseInventory } from "./lib/release-contract";
import {
  readCandidateFiles,
  verifyReleaseInventory,
} from "./lib/release-contract";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const homeIndex = args.indexOf("--phials-home");
if (homeIndex < 0 || !args[homeIndex + 1]) {
  throw new Error("Usage: npm run dev:install -- --phials-home <directory>");
}
const phialsHome = path.resolve(args[homeIndex + 1]!);
const dist = path.join(root, "dist");
const inventory = JSON.parse(
  fs.readFileSync(path.join(root, "release", "release-inventory.json"), "utf8"),
) as ReleaseInventory;
verifyReleaseInventory(dist, inventory, pluginManifest);

const pluginsDirectory = path.join(phialsHome, "plugins");
const destination = path.join(pluginsDirectory, pluginManifest.id);
const temporary = path.join(
  pluginsDirectory,
  `.${pluginManifest.id}.install-${process.pid}`,
);
const backup = path.join(
  pluginsDirectory,
  `.${pluginManifest.id}.previous-${process.pid}`,
);
fs.mkdirSync(pluginsDirectory, { recursive: true });
fs.rmSync(temporary, { recursive: true, force: true });
fs.mkdirSync(temporary);

for (const file of readCandidateFiles(dist)) {
  const theme = file.name.match(
    /^theme-([a-z0-9][a-z0-9-]*)\.(json|css)$/,
  );
  const relative =
    theme ?
      path.join("themes", theme[1]!, `theme.${theme[2]!}`)
    : file.name;
  const output = path.join(temporary, relative);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, file.content);
}

let movedPrevious = false;
try {
  fs.rmSync(backup, { recursive: true, force: true });
  if (fs.existsSync(destination)) {
    fs.renameSync(destination, backup);
    movedPrevious = true;
  }
  fs.renameSync(temporary, destination);
  fs.rmSync(backup, { recursive: true, force: true });
} catch (error) {
  fs.rmSync(temporary, { recursive: true, force: true });
  if (movedPrevious && !fs.existsSync(destination) && fs.existsSync(backup)) {
    fs.renameSync(backup, destination);
  }
  throw error;
}

console.log(`Installed ${pluginManifest.id} → ${destination}`);
console.log(`Candidate SHA-256: ${inventory.candidate.sha256}`);
