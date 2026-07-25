// @generated from phials - do not edit
// Synced by phials/scripts/sync-plugin-sdk.mjs

/// <reference path="./pane-context.stub.d.ts" />

/**
 * Plugin System Type Definitions
 *
 * Defines interfaces for the plugin architecture including:
 * - Plugin container and registration
 * - All provider types (Preview, Metadata, View, Module, Command)
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


/**
 * Svelte runtime re-exported from a community plugin bundle (`main.js`).
 * Required so host code mounts plugin components with the same runtime that compiled them.
 */
interface PluginSvelteRuntime {
	mount: (
		component: import("svelte").Component<Record<string, unknown>>,
		options: {
			target: Element | Document | ShadowRoot;
			props?: Record<string, unknown>;
		},
	) => unknown;
	unmount: (instance: unknown) => void;
}

// ─── Provider Types ──────────────────────────────────────────────────────────

/**
 * Union type for all provider types
 */
type PluginProvider =
	| PreviewProvider
	| MetadataProvider
	| FileBrowserViewProvider
	| ModuleProvider
	| CommandProvider;

/**
 * Provider type discriminator
 */
type ProviderType =
	| "preview"
	| "metadata"
	| "view"
	| "module"
	| "command";

// ─── Preview Provider ────────────────────────────────────────────────────────

type PreviewDestination = "module" | "gallery" | "page" | "embed";

/** Provider-owned state shared by every presentation of one file preview. */
interface PreviewSession {
	/** Clean unreferenced sessions are disposed; unresolved work can retain itself. */
	retainOnRelease?: () => boolean;
	dispose?: () => void | Promise<void>;
	/** Optional in-app path relocation hook. */
	relocate?: (oldPath: string, newPath: string) => void | Promise<void>;
	/** Standard editor state rendered by host preview toolbars. */
	editor?: PreviewToolbarEditorState;
}

interface PreviewSessionFactoryProps {
	file: FileEntry;
}

interface PreviewSurfaceProps {
	file: FileEntry;
	session?: PreviewSession;
	/** Host destination; `embed` requires inspection-only behavior. */
	destination?: PreviewDestination;
	/** One-shot focus request; does not describe the host destination. */
	focusEditor?: boolean;
	onConsumeFocusEditor?: () => void;
}

interface PreviewToolbarContributionProps {
	file: FileEntry;
	session?: PreviewSession;
	destination: PreviewDestination;
}

interface PreviewDestinationCapabilities {
	/** Surface may populate File mode in the universal Page tab. */
	pageTab?: boolean;
	/** Surface is safe to mount inspection-only inside Markdown. */
	embed?: boolean;
}

/**
 * Props passed to thumbnail components
 */
interface ThumbnailProviderProps {
	file: FileEntry;
	size: number;
	generatedSize?: number;
	quality?: number;
}

/**
 * Preview toolbar surface - sidebar embed vs PageTab / gallery fullscreen stage.
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

interface PhormatEditorEmbedderHandle {
	prepareForSave(): string;
	hasActiveDraft(): boolean;
}

/**
 * Editor bundle props for {@link PreviewToolbar}.
 */
interface PreviewToolbarEditorState {
	isDirty: boolean;
	/** Hide explicit persistence chrome while retaining history controls. */
	autosave?: boolean;
	saving?: boolean;
	onSave: () => void | Promise<void>;
	/** Await autosave finalization before replacing the current document. */
	onFinalize?: () => Promise<boolean>;
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
	/** Responsive file-specific viewer/editor used by every host destination. */
	surface?: import("svelte").Component<PreviewSurfaceProps>;
	createSession?: (
		props: PreviewSessionFactoryProps,
	) => PreviewSession | Promise<PreviewSession>;
	/** Single reactive provider control group mounted at the host toolbar's trailing edge. */
	toolbar?: import("svelte").Component<PreviewToolbarContributionProps>;
	destinations?: PreviewDestinationCapabilities;

	/** Behavior */
	overridesDoubleClick?: boolean;
	/** Preview can modify file contents (future host behavior; see Preview editor toolbar in docs/context/preview/toolbar.md). */
	isEditable?: (file: FileEntry, metadata?: FileMetadata) => boolean;
}

// ─── Item Shortcuts ──────────────────────────────────────────────────────────

/**
 * Shortcut configuration for module providers and other item-level shortcuts.
 * When defined on a module, the shortcut is auto-registered with ShortcutManager.
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

// ─── Toolbar Context (Command Path Bar) ─────────────────────────────────────

/**
 * Props passed to toolbar sub-toolbar components
 */
interface ToolbarSubToolbarProps {
	ctx: ToolbarContext;
}

/**
 * Context passed to toolbar button callbacks and sub-toolbar components
 */
