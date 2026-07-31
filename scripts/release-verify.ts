import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pluginManifest } from "../src/plugin.manifest";
import type { ReleaseInventory } from "./lib/release-contract";
import {
  loadAndValidatePluginModule,
  verifyReleaseInventory,
} from "./lib/release-contract";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const inventoryPath = path.join(root, "release", "release-inventory.json");
const inventory = JSON.parse(
  fs.readFileSync(inventoryPath, "utf8"),
) as ReleaseInventory;
verifyReleaseInventory(dist, inventory, pluginManifest);
await loadAndValidatePluginModule(
  path.join(dist, "main.js"),
  pluginManifest,
);
console.log(
  `release:verify OK ${inventory.identity.id}@${inventory.identity.version} ${inventory.candidate.sha256}`,
);
