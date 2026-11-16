import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";
import { createReleaseInventory, loadPlugin } from "./release.logic.ts";

/** Emit metadata from the same bundle the host loads, including watch builds. */
export function pluginArtifacts(root: string): Plugin {
  const dist = path.join(root, "dist");
  const release = path.join(root, "release");
  return {
    name: "phials-plugin-artifacts",
    apply: "build",
    buildStart() {
      fs.rmSync(path.join(release, "release-inventory.json"), { force: true });
    },
    async writeBundle() {
      const manifest = await loadPlugin(path.join(dist, "main.js"));
      fs.writeFileSync(path.join(dist, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
      const inventory = createReleaseInventory(dist);
      fs.mkdirSync(release, { recursive: true });
      const output = path.join(release, "release-inventory.json");
      fs.writeFileSync(`${output}.tmp`, `${JSON.stringify(inventory, null, 2)}\n`);
      fs.renameSync(`${output}.tmp`, output);
      console.log(`Plugin ${manifest.id}@${manifest.version} built and inventoried`);
    },
  };
}
