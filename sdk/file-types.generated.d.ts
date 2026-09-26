// @generated from phials - do not edit
// Source graph: phials/scripts/lib/public-sdk-manifest.mjs

/**
 * File type categories for plugin matching and UI display
 * Format: 'broad-category' or 'broad-category - specific'
 */
type FileCategory =
	// Images
	| "image"
	| "image - vector"
	| "image - raw"
	// Video
	| "video"
	// Audio
	| "audio - lossless"
	| "audio - lossy"
	| "audio - midi"
	// Documents
	| "document"
	| "ebook"
	| "spreadsheet"
	| "presentation"
	| "plain text"
	// Code & Data
	| "code"
	| "code - data"
	| "code - config"
	| "code - markup"
	// 3D & CAD
	| "model"
	| "cad"
	// Archives & Packages
	| "archive"
	| "archive - disk"
	| "archive - package"
	// System
	| "executable"
	| "database"
	| "font"
	| "folder"
	| "unknown";

/**
 * Core file entry interface - file-type agnostic
 * Represents a file or directory in the filesystem
 */
interface FileEntry {
	name: string;
	path: string;
	/**
	 * Host-resolved Iconify glyph. Public directory-listing APIs populate this
	 * so plugins share Phials' canonical file and folder icon policy.
	 */
	icon?: string;
	is_file: boolean;
	is_dir: boolean;
	is_workspace: boolean;
	/** Nested workspace folder when listing inside a parent workspace */
	isChildWorkspace?: boolean;
	/** Listing node is a symlink or Windows directory junction */
	is_symlink?: boolean;
	/** Resolved absolute target when healthy; stored link text when broken */
	symlink_target?: string | null;
	symlink_broken?: boolean;
	/** Bytes are not local. Set from listing metadata; absent means local or unknown. */
	online_only?: boolean;
	size: number;
	created?: number | null;
	modified?: number | null;
	/** Raw metadata from filesystem/EXIF - parsed lazily by plugins */
	exif_data: Record<string, string> | null;
	/** Computed lazily based on extension */
	mimeType?: string;
	/** Computed lazily based on extension */
	category?: FileCategory;
}

/**
 * Sort modes available for file listings.
 * Can be a standard property ('name', 'created', 'modified', 'size')
 * or a collection property ID.
 */
type SortMode = string;

/**
 * Sort order direction
 */
type SortOrder = "asc" | "desc";

/**
 * View modes for file browser
 */
type ViewMode =
	| "details"
	| "thumbnails"
	| "masonry"
	| "column"
	| "tree"
	| "boards"
	| "gallery"
	| "calendar";

/** Calendar view zoom level */
type CalendarScope = "year" | "month" | "week" | "3day" | "day";

/** Built-in calendar date sources (`created`, `modified`) or a workspace property id */
type CalendarDateSourceId = "created" | "modified" | (string & {});

/**
 * Filter scope for directory listing (current folder vs flatten-with-filters).
 */
type FilterScope = "current" | "flatten";

// ─── Multi-Sort Types ─────────────────────────────────────────────────────────

/**
 * A single sort criterion for multi-level sorting
 */
interface SortCriteria {
	/** Property to sort by: 'name', 'size', 'created', 'modified', 'type', 'extension', or collection property ID */
	property: string;
	/** Sort direction */
	order: SortOrder;
}

// ─── Multi-Filter Types ───────────────────────────────────────────────────────

/**
 * Filter operators for text properties
 */
type TextFilterOp =
	| "contains"
	| "not_contains"
	| "equals"
	| "not_equals"
	| "starts_with"
	| "ends_with"
	| "is_empty"
	| "is_not_empty";

/**
 * Filter operators for number properties
 */
type NumberFilterOp =
	"eq" | "neq" | "lt" | "gt" | "lte" | "gte" | "is_empty" | "is_not_empty";

/**
 * Filter operators for date properties
 */
type DateFilterOp =
	| "is"
	| "is_not"
	| "is_before"
	| "is_after"
	| "is_on_or_before"
	| "is_on_or_after"
	| "is_empty"
	| "is_not_empty";

/**
 * Filter operators for select/status properties
 */
type SelectFilterOp = "is" | "is_not" | "is_empty" | "is_not_empty";

/**
 * Filter operators for multi-select properties
 */
type MultiSelectFilterOp =
	"contains" | "not_contains" | "is_empty" | "is_not_empty";

/**
 * Filter operators for boolean properties
 */
type BooleanFilterOp = "is" | "is_not";

/** @deprecated Migrated to `is` + `true` on load */
type LegacyBooleanFilterOp = "is_true" | "is_false";

/**
 * Union of all filter operators
 */
type FilterOperator =
	| TextFilterOp
	| NumberFilterOp
	| DateFilterOp
	| SelectFilterOp
	| MultiSelectFilterOp
	| BooleanFilterOp
	| LegacyBooleanFilterOp;

/**
 * Size unit for file size filters
 */
type SizeUnit = "B" | "KB" | "MB" | "GB";

/**
 * A single filter condition
 */
interface FilterCondition {
	/** Unique identifier for the condition */
	id: string;
	/** Property to filter by: 'name', 'extension', 'size', 'created', 'modified', or collection property ID */
	property: string;
	/** Filter operator */
	operator: FilterOperator;
	/** Filter value (type depends on property type) */
	value?: string | number | boolean | string[];
	/** Size unit for file size filters (default: MB) */
	sizeUnit?: SizeUnit;
}

/** Leaf node in a filter tree */
interface FilterConditionNode extends FilterCondition {
	type: "condition";
}

/** Nested filter sub-group node */
interface FilterSubGroupNode {
	type: "group";
	/** Unique identifier for the sub-group */
	id: string;
	/** Logic operator for combining direct children */
	logic: "and" | "or";
	/** Child conditions and nested sub-groups */
	children: FilterNode[];
}

/** Discriminated node in a filter tree */
type FilterNode = FilterConditionNode | FilterSubGroupNode;

/** Root filter group id sentinel - `null` means the root group in tree APIs */
type FilterGroupId = string | null;

/**
 * Filter tree root: conditions and nested sub-groups combined with AND/OR logic
 */
interface FilterGroup {
	/** Logic operator for combining direct children */
	logic: "and" | "or";
	/** Child conditions and nested sub-groups */
	children: FilterNode[];
}
