import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { checksumCandidate, createReleaseInventory, verifyRelease } from "../scripts/release.logic";

const manifest = {
  id: "example.test",
  name: "Test",
  version: "1.0.0",
  minAppVersion: "0.1.0",
  pluginApiVersion: "3.0.0",
  author: "Example",
  description: "Release verification fixture",
};

function candidate(t: { after: (cleanup: () => void) => void }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "phials-plugin-release-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, "dist"));
  fs.mkdirSync(path.join(root, "release"));
  fs.writeFileSync(path.join(root, "package.json"), '{"type":"module"}');
  fs.writeFileSync(path.join(root, "dist/manifest.json"), JSON.stringify(manifest));
  fs.writeFileSync(
    path.join(root, "dist/main.js"),
    `
    export const manifest = ${JSON.stringify(manifest)};
    export default { id: manifest.id, version: manifest.version, providers: [] };
  `,
  );
  const inventory = () =>
    fs.writeFileSync(
      path.join(root, "release/release-inventory.json"),
      JSON.stringify(createReleaseInventory(path.join(root, "dist"))),
    );
  inventory();
  return { root, inventory };
}

test("candidate checksum is order-independent and byte-sensitive", () => {
  const main = { name: "main.js", content: Buffer.from("plugin") };
  const metadata = { name: "manifest.json", content: Buffer.from("manifest") };
  assert.equal(checksumCandidate([main, metadata]), checksumCandidate([metadata, main]));
  assert.notEqual(
    checksumCandidate([main]),
    checksumCandidate([{ ...main, content: Buffer.from("changed") }]),
  );
});

test("verification detects modified artifacts without rewriting the inventory", async (t) => {
  const { root } = candidate(t);
  await verifyRelease(root);
  const inventoryPath = path.join(root, "release/release-inventory.json");
  const original = fs.readFileSync(inventoryPath, "utf8");
  fs.appendFileSync(path.join(root, "dist/main.js"), "\n// changed");
  await assert.rejects(verifyRelease(root), /inventory differs/);
  assert.equal(fs.readFileSync(inventoryPath, "utf8"), original);
});

test("verification rejects a re-inventoried manifest that differs from the bundle", async (t) => {
  const { root, inventory } = candidate(t);
  fs.writeFileSync(
    path.join(root, "dist/manifest.json"),
    JSON.stringify({ ...manifest, description: "Different" }),
  );
  inventory();
  await assert.rejects(verifyRelease(root), /manifest differs/);
});
