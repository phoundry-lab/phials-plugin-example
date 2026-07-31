import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { PluginManifest } from "../../sdk/manifest-schema";
import {
  manifestIdentity,
  validateIdentityProjections,
} from "../../sdk/manifest-schema";

export const PHOUNDRY_UI_COMPATIBILITY = "^0.1.40";
export const RELEASE_INVENTORY_SCHEMA_VERSION = 1;

const CORE_ASSETS = new Set(["manifest.json", "main.js", "styles.css"]);
const THEME_ASSET = /^theme-([a-z0-9][a-z0-9-]*)\.(json|css)$/;
const HOST_TOKEN_DECLARATION =
  /--(?:(?:surface-(?:sunken|base|raised|overlay))|(?:border-(?:muted|default|emphasis))|(?:text-(?:primary|secondary|tertiary|inverse))|(?:accent-(?:primary|primary-hover|primary-active|secondary))|(?:semantic-(?:success|warning|error|info))|(?:selection-(?:bg|text))|focus-ring|(?:option-(?:red|orange|yellow|green|cyan|blue|purple|pink|gray))|(?:shadow-panel)|(?:(?:button|input|select|badge|modal|tooltip|toast|ctx|tab|tree|table|editor)-[a-z0-9-]+))\s*:/i;

export interface ReleaseInventoryFile {
  name: string;
  size: number;
  sha256: string;
}

export interface ReleaseInventory {
  schemaVersion: 1;
  identity: {
    id: string;
    version: string;
    minAppVersion: string;
    pluginApiVersion: string;
  };
  compatibility: {
    phoundryUi: string;
  };
  candidate: {
    sha256: string;
    files: ReleaseInventoryFile[];
  };
}

export function sha256(content: Uint8Array | string): string {
  return createHash("sha256").update(content).digest("hex");
}

export function checksumCandidate(
  files: readonly { name: string; content: Uint8Array }[],
): string {
  const hash = createHash("sha256");
  for (const file of [...files].sort((a, b) => a.name.localeCompare(b.name))) {
    const name = Buffer.from(file.name, "utf8");
    const length = Buffer.from(String(file.content.byteLength), "utf8");
    hash.update(name);
    hash.update(new Uint8Array([0]));
    hash.update(length);
    hash.update(new Uint8Array([0]));
    hash.update(file.content);
    hash.update(new Uint8Array([0]));
  }
  return hash.digest("hex");
}

export function listCandidateFiles(dist: string): string[] {
  if (!fs.existsSync(dist)) {
    throw new Error(`Missing release directory: ${dist}`);
  }
  const entries = fs.readdirSync(dist, { withFileTypes: true });
  const errors: string[] = [];
  const names: string[] = [];
  const themes = new Map<string, Set<string>>();

  for (const entry of entries) {
    if (!entry.isFile()) {
      errors.push(`Unexpected release directory "${entry.name}"`);
      continue;
    }
    const name = entry.name;
    if (CORE_ASSETS.has(name)) {
      names.push(name);
      continue;
    }
    const theme = name.match(THEME_ASSET);
    if (!theme) {
      errors.push(`Unexpected or noncanonical release file "${name}"`);
      continue;
    }
    const [, slug, extension] = theme;
    const extensions = themes.get(slug) ?? new Set<string>();
    extensions.add(extension);
    themes.set(slug, extensions);
    names.push(name);
  }

  for (const required of ["manifest.json", "main.js"]) {
    if (!names.includes(required)) errors.push(`Missing required ${required}`);
  }
  for (const [slug, extensions] of themes) {
    if (!extensions.has("json") || !extensions.has("css")) {
      errors.push(
        `Theme "${slug}" must include both theme-${slug}.json and theme-${slug}.css`,
      );
    }
  }
  if (errors.length) throw new Error(errors.join("\n"));
  return names.sort();
}

export function readCandidateFiles(
  dist: string,
): Array<{ name: string; content: Uint8Array }> {
  return listCandidateFiles(dist).map((name) => ({
    name,
    content: fs.readFileSync(path.join(dist, name)),
  }));
}

