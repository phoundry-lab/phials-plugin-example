// @generated from phials - do not edit
// Synced by phials/scripts/sync-plugin-sdk.mjs

/**
 * Plugin Manifest Schema
 *
 * Defines the structure and validation for external plugin manifests.
 * Each external plugin must have a manifest.json that conforms to this schema.
 */

// ─── Permission Types ─────────────────────────────────────────────────────────

/**
 * Available permissions that plugins can request.
 * `shell.execute` is intentionally omitted until a native-backed, reviewed path exists.
 */
export type PluginPermission =
	| "filesystem.read"
	| "filesystem.write"
	| "clipboard.read"
	| "clipboard.write"
	| "network.fetch";

/**
 * Human-readable descriptions for each permission
 */
export const PERMISSION_DESCRIPTIONS: Record<PluginPermission, string> = {
	"filesystem.read": "Read files from your filesystem",
	"filesystem.write": "Write and delete files on your filesystem",
	"clipboard.read": "Read content from your clipboard",
	"clipboard.write": "Write content to your clipboard",
	"network.fetch": "Make network requests to external servers",
};

/**
 * Risk level for each permission (for UI display)
 */
export const PERMISSION_RISK: Record<
	PluginPermission,
	"low" | "medium" | "high"
> = {
	"filesystem.read": "low",
	"filesystem.write": "high",
	"clipboard.read": "medium",
	"clipboard.write": "low",
	"network.fetch": "medium",
};

// ─── Manifest Types ───────────────────────────────────────────────────────────

/**
 * Plugin manifest schema
 */
export interface PluginManifest {
	/** Unique plugin identifier (e.g., "vendor.plugin-name") */
	id: string;

	/** Human-readable name */
	name: string;

	/** Plugin version (semver format) */
	version: string;

	/** Minimum Phials app version required */
	minAppVersion: string;

	/**
	 * Public plugin API / SDK contract version this bundle targets (semver).
	 * When omitted, treated as 1.0.0 for compatibility.
	 */
	pluginApiVersion?: string;

	/** Plugin author name */
	author: string;

	/** Brief description of the plugin */
	description: string;

	/** Author's website or profile URL */
	authorUrl?: string;

	/** GitHub repository URL */
	repository?: string;

	/** Iconify icons to preload */
	icons?: string[];

	/** Required permissions */
	permissions?: PluginPermission[];
}

/**
 * Community plugin entry (from registry index)
 */
export interface CommunityPluginEntry {
	/** Plugin ID */
	id: string;

	/** Display name */
	name: string;

	/** Author name */
	author: string;

	/** Description */
	description: string;

	/** GitHub repo path (e.g., "owner/repo") */
	repo: string;
}

/**
 * Community plugins index structure
 */
export interface CommunityPluginsIndex {
	plugins: CommunityPluginEntry[];
}

/** `owner/repo` (no URL, no leading slash); matches GitHub API path shape. */
const GITHUB_REPO_PATH =
	/^[a-zA-Z0-9][a-zA-Z0-9_.-]*\/[a-zA-Z0-9][a-zA-Z0-9_.-]*$/;

/**
 * True when an index entry id must be rejected (reserved built-in namespace).
 */
export function isReservedCommunityRegistryPluginId(id: string): boolean {
	return id.startsWith("phials.");
}

export function validateCommunityRepoPath(repo: string): boolean {
	return typeof repo === "string" && GITHUB_REPO_PATH.test(repo);
}

/**
 * Validate one community index entry (shape only; caller checks duplicates).
 */
