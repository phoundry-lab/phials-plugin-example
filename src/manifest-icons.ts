import { registerPhoundryIcons } from "phoundry-ui/icons";

const PHOUNDRY_COLLECTION = /^phoundry-(?:mono|colored):/;

/**
 * Register only the packaged icon collections declared by the source manifest.
 * Phials preloads the same manifest list before importing the plugin module.
 */
export function initializeManifestIconCollections(
  icons: readonly string[] | undefined,
): void {
  if (icons?.some((icon) => PHOUNDRY_COLLECTION.test(icon))) {
    registerPhoundryIcons();
  }
}
