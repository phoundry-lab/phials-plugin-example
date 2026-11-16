import { definePluginManifest } from "@phoundry/phials-plugin-sdk/manifest";
import { version } from "../package.json";

export const pluginManifest = definePluginManifest({
  id: "example.community-demo",
  name: "Community plugin example",
  version,
  minAppVersion: "0.1.0",
  pluginApiVersion: "3.0.0",
  author: "Phoundry",
  description:
    "Demo command plus preview using phoundry-ui (trusted community plugin)",
  repository: "https://github.com/phoundry/phials-plugin-example",
  icons: ["mdi:hand-wave", "phoundry-mono:general-check"],
  // This example does not perform privileged file or network operations.
  permissions: [],
});

export default pluginManifest;