export function validateCommunityPluginEntryShape(
	entry: unknown,
	index: number,
): string[] {
	const prefix = `plugins[${index}]`;
	const errors: string[] = [];

	if (!entry || typeof entry !== "object") {
		return [`${prefix}: must be an object`];
	}

	const e = entry as Record<string, unknown>;
	const id = e.id;
	const name = e.name;
	const author = e.author;
	const description = e.description;
	const repo = e.repo;

	if (typeof id !== "string" || !id.trim()) {
		errors.push(`${prefix}.id: missing or invalid`);
	} else if (!validatePluginId(id)) {
		errors.push(
			`${prefix}.id: invalid format (expected vendor.plugin-name, lowercase)`,
		);
	} else if (isReservedCommunityRegistryPluginId(id)) {
		errors.push(`${prefix}.id: reserved prefix "phials." is not allowed`);
	}

	if (typeof name !== "string" || !name.trim()) {
		errors.push(`${prefix}.name: missing or invalid`);
	}
	if (typeof author !== "string" || !author.trim()) {
		errors.push(`${prefix}.author: missing or invalid`);
	}
	if (typeof description !== "string" || !description.trim()) {
		errors.push(`${prefix}.description: missing or invalid`);
	}
	if (typeof repo !== "string" || !repo.trim()) {
		errors.push(`${prefix}.repo: missing or invalid`);
	} else if (!validateCommunityRepoPath(repo.trim())) {
		errors.push(
			`${prefix}.repo: must be "owner/repo" (GitHub path, no URL or leading slash)`,
		);
	}

	const extra = Object.keys(e).filter(
		(k) => !["id", "name", "author", "description", "repo"].includes(k),
	);
	if (extra.length > 0) {
		errors.push(`${prefix}: unknown field(s): ${extra.join(", ")}`);
	}

	return errors;
}

/**
 * Validate parsed community plugins index JSON.
 */
export function validateCommunityPluginsIndex(raw: unknown): ValidationResult {
	const errors: string[] = [];

	if (!raw || typeof raw !== "object") {
		return { valid: false, errors: ["Index must be a JSON object"] };
	}

	const root = raw as Record<string, unknown>;
	const plugins = root.plugins;

	if (!Array.isArray(plugins)) {
		return { valid: false, errors: ['Missing or invalid "plugins" array'] };
	}

	const allowedRoot = new Set(["plugins", "$schema"]);
	const rootKeys = Object.keys(root).filter((k) => !allowedRoot.has(k));
	if (rootKeys.length > 0) {
		errors.push(`Unknown top-level field(s): ${rootKeys.join(", ")}`);
	}

	const seenIds = new Map<string, number>();
	for (let i = 0; i < plugins.length; i++) {
		const rowErrors = validateCommunityPluginEntryShape(plugins[i], i);
		errors.push(...rowErrors);

		const entry = plugins[i];
		if (entry && typeof entry === "object") {
			const id = (entry as Record<string, unknown>).id;
			if (typeof id === "string" && id.trim()) {
				const prev = seenIds.get(id);
				if (prev !== undefined) {
					errors.push(
						`Duplicate plugin id "${id}" at plugins[${i}] (also plugins[${prev}])`,
					);
				} else {
					seenIds.set(id, i);
				}
			}
		}
	}

	return { valid: errors.length === 0, errors };
}

/**
 * Parse and validate community-plugins.json text.
 */
export function parseCommunityPluginsIndex(json: string): {
	entries: CommunityPluginEntry[] | null;
	errors: string[];
} {
	let parsed: unknown;
	try {
		parsed = JSON.parse(json);
	} catch {
		return { entries: null, errors: ["Invalid JSON"] };
	}

	const result = validateCommunityPluginsIndex(parsed);
	if (!result.valid) {
		return { entries: null, errors: result.errors };
	}

	const plugins = (parsed as CommunityPluginsIndex).plugins;
	return { entries: plugins, errors: [] };
}

/** Persisted install / permission trust (mirrors Rust `PluginTrustState`). */
export interface PluginTrustStateWire {
	approvedPermissions: Record<string, string[]>;
	installMeta: Record<
		string,
		{
			installedAt?: string;
			updatedAt?: string;
			sourceRepo?: string;
			lastReleaseUrl?: string;
		}
	>;
}

/**
 * Installed plugin state
 */
export interface InstalledPlugin {
	manifest: PluginManifest;
	enabled: boolean;
	installedAt: string;
	updatedAt?: string;
	/** Registry GitHub repo path when installed from the index */
	sourceRepo?: string;
	lastReleaseUrl?: string;
	/** True when manifest permissions differ from last user-approved set */
	needsPermissionReview?: boolean;
}

/**
 * Plugin update information
 */
export interface PluginUpdate {
	pluginId: string;
	currentVersion: string;
	latestVersion: string;
	releaseUrl: string;
}

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Validation result
 */
