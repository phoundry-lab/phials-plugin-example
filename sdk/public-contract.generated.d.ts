// @generated from phials - do not edit
// Source graph: phials/scripts/lib/public-sdk-manifest.mjs

/** Values that can cross the public plugin boundary as plain data. */
type JsonPrimitive = string | number | boolean | null;
type JsonValue =
	| JsonPrimitive
	| readonly JsonValue[]
	| { readonly [key: string]: JsonValue };

type PluginFileErrorCode =
	| "aborted"
	| "already-exists"
	| "conflict"
	| "invalid-path"
	| "is-directory"
	| "not-directory"
	| "not-found"
	| "permission-denied"
	| "unsupported"
	| "io-error";

/** Stable operational failure exposed by public filesystem operations. */
declare class PluginFileError extends Error {
	readonly name: "PluginFileError";
	readonly code: PluginFileErrorCode;
	readonly path?: string;
	constructor(
		code: PluginFileErrorCode,
		message: string,
		options?: { path?: string; cause?: unknown },
	);
}

interface PluginFileFailure {
	readonly code: PluginFileErrorCode;
	readonly message: string;
	readonly path?: string;
}

type PluginPathOutcome =
	| { readonly path: string; readonly status: "succeeded" }
	| {
			readonly path: string;
			readonly status: "failed";
			readonly failure: PluginFileFailure;
	  };

interface PluginDirectoryReadResult {
	readonly entries: readonly FileEntry[];
	readonly failures: readonly PluginFileFailure[];
}

interface PluginBinaryFileSnapshot {
	readonly content: Uint8Array;
	readonly revision: string;
}

type PluginBinaryWriteResult =
	| { readonly status: "saved"; readonly revision: string }
	| {
			readonly status: "conflict";
			readonly actualRevision: string | null;
	  };

interface FolderSummary {
	readonly path: string;
	readonly files: number;
	readonly folders: number;
	readonly totalBytes: number;
}

interface ClipboardAPI {
	writeText(text: string): Promise<void>;
	readText(): Promise<string>;
}

interface ExplorerAPI {
	getActivePane(): PluginPaneContext | null;
	getPane(id: string): PluginPaneContext | null;
}

interface GitInfo {
	readonly rootPath: string;
	readonly branch: string | null;
	readonly detached: boolean;
	readonly dirty: boolean;
	readonly ahead: number;
	readonly behind: number;
	readonly remoteUrl: string | null;
}

interface RepositoryLanguage {
	readonly language: string;
	readonly bytes: number;
	readonly share: number;
}

interface GitAPI {
	getInfo(path: string): Promise<GitInfo | null>;
	getLanguages(path: string): Promise<readonly RepositoryLanguage[]>;
}

type WorkspaceFolderPropertyType =
	| "text"
	| "number"
	| "date"
	| "calendar"
	| "boolean"
	| "select"
	| "multi-select"
	| "status"
	| "rating"
	| "url"
	| "relation"
	| "rollup"
	| "formula";

type WorkspaceFolderPropertyValue = JsonValue;

type WorkspaceFolderCalendarValue =
	| {
			readonly kind: "date";
			readonly start: string;
			readonly end?: string;
	  }
	| {
			readonly kind: "datetime";
			readonly start: string;
			readonly end?: string;
	  };

interface WorkspaceFolderPropertyOption {
	readonly id: string;
	readonly name: string;
	readonly color?: string;
}

interface WorkspaceFolderPropertyDefinition {
	readonly id: string;
	readonly name: string;
	readonly displayName: string;
	readonly type: WorkspaceFolderPropertyType;
	readonly options?: readonly WorkspaceFolderPropertyOption[];
	readonly derived: boolean;
}

interface WorkspaceFolderSchema {
	readonly version: number;
	readonly properties: readonly WorkspaceFolderPropertyDefinition[];
}

type WorkspaceFolderFileRef =
	| {
			readonly workspaceFolderId: string;
			readonly fileId: string;
	  }
	| { readonly path: string };

interface KnownWorkspaceFolder {
	readonly id: string;
	readonly rootPath: string;
	readonly name: string;
	readonly icon?: string;
	readonly available: boolean;
}

interface WorkspaceFolderPropertyWrite {
	readonly propertyId: string;
	readonly value: WorkspaceFolderPropertyValue | null;
}

interface WorkspaceFoldersAPI {
	isWorkspaceFolder(path: string): Promise<boolean>;
	getSchema(workspaceFolderIdOrPath: string): Promise<WorkspaceFolderSchema>;
	getPropertyValue(
		file: WorkspaceFolderFileRef,
		propertyId: string,
	): Promise<WorkspaceFolderPropertyValue | null>;
	setPropertyValue(
		file: WorkspaceFolderFileRef,
		propertyId: string,
		value: WorkspaceFolderPropertyValue | null,
	): Promise<void>;
	setPropertyValues(
		file: WorkspaceFolderFileRef,
		values: readonly WorkspaceFolderPropertyWrite[],
	): Promise<void>;
	getTags(file: WorkspaceFolderFileRef): Promise<readonly string[]>;
	setTags(
		file: WorkspaceFolderFileRef,
		tags: readonly string[],
	): Promise<void>;
	getRating(file: WorkspaceFolderFileRef): Promise<number | null>;
	setRating(
		file: WorkspaceFolderFileRef,
		rating: number | null,
	): Promise<void>;
	getCalendar(
		file: WorkspaceFolderFileRef,
	): Promise<WorkspaceFolderCalendarValue | null>;
	setCalendar(
		file: WorkspaceFolderFileRef,
		value: WorkspaceFolderCalendarValue | null,
	): Promise<void>;
	listKnown(): Promise<readonly KnownWorkspaceFolder[]>;
	openPage(
		file: WorkspaceFolderFileRef,
		options?: { focusEditor?: boolean; sourcePaneId?: string },
	): Promise<void>;
}

