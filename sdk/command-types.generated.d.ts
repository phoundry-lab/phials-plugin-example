// @generated from phials - do not edit
// Synced by phials/scripts/sync-plugin-sdk.mjs

/// <reference path="./pane-context.stub.d.ts" />

/**
 * Command System Type Definitions
 *
 * Defines interfaces for the unified command architecture including:
 * - Context keys for fast filtering
 * - Command definition and configuration
 * - UI placement configuration
 * - User settings persistence
 */

// ─── Context Keys (Fast Pre-Filter) ──────────────────────────────────────────

/**
 * Context keys for fast command filtering.
 * Commands declare which keys they require, and the CommandManager
 * maintains the current set of active keys based on app state.
 */
type CommandContextKey =
	// Selection state
	| "hasSelection" // Any file(s) selected
	| "hasSingleSelection" // Exactly one file selected
	| "hasMultiSelection" // 2+ files selected
	// File type (based on selection)
	| "selectionIsFile" // All selected are files
	| "selectionIsDirectory" // All selected are directories
	| "selectionIsMixed" // Mix of files and directories
	// Vial/Collection state
	| "inVial" // Current directory is a vial
	| "hasVialSelection" // Selected files are in a vial
	// Clipboard
	| "hasClipboard" // Files in clipboard (cut/copy)
	| "clipboardIsCut" // Clipboard operation is cut
	| "clipboardIsCopy" // Clipboard operation is copy
	| "clipboardIsCopySymlink" // Clipboard operation is copy-as-symlink
	// Navigation state
	| "canGoBack" // Navigation history has back
	| "canGoForward" // Navigation history has forward
	// Always
	| "always"; // No filtering (always visible)

// ─── Command Context ─────────────────────────────────────────────────────────

/**
 * Runtime context passed to command handlers and predicates.
 * Built from the active pane's current state.
 */
interface CommandContext {
	/** The active pane (always available) */
	pane: PluginPaneContext;

	/** Selected files (empty if none) */
	selectedFiles: FileEntry[];

	/** The "target" file (for context menu: right-clicked file; otherwise: first selected) */
	targetFile: FileEntry | null;

	/** Current directory path */
	currentPath: string;

	/** Whether current directory is a vial */
	isVial: boolean;

	/** Whether the saved-views scope has a property schema (e.g. Boards). */
	hasPropertySchema: boolean;

	/** Active context keys (for debugging/inspection) */
	activeContextKeys: ReadonlySet<CommandContextKey>;
}

// ─── Command Shortcut ────────────────────────────────────────────────────────

/**
 * Keyboard shortcut configuration for a command.
 */
interface CommandShortcut {
	/** Default shortcut(s) - up to 3 */
	defaults?: ShortcutDefinition[];

	/** If true, don't call preventDefault() after handling */
	allowDefault?: boolean;

	/** Priority for conflict resolution (higher = checked first) */
	priority?: number;
}

// ─── Command Placements ──────────────────────────────────────────────────────

/**
 * Areas where commands can be placed in the UI.
 */
type CommandPlacementArea = "toolbar" | "contextMenu";

/**
 * Base placement configuration.
 */
interface CommandPlacementBase {
	area: CommandPlacementArea;
}

/**
 * Toolbar placement configuration (PathBar toolbar).
 */
interface ToolbarPlacementConfig extends CommandPlacementBase {
	area: "toolbar";
	/** Icon override for toolbar display */
	icon?: string | ((ctx: CommandContext) => string);
	/** Order priority (higher = more left) */
	priority?: number;
	/** If true, cannot be removed by user */
	fixed?: boolean;
	/** Whether to show text label by default (can be overridden by user config) */
	showLabel?: boolean;
	/** Whether to show the dropdown chevron on commands with children (default true) */
	showArrow?: boolean;
	/** Toggle/active state indicator */
	active?: (ctx: CommandContext) => boolean;
	/** Optional activity badge count on the path bar button */
	badgeCount?: (ctx: CommandContext) => number;
	/** Group ID for ButtonGroup */
	group?: string;
	/** Optional sub-toolbar component shown when button is toggled */
	subToolbar?: import("svelte").Component<{ ctx: ToolbarContext }>;
}

