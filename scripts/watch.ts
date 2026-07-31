import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function synchronizeManifest(): void {
  const result = spawnSync(
    process.execPath,
    ["--import", "tsx", "scripts/sync-manifest.ts"],
    { cwd: root, stdio: "inherit" },
  );
  if (result.status !== 0) {
    console.error("watch: manifest/version synchronization failed");
  }
}

synchronizeManifest();
const child = spawn("vite", ["build", "--watch"], {
  cwd: root,
  stdio: "inherit",
  shell: process.platform === "win32",
});
for (const file of [
  path.join(root, "package.json"),
  path.join(root, "src", "plugin.manifest.ts"),
]) {
  fs.watch(file, { persistent: false }, () => synchronizeManifest());
}
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => child.kill(signal));
}
child.on("exit", (code) => process.exit(code ?? 0));
