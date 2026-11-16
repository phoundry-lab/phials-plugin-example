import { definePluginManifest } from "../sdk/manifest-schema";
import {
  EXAMPLE_THUMBNAIL_ID,
  EXAMPLE_THUMBNAIL_VERSION,
} from "./example-thumbnail.render";

export const pluginManifest = definePluginManifest({
  id: "example.community-demo",
  name: "Community plugin example",
  version: "0.1.0",
  minAppVersion: "0.1.0",
  pluginApiVersion: "2.0.0",
  // Optional authoritative renderer catalog: keeps proactive cleanup tied to the shipped contract.
  thumbnailProviders: [
    { id: EXAMPLE_THUMBNAIL_ID, rendererVersion: EXAMPLE_THUMBNAIL_VERSION },
  ],
  author: "Phoundry",
  description:
    "Demo command plus preview using phoundry-ui (trusted community plugin)",
  repository: "https://github.com/phoundry/phials-plugin-example",
  icons: ["mdi:hand-wave", "phoundry-mono:general-check"],
  // Write permissions imply their corresponding read permissions.
  permissions: ["filesystem.write", "workspace-folders.write"],
});

export default pluginManifest;
