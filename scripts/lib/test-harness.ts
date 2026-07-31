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

export function assertProviderContract(
  providers: readonly Record<string, unknown>[],
): void {
  const ids = new Set<string>();
  for (const provider of providers) {
    if (
      typeof provider.id !== "string" ||
      typeof provider.name !== "string" ||
      typeof provider.type !== "string"
    ) {
      throw new Error("Provider must have string id, name, and type");
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
