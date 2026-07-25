# Phials community plugin example

Cloneable starting point for **Phials community plugins**: **Svelte 5**, **TypeScript**, **Vite**, **phoundry-ui** (npm), and a **generated SDK** copied from the closed-source Phials app so you do not import from the Phials `src/` tree.

**Trust model:** Community plugins are **trusted JavaScript** running in the Phials renderer. Phials exposes a **permission-gated `PluginAPI`** only for declared manifest permissions. See the [public SDK support contract](https://github.com/phoundry/phials/blob/main/documentation/developer/reference/plugin-contract-and-compatibility/public-sdk-support-contract.md) (source of truth in the Phials repo).

## Prerequisites

- Node 20+
- A checkout of [Phials](https://github.com/phoundry/phials) (for regenerating the SDK; optional if you only consume the committed `sdk/`)

## Install and build

```bash
npm install
npm run build
npm run validate
```

- **`dist/manifest.json`**, **`dist/main.js`**, and **`dist/styles.css`** (when styles exist) match what the Phials plugin loader expects for GitHub Release assets.
- **`npm run check`** runs `svelte-check` against `src/` and the generated `sdk/` types.

## Regenerate the SDK (from Phials)

When Phials maintainers change plugin or command types, regenerate the mirrored SDK into this repo:

```bash
cd /path/to/phials
npm run sdk:sync-plugin-example
```

Optional: `PHIALS_PLUGIN_EXAMPLE_ROOT=/absolute/path/to/phials-plugin-example`.

Then run **`npm run check`** here again.

## Copy build output into Phials test fixtures

From the Phials repository (after `npm run build` here):

```bash
cd /path/to/phials
npm run fixtures:sync-example-plugin
```

This copies `dist/*` into `tests/fixtures/community-plugin-minimal/` for automated tests.

## Local install in Phials

1. Build this repo (`npm run build`).
2. Copy `dist/manifest.json`, `dist/main.js`, and `dist/styles.css` (if present) into your Phials plugins directory under a folder named **`example.community-demo`** (must match `manifest.id` and the default export’s `PhialsPlugin.id`).
3. Enable the plugin in Phials settings.

Use **`PHIALS_HOME`** (or the default portable home) as documented for your platform.

## Release (GitHub)

Create a **GitHub Release** and attach at least:

- `manifest.json`
- `main.js`
- `styles.css` (if your build emits it)

Version in `public/manifest.json` is overwritten at build time from `package.json`’s `version`.

## Implementation notes

- **phoundry-ui** is consumed from **npm** (`phoundry-ui`, aligned with Phials). Peer: `@iconify/svelte`, `svelte@5`.
- **`vite.config.ts`** aliases **`$app/environment`** to `src/shims/app-environment.ts` so phoundry-ui can bundle in a **plain Vite** app (Phials uses SvelteKit, which provides `$app/environment` for real).
- **CSS:** `src/app.css` imports a **subset** of phoundry-ui styles (theme, tokens, components, utils) to keep `dist/styles.css` small; add more `@import "phoundry-ui/…"` entries if you need additional components.

## Plugin ID and manifest

- Plugin id must match `^[a-z][a-z0-9]*\.[a-z][a-z0-9-]*[a-z0-9]$` (e.g. `example.community-demo`).
- `version` and `minAppVersion` must be semver `x.y.z` (optional prerelease suffix allowed).
