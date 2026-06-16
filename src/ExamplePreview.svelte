<script lang="ts">
	import { Button } from "phoundry-ui";

	let { file }: PreviewProviderProps = $props();
</script>

<div class="demo-wrap">
	<p class="text-txt-secondary text-sm">{file.name}</p>
	<Button variant="secondary" size="sm">phoundry-ui</Button>
</div>

<style>
	.demo-wrap {
		padding: 1rem;
	}
</style>
