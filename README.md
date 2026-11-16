# Phials plugin starter

A small Svelte 5 and TypeScript plugin: one command that shows a toast, and one
preview for files ending in `.phials-demo-preview.txt`. It uses `phoundry-ui`
components and the host's shared styles. No privileged permissions are needed.

## Start

Use Node 24 (the version in `.nvmrc`), then:

```bash
npm install
npm run check
npm test
npm run build
```

The build creates `dist/main.js`, `dist/manifest.json`, optional `dist/styles.css`,
and `release/release-inventory.json`. These are generated files, not source files
to edit or commit. Both production and watch builds generate their own metadata.

## Write your plugin

- `src/main.ts` defines the command, preview, and activation/deactivation hooks.
  It exports the manifest and Svelte's `mount`/`unmount` for the host.
- `src/ExamplePreview.svelte` is the preview component.
- `src/plugin.manifest.ts` owns plugin metadata and permissions. Change its ID
  and repository when starting your own plugin. The version comes directly from
  `package.json`; update it there or use `npm version patch --no-git-tag-version`.
- `src/manifest-icons.ts` registers packaged Phoundry icon collections. Declare
  icons in the manifest so Phials can preload other Iconify icons too.

The public Plugin API comes from `@phoundry/phials-plugin-sdk`, pinned to version
3.1.0. No copied SDK or Phials checkout is needed. Import runtime manifest helpers
from `@phoundry/phials-plugin-sdk/manifest`; `env.d.ts` includes the public ambient
types. SDK upgrades are normal dependency updates. Changing API major versions
also requires migrating the plugin and its manifest.

Plugins are trusted JavaScript in the Phials renderer, not sandboxed code.
Privileged operations use the permission-gated `PluginAPI`; declare only the
permissions your plugin actually needs.

## Read-only Git example

SDK 3.1.0 adds repository status, diffs, history, local branches, and committed
file reads. The optional, type-checked helper in
`src/examples/git-inspection.logic.ts` demonstrates every new method. It is not
registered or bundled by `src/main.ts`, so the starter still needs no privileged
permissions by default.

To use the helper, declare `permissions: ["filesystem.read"]` in
`src/plugin.manifest.ts`, then call it from an async command or feature with the
Plugin API and a repository path on its captured Host:

```ts
import { inspectGitRepository } from "./examples/git-inspection.logic";

// Inside your async command/feature; api is the Plugin API from onActivate.
try {
  const result = await inspectGitRepository(api, repositoryPath);
  if (!result) api.notify.info("This path is not in a Git repository");
  else api.notify.success(`${result.status.length} changed files`);
} catch (error) {
  api.notify.error(error instanceof Error ? error.message : String(error));
}
```

An optional third argument, such as `"README.md"`, reads that file from the newest
returned commit. Choose a file known to exist there; missing files, non-UTF-8
content, and NUL-containing content are errors. An unborn branch has no history.

`getInfo` discovers the containing repository, including linked worktrees, and
reports the real root and upstream ahead/behind counts. Status paths and file
arguments are repository-relative; file arguments use literal forward-slash
paths rather than Git pathspecs. `diff` defaults to unstaged tracked-file changes;
use `{ staged: true }` for index changes. Untracked files appear in `status`, not
in these patches. These calls are separate queries, not an atomic snapshot.

Git must be installed on the executing Local or Remote Host. Git CLI subprocesses
have a 15-second timeout and an 8 MiB stdout limit; oversized output is rejected,
not truncated. History defaults to 50 commits, supports up to 500 per call, and
allows `skip` up to 1,000,000. All operations are read-only: no staging, commits,
checkout, fetch, or push is exposed. The manifest's `pluginApiVersion` remains
`"3.0.0"`; SDK package 3.1.0 is an additive declaration release, not a new Host API
compatibility version. Use a Phials build that includes these Git operations.

## CSS

Use ordinary Svelte/CSS styling. There is no CSS policy, token scanner, selector
ban, or enforced `phoundry-ui` version range beyond the package dependency.
Phials already supplies the shared UI styles and theme; the starter does not
bundle another global reset or require Tailwind. You can add your preferred
styling tools if needed.

Plugin styles share the application's document, so global rules also affect the
surrounding app. Component-scoped styles are a useful default, not a build gate.

## Develop locally

Rebuild on source changes:

```bash
npm run dev
```

Build and install into your normal Phials installation:

```bash
npm run dev:install
```

The installer uses `PHIALS_HOME` if set; otherwise it uses Phials' default home:

- macOS: `~/Library/Application Support/com.phials`
- Windows: `%LOCALAPPDATA%\\com.phials`
- Linux: `${XDG_DATA_HOME:-~/.local/share}/com.phials` (XDG_DATA_HOME must be absolute)

It builds first, stages files under `plugins/<manifest-id>`, and replaces the
previous installation with rollback on failure. Re-run it after changes, then
reload the plugin in Settings → Plugins. No separate build or inventory step is
needed. Watching alone does not install or hot-reload the plugin.

Optionally install into an isolated home instead:

```bash
npm run dev:install -- --phials-home /absolute/path/to/dev-phials-home
```

The flag takes precedence over `PHIALS_HOME`. When using an isolated home, launch
Phials with that same home (`PHIALS_HOME=/absolute/path/to/dev-phials-home`).

## Release

```bash
npm run check
npm test
npm run build
npm run release:verify
```

Build automatically inventories the exact emitted bytes. `release:verify` checks
those existing bytes and the bundled manifest without rebuilding or rewriting
anything. Build and verification import your own bundle to check its exports;
they are not a safe way to inspect untrusted third-party plugins.

Attach the files listed in `release/release-inventory.json` from `dist/` to the
matching GitHub Release. The current host accepts `main.js`, `manifest.json`,
optional `styles.css`, and optional complete `theme-<slug>.json` / `.css` pairs.
Other assets must currently be bundled/inlined: nested release directories and
separate chunks are not supported by the host's installation format.

For community registry submission, provide the repository, stable tag, version,
candidate checksum, and exact asset inventory. Never replace the bytes of an
existing published version; publish a new version instead.

To update the SDK dependency:

```bash
npm install --save-dev --save-exact @phoundry/phials-plugin-sdk@<version>
```

Run the checks above and keep the manifest's `pluginApiVersion` aligned with the
API contract the plugin actually requires.
