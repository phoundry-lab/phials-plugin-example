// @generated from phials - do not edit
// Synced by phials/scripts/sync-plugin-sdk.mjs

/**
 * Event System Type Definitions
 *
 * Defines types for the pub/sub event system used for cross-plugin
 * communication and internal app events.
 */

// ─── Event Definition ────────────────────────────────────────────────────────

/**
 * Event type definition - registered for introspection/validation
 */
interface EventDefinition<T = unknown> {
	/** Unique event ID (e.g., 'core.navigation.changed', 'phials.terminal.command-executed') */
	id: string;
	/** Optional description for docs/debugging */
	description?: string;
}

/**
 * Subscription handle for cleanup
 */
interface EventSubscription {
	/** Unsubscribe from the event */
	unsubscribe(): void;
}

/**
 * Event handler callback type
 */
type EventHandler<T = unknown> = (payload: T) => void | Promise<void>;

/** Details column layout live-sync payload (ADR-0010). */
interface ColumnLayoutChangedPayload {
	browsedPath: string;
	savedViewsCount: number;
	activeSavedViewId: string | null;
	columnConfig: DetailsViewColumnConfig[];
	calculationRowVisible: boolean;
	sourcePaneId: string;
}

type LayoutSettledReason =
	| "center-divider"
	| "center-structure"
	| "panel-resize"
	| "panel-structure"
	| "panel-transition"
	| "window-resize"
	| "window-restore";

/** Semantic notification emitted after shell-owned geometry reaches the DOM. */
interface LayoutSettledPayload {
	reasons: LayoutSettledReason[];
	affectedIds: string[];
	timestamp: number;
}

// ─── Core Events ─────────────────────────────────────────────────────────────

/**
 * Built-in core events (strongly typed)
 */
interface CoreEvents {
	/** Pane navigation path changed */
	"core.navigation.changed": { path: string; paneId: string };

	/** File selection changed in a pane */
	"core.selection.changed": { paths: string[]; paneId: string };

	/** New tab created */
	"core.tab.created": { tabId: string };

	/** Tab closed */
	"core.tab.closed": { tabId: string };

	/** Active tab changed */
	"core.tab.switched": { tabId: string; previousTabId: string };

	/** File or directory renamed */
	"core.file.renamed": { oldPath: string; newPath: string };

	/** Files deleted */
	"core.file.deleted": { paths: string[] };
	/** File saved */
	"core.file.saved": { path: string };
	/** Persisted File Note content was created, updated, or removed */
	"core.file-note.saved": {
		path: string;
		vialPath: string;
		hasNote: boolean;
	};
	/** Portable Page visibility/order changed for one Vial. */
	"core.vial-page-config.changed": {
		vialPath: string;
		page: VialPageConfig;
	};
	/** Canonical cell deltas or a filtered compatibility refetch for one Vial. */
	"core.vial-values.changed": VialValuesChangedEvent;
	/** File opened */
	"core.file.opened": { path: string };
	/** File created */
	"core.file.created": { path: string };

	/** Directory contents changed (files added/removed/modified) */
	"core.directory.changed": { path: string; paneId: string };
	/** Directory renamed */
	"core.directory.renamed": { oldPath: string; newPath: string };
	/** Directory deleted */
	"core.directory.deleted": { path: string };
	/** Directory created */
	"core.directory.created": { path: string };

	/** App setting value changed */
	"core.settings.changed": { key: string; value: unknown };

	/** Known vials list changed (add/remove/rename in session) */
	"core.known-vials.changed": { paths: string[] };

	/** Explorer always-hide globs changed */
	"core.config.hidden-globs.changed": { globs: string[] };

	/** Global audio: current track or index changed */
	"core.audio.track.changed": {
		trackId: string | null;
		path: string | null;
		index: number;
	};

	/** Global audio: queue contents changed */
	"core.audio.queue.changed": { trackIds: string[]; length: number };

	/** Global audio: playback error (e.g. decode / missing file) */
	"core.audio.playback.error": { trackId: string | null; message: string };

	/** Drive/volume set may have changed (after pane drive caches refreshed) */
	"core.drives.changed": DrivesChangedPayload;

	/** Details column layout changed in a pane (path-owned or saved-view-owned) */
	"core.columns.layout.changed": ColumnLayoutChangedPayload;

	/** Shell-owned geometry changed and presented consumers may measure locally. */
	"core.layout.settled": LayoutSettledPayload;
}

// ─── Plugin Events ───────────────────────────────────────────────────────────

/**
 * Plugin event map - plugins extend this via declaration merging.
 *
 * @example
 * ```typescript
 * // In a plugin file:
 * declare global {
 *   interface PluginEvents {
 *     'phials.terminal.command-executed': {
 *       command: string;
 *       exitCode: number;
 *       duration: number;
 *     };
 *   }
 * }
 * ```
 */
interface PluginEvents {
	// Plugins add their events here via module augmentation
}

// ─── Combined Event Map ──────────────────────────────────────────────────────

/**
 * Combined event map for type safety.
 * Merges CoreEvents and PluginEvents.
 */
type EventMap = CoreEvents & PluginEvents;

/**
 * Helper type to get event payload for a given event ID
 */
type EventPayload<K extends keyof EventMap> = EventMap[K];
