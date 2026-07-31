import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const starterRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const command = process.argv[2];
if (command !== "sync" && command !== "verify") {
  throw new Error("Usage: tsx scripts/sdk.ts <sync|verify>");
}
const phialsRoot = path.resolve(
  process.env.PHIALS_ROOT ?? path.join(starterRoot, "..", "phials"),
);
const script = path.join(
  phialsRoot,
  "scripts",
  command === "sync" ? "sync-plugin-sdk.mjs" : "verify-plugin-sdk.mjs",
);
if (!fs.existsSync(script)) {
  throw new Error(
    `Phials checkout not found at ${phialsRoot}. Set PHIALS_ROOT to synchronize the SDK.`,
  );
}
const result = spawnSync(process.execPath, [script], {
  cwd: phialsRoot,
  env: {
    ...process.env,
    PHIALS_PLUGIN_EXAMPLE_ROOT: starterRoot,
  },
  stdio: "inherit",
});
if (result.status !== 0) process.exit(result.status ?? 1);
