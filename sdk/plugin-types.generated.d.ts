// @generated from phials — do not edit
// Synced by phials/scripts/sync-plugin-sdk.mjs

/// <reference path="./pane-context.stub.d.ts" />

/**
 * Plugin System Type Definitions
 *
 * Defines interfaces for the plugin architecture including:
 * - Plugin container and registration
 * - All provider types (Preview, Context, Metadata, Toolbar, View, Theme, Module, Command)
 * - Scoped API interfaces
 * - Settings schema types
 */

// ─── Plugin Container ────────────────────────────────────────────────────────

/**
 * Props passed to a plugin's custom settings component in Settings → Plugins.
 */
interface PluginSettingsComponentProps {
	plugin: PhialsPlugin;
}

/**
 * A plugin is a container that can provide one or more providers.
 * Each provider type has its own interface and registration mechanism.
 */
interface PhialsPlugin {
	/** Unique plugin identifier (e.g., 'phials.terminal', 'vendor.preview-pdf') */
	id: string;

	/** Human-readable name */
	name: string;

	/** Plugin version (semver) */
	version: string;

	/** Icons used by this plugin (for preloading) */
	icons?: string[];

	/** Settings schema contributed by this plugin */
	settings?: PluginSettingsSchema;

	/**
	 * Custom settings UI for Settings → Plugins.
	 * When set, replaces the generic field loop; `settings` still supplies defaults and reset.
	 */
	settingsComponent?: import("svelte").Component<PluginSettingsComponentProps>;

	/** Database schema for plugin-owned SQL tables */
	database?: PluginDatabaseSchema;

	/** Called when the plugin is activated */
	onActivate?: (api: PluginAPI) => void | Promise<void>;

	/** Called when the plugin is deactivated */
	onDeactivate?: () => void | Promise<void>;

	/**
	 * Called before the plugin is reloaded.
	 * Return any state that should be preserved across the reload.
	 */
	onBeforeReload?: () => unknown | Promise<unknown>;

	/**
	 * Called after the plugin is reloaded.
	 * Receives the state that was returned from onBeforeReload.
	 */
	onAfterReload?: (state: unknown) => void | Promise<void>;

	/** Providers contributed by this plugin */
	providers: PluginProvider[];
}


// ─── Provider Types ──────────────────────────────────────────────────────────

/**
 * Union type for all provider types
 */
type PluginProvider =
	| PreviewProvider
	| ContextProvider
	| MetadataProvider
	| ToolbarButtonProvider
	| FileBrowserViewProvider
	| ThemeProvider
	| SelectionProvider
	| ModuleProvider
	| CommandProvider;

/**
 * Provider type discriminator
 */
type ProviderType =
	| "preview"
	| "context"
	| "metadata"
	| "toolbar"
	| "view"
	| "theme"
	| "selection"
	| "module"
	| "command";

// ─── Preview Provider ────────────────────────────────────────────────────────

/**
 * Props passed to preview components
 */
interface PreviewProviderProps {
	file: FileEntry;
}

/** Where the host mounted the thumbnail component. */
type ThumbnailSurface = "grid" | "details";

/** Load lifecycle reported to the host (details view uses this for icon fallback). */
type ThumbnailLoadState = "loading" | "loaded" | "failed";

/**
 * Props passed to thumbnail components
 */
interface ThumbnailProviderProps {
	file: FileEntry;
	size: number;
	generatedSize?: number;
	quality?: number;
	/** Host surface; grid-only chrome should hide when `"details"`. */
	surface?: ThumbnailSurface;
	/** Optional load-state callback for host-driven fallback (e.g. details leading column). */
	onLoadStateChange?: (state: ThumbnailLoadState) => void;
}

/**
 * Preview toolbar surface — sidebar embed vs preview tab / gallery fullscreen stage.
 */
type PreviewToolbarSurface = "sidebar" | "fullscreen";

/**
 * In-session undo/redo surface for preview editor toolbars and code/markdown editors.
 */
interface EditorHistoryHandle {
	undo: () => boolean;
	redo: () => boolean;
	canUndo: boolean;
	canRedo: boolean;
}

/**
 * Editor bundle props for {@link PreviewToolbar}.
 */