type ModuleOpenResult =
	| { readonly status: "created"; readonly moduleInstanceId: string }
	| { readonly status: "focused"; readonly moduleInstanceId: string }
	| { readonly status: "replaced"; readonly moduleInstanceId: string };

interface PluginSettingsChange {
	readonly key: string;
	readonly value: unknown;
}

interface PluginSettingsSubscription {
	unsubscribe(): void;
}

type PluginDatabaseValue = JsonPrimitive | Uint8Array;

interface PluginDatabaseSchemaOperations {
	createTable(table: PluginTableDefinition): Promise<void>;
	addColumn(table: string, column: PluginColumnDefinition): Promise<void>;
	renameColumn(table: string, from: string, to: string): Promise<void>;
	dropColumn(table: string, column: string): Promise<void>;
	createIndex(table: string, index: PluginIndexDefinition): Promise<void>;
	dropIndex(table: string, index: string): Promise<void>;
}

interface PluginDatabaseTransaction {
	readonly schema: PluginDatabaseSchemaOperations;
	query<T = Record<string, PluginDatabaseValue>>(
		table: string,
		sql: string,
		params?: readonly PluginDatabaseValue[],
	): Promise<readonly T[]>;
	execute(
		table: string,
		sql: string,
		params?: readonly PluginDatabaseValue[],
	): Promise<DatabaseExecuteResult>;
}

interface PluginDatabaseMigration {
	readonly from: number;
	readonly to: number;
	up(transaction: PluginDatabaseTransaction): Promise<void>;
}

/** Public closure for payloads retained under compatibility-sensitive event names. */
type ColumnCalculationKind =
	| "none"
	| "count"
	| "count-unique"
	| "count-files"
	| "count-unique-files"
	| "count-folders"
	| "count-unique-folders"
	| "percent-empty"
	| "percent-not-empty"
	| "sum"
	| "average"
	| "min"
	| "max"
	| "earliest"
	| "latest"
	| "range-days"
	| "checked"
	| "unchecked"
	| "percent-checked";

interface DetailsViewColumnConfig {
	readonly id: string;
	readonly visible: boolean;
	readonly width: number;
	readonly order: number;
	readonly frozen?: boolean;
	readonly source?: "file" | "property" | "metadata";
	readonly visibilitySource?: "default" | "auto" | "user";
	readonly calculation?: ColumnCalculationKind;
	readonly wrap?: boolean;
}

type PagePropertyVisibility = "always" | "not-empty" | "hidden";

interface WorkspacePageConfig {
	readonly propertyOrder?: readonly string[];
	readonly propertyVisibility?: Readonly<
		Record<string, PagePropertyVisibility>
	>;
	readonly compactProperties?: boolean;
	readonly fullWidth?: boolean;
}

interface SavedWorkspaceView {
	readonly id: string;
	readonly name: string;
	readonly icon?: string;
	readonly viewMode: ViewMode;
	readonly sortBy?: string;
	readonly sortDirection?: "asc" | "desc";
}

type PropertyValue = WorkspaceFolderPropertyValue;
type WorkspaceCellDeltaOperation = "set" | "clear" | "pending";

interface WorkspaceCellDelta {
	readonly workspaceId: string;
	readonly workspacePath: string;
	readonly fileId: string;
	readonly filePath: string;
	readonly propertyId: string;
	readonly operation: WorkspaceCellDeltaOperation;
	readonly value: PropertyValue | null;
	readonly mutationVersion: number;
}

interface WorkspaceValueDeltaEvent {
	readonly kind: "delta";
	readonly sourcePaneId: string;
	readonly cell: WorkspaceCellDelta;
	readonly dependentDeltas: readonly WorkspaceCellDelta[];
}

interface WorkspaceValueRefetchEvent {
	readonly kind: "refetch";
	readonly sourcePaneId: string;
	readonly workspaceId: string;
	readonly workspacePath: string;
	readonly fileIds?: readonly string[];
	readonly filePaths?: readonly string[];
	readonly propertyIds?: readonly string[];
	readonly reason: "legacy" | "plugin" | "schema";
}

type WorkspaceValuesChangedEvent =
	WorkspaceValueDeltaEvent | WorkspaceValueRefetchEvent;

type DrivesChangedPayload = {
	readonly reason: "mounted" | "unmounted" | "changed" | "poll";
	readonly platform: "macos" | "windows" | "linux" | "unknown";
};
