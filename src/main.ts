import "./app.css";
import ExamplePreview from "./ExamplePreview.svelte";
import { definePlugin } from "../sdk/manifest-schema";
import { pluginManifest } from "./plugin.manifest";
import { initializeManifestIconCollections } from "./manifest-icons";
export { mount, unmount } from "svelte";

initializeManifestIconCollections(pluginManifest.icons);

let api: PluginAPI | null = null;

const helloCommand: Command = {
  id: "example.community-demo.hello",
  label: "Demo: Hello from community plugin",
  description: "Shows a toast via permission-gated PluginAPI",
  icon: "mdi:hand-wave",
  category: "View",
  contextKeys: ["always"],
  action: () => {
    api?.notify.success("Hello from example.community-demo");
  },
};

const commandProvider: CommandProvider = {
  type: "command",
  id: "example.community-demo.commands",
  name: "Example commands",
  commands: [helloCommand],
};

const previewProvider: PreviewProvider = {
  type: "preview",
  id: "example.community-demo.preview",
  name: "Example phoundry-ui preview",
  canHandle: (file) => file.name.endsWith(".phials-demo-preview.txt"),
  thumbnail: ExamplePreview,
  surface: ExamplePreview,
  destinations: { pageTab: true },
};

export default definePlugin(pluginManifest, {
  onActivate: (pluginApi: PluginAPI) => {
    api = pluginApi;
  },
  onDeactivate: () => {
    api = null;
  },
  providers: [commandProvider, previewProvider],
});
