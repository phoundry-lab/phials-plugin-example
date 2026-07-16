import "./app.css";
import ExamplePreview from "./ExamplePreview.svelte";

export default function createPlugin(): PhialsPlugin {
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
	};

	return {
		id: "example.community-demo",
		name: "Community plugin example",
		version: "0.1.0",
		onActivate: (pluginApi: PluginAPI) => {
			api = pluginApi;
			pluginApi.notify.info("example.community-demo activated");
		},
		onDeactivate: () => {
			api = null;
		},
		providers: [commandProvider, previewProvider],
	};
}
