// @generated from phials - do not edit
// Source graph: phials/scripts/lib/public-sdk-manifest.mjs

/**
 * Module System Type Definitions
 *
 * Types for the modular panel system that allows Navigator, Preview, Terminal,
 * and other components to be placed in any panel position with tabs or splits.
 */
// ─── Module Types ─────────────────────────────────────────────────────────────
/**
 * Built-in module type identifiers.
 * Plugin-provided modules use their full plugin ID (e.g., 'vendor.module.custom')
 */
type ModuleType = "navigator" | "preview" | "terminal" | string;

/**
 * Panel positions in the layout (side/bottom panels only).
 */
type PanelPosition = "left" | "right" | "bottom";

/**
 * All positions where a module can be placed, including center (tab-based).
 */
type ModulePosition = PanelPosition | "center";

// ─── Module Instance ──────────────────────────────────────────────────────────
/**
 * A single module instance configuration.
 * Multiple instances of the same module type may exist (if allowMultiple is true).
 */
interface ModuleInstance {
    /** Unique instance ID */
    id: string;
    /** Module type (references ModuleProvider.id) */
    type: ModuleType;
    /** Custom title override (uses provider name if not set) */
    title?: string;
    /** Module-specific persisted state */
    state?: unknown;
}
