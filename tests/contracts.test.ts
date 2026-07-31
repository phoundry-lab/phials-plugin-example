import assert from "node:assert/strict";
import test from "node:test";
import {
  assertAccessibleHtml,
  assertPermissionHarness,
  assertProviderContract,
  runLifecycleHarness,
} from "../scripts/lib/test-harness";
import {
  assertSafePluginCss,
  checksumCandidate,
} from "../scripts/lib/release-contract";
import { pluginManifest } from "../src/plugin.manifest";

test("provider harness rejects duplicate provider ids", () => {
  assert.throws(() =>
    assertProviderContract([
      { id: "example.same", name: "One", type: "command" },
      { id: "example.same", name: "Two", type: "preview" },
    ]),
  );
});

test("component accessibility harness requires an accessible name", () => {
  assert.doesNotThrow(() =>
    assertAccessibleHtml('<button type="button">Open</button>'),
  );
  assert.throws(() =>
    assertAccessibleHtml('<button type="button"><span aria-hidden="true"></span></button>'),
  );
});

test("permission harness recognizes write-implies-read", () => {
  assert.doesNotThrow(() =>
    assertPermissionHarness(pluginManifest.permissions ?? [], "filesystem.read"),
  );
  assert.throws(() =>
    assertPermissionHarness(pluginManifest.permissions ?? [], "network.fetch"),
  );
});

test("lifecycle harness awaits activation and deactivation", async () => {
  const order: string[] = [];
  const probe = await runLifecycleHarness(
    {
      onActivate: async () => order.push("activate"),
      onDeactivate: async () => order.push("deactivate"),
    },
    {},
  );
  assert.deepEqual(order, ["activate", "deactivate"]);
  assert.deepEqual(probe, { activated: 1, deactivated: 1 });
});

test("candidate checksum is deterministic and byte-sensitive", () => {
  const a = checksumCandidate([
    { name: "main.js", content: Buffer.from("a") },
    { name: "manifest.json", content: Buffer.from("{}") },
  ]);
  const b = checksumCandidate([
    { name: "manifest.json", content: Buffer.from("{}") },
    { name: "main.js", content: Buffer.from("a") },
  ]);
  const changed = checksumCandidate([
    { name: "main.js", content: Buffer.from("b") },
    { name: "manifest.json", content: Buffer.from("{}") },
  ]);
  assert.equal(a, b);
  assert.notEqual(a, changed);
});

test("CSS harness rejects host token overrides", () => {
  assert.doesNotThrow(() =>
    assertSafePluginCss(".example { color: var(--text-primary); }", "safe.css"),
  );
  assert.throws(() =>
    assertSafePluginCss(":root { --text-primary: red; }", "unsafe.css"),
  );
});