interface PreviewToolbarEditorState {
	isDirty: boolean;
	saving?: boolean;
	onSave: () => void | Promise<void>;
	onRevert?: () => void;
	history?: EditorHistoryHandle;
	saveLabel?: string;
	saveSavingLabel?: string;
	revertLabel?: string;
	revertTitle?: string;
	revertIcon?: string | null;
	/** When false, Revert/Cancel stays enabled while clean (e.g. exit edit mode). Default true. */
	revertRequiresDirty?: boolean;
	dirtyLabel?: string;
	showDirtyIndicator?: boolean;
}

/**
 * Props passed to fullscreen components
 */
interface FullscreenProviderProps {
	file: FileEntry;
	onclose?: () => void;
	/** One-shot request to focus an editable preview surface after load. */
	focusEditor?: boolean;
	onConsumeFocusEditor?: () => void;
}

/**
 * Preview provider - renders file previews, thumbnails, and fullscreen views
 */
interface PreviewProvider {
	type: "preview";
	id: string;
	name: string;
	priority?: number;

	/** File matching criteria */
	extensions?: string[];
	mimeTypes?: string[];
	categories?: FileCategory[];
	canHandle?: (file: FileEntry, api: FileMatchAPI) => boolean;

	/** Components */
	thumbnail?: import("svelte").Component<ThumbnailProviderProps>;
	preview?: import("svelte").Component<PreviewProviderProps>;
	fullscreen?: import("svelte").Component<FullscreenProviderProps>;

	/**
	 * Details view row-height presets (`xs`–`lg`, details slider ticks) at which
	 * the leading column mounts {@link thumbnail}. Omitted or empty = icon only.
	 */
	detailsViewThumbnails?: ViewItemSizePreset[];

	/** Behavior */
	overridesDoubleClick?: boolean;
	/** Preview can modify file contents (future host behavior; see Preview editor toolbar in docs/context/preview/toolbar.md). */
	isEditable?: (file: FileEntry, metadata?: FileMetadata) => boolean;
}

// ─── Context Provider ────────────────────────────────────────────────────────

/**
 * Shortcut configuration for context menu items.
 * When defined, the shortcut is auto-registered with ShortcutManager.
 */
interface ItemShortcutConfig {
	/** Default shortcuts (up to 3). Use ShortcutDefinition format. */
	defaults?: ShortcutDefinition[];
	/** Description shown in shortcuts settings */
	description?: string;
	/** If true, don't call preventDefault() after handling */
	allowDefault?: boolean;
	/** Priority for conflict resolution (higher = checked first) */
	priority?: number;
}

/**
 * Context passed to context menu item callbacks.
 * Provides access to the current file(s) and pane.
 */
interface ContextItemContext {
	/** The primary file entry (for single mode, the right-clicked file; for multi, the first selected) */
	entry: FileEntry;
	/** All selected file entries (for multi mode; for single mode, just [entry]) */
	entries: FileEntry[];
	/** The pane context */
	pane: PluginPaneContext;
}

/**
 * A single menu item contributed by a context provider.
 * Items are defined statically on the provider and filtered at runtime using canHandle.
 */
interface ContextProviderItem {
	/** Unique item ID within this provider */
	id: string;
	/** Display label in the menu */
	label: string;
	/** Icon to display */
	icon?: string;
	/** Mark as dangerous action (shows in red) */
	danger?: boolean;
	/** Custom render snippet instead of standard menu item */
	render?: import("svelte").Snippet;

	/**
	 * Per-item visibility check.
	 * Used for both menu filtering and shortcut 'when' condition.
	 * If omitted, item is always visible (when provider matches).
	 */
	canHandle?: (ctx: ContextItemContext) => boolean;

	/**
	 * Whether the item is disabled.
	 * Can be a boolean or a function that receives the context.
	 */
	disabled?: boolean | ((ctx: ContextItemContext) => boolean);

	/**
	 * Shortcut configuration.
	 * When defined, auto-registers with ShortcutManager using ID: `{pluginId}.{itemId}`.
	 */
	shortcut?: ItemShortcutConfig;

	/**
	 * Action to execute when the item is clicked or shortcut is triggered.
	 * Receives the context with current entry/entries and pane.
	 */
	action?: (ctx: ContextItemContext) => void | Promise<void>;
}

/**
 * Category definition for grouping items into submenus
 */
interface ContextProviderCategory {
	id: string;
	label: string;
	icon?: string;
}

/**
 * Context provider - contributes items to the right-click context menu.
 *
 * Items are defined statically in the `items` array and filtered at runtime
 * using the provider's `canHandle` and each item's `canHandle`.
 */
