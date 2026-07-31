import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pluginManifest } from "../src/plugin.manifest";
import { createReleaseInventory } from "./lib/release-contract";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "release", "release-inventory.json");
const inventory = createReleaseInventory(path.join(root, "dist"), pluginManifest);
fs.mkdirSync(path.dirname(output), { recursive: true });
const temporary = `${output}.tmp`;
fs.writeFileSync(temporary, `${JSON.stringify(inventory, null, 2)}\n`);
fs.renameSync(temporary, output);
console.log(
  `release:inventory ${inventory.identity.id}@${inventory.identity.version} ${inventory.candidate.sha256}`,
);
