import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pluginManifest } from "../src/plugin.manifest";
import { build } from "vite";
import { readCandidateFiles } from "./release.logic";
import { resolvePhialsHome } from "./phials-home.logic";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const phialsHome = resolvePhialsHome(process.argv.slice(2));
const dist = path.join(root, "dist");
// Always install a fresh successful build; no inventory prerequisite.
await build({ root });

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
console.log("Reload the plugin in Phials to use this build.");