interface ContextProvider {
	type: "context";
	id: string;
	name: string;
	priority?: number;

	/** Selection mode: 'single' (default) or 'multi' */
	selectionMode?: "single" | "multi";

	/** Optional file-type filtering at provider level */
	extensions?: string[];
	mimeTypes?: string[];
	categories?: FileCategory[];

	/**
	 * Provider-level visibility check.
	 * For single mode: receives the right-clicked entry.
	 * For multi mode: receives all selected entries.
	 */
	canHandle?: (ctx: ContextItemContext) => boolean;

	/** Submenu category (null = root level) */
	category?: ContextProviderCategory | null;

	/** Static array of menu items provided by this provider */
	items: ContextProviderItem[];
}

// ─── Metadata Provider ───────────────────────────────────────────────────────

/**
 * Raw metadata from filesystem/backend
 */
interface RawMetadata {
	[key: string]: string;
}

/**
 * Extracted/processed metadata from a provider
 */
interface ExtractedMetadata {
	[key: string]: unknown;
}

/**
 * File metadata combining raw and extracted data
 */
interface FileMetadata {
	raw: RawMetadata;
	extracted: ExtractedMetadata;
}

/**
 * Schema field for metadata display
 */
interface MetadataSchemaField {
	key: string;
	label: string;
	type: "string" | "number" | "date" | "boolean" | "array" | "dynamic-enum";
	/**
	 * Optional hint for how extracted values should be presented in schema-driven UI
	 * (Details columns, preview Metadata, thumbnail captions), paired with `type`.
	 * v1 implements `"html"` only (sanitized render from `key`); requires `rawKey`.
	 * On formatted fields, `type` describes the raw value semantics for sort/filter.
	 */
	format?: string;
	/**
	 * Extracted key for sort, filter, and logic (not a separate schema row).
	 * Required when `format: "html"`.
	 */
	rawKey?: string;
	/** Optional Iconify id for column header / property list chrome */
	icon?: string;
}

/**
 * Schema for metadata UI rendering
 */
interface MetadataSchema {
	fields: MetadataSchemaField[];
}

/**
 * Policy for how a metadata provider contributes Details view columns.
 */
interface MetadataColumnPolicy {
	/** Whether this provider contributes fields to the Details column menu. Default true when schema exists. */
	showInColumnMenu?: boolean;

	/**
	 * If set, only these schema keys appear in the Details column menu (and auto-visible
	 * picks from this set). Omit for all schema fields. An empty array excludes the provider
	 * from column contributions. Does not override `showInColumnMenu` when that is false.
	 */
	columnWhitelist?: string[];

	/** Whether columns can be auto-shown from file matching alone. Default "when-dominant". */
	autoVisible?: "never" | "when-any" | "when-dominant";

	/** Fields to show automatically when the provider qualifies. Defaults to the first few schema fields. */
	defaultVisibleFields?: string[];

	/** Exclude this provider from dominance ratios. Useful for global/base providers. */
	excludeFromDominance?: boolean;

	/** Matching by extension/category is not enough; values may require sampling. */
	requiresValueSampling?: boolean;
}

/**
 * Metadata provider - extracts structured metadata from files
 */
interface MetadataProvider {
	type: "metadata";
	id: string;
	name: string;
	/**
	 * Precedence when multiple providers match the same file (default 0).
	 * Higher values sort first in registry lookups and extraction order; also
	 * breaks ties for directory metadata profiles and auto-visible Details columns.
	 */
	priority?: number;

	/** File matching criteria */
	extensions?: string[];
	mimeTypes?: string[];
	categories?: FileCategory[];
	canHandle?: (file: FileEntry) => boolean;

	/** Extract metadata from file */
	extract: (
		file: FileEntry,
		rawMeta: RawMetadata,
		api: MetadataAPI,
	) => Promise<ExtractedMetadata> | ExtractedMetadata;

	/** Schema for extracted metadata (for UI rendering) */
	schema?: MetadataSchema;

	/** How this provider appears in Details column picker and auto-visible heuristics */
	columnPolicy?: MetadataColumnPolicy;

	/**
	 * Optional override for filter dropdown options on `dynamic-enum` schema fields.
	 * When absent or empty, Phials falls back to distinct-value scan over the listing.
	 */
	getFilterValueOptions?: (
		fieldKey: string,
		api: MetadataAPI,
	) => FilterValueOption[] | Promise<FilterValueOption[]>;
}

