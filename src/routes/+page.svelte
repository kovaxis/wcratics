<script lang="ts">
	import type { GlobalState } from '$lib/statetype';
	import { sleep } from '$lib/util';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();
	let globalState: GlobalState = $state(data.stateInitial);
	let connected = $state(true);

	$effect(() => {
		let running = true;
		async function listenToStream() {
			while (running) {
				// Attempt to connect
				let waitTime = 1000;
				let connection;
				while (true) {
					try {
						const resp = await fetch('/api/state');
						if (!resp.body) throw new Error('state stream response with no body');
						connection = resp.body;
						break;
					} catch (e) {
						console.error('State stream reconnect:', e);
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
					}
				}
				connected = true;
				// Receive data
				try {
					connected = true;
					while (running) {
						const chunk = await connection.getReader().read();
						if (chunk.value) {
							globalState = JSON.parse(new TextDecoder().decode(chunk.value));
						}
						if (chunk.done) break;
					}
				} catch (e) {
					// Error receiving data
					console.error('State stream receive:', e);
				}
				connected = false;
			}
		}
		void listenToStream();
		return () => {
			connected = false;
			running = false;
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
