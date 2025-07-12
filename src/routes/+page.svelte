<script lang="ts">
	import type { GlobalState } from '$lib/statetype';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();
	let state: GlobalState = $state(data.state);

	$effect(() => {
		let running = true;
		async function listenToStream() {
			while (running) {
				const chunk = await data.stateStream.getReader().read();
				if (chunk.value) {
					state = JSON.parse(new TextDecoder().decode(chunk.value));
				}
				if (chunk.done) break;
			}
		}
		void listenToStream();
		return () => {
			running = false;
		};
	});
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>
{JSON.stringify(state)}