/** Runtime filter dropdown entry from a metadata provider hook */
interface FilterValueOption {
	value: string;
	label?: string;
}

/**
 * Options for computing a directory metadata profile (cheap matching only).
 */
interface DirectoryMetadataProfileOptions {
	/** Directory path this profile describes (for diagnostics / persistence). */
	path?: string;
	/** Cap files scanned; default 1000. Uses the first N files after filtering. */
	maxSample?: number;
	/** Minimum share of sampled files that must match a provider for `dominant`; default 0.9. */
	dominanceThreshold?: number;
	/** Minimum total file count in the directory before any provider can be `dominant`; default 5. */
	minFilesForDominance?: number;
}

/**
 * Per-provider stats from scanning directory file entries (no metadata extraction).
 */
interface MetadataProviderDirectoryStats {
	providerId: string;
	matchedFiles: number;
	ratio: number;
	fields: MetadataSchemaField[];
	dominant: boolean;
}

/**
 * Aggregated column-relevant metadata coverage for a directory listing.
 */
interface DirectoryMetadataProfile {
	path: string;
	fileCount: number;
	sampledCount: number;
	providers: MetadataProviderDirectoryStats[];
}

// ─── Toolbar Button Provider ─────────────────────────────────────────────────

/**
 * Toolbar button definition
 */
interface ToolbarButtonDefinition {
	id: string;
	label: string;
	icon?: string | ((ctx: ToolbarContext) => string);
	/** Shortcut configuration for this button */
	shortcut?: ItemShortcutConfig;
	action: (ctx: ToolbarContext) => void | Promise<void>;
	disabled?: (ctx: ToolbarContext) => boolean;
	hidden?: (ctx: ToolbarContext) => boolean;
	active?: (ctx: ToolbarContext) => boolean;
	/** If true, cannot be removed in edit mode */
	fixed?: boolean;
	/** Higher priority items stay visible longer when collapsing (default 0) */
	priority?: number;
}

/**
 * Toolbar button group definition
 */
interface ToolbarButtonGroupDefinition {
	id: string;
	label: string;
	icon?: string;
	buttons: ToolbarButtonDefinition[];
	dropdownLabel?: string;
	/** Higher priority items stay visible longer when collapsing (default 0) */
	priority?: number;
}

/**
 * Item in a toolbar dropdown menu
 */
interface ToolbarDropdownItem {
	id: string;
	label: string;
	icon?: string;
	shortcut?: ItemShortcutConfig;
	action: (ctx: ToolbarContext) => void | Promise<void>;
	disabled?: (ctx: ToolbarContext) => boolean;
	danger?: boolean;
}

/**
 * Toolbar button that opens a dropdown menu
 */
interface ToolbarButtonDropdownDefinition {
	id: string;
	label: string;
	icon?: string | ((ctx: ToolbarContext) => string);
	dropdownItems: ToolbarDropdownItem[];
	disabled?: (ctx: ToolbarContext) => boolean;
	hidden?: (ctx: ToolbarContext) => boolean;
	/** If true, cannot be removed in edit mode */
	fixed?: boolean;
	/** Higher priority items stay visible longer when collapsing (default 0) */
	priority?: number;
}

/**
 * Props passed to toolbar sub-toolbar components
 */
interface ToolbarSubToolbarProps {
	ctx: ToolbarContext;
}

/**
 * Context passed to toolbar button callbacks
 */
interface ToolbarContext {
	pane: PluginPaneContext;
}

/**
 * Toolbar button provider - contributes buttons to the PathBar toolbar
 */
interface ToolbarButtonProvider {
	type: "toolbar";
	id: string;
	name: string;
	priority?: number;

	/** Optional file-type filtering (shows only when matching files selected) */
	extensions?: string[];
	mimeTypes?: string[];
	categories?: FileCategory[];
	requiresSelection?: boolean;

	/** Button definition */
	button:
		| ToolbarButtonDefinition
		| ToolbarButtonGroupDefinition
		| ToolbarButtonDropdownDefinition;

	/** Optional sub-toolbar (custom component shown when button is clicked) */
	subToolbar?: import("svelte").Component<ToolbarSubToolbarProps>;
}

// ─── File Browser View Provider ──────────────────────────────────────────────

/**
 * Props passed to file browser view components
 */
interface FileBrowserViewProps {
	pane: PluginPaneContext;
}