export interface ValidationResult {
	valid: boolean;
	errors: string[];
}

/**
 * Validate a plugin ID format
 * Must be in format: vendor.plugin-name (lowercase, alphanumeric with hyphens)
 */
export function validatePluginId(id: string): boolean {
	const pattern = /^[a-z][a-z0-9]*\.[a-z][a-z0-9-]*[a-z0-9]$/;
	return pattern.test(id);
}

/**
 * Validate semver format (basic check)
 */
export function validateSemver(version: string): boolean {
	const pattern = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/;
	return pattern.test(version);
}

/**
 * Compare two semver versions
 * Returns: -1 if a < b, 0 if a == b, 1 if a > b
 */
export function compareSemver(a: string, b: string): number {
	const parseVersion = (v: string) => {
		const [version] = v.split("-"); // Remove prerelease suffix
		return version.split(".").map(Number);
	};

	const aParts = parseVersion(a);
	const bParts = parseVersion(b);

	for (let i = 0; i < 3; i++) {
		const aVal = aParts[i] ?? 0;
		const bVal = bParts[i] ?? 0;
		if (aVal < bVal) return -1;
		if (aVal > bVal) return 1;
	}

	return 0;
}

/**
 * Check if a version satisfies a minimum version requirement
 */
export function satisfiesMinVersion(
	version: string,
	minVersion: string,
): boolean {
	return compareSemver(version, minVersion) >= 0;
}

/** Default contract version when manifest omits `pluginApiVersion`. */
export const DEFAULT_PLUGIN_API_VERSION = "1.0.0";

/**
 * Supported public plugin API contract for this app build.
 * Keep in sync with `SUPPORTED_PLUGIN_API_VERSION` in `src-tauri/src/lib.rs`.
 */
export const SUPPORTED_PLUGIN_API_VERSION = "1.0.0" as const;

let cachedNativeAppVersion: string | null = null;
let cachedNativeSupportedPluginApi: string | null = null;

/**
 * Load app and supported plugin API versions from the Tauri shell (authoritative).
 * Dynamic import keeps the synced example `sdk/manifest-schema.ts` usable without bundling Tauri.
 */
export async function cachePluginRuntimeFromNative(): Promise<void> {
	const { invoke } = await import("@tauri-apps/api/core");
	const [app, api] = await Promise.all([
		invoke<string>("get_app_version_cmd"),
		invoke<string>("get_supported_plugin_api_version_cmd"),
	]);
	cachedNativeAppVersion = app;
	cachedNativeSupportedPluginApi = api;
}

/** For Vitest: override or clear cached versions (pass null to clear). */
export function setPluginRuntimeVersionsForTests(
	appVersion: string | null,
	supportedPluginApiVersion: string | null,
): void {
	cachedNativeAppVersion = appVersion;
	cachedNativeSupportedPluginApi = supportedPluginApiVersion;
}

/**
 * Current Phials app version (from Tauri). Before `cachePluginRuntimeFromNative`, returns a dev placeholder.
 */
export function getAppVersion(): string {
	return cachedNativeAppVersion ?? "0.0.0-dev";
}

/** Supported plugin API contract version for this build. */
export function getSupportedPluginApiVersion(): string {
	return cachedNativeSupportedPluginApi ?? SUPPORTED_PLUGIN_API_VERSION;
}

/**
 * Validate a plugin manifest
 */
