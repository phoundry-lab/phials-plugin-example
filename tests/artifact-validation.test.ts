import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";
import {
  assertSafeAuthoredCss,
  assertSafePluginCss,
  loadAndValidatePluginModule,
} from "../scripts/lib/release-contract";
import { assertProviderContract } from "../scripts/lib/test-harness";
import { pluginManifest } from "../src/plugin.manifest";

const thumbnail = 'type: "thumbnail", rendererVersion: "1", render: () => null';

test("provider harness and release validation enforce the host provider contract", async (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "phials-validators-"));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const cases: Array<{ name: string; source: string; valid: boolean }> = [
    ...["preview", "metadata", "view", "module", "command"].map((type) => ({
      name: `accepts ${type}`,
      source: `type: ${JSON.stringify(type)}`,
      valid: true,
    })),
    { name: "accepts minimal thumbnail", source: thumbnail, valid: true },
    {
      name: "accepts current thumbnail options",
      source: `${thumbnail}, priority: -1, canHandle: () => true,
        extensions: ["example"], mimeTypes: ["application/example"], categories: ["image"],
        requiredHostFeatures: ["audioProxy", "rawProxy", "sqlite", "dmg", "macApp", "appIcon"],
        requiredHostPlatforms: ["macos", "windows", "linux", "other"],
        presentationVariants: ["platform", "theme"]`,
      valid: true,
    },
    { name: "rejects unknown type", source: 'type: "unknown"', valid: false },
    ...["null", "false", "() => null"].map((value) => ({
      name: `rejects removed preview thumbnail ${value}`,
      source: `type: "preview", thumbnail: ${value}`,
      valid: false,
    })),
    {
      name: "accepts undefined preview thumbnail like host",
      source: 'type: "preview", thumbnail: undefined',
      valid: true,
    },
    ...[
      'rendererVersion: undefined',
      'rendererVersion: "  "',
      'rendererVersion: 1',
      'render: undefined',
      'render: "render"',
      'priority: NaN',
      'priority: Infinity',
      'priority: "1"',
      'canHandle: true',
      'presentationVariants: ["size"]',
      'requiredHostPlatforms: ["android"]',
      'requiredHostFeatures: ["unknown"]',
      ...["extensions", "mimeTypes", "categories", "requiredHostFeatures", "requiredHostPlatforms", "presentationVariants"]
        .flatMap((key) => [`${key}: "value"`, `${key}: [1]`]),
    ].map((override) => ({
      name: `rejects thumbnail ${override}`,
      source: `${thumbnail}, ${override}`,
      valid: false,
    })),
  ];
  for (const [index, entry] of cases.entries()) {
    await t.test(entry.name, async () => {
      const file = path.join(directory, `${index}.mjs`);
      fs.writeFileSync(file, `export default {
        id: ${JSON.stringify(pluginManifest.id)},
        version: ${JSON.stringify(pluginManifest.version)},
        providers: [{ id: "test.provider", name: "Test", ${entry.source} }]
      };`);
      const module = await import(pathToFileURL(file).href);
      if (entry.valid) {
        assert.doesNotThrow(() => assertProviderContract(module.default.providers));
        const result = await loadAndValidatePluginModule(file, pluginManifest);
        assert.equal(result.usesSvelte, false);
      } else {
        assert.throws(() => assertProviderContract(module.default.providers));
        await assert.rejects(loadAndValidatePluginModule(file, pluginManifest));
      }
    });
  }
});

test("release validation detects function-valued command components without mistaking text for UI", async (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "phials-runtime-"));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  for (const [index, contribution] of [
    'panel: { component: () => null }',
    'description: "component"',
  ].entries()) {
    const file = path.join(directory, `${index}.mjs`);
    const source = `export default {
      id: ${JSON.stringify(pluginManifest.id)}, version: ${JSON.stringify(pluginManifest.version)},
      providers: [{ id: "test.command", name: "Test", type: "command", ${contribution} }]
    };`;
    fs.writeFileSync(file, source);
    if (index === 0) {
      await assert.rejects(loadAndValidatePluginModule(file, pluginManifest), /mount and unmount/);
      const withRuntime = path.join(directory, "with-runtime.mjs");
      fs.writeFileSync(withRuntime, `${source}\nexport function mount() {} export function unmount() {}`);
      assert.equal((await loadAndValidatePluginModule(withRuntime, pluginManifest)).usesSvelte, true);
    } else {
      assert.equal((await loadAndValidatePluginModule(file, pluginManifest)).usesSvelte, false);
    }
  }
});

test("CSS validation protects host token namespaces without blocking references or plugin-local tokens", (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "phials-css-"));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  fs.mkdirSync(path.join(directory, "src"));
  const authored = path.join(directory, "src", "example.css");
  for (const token of ["--ph-surface-base", "--phials-custom-token", "--PH-FOCUS-RING"]) {
    const css = `.example { ${token}: red; }`;
    assert.throws(() => assertSafePluginCss(css, "styles.css"), /host-owned/);
    fs.writeFileSync(authored, css);
    assert.throws(() => assertSafeAuthoredCss(directory), /host token override/);
  }
  const safe = ".example { --example-local: 1; color: var(--ph-text-primary); background: var(--phials-surface-base); }";
  assert.doesNotThrow(() => assertSafePluginCss(safe, "styles.css"));
  fs.writeFileSync(authored, safe);
  assert.doesNotThrow(() => assertSafeAuthoredCss(directory));
});