interface ToolbarContext {
	pane: PluginPaneContext;
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
	 * Details family uses row-height ticks; thumbnails / gallery use grid ticks;
	 * Boards uses its column-width ticks.
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

// ─── Module Provider ──────────────────────────────────────────────────────────

/**
 * Props passed to module components
 */
interface ModuleProviderProps {
	/** The pane context (for pane-scoped modules) */
	pane?: PluginPaneContext;

	/** The module instance configuration */
	moduleInstance: ModuleInstance;

	/** Replace this instance's opaque state and schedule center-session persistence. */
	updateState(state: unknown): void;

	/** Request that the host close this module instance. */
	close(): Promise<void>;
}

/**
 * Module provider - provides a UI module for panels and center tab groups
 *
 * Modules are self-contained UI components like Navigator, File Preview,
 * or Terminal that can be arranged in panel tabs or modular center groups.
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

	/**
	 * If true, the center host fully remounts the component when the remount key
	 * changes: `getCenterTabIdentity(state)` when defined, otherwise the module
	 * instance id. Needed for lifecycle-heavy modules (Terminal, Page, Preview)
	 * so **center tab replacement** reloads content when only state changes.
	 * Default: false.
	 */
	requiresRemount?: boolean;

	/** Default state for new module instances */
	getDefaultState?: () => unknown;

	/** Keyboard shortcut to toggle/focus this module */
	shortcut?: ItemShortcutConfig;

	/** Dynamic tab title when rendered in center (falls back to `name`) */
	getTabTitle?: (state?: unknown) => string;

	/** Dynamic tab icon when rendered in center (falls back to `icon`) */
	getTabIcon?: (state?: unknown) => string;

	/** Stable content identity used to focus an equivalent center tab before creating one. */
	getCenterTabIdentity?: (state?: unknown) => string | undefined;

	/** Opt in to same-type replacement of an active, unpinned center tab. */
	canReplaceCenterTab?: (
		currentState: unknown,
		requestedState: unknown,
	) => boolean;

	/** Finalize or refuse unresolved state before close or center-tab replacement. */
	finalizeCenterTab?: (moduleInstance: ModuleInstance) => Promise<boolean>;

	/** Optional panel module tab bar menu items (phoundry-ui context menu rows). */
	getTabBarMenuItems?: (
		moduleInstance: ModuleInstance,
		api: ModuleAPI,
	) => import("phoundry-ui").MenuItem[];
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

	choose<T extends string>(opts: {
		title: string;
		message: string;
		choices: Array<{
			id: T;
			label: string;
			description?: string;
			variant?: "primary" | "secondary" | "danger";
		}>;
		cancelLabel?: string;
	}): Promise<T | null>;
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
	pickDirectory(options?: {
		title?: string;
		initialPath?: string;
	}): Promise<string | null>;
	readDirectory(path: string): Promise<FileEntry[]>;
	readText(path: string): Promise<PluginTextFileSnapshot>;
	writeText(
		path: string,
		content: string,
		options: {
			expectedRevision: string | null;
			overwrite?: boolean;
		},
	): Promise<PluginTextWriteResult>;
	createDirectory(path: string): Promise<void>;
	renamePath(source: string, destination: string): Promise<void>;
	trash(paths: string[]): Promise<void>;
	openPath(path: string): Promise<void>;
	revealPath(path: string): Promise<void>;
	watchDirectory(
		path: string,
		handler: () => void,
	): Promise<PluginDirectoryWatch>;
}

interface PluginTextFileSnapshot {
	content: string;
	revision: string;
}

type PluginTextWriteResult =
	| { status: "saved"; revision: string }
	| { status: "conflict"; actualRevision: string | null };

interface PluginDirectoryWatch {
	unsubscribe(): void;
}

interface ModuleOpenResult {
	moduleInstanceId: string;
	focusedExisting: boolean;
}

interface ModulesAPI {
	openCenter(
		moduleProviderId: string,
		state: unknown,
		options?: { sourcePaneId?: string },
	): Promise<ModuleOpenResult>;
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

	/** Center-module routing */
	modules: ModulesAPI;

	/** Event pub/sub for cross-plugin communication */
	events: EventsAPI;
}

/**
 * API passed to view configuration item factories (scoped to the view's owning plugin).
 * Same runtime object as {@link PluginAPI} for that plugin; reserved for future view helpers.
 */
interface ViewAPI extends PluginAPI {}

/**
 * API passed to module tab bar menu item factories (scoped to the module's owning plugin).
 * Same runtime object as {@link PluginAPI} for that plugin; reserved for future module helpers.
 */
interface ModuleAPI extends PluginAPI {}

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
 * Metadata API - extended API for metadata providers
 */
interface MetadataAPI extends PluginAPI {
	/** Read file content as bytes */
	readFile(path: string): Promise<Uint8Array>;

	/** Read text file content */
	readTextFile(path: string): Promise<string>;
}
