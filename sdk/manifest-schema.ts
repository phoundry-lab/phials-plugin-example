// @generated from phials - do not edit
// Source graph: phials/scripts/lib/public-sdk-manifest.mjs

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
export type PluginPermission = "filesystem.read" | "filesystem.write" | "clipboard.read" | "clipboard.write" | "network.fetch" | "workspace-folders.read" | "workspace-folders.write";

/**
 * Human-readable descriptions for each permission
 */
export const PERMISSION_DESCRIPTIONS: Record<PluginPermission, string> = {
    "filesystem.read": "Read files from your filesystem",
    "filesystem.write": "Write and delete files on your filesystem",
    "clipboard.read": "Read content from your clipboard",
    "clipboard.write": "Write content to your clipboard",
    "network.fetch": "Make network requests to external servers",
    "workspace-folders.read": "Read Workspace Folder schemas and values",
    "workspace-folders.write": "Change Workspace Folder schemas and values",
};

/**
 * Risk level for each permission (for UI display)
 */
export const PERMISSION_RISK: Record<PluginPermission, "low" | "medium" | "high"> = {
    "filesystem.read": "low",
    "filesystem.write": "high",
    "clipboard.read": "medium",
    "clipboard.write": "low",
    "network.fetch": "medium",
    "workspace-folders.read": "medium",
    "workspace-folders.write": "high",
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
     */
    pluginApiVersion: string;
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

export interface PluginIdentity {
    id: string;
    version: string;
    minAppVersion: string;
    pluginApiVersion: string;
}

export interface PluginIdentityProjection {
    source: string;
    id?: string;
    version?: string;
    minAppVersion?: string;
    pluginApiVersion?: string;
}

export interface PluginCandidateIdentity extends PluginIdentity {
    checksum: string;
}

// ─── Validation ───────────────────────────────────────────────────────────────
/**
 * Validation result
 */
export interface ValidationResult {
    valid: boolean;
    errors: string[];
}

const MANIFEST_FIELDS = new Set([
    "id",
    "name",
    "version",
    "minAppVersion",
    "pluginApiVersion",
    "author",
    "description",
    "authorUrl",
    "repository",
    "icons",
    "permissions",
]);

const VALID_PERMISSIONS = new Set<PluginPermission>([
    "filesystem.read",
    "filesystem.write",
    "clipboard.read",
    "clipboard.write",
    "network.fetch",
    "workspace-folders.read",
    "workspace-folders.write",
]);

const IMPLIED_PERMISSION_PAIRS: ReadonlyArray<readonly [
    PluginPermission,
    PluginPermission
]> = [
    ["filesystem.write", "filesystem.read"],
    ["workspace-folders.write", "workspace-folders.read"],
];

const SEMVER_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;

const ICONIFY_ICON_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

/**
 * Validate a plugin ID format
 * Must be in format: vendor.plugin-name (lowercase, alphanumeric with hyphens)
 */
export function validatePluginId(id: string): boolean {
    const pattern = /^[a-z][a-z0-9]*\.[a-z][a-z0-9-]*[a-z0-9]$/;
    return pattern.test(id) && !id.startsWith("phials.");
}

/**
 * Validate complete SemVer 2.0.0 syntax.
 */
export function validateSemver(version: string): boolean {
    return SEMVER_PATTERN.test(version);
}

/**
 * Compare two semver versions
 * Returns: -1 if a < b, 0 if a == b, 1 if a > b
 */
export function compareSemver(a: string, b: string): number {
    if (!validateSemver(a) || !validateSemver(b)) {
        throw new Error("compareSemver requires valid SemVer values");
    }
    const parseVersion = (value: string) => {
        const match = SEMVER_PATTERN.exec(value)!;
        return {
            core: [Number(match[1]), Number(match[2]), Number(match[3])],
            pre: match[4]?.split(".") ?? [],
        };
    };
    const left = parseVersion(a);
    const right = parseVersion(b);
    for (let i = 0; i < 3; i++) {
        const aVal = left.core[i] ?? 0;
        const bVal = right.core[i] ?? 0;
        if (aVal < bVal)
            return -1;
        if (aVal > bVal)
            return 1;
    }
    if (left.pre.length === 0 && right.pre.length === 0)
        return 0;
    if (left.pre.length === 0)
        return 1;
    if (right.pre.length === 0)
        return -1;
    for (let i = 0; i < Math.max(left.pre.length, right.pre.length); i++) {
        const aPart = left.pre[i];
        const bPart = right.pre[i];
        if (aPart === undefined)
            return -1;
        if (bPart === undefined)
            return 1;
        if (aPart === bPart)
            continue;
        const aNumeric = /^\d+$/.test(aPart);
        const bNumeric = /^\d+$/.test(bPart);
        if (aNumeric && bNumeric) {
            return Number(aPart) < Number(bPart) ? -1 : 1;
        }
        if (aNumeric !== bNumeric)
            return aNumeric ? -1 : 1;
        return aPart < bPart ? -1 : 1;
    }
    return 0;
}

/**
 * Check if a version satisfies a minimum version requirement
 */
export function satisfiesMinVersion(version: string, minVersion: string): boolean {
    return compareSemver(version, minVersion) >= 0;
}

export function definePluginManifest<const T extends PluginManifest>(manifest: T): Readonly<T> {
    const result = validateManifest(manifest);
    if (!result.valid) {
        throw new Error(`Invalid plugin manifest: ${result.errors.join("; ")}`);
    }
    return Object.freeze({
        ...manifest,
        permissions: manifest.permissions ?
            Object.freeze([...manifest.permissions])
            : undefined,
        icons: manifest.icons ? Object.freeze([...manifest.icons]) : undefined,
    }) as Readonly<T>;
}

export function manifestIdentity(manifest: PluginManifest): PluginIdentity {
    return {
        id: manifest.id,
        version: manifest.version,
        minAppVersion: manifest.minAppVersion,
        pluginApiVersion: manifest.pluginApiVersion,
    };
}

export function validateIdentityProjections(identity: PluginIdentity, projections: readonly PluginIdentityProjection[]): ValidationResult {
    const errors: string[] = [];
    for (const projection of projections) {
        for (const field of [
            "id",
            "version",
            "minAppVersion",
            "pluginApiVersion",
        ] as const) {
            const value = projection[field];
            if (value !== undefined && value !== identity[field]) {
                errors.push(`${projection.source}.${field} "${value}" does not match manifest "${identity[field]}"`);
            }
        }
    }
    return { valid: errors.length === 0, errors };
}

export function definePlugin(manifest: PluginManifest, definition: Omit<PhialsPlugin, "id" | "name" | "version">): PhialsPlugin {
    const validManifest = definePluginManifest(manifest);
    return Object.freeze({
        ...definition,
        id: validManifest.id,
        name: validManifest.name,
        version: validManifest.version,
    });
}

/**
 * Supported public plugin API contract for this app build.
 * Keep in sync with `SUPPORTED_PLUGIN_API_VERSION` in `src-tauri/src/lib.rs`.
 */
export const SUPPORTED_PLUGIN_API_VERSION = "1.1.0" as const;

/**
 * Validate a plugin manifest
 */
export function validateManifest(manifest: unknown): ValidationResult {
    const errors: string[] = [];
    if (!manifest || typeof manifest !== "object") {
        return { valid: false, errors: ["Manifest must be an object"] };
    }
    const m = manifest as Record<string, unknown>;
    const unknownFields = Object.keys(m).filter((field) => !MANIFEST_FIELDS.has(field));
    if (unknownFields.length > 0) {
        errors.push(`Unknown manifest field(s): ${unknownFields.join(", ")}`);
    }
    // Required fields
    if (typeof m.id !== "string" || !m.id.trim()) {
        errors.push('Missing or invalid "id" field');
    }
    else if (!validatePluginId(m.id)) {
        errors.push('Invalid or reserved "id". Use lowercase vendor.plugin-name and do not use the "phials." namespace');
    }
    if (typeof m.name !== "string" || !m.name.trim()) {
        errors.push('Missing or invalid "name" field');
    }
    if (typeof m.version !== "string" || !m.version.trim()) {
        errors.push('Missing or invalid "version" field');
    }
    else if (!validateSemver(m.version)) {
        errors.push('Invalid "version" format. Must be semver (e.g., "1.0.0")');
    }
    if (typeof m.minAppVersion !== "string" || !m.minAppVersion.trim()) {
        errors.push('Missing or invalid "minAppVersion" field');
    }
    else if (!validateSemver(m.minAppVersion)) {
        errors.push('Invalid "minAppVersion" format. Must be semver (e.g., "0.1.0")');
    }
    if (typeof m.pluginApiVersion !== "string" || !m.pluginApiVersion.trim()) {
        errors.push('Missing or invalid "pluginApiVersion" field');
    }
    else if (!validateSemver(m.pluginApiVersion)) {
        errors.push('Invalid "pluginApiVersion" format. Must be semver (e.g., "1.1.0")');
    }
    if (typeof m.author !== "string" || !m.author.trim()) {
        errors.push('Missing or invalid "author" field');
    }
    if (typeof m.description !== "string" || !m.description.trim()) {
        errors.push('Missing or invalid "description" field');
    }
    // Optional fields
    for (const field of ["authorUrl", "repository"] as const) {
        const value = m[field];
        if (value === undefined)
            continue;
        if (typeof value !== "string" || !value.trim()) {
            errors.push(`Invalid "${field}" field - must be a non-empty HTTPS URL`);
            continue;
        }
        try {
            const url = new URL(value);
            if (url.protocol !== "https:" || url.username || url.password) {
                errors.push(`Invalid "${field}" field - must be a public HTTPS URL`);
            }
        }
        catch {
            errors.push(`Invalid "${field}" field - must be a public HTTPS URL`);
        }
    }
    if (m.icons !== undefined) {
        if (!Array.isArray(m.icons)) {
            errors.push('Invalid "icons" field - must be an array');
        }
        else {
            const seen = new Set<string>();
            for (const icon of m.icons) {
                if (typeof icon !== "string" ||
                    !icon.trim() ||
                    !ICONIFY_ICON_PATTERN.test(icon)) {
                    errors.push(`Invalid icon: "${String(icon)}"`);
                }
                else if (seen.has(icon)) {
                    errors.push(`Duplicate icon: "${icon}"`);
                }
                else {
                    seen.add(icon);
                }
            }
        }
    }
    if (m.permissions !== undefined) {
        if (!Array.isArray(m.permissions)) {
            errors.push('Invalid "permissions" field - must be an array');
        }
        else {
            const seen = new Set<PluginPermission>();
            for (const p of m.permissions) {
                if (!VALID_PERMISSIONS.has(p as PluginPermission)) {
                    errors.push(`Invalid permission: "${p}"`);
                }
                else if (seen.has(p as PluginPermission)) {
                    errors.push(`Duplicate permission: "${p}"`);
                }
                else {
                    seen.add(p as PluginPermission);
                }
            }
            for (const [write, read] of IMPLIED_PERMISSION_PAIRS) {
                if (seen.has(write) && seen.has(read)) {
                    errors.push(`Redundant permissions: "${write}" already implies "${read}"`);
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
    }
    catch {
        return { manifest: null, errors: ["Invalid JSON"] };
    }
    const result = validateManifest(parsed);
    if (!result.valid) {
        return { manifest: null, errors: result.errors };
    }
    return { manifest: parsed as PluginManifest, errors: [] };
}
