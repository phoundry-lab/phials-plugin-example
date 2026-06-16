// @generated from phials — do not edit
// Synced by phials/scripts/sync-plugin-sdk.mjs

/**
 * Keyboard Shortcut Manager Type Definitions
 */

/** Platform identifiers */
type ShortcutPlatform = "mac" | "windows" | "linux";

/**
 * Platform-specific shortcut definitions.
 * Use when different platforms need different shortcuts.
 */
interface PlatformShortcuts {
	mac?: string;
	windows?: string;
	linux?: string;
	/** Fallback for unspecified platforms */
	default?: string;
}

/**
 * Shortcut definition syntax:
 * - "CmdOrCtrl+S" - Platform-dependent (Cmd on Mac, Ctrl on Win/Linux)
 * - "Ctrl+Shift+N" - Explicit modifiers
 * - "Delete" - Single key
 * - { mac: "Cmd+Backspace", default: "Delete" } - Platform-specific
 */
type ShortcutDefinition = string | PlatformShortcuts;

/** Parsed shortcut for internal matching */
interface ParsedShortcut {
	/** Normalized key (lowercase, e.g., 'a', 'delete', 'f1') */
	key: string;
	ctrl: boolean;
	meta: boolean;
	alt: boolean;
	shift: boolean;
	/** Original string representation */
	original: string;
}

/** A registered shortcut action (internal use) */
interface ShortcutRegistration {
	/** Unique identifier (e.g., 'core.newTab', 'plugin.terminal.toggle') */
	id: string;

	/** Human-readable name shown in settings */
	label: string;

	/** Optional description */
	description?: string;

	/** Default shortcut(s) - up to 3 */
	defaults?: ShortcutDefinition[];

	/** Section for settings page (defaults to provider type or 'Builtin') */
	section?: string;

	/** Subsection for settings page (defaults to plugin name if from plugin) */
	subsection?: string;

	/** The action handler */
	handler: (event: KeyboardEvent) => void | boolean | Promise<void>;

	/**
	 * Optional: only active when this returns true.
	 * Use for context-sensitive shortcuts.
	 */
	when?: () => boolean;

	/**
	 * If true, don't call preventDefault() after handling.
	 * Useful for shortcuts that should also trigger browser behavior.
	 */
	allowDefault?: boolean;

	/**
	 * Priority for conflict resolution (higher = checked first).
	 * Default is 0. Core shortcuts use 100+.
	 */
	priority?: number;
}

/** User's custom shortcut overrides (persisted) */
interface ShortcutOverrides {
	/** Action ID → array of shortcut strings (null = disabled slot) */
	[actionId: string]: (string | null)[];
}

/** Shortcut conflict info */
interface ShortcutConflict {
	/** The conflicting shortcut string */
	shortcut: string;
	/** ID of the action that already has this shortcut */
	existingActionId: string;
	/** Label of the existing action */
	existingActionLabel: string;
}

/** Section info for settings page organization */
interface ShortcutSection {
	id: string;
	label: string;
	subsections: ShortcutSubsection[];
}

interface ShortcutSubsection {
	id: string;
	label: string;
	shortcuts: ShortcutRegistration[];
}
