export interface LifecycleProbe {
  activated: number;
  deactivated: number;
}

export async function runLifecycleHarness(
  plugin: {
    onActivate?: (api: unknown) => unknown;
    onDeactivate?: () => unknown;
  },
  api: unknown,
): Promise<LifecycleProbe> {
  const probe = { activated: 0, deactivated: 0 };
  await plugin.onActivate?.(api);
  probe.activated += 1;
  await plugin.onDeactivate?.();
  probe.deactivated += 1;
  return probe;
}

const PROVIDER_TYPES = new Set([
  "preview",
  "thumbnail",
  "metadata",
  "view",
  "module",
  "command",
]);

export function assertProviderContract(providers: readonly unknown[]): void {
  const ids = new Set<string>();
  for (const [index, raw] of providers.entries()) {
    if (!raw || typeof raw !== "object") {
      throw new Error(`providers[${index}] must be an object`);
    }
    const provider = raw as Record<string, unknown>;
    if (
      typeof provider.id !== "string" ||
      typeof provider.name !== "string" ||
      typeof provider.type !== "string" ||
      !PROVIDER_TYPES.has(provider.type)
    ) {
      throw new Error(`providers[${index}] has an invalid public provider shape`);
    }
    if (
      provider.type === "thumbnail" &&
      (typeof provider.rendererVersion !== "string" ||
        !provider.rendererVersion.trim() ||
        typeof provider.render !== "function" ||
        (provider.priority !== undefined &&
          (typeof provider.priority !== "number" ||
            !Number.isFinite(provider.priority))) ||
        [
          "extensions",
          "mimeTypes",
          "categories",
          "requiredHostFeatures",
          "requiredHostPlatforms",
          "presentationVariants",
        ].some(
          (key) =>
            provider[key] !== undefined &&
            (!Array.isArray(provider[key]) ||
              !provider[key].every((value) => typeof value === "string")),
        ) ||
        (provider.canHandle !== undefined &&
          typeof provider.canHandle !== "function") ||
        (Array.isArray(provider.presentationVariants) &&
          provider.presentationVariants.some(
            (value) => value !== "platform" && value !== "theme",
          )) ||
        (Array.isArray(provider.requiredHostPlatforms) &&
          provider.requiredHostPlatforms.some(
            (value) => !["macos", "windows", "linux", "other"].includes(value),
          )) ||
        (Array.isArray(provider.requiredHostFeatures) &&
          provider.requiredHostFeatures.some(
            (value) =>
              ![
                "audioProxy",
                "rawProxy",
                "sqlite",
                "dmg",
                "macApp",
                "appIcon",
              ].includes(value),
          )))
    ) {
      throw new Error(
        `providers[${index}] has an invalid ThumbnailProvider contract`,
      );
    }
    if (provider.type === "preview" && provider.thumbnail !== undefined) {
      throw new Error(
        "PreviewProvider.thumbnail is not a public contribution; register a ThumbnailProvider",
      );
    }
    if (ids.has(provider.id)) throw new Error(`Duplicate provider ${provider.id}`);
    ids.add(provider.id);
  }
}

export function assertAccessibleHtml(html: string): void {
  for (const match of html.matchAll(/<(button|input|select|textarea)\b([^>]*)>/gi)) {
    const [, tag, attributes] = match;
    const tail = html.slice(match.index! + match[0].length);
    const text =
      tag.toLowerCase() === "button" ?
        tail.slice(0, tail.indexOf("</button>")).replace(/<[^>]+>/g, "").trim()
      : "";
    if (
      !/\b(?:aria-label|aria-labelledby|title)\s*=/i.test(attributes) &&
      !text
    ) {
      throw new Error(`${tag} requires an accessible name`);
    }
  }
}

export function assertPermissionHarness(
  permissions: readonly string[],
  required: string,
): void {
  const impliedRead =
    required.endsWith(".read") &&
    permissions.includes(required.replace(/\.read$/, ".write"));
  if (!permissions.includes(required) && !impliedRead) {
    throw new Error(`Missing required permission ${required}`);
  }
}