/**
 * Row / cell size tier for view default item size (maps to slider ticks per view family).
 */
type ViewItemSizePreset = "xs" | "sm" | "md" | "lg";

/**
 * Column definition for views that support columns
 */
interface ViewColumnDefinition {
	id: string;
	label: string;
	width: number;
	minWidth?: number;
	sortable?: boolean;
	getValue: (file: FileEntry) => string | number | null;
}

/**
 * File browser view provider - provides custom view modes
 */
interface FileBrowserViewProvider {
	type: "view";
	id: string;
	name: string;

	/**
	 * Sort order when listing views (lower appears first).
	 * Built-in views use 1–6; extension views should use higher numbers.
	 */
	priority: number;

	/** Icon for view switcher */
	icon: string;

	/** View component */
	component: import("svelte").Component<FileBrowserViewProps>;

	/** Optional: custom column configuration for this view */
	columns?: ViewColumnDefinition[];

	/** If true, this view is only available in collections (vials) */
	collectionOnly?: boolean;

	/**
	 * Default item size when a folder has no per-folder override (`itemSize` null).
	 * Details family uses row-height ticks; thumbnails / gallery use grid ticks; other
	 * modes use thumbnail tick mapping when a preset is set.
	 */
	defaultItemSizePreset?: ViewItemSizePreset;

	/**
	 * Optional inline view configuration items (phoundry-ui menu row contract).
	 * `api` is scoped to the plugin that registered this view.
	 */
	getConfigurationItems?: (
		pane: PluginPaneContext,
		api: ViewAPI,
	) => import("phoundry-ui").MenuItem[];
}

// ─── Theme Provider ──────────────────────────────────────────────────────────

type _ThemeDefinition = import("phoundry-ui").ThemeDefinition;
type _ThemeVariables = import("phoundry-ui").ThemeVariables;

/**
 * Theme provider for the plugin system.
 * Extends phoundry-ui's ThemeDefinition with a `type` discriminator
 * so the PluginProvider union routing continues to work.
 */
interface ThemeProvider extends _ThemeDefinition {
	type: "theme";
}

/** Re-export for convenience — consumers should prefer importing from phoundry-ui directly. */
type ThemeVariables = _ThemeVariables;

// ─── Selection Provider ──────────────────────────────────────────────────────

/**
 * Context passed to selection provider callbacks
 */
interface SelectionContext {
	/** The pane context */
	pane: PluginPaneContext;

	/** Currently selected file entries */
	selectedFiles: FileEntry[];

	/** Currently selected paths */
	selectedPaths: string[];
}

/**
 * A single action item contributed by a selection provider
 */
interface SelectionProviderItem {
	id: string;
	label: string;
	icon?: string;
	disabled?: boolean;
	danger?: boolean;
	action: (ctx: SelectionContext) => void | Promise<void>;
}

/**
 * Selection provider - contributes actions to the multi-selection toolbar
 */
interface SelectionProvider {
	type: "selection";
	id: string;
	name: string;
	priority?: number;

	/** Optional file-type filtering (only shows when all selected files match) */
	extensions?: string[];
	mimeTypes?: string[];
	categories?: FileCategory[];

	/** Custom handler to check if provider applies to selection */
	canHandle?: (selectedFiles: FileEntry[]) => boolean;

	/** Minimum number of selected items required (default: 2) */
	minSelection?: number;

	/** Generate action items for the current selection */
	getItems: (
		ctx: SelectionContext,
		api?: SelectionActionAPI,
	) => SelectionProviderItem[];
}

// ─── Module Provider ──────────────────────────────────────────────────────────

/**
 * Props passed to module components
 */
interface ModuleProviderProps {
	/** The pane context (for pane-scoped modules) */
	pane?: PluginPaneContext;

	/** The module instance configuration */
	moduleInstance: ModuleInstance;
}

/**
 * Module provider - provides a UI module that can be placed in any panel
 *
 * Modules are self-contained UI components like Navigator, File Preview,
 * or Terminal that can be arranged in tabs or splits within panels.
 */
interface ModuleProvider {
	type: "module";

	/** Unique module identifier (e.g., 'phials.module.navigator') */
	id: string;

	/** Human-readable name for display */
	name: string;

	/** Icon for tabs and headers */
	icon: string;

	/** Positions where this module can be placed (default: all panels, not center) */
	allowedPositions?: ModulePosition[];

	/** Default position for new instances */
	defaultPosition?: ModulePosition;

