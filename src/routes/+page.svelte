<script lang="ts">
	import type { GlobalState } from '$lib/statetype';
	import { sleep } from '$lib/util';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();
	let globalState: GlobalState = $state(data.stateInitial);
	let connected = $state(true);

	$effect(() => {
		let connection: EventSource | null = null;
		let waitTime = 1000;

		function connect() {
			connection = new EventSource('/api/state');
			connection.onopen = () => {
				console.log('Connected to state stream');
				connected = true;
				waitTime = 1000;
			};
			connection.onerror = async (ev) => {
				console.log(`Connection to state stream failed, retrying in ${waitTime}ms`);
				connection?.close();
				connected = false;
				connection = null;
				// Sleep or wait until the `online` event happens
				const abort = new AbortController();
				const onOnline = () => {
					abort.abort();
				};
				try {
					window.addEventListener('online', onOnline);
					await sleep(waitTime, abort.signal);
					waitTime = Math.min(waitTime * 2, 10000);
				} catch (e) {
				} finally {
					window.removeEventListener('online', onOnline);
				}
				// Attempt to reconnect
				connect();
			};
			connection.onmessage = (ev) => {
				console.log(`State stream update`);
				globalState = JSON.parse(ev.data);
			};
		}

		connect();

		return () => {
			connection?.close();
		};
	});
</script>

{#if !connected}
	<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
		<div class="spinner"></div>
	</div>
{/if}
<div class="flex-down" style="position: relative;">
	<h1>Waifucratics</h1>
	{#if globalState.stage === 'idle'}
		<h2>Waiting</h2>
	{/if}
</div>
