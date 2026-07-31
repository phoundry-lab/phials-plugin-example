// @generated from phials - do not edit
// Source graph: phials/scripts/lib/public-sdk-manifest.mjs

/**
 * Stable reactive projection of one Explorer pane.
 *
 * The host owns the backing pane and keeps these readonly projections current.
 * Acquire a pane explicitly through `api.explorer` and do not retain it after
 * the owning plugin API is invalidated.
 */
interface PluginPaneContext {
	readonly id: string;
	readonly listing: PluginPaneListing;
	readonly selection: PluginPaneSelection;
	readonly navigation: PluginPaneNavigation;
	readonly view: PluginPaneView;
	readonly workspaceFolder: PluginPaneWorkspaceFolder | null;
}

interface PluginPaneListing {
	readonly loading: boolean;
	readonly entries: readonly FileEntry[];
	readonly failures: readonly PluginFileFailure[];
	refresh(): Promise<void>;
}

interface PluginPaneSelection {
	readonly entries: readonly FileEntry[];
	readonly paths: readonly string[];
	set(paths: readonly string[]): void;
	selectAll(): void;
	clear(): void;
}

interface PluginPaneNavigation {
	readonly currentPath: string | null;
	readonly canGoBack: boolean;
	readonly canGoForward: boolean;
	readonly canGoUp: boolean;
	navigateTo(path: string): Promise<void>;
	openPath(path: string): Promise<void>;
	back(): Promise<void>;
	forward(): Promise<void>;
	up(): Promise<void>;
}

interface PluginPaneView {
	readonly mode: string;
	readonly itemSize: number | null;
	readonly columns: readonly PluginPaneColumn[];
	readonly sorting: readonly PluginPaneSort[];
	readonly options: Readonly<Record<string, JsonValue>>;
}

interface PluginPaneColumn {
	readonly id: string;
	readonly visible: boolean;
	readonly width: number;
	readonly order: number;
}

interface PluginPaneSort {
	readonly property: string;
	readonly order: "asc" | "desc";
}

interface PluginPaneWorkspaceFolder {
	readonly id: string;
	readonly rootPath: string;
	readonly available: boolean;
}