/**
 * Context menu placement configuration.
 */
interface ContextMenuPlacementConfig extends CommandPlacementBase {
	area: "contextMenu";
	/** Selection mode this applies to */
	selectionMode?: "single" | "multi" | "both";
	/** Default submenu (null = root level) */
	submenu?: { id: string; label: string; icon?: string } | null;
	/** Show as dangerous (red styling) */
	danger?: boolean;
	/** Order within section/submenu (lower = higher in menu) */
	order?: number;
}

/**
 * Union of all placement configurations.
 */
type CommandPlacement =
	| ToolbarPlacementConfig
	| ContextMenuPlacementConfig;

// ─── Command Definition ──────────────────────────────────────────────────────

/**
 * A command is a discrete action that can be invoked via:
 * - Keyboard shortcut
 * - Command bar
 * - Context menu
 * - Toolbar button
 * - Programmatically
 */
interface Command {
	/** Unique command identifier (e.g., 'core.file.delete', 'plugin.terminal.toggle') */
	id: string;

	/** Human-readable label */
	label: string;

	/** Optional description for command bar/settings */
	description?: string;

	/** Tooltip text shown on hover (defaults to label if not set) */
	tooltip?: string;

	/** Icon for UI display */
	icon?: string;

	// ─── Visibility & Availability ─────────────────────────────────────────────

	/**
	 * Context keys required for this command to be visible.
	 * Used for fast pre-filtering before evaluating `when()`.
	 * If omitted or contains 'always', command is always considered.
	 */
	contextKeys?: CommandContextKey[];

	/**
	 * Fine-grained visibility check.
	 * Only called if contextKeys pass (or are not specified).
	 * Return false to hide the command.
	 */
	when?: (ctx: CommandContext) => boolean;

	/**
	 * Whether the command is disabled (visible but not executable).
	 * Return true to disable.
	 */
	disabled?: (ctx: CommandContext) => boolean;

	// ─── Execution ─────────────────────────────────────────────────────────────

	/** The action to execute */
	action: (ctx: CommandContext) => void | Promise<void>;

	/**
	 * Optional toast shown after the action completes successfully (no throw).
	 * Static entry or a function of the same context passed to `action`.
	 */
	toastData?:
		| import("phoundry-ui").ToastEntry
		| ((
				ctx: CommandContext,
		  ) => import("phoundry-ui").ToastEntry | null | undefined);

	// ─── Keyboard Shortcut ─────────────────────────────────────────────────────

	/** Keyboard shortcut configuration */
	shortcut?: CommandShortcut;

	// ─── Default UI Placements ─────────────────────────────────────────────────

	/**
	 * Where this command appears by default.
	 * Users can override these in settings.
	 */
	defaultPlacements?: CommandPlacement[];

	// ─── Command Bar ───────────────────────────────────────────────────────────

	/**
	 * Category for grouping in command bar.
	 * E.g., 'File', 'Edit', 'View', 'Navigation', 'Tabs'
	 */
	category?: string;

	/** Alternative search terms for command bar fuzzy search */
	searchAliases?: string[];

	/** Optional group for path bar dropdown separators between sibling child commands */
	menuGroup?: string;

	// ─── Child Commands ───────────────────────────────────────────────────────

	/**
	 * Child commands for dropdown/submenu patterns.
	 * When a command has children, its action typically does nothing
	 * and the UI shows a dropdown menu of child commands instead.
	 */
	children?: Command[];

	// ─── Custom Rendering ─────────────────────────────────────────────────────

	/**
	 * Custom render snippet for context menu.
	 * When provided, the command renders as a custom menu item instead of
	 * a standard action item. Useful for inline controls like ratings.
	 *
	 * @returns A Svelte Snippet to render in the menu
	 */
	renderSnippet?: (ctx: CommandContext) => import("svelte").Snippet;
}

// ─── Command Provider ────────────────────────────────────────────────────────

/**
 * A command provider contributes commands from a plugin.
 */
interface CommandProvider {
	type: "command";

	/** Provider identifier */
	id: string;

	/** Human-readable name */
	name: string;

	/** Commands contributed by this provider */
	commands: Command[];
}