export function validateManifest(manifest: unknown): ValidationResult {
	const errors: string[] = [];

	if (!manifest || typeof manifest !== "object") {
		return { valid: false, errors: ["Manifest must be an object"] };
	}

	const m = manifest as Record<string, unknown>;

	// Required fields
	if (typeof m.id !== "string" || !m.id) {
		errors.push('Missing or invalid "id" field');
	} else if (!validatePluginId(m.id)) {
		errors.push(
			'Invalid "id" format. Must be lowercase vendor.plugin-name (e.g., "mycompany.pdf-viewer")',
		);
	}

	if (typeof m.name !== "string" || !m.name) {
		errors.push('Missing or invalid "name" field');
	}

	if (typeof m.version !== "string" || !m.version) {
		errors.push('Missing or invalid "version" field');
	} else if (!validateSemver(m.version)) {
		errors.push('Invalid "version" format. Must be semver (e.g., "1.0.0")');
	}

	if (typeof m.minAppVersion !== "string" || !m.minAppVersion) {
		errors.push('Missing or invalid "minAppVersion" field');
	} else if (!validateSemver(m.minAppVersion)) {
		errors.push(
			'Invalid "minAppVersion" format. Must be semver (e.g., "0.1.0")',
		);
	}

	if (m.pluginApiVersion !== undefined) {
		if (typeof m.pluginApiVersion !== "string" || !m.pluginApiVersion) {
			errors.push(
				'Invalid "pluginApiVersion" field - must be a non-empty string',
			);
		} else if (!validateSemver(m.pluginApiVersion)) {
			errors.push(
				'Invalid "pluginApiVersion" format. Must be semver (e.g., "1.0.0")',
			);
		}
	}

	if (typeof m.author !== "string" || !m.author) {
		errors.push('Missing or invalid "author" field');
	}

	if (typeof m.description !== "string" || !m.description) {
		errors.push('Missing or invalid "description" field');
	}

	// Optional fields
	if (m.authorUrl !== undefined && typeof m.authorUrl !== "string") {
		errors.push('Invalid "authorUrl" field - must be a string');
	}

	if (m.repository !== undefined && typeof m.repository !== "string") {
		errors.push('Invalid "repository" field - must be a string');
	}

	if (m.icons !== undefined) {
		if (!Array.isArray(m.icons)) {
			errors.push('Invalid "icons" field - must be an array');
		} else if (!m.icons.every((i) => typeof i === "string")) {
			errors.push('Invalid "icons" field - must be an array of strings');
		}
	}

	if (m.permissions !== undefined) {
		if (!Array.isArray(m.permissions)) {
			errors.push('Invalid "permissions" field - must be an array');
		} else {
			const validPermissions: PluginPermission[] = [
				"filesystem.read",
				"filesystem.write",
				"clipboard.read",
				"clipboard.write",
				"network.fetch",
			];
			for (const p of m.permissions) {
				if (!validPermissions.includes(p as PluginPermission)) {
					errors.push(`Invalid permission: "${p}"`);
				}
			}
		}
	}

	return { valid: errors.length === 0, errors };
}

/**
 * Parse and validate a manifest JSON string
 */
export function parseManifest(json: string): {
	manifest: PluginManifest | null;
	errors: string[];
} {
	let parsed: unknown;

	try {
		parsed = JSON.parse(json);
	} catch {
		return { manifest: null, errors: ["Invalid JSON"] };
	}

	const result = validateManifest(parsed);

	if (!result.valid) {
		return { manifest: null, errors: result.errors };
	}

	return { manifest: parsed as PluginManifest, errors: [] };
}

/**
 * Check if a plugin is compatible with the current app version
 */
export function isPluginCompatible(manifest: PluginManifest): boolean {
	return satisfiesMinVersion(getAppVersion(), manifest.minAppVersion);
}

/**
 * True when this build implements at least the plugin API contract the manifest declares.
 */
export function isPluginApiCompatible(manifest: PluginManifest): boolean {
	const declared = manifest.pluginApiVersion ?? DEFAULT_PLUGIN_API_VERSION;
	if (!validateSemver(declared)) return false;
	return compareSemver(getSupportedPluginApiVersion(), declared) >= 0;
}

/** App semver + plugin API contract checks for load/install/activate. */
export function isPluginRuntimeCompatible(manifest: PluginManifest): boolean {
	return isPluginCompatible(manifest) && isPluginApiCompatible(manifest);
}

/** Sorted permission list for stable compare / persistence */
export function sortedPermissionSnapshot(
	permissions: PluginPermission[] | undefined,
): string[] {
	return [...(permissions ?? [])].map(String).sort();
}

export function permissionSetsDiffer(
	a: PluginPermission[] | undefined,
	b: string[] | undefined,
): boolean {
	const left = JSON.stringify(sortedPermissionSnapshot(a));
	const right = JSON.stringify([...(b ?? [])].sort());
	return left !== right;
}
