<script lang="ts">
	import { Button } from "phoundry-ui";

	let { file }: PreviewSurfaceProps = $props();
</script>

<section aria-label="Example preview">
	<p>{file.name}</p>
	<Button variant="secondary" size="sm">phoundry-ui</Button>
</section>