	/** The module component */
	component: import("svelte").Component<ModuleProviderProps>;

	/** Whether multiple instances of this module are allowed (default: false) */
	allowMultiple?: boolean;

	/** If true, the component is fully remounted when switching between instances (needed for lifecycle-heavy modules like Terminal). Default: false. */
	requiresRemount?: boolean;

	/** Default state for new module instances */
	getDefaultState?: () => unknown;

	/** Keyboard shortcut to toggle/focus this module */
	shortcut?: ItemShortcutConfig;

	/** Dynamic tab title when rendered in center (falls back to `name`) */
	getTabTitle?: (state?: unknown) => string;

	/** Dynamic tab icon when rendered in center (falls back to `icon`) */
	getTabIcon?: (state?: unknown) => string;
}

// ─── Plugin Settings ─────────────────────────────────────────────────────────

/**
 * Settings field types
 */
type SettingsFieldType = "boolean" | "string" | "number" | "select" | "path";

/**
 * Base settings field
 */
interface SettingsFieldBase {
	key: string;
	label: string;
	description?: string;
}

/**
 * Boolean settings field
 */
interface BooleanSettingsField extends SettingsFieldBase {
	type: "boolean";
	default: boolean;
}

/**
 * String settings field
 */
interface StringSettingsField extends SettingsFieldBase {
	type: "string";
	default: string;
	placeholder?: string;
}

/**
 * Number settings field
 */
interface NumberSettingsField extends SettingsFieldBase {
	type: "number";
	default: number;
	min?: number;
	max?: number;
	step?: number;
}

/**
 * Select settings field
 */
interface SelectSettingsField extends SettingsFieldBase {
	type: "select";
	options: { value: string; label: string }[];
	default: string;
}

/**
 * Path settings field
 */
interface PathSettingsField extends SettingsFieldBase {
	type: "path";
	default: string;
	directory?: boolean;
}

/**
 * Union of all settings field types
 */
type SettingsField =
	| BooleanSettingsField
	| StringSettingsField
	| NumberSettingsField
	| SelectSettingsField
	| PathSettingsField;

/**
 * Plugin settings schema
 */
interface PluginSettingsSchema {
	/** Settings section title */
	title: string;

	/** Settings fields */
	fields: SettingsField[];
}

// ─── Plugin Database Schema ──────────────────────────────────────────────────

/**
 * SQLite column types supported for plugin tables
 */
type PluginColumnType = "TEXT" | "INTEGER" | "REAL" | "BLOB";

/**
 * Column definition for a plugin database table
 */
interface PluginColumnDefinition {
	/** Column name */
	name: string;

	/** SQLite data type */
	type: PluginColumnType;

	/** Whether this column is the primary key */
	primaryKey?: boolean;

	/** Whether this column auto-increments (only for INTEGER PRIMARY KEY) */
	autoIncrement?: boolean;

	/** Whether NULL values are disallowed */
	notNull?: boolean;

	/** Whether values must be unique */
	unique?: boolean;

	/** Default value for the column */
	default?: unknown;
}

/**
 * Index definition for a plugin database table
 */
interface PluginIndexDefinition {
	/** Index name (will be prefixed with table name) */
	name: string;

	/** Columns to index */
	columns: string[];

	/** Whether this is a unique index */
	unique?: boolean;
}

/**
 * Table definition for a plugin database
 */
interface PluginTableDefinition {
	/** Table name (will be prefixed with plugin ID) */
	name: string;

	/** Column definitions */
	columns: PluginColumnDefinition[];

	/** Optional index definitions */
	indexes?: PluginIndexDefinition[];
}

/**
 * Database schema for a plugin
 */
interface PluginDatabaseSchema {
	/** Tables owned by this plugin */
	tables: PluginTableDefinition[];
}

// ─── Plugin Storage API ──────────────────────────────────────────────────────

/**
 * Key/value storage API for plugin data (separate from settings)
 */
interface PluginStorageAPI {
	/** Get a value by key */
	get<T>(key: string): Promise<T | null>;

	/** Set a value by key */
	set(key: string, value: unknown): Promise<void>;

	/** Delete a value by key */
	delete(key: string): Promise<void>;

	/** Get all keys for this plugin */
	keys(): Promise<string[]>;

	/** Clear all data for this plugin */
	clear(): Promise<void>;
}

// ─── Plugin Database API ─────────────────────────────────────────────────────