export function assertSafePluginCss(css: string, source: string): void {
  if (HOST_TOKEN_DECLARATION.test(css)) {
    throw new Error(
      `${source} overrides host-owned Phoundry UI theme or component tokens`,
    );
  }
  if (/(^|[},])\s*(?:html|body)\b[^,{]*\{/im.test(css)) {
    throw new Error(`${source} contains an unscoped html/body selector`);
  }
}

export function assertSafeAuthoredCss(root: string): void {
  const files: string[] = [];
  const walk = (directory: string) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".css") || entry.name.endsWith(".svelte")) {
        files.push(full);
      }
    }
  };
  walk(path.join(root, "src"));
  for (const file of files) {
    const source = fs.readFileSync(file, "utf8");
    if (
      /:global\s*\(|(^|[\s,{])(?::root|html|body)\b[^,{]*\{/im.test(source) ||
      HOST_TOKEN_DECLARATION.test(source)
    ) {
      throw new Error(
        `${path.relative(root, file)} contains an unsafe global/root selector or host token override`,
      );
    }
  }
}

export function assertPhoundryUiCompatibility(
  root: string,
  packageJson: { devDependencies?: Record<string, string> },
): void {
  const declared = packageJson.devDependencies?.["phoundry-ui"];
  if (declared !== PHOUNDRY_UI_COMPATIBILITY) {
    throw new Error(
      `phoundry-ui must use the starter compatibility policy ${PHOUNDRY_UI_COMPATIBILITY}; found ${declared ?? "none"}`,
    );
  }
  const installed = JSON.parse(
    fs.readFileSync(
      path.join(root, "node_modules", "phoundry-ui", "package.json"),
      "utf8",
    ),
  ) as { version?: string };
  if (!installed.version?.startsWith("0.1.")) {
    throw new Error(
      `Installed phoundry-ui ${installed.version ?? "unknown"} is outside ${PHOUNDRY_UI_COMPATIBILITY}`,
    );
  }
}

function providerUsesSvelte(provider: Record<string, unknown>): boolean {
  if (provider.type === "preview") {
    return Boolean(provider.surface || provider.thumbnail || provider.toolbar);
  }
  if (provider.type === "view" || provider.type === "module") {
    return Boolean(provider.component);
  }
  if (provider.type === "command") {
    return JSON.stringify(provider).includes("component");
  }
  return false;
}

export async function loadAndValidatePluginModule(
  mainJs: string,
  manifest: PluginManifest,
): Promise<{
  definition: Record<string, unknown>;
  usesSvelte: boolean;
}> {
  const url = `${pathToFileURL(mainJs).href}?verify=${Date.now()}`;
  const module = (await import(url)) as Record<string, unknown>;
  const exported = module.default;
  if (!exported) throw new Error("main.js must have a default export");
  const definition =
    typeof exported === "function" ? exported() : exported;
  if (!definition || typeof definition !== "object") {
    throw new Error("main.js default export must produce a plugin definition");
  }
  const plugin = definition as Record<string, unknown>;
  if (!Array.isArray(plugin.providers)) {
    throw new Error("Plugin definition must contain a providers array");
  }
  const providerIds = new Set<string>();
  let usesSvelte = false;
  for (const [index, raw] of plugin.providers.entries()) {
    if (!raw || typeof raw !== "object") {
      throw new Error(`providers[${index}] must be an object`);
    }
    const provider = raw as Record<string, unknown>;
    if (
      typeof provider.id !== "string" ||
      typeof provider.name !== "string" ||
      typeof provider.type !== "string"
    ) {
      throw new Error(
        `providers[${index}] must define string id, name, and type`,
      );
    }
    if (providerIds.has(provider.id)) {
      throw new Error(`Duplicate provider id "${provider.id}"`);
    }
    providerIds.add(provider.id);
    usesSvelte ||= providerUsesSvelte(provider);
  }
  const identity = validateIdentityProjections(manifestIdentity(manifest), [
    {
      source: "exportedDefinition",
      id: typeof plugin.id === "string" ? plugin.id : undefined,
      version:
        typeof plugin.version === "string" ? plugin.version : undefined,
    },
  ]);
  if (!identity.valid) throw new Error(identity.errors.join("; "));
  if (
    usesSvelte &&
    (typeof module.mount !== "function" || typeof module.unmount !== "function")
  ) {
    throw new Error(
      "Svelte contributions require named mount and unmount exports",
    );
  }
  return { definition: plugin, usesSvelte };
}

export function createReleaseInventory(
  dist: string,
  manifest: PluginManifest,
): ReleaseInventory {
  const files = readCandidateFiles(dist);
  return {
    schemaVersion: RELEASE_INVENTORY_SCHEMA_VERSION,
    identity: manifestIdentity(manifest),
    compatibility: { phoundryUi: PHOUNDRY_UI_COMPATIBILITY },
    candidate: {
      sha256: checksumCandidate(files),
      files: files.map((file) => ({
        name: file.name,
        size: file.content.byteLength,
        sha256: sha256(file.content),
      })),
    },
  };
}

export function verifyReleaseInventory(
  dist: string,
  inventory: ReleaseInventory,
  manifest: PluginManifest,
): void {
  if (inventory.schemaVersion !== RELEASE_INVENTORY_SCHEMA_VERSION) {
    throw new Error(`Unsupported release inventory schema`);
  }
  const expected = createReleaseInventory(dist, manifest);
  if (JSON.stringify(inventory) !== JSON.stringify(expected)) {
    throw new Error(
      "Release inventory does not match the immutable candidate bytes",
    );
  }
}
