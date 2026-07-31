# Phials community plugin starter

This repository is the supported starting point for a Phials community plugin. It includes Svelte 5, TypeScript, Vite, Phoundry UI, the generated public Plugin API `1.0.0` SDK, local install tooling, contract tests, and immutable release verification.

Community plugins are trusted JavaScript running in the Phials renderer. Every privileged operation still goes through the permission-gated `PluginAPI`. The [public SDK support contract](https://github.com/phoundry/phials/blob/main/documentation/developer/reference/plugin-contract-and-compatibility/public-sdk-support-contract.md) defines the supported boundary.

## Prerequisites

- Node 20 or newer
- A local Phials checkout when synchronizing the SDK
- A Phials development profile for local installation

## First run

```bash
npm install
npm run check
npm run test:run
npm run build
npm run validate
```

`src/plugin.manifest.ts` is the authored manifest. It uses `definePluginManifest()`, and `src/main.ts` binds the definition to that manifest with `definePlugin(manifest, …)`. The build synchronizes `public/manifest.json`; do not edit the generated copy.

The manifest also owns the Iconify names the plugin preloads. `src/manifest-icons.ts` initializes the required collections before activation. Keep those declarations aligned with every icon used by the plugin.

## Develop and reload

Start coordinated manifest synchronization and a Vite watch build:

```bash
npm run dev
```

Install the current `dist/` candidate into an isolated Phials Home:

```bash
npm run dev:install -- --phials-home /absolute/path/to/dev-phials-home
```

The installer derives the destination from the manifest id, accepts only supported release assets, verifies the exact candidate checksum, and atomically replaces an existing development install. Re-running it is safe and reports the installed destination and checksum.

In Phials Settings → Plugins:

1. Confirm the Installed, Enabled, Loaded, and Activated stages.
2. Review changed permissions before enabling.
3. Use Reload after rebuilding.
4. Use Copy diagnostics when a stage fails; the copied text includes a stable diagnostic code.

Routine activation does not show a notification. The stage badges and diagnostics are the source of truth.

## Synchronize the SDK

Point `PHIALS_ROOT` at a local Phials checkout when it is not the default sibling:

```bash
PHIALS_ROOT=/absolute/path/to/phials npm run sdk:sync
PHIALS_ROOT=/absolute/path/to/phials npm run sdk:verify
```

`sdk:sync` updates the committed generated SDK. `sdk:verify` is non-mutating and fails when the committed SDK differs from Phials.

## Test the public contract

```bash
npm run test:run
```

The harness covers definition and provider shape, Svelte component mount/unmount, accessible controls, permission failures, lifecycle cleanup, deterministic candidate checksums, and unsafe CSS rejection. Add focused tests for behavior your plugin owns.

Phoundry UI is pinned to the starter compatibility policy `^0.1.40`. Plugin CSS may use Phoundry UI tokens, but it must not redefine host tokens or apply unscoped `:root`, `html`, or `body` rules.

## Set a version and create a release candidate

Set the version once across the package and source manifest:

```bash
npm run version:set -- 1.2.3
```

Then create and verify the candidate:

```bash
npm run check
npm run test:run
npm run build
npm run validate
npm run release:inventory
npm run release:verify
```

`release/release-inventory.json` records the exact canonical assets, byte sizes, SHA-256 digests, identity, compatibility policy, and candidate checksum. Verification is non-mutating.

Attach exactly the inventory files to the matching stable GitHub Release:

- `manifest.json`
- `main.js`
- `styles.css`, when emitted
- complete flat theme pairs named `theme-<slug>.json` and `theme-<slug>.css`, when emitted

Do not attach source archives, unresolved chunks, maps, nested directories, or other files as plugin assets. Phials and the registry install only the attached immutable bytes; there is no raw-repository fallback.

## Registry submission and recovery

Submit the repository, stable tag, version, candidate checksum, and exact asset inventory to the [community registry](https://github.com/EliWimmer/phials-plugins). Registry CI verifies repository ownership and availability, the latest stable release, asset identity, every byte checksum, and manifest identity.

Never replace assets for an existing version. Publish a new version to recover from a broken release. A registry maintainer can temporarily unlist the record without remotely disabling or uninstalling existing copies, then restore it from a newly verified inventory.