/**
 * Result from an execute operation
 */
interface DatabaseExecuteResult {
	/** Number of rows affected */
	rowsAffected: number;

	/** Last inserted row ID (if applicable) */
	lastInsertId?: number;
}

/**
 * SQL database API for plugin-owned tables
 */
interface PluginDatabaseAPI {
	/**
	 * Execute a raw SQL query and return results.
	 * Table names in the query should use the short name (without prefix).
	 * @param sql SQL query string with ? placeholders
	 * @param params Array of parameter values
	 */
	query<T = Record<string, unknown>>(
		sql: string,
		params?: unknown[],
	): Promise<T[]>;

	/**
	 * Execute a SQL statement (INSERT, UPDATE, DELETE, etc.)
	 * @param sql SQL statement with ? placeholders
	 * @param params Array of parameter values
	 */
	execute(sql: string, params?: unknown[]): Promise<DatabaseExecuteResult>;

	/**
	 * Insert a row into a table
	 * @param table Table name (without prefix)
	 * @param data Object with column names as keys
	 * @returns The last inserted row ID
	 */
	insert(table: string, data: Record<string, unknown>): Promise<number>;

	/**
	 * Update rows in a table
	 * @param table Table name (without prefix)
	 * @param data Object with column names as keys
	 * @param where WHERE clause (without 'WHERE')
	 * @param params Parameters for the WHERE clause
	 * @returns Number of rows affected
	 */
	update(
		table: string,
		data: Record<string, unknown>,
		where: string,
		params?: unknown[],
	): Promise<number>;

	/**
	 * Delete rows from a table
	 * @param table Table name (without prefix)
	 * @param where WHERE clause (without 'WHERE')
	 * @param params Parameters for the WHERE clause
	 * @returns Number of rows affected
	 */
	deleteFrom(
		table: string,
		where: string,
		params?: unknown[],
	): Promise<number>;

	/**
	 * Select all rows from a table
	 * @param table Table name (without prefix)
	 * @param where Optional WHERE clause (without 'WHERE')
	 * @param params Parameters for the WHERE clause
	 */
	selectAll<T = Record<string, unknown>>(
		table: string,
		where?: string,
		params?: unknown[],
	): Promise<T[]>;
}

// ─── Plugin APIs ─────────────────────────────────────────────────────────────

/**
 * Read-only app settings proxy
 */
interface ReadonlyAppSettings {
	readonly thumbnailsEnabled: boolean;
	readonly thumbnailSize: number;
	readonly thumbnailQuality: number;
	readonly showHiddenFiles: boolean;
	readonly showParentDirectory: boolean;
}

/**
 * Plugin settings proxy for a specific plugin
 */
interface PluginSettings {
	get<T>(key: string): T | undefined;
	set(key: string, value: unknown): Promise<void>;
	getAll(): Record<string, unknown>;
}

/**
 * Modal dialog API
 */
interface ModalAPI {
	confirm(opts: {
		title: string;
		message: string;
		confirmLabel?: string;
		cancelLabel?: string;
		danger?: boolean;
	}): Promise<boolean>;

	prompt(opts: {
		title: string;
		message: string;
		defaultValue?: string;
		placeholder?: string;
	}): Promise<string | null>;

	alert(opts: { title: string; message: string }): Promise<void>;
}

/**
 * Notification/toast API
 */
interface NotifyAPI {
	info(message: string): void;
	success(message: string): void;
	warning(message: string): void;
	error(message: string): void;
}

/**
 * File utilities API
 */
interface FileUtilsAPI {
	getExtension(filename: string): string;
	getBasename(path: string): string;
	getDirname(path: string): string;
	joinPath(...parts: string[]): string;
}

/**
 * File matching API for canHandle callbacks
 */
interface FileMatchAPI {
	matchesExtension(file: FileEntry, extensions: string[]): boolean;
	matchesMime(file: FileEntry, mimeTypes: string[]): boolean;
	matchesCategory(file: FileEntry, categories: FileCategory[]): boolean;
}

/**
 * Events API for pub/sub cross-plugin communication
 */
interface EventsAPI {
	/**
	 * Subscribe to an event.
	 * @param eventId - The event ID to subscribe to
	 * @param handler - Callback invoked when event is emitted
	 * @returns Subscription handle with unsubscribe() method
	 */
	on<K extends keyof EventMap>(
		eventId: K,
		handler: EventHandler<EventMap[K]>,
	): EventSubscription;

