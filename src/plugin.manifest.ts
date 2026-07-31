import { definePluginManifest } from "../sdk/manifest-schema";

export const pluginManifest = definePluginManifest({
  id: "example.community-demo",
  name: "Community plugin example",
  version: "0.1.0",
  minAppVersion: "0.1.0",
  pluginApiVersion: "1.0.0",
  author: "Phoundry",
  description:
    "Demo command plus preview using phoundry-ui (trusted community plugin)",
  repository: "https://github.com/phoundry/phials-plugin-example",
  icons: ["mdi:hand-wave", "phoundry-mono:general-check"],
  // Write permissions imply their corresponding read permissions.
  permissions: ["filesystem.write", "workspace-folders.write"],
});

export default pluginManifest;