	/**
	 * Subscribe to an event once (auto-unsubscribes after first trigger).
	 * @param eventId - The event ID to subscribe to
	 * @param handler - Callback invoked when event is emitted
	 * @returns Subscription handle with unsubscribe() method
	 */
	once<K extends keyof EventMap>(
		eventId: K,
		handler: EventHandler<EventMap[K]>,
	): EventSubscription;

	/**
	 * Emit an event to all subscribers.
	 * @param eventId - The event ID to emit
	 * @param payload - The event payload
	 */
	emit<K extends keyof EventMap>(eventId: K, payload: EventMap[K]): void;

	/**
	 * Register a new event type (namespaced to plugin).
	 * The full event ID will be `{pluginId}.{localId}`.
	 * @param localId - Local event name (without plugin prefix)
	 * @param description - Optional description for docs/debugging
	 */
	register(localId: string, description?: string): void;
}

/**
 * Base Plugin API - available to all providers
 */
interface PluginAPI {
	/** Plugin's own settings */
	settings: PluginSettings;

	/** Key/value data storage (separate from settings) */
	storage: PluginStorageAPI;

	/** SQL database for plugin-owned tables */
	database: PluginDatabaseAPI;

	/** Read-only access to app settings */
	appSettings: ReadonlyAppSettings;

	/** Invoke Tauri commands (permission-gated allowlist for community plugins) */
	invoke<T>(command: string, args?: Record<string, unknown>): Promise<T>;

	/** Modal dialogs */
	modal: ModalAPI;

	/** Notifications/toasts */
	notify: NotifyAPI;

	/** File path utilities */
	files: FileUtilsAPI;

	/** Event pub/sub for cross-plugin communication */
	events: EventsAPI;
}

/**
 * API passed to view configuration item factories (scoped to the view's owning plugin).
 * Same runtime object as {@link PluginAPI} for that plugin; reserved for future view helpers.
 */
interface ViewAPI extends PluginAPI {}

/**
 * Preview API - extended API for preview providers
 */
interface PreviewAPI extends PluginAPI {
	/** Get metadata for a file */
	getMetadata(file: FileEntry): Promise<FileMetadata>;

	/** Open fullscreen preview for a file */
	openFullscreen(file: FileEntry): void;

	/** Navigate to a path */
	navigateTo(path: string): void;
}

/**
 * Selection API for context providers
 */
interface SelectionAPI {
	/** Get currently selected files */
	getSelected(): FileEntry[];

	/** Check if a file is selected */
	isSelected(file: FileEntry): boolean;

	/** Select a file */
	select(file: FileEntry): void;

	/** Clear selection */
	clearSelection(): void;
}

/**
 * Clipboard API for context providers
 */
interface ClipboardAPI {
	/** Copy text to clipboard */
	writeText(text: string): Promise<void>;

	/** Copy file paths to clipboard */
	copyPaths(paths: string[]): Promise<void>;
}

/**
 * File operations API for context providers
 */
interface FileOpsAPI {
	/** Delete file (move to trash) */
	deleteFile(path: string): Promise<void>;

	/** Rename file */
	renameFile(path: string, newName: string): Promise<string>;

	/** Refresh current directory */
	refresh(): Promise<void>;
}

/**
 * Context API - extended API for context providers
 */
interface ContextAPI extends PluginAPI {
	/** Access to selection */
	selection: SelectionAPI;

	/** Clipboard operations */
	clipboard: ClipboardAPI;

	/** File operations */
	fileOps: FileOpsAPI;
}

/**
 * Metadata API - extended API for metadata providers
 */
interface MetadataAPI extends PluginAPI {
	/** Read file content as bytes */
	readFile(path: string): Promise<Uint8Array>;

	/** Read text file content */
	readTextFile(path: string): Promise<string>;
}

/**
 * File operations API for selection providers (supports multiple files)
 */
interface SelectionFileOpsAPI {
	/** Delete multiple files (move to trash) */
	deleteFiles(paths: string[]): Promise<void>;

	/** Refresh current directory */
	refresh(): Promise<void>;

	/** Clear the current selection */
	clearSelection(): void;
}

/**
 * Selection action API - extended API for selection providers
 */
interface SelectionActionAPI extends PluginAPI {
	/** Clipboard operations */
	clipboard: ClipboardAPI;

	/** File operations */
	fileOps: SelectionFileOpsAPI;
}
