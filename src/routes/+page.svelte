<script lang="ts">
	import { browser } from '$app/environment';
	import Card from '$lib/Card.svelte';
	import type { GlobalState, Piece, ShowCard } from '$lib/types';
	import { execAction, hashString, sleep } from '$lib/util';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();
	let globalState: GlobalState = $state(data.stateInitial);
	let connected = $state(true);

	let name: string | null = $state(browser ? localStorage.getItem('myName') : '');
	$effect(() => {
		if (name == null) localStorage.removeItem('myName');
		else localStorage.setItem('myName', name);
	});

	let tmpName: string = $state('');

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

	let timeToBet: number = $state(-1);
	$effect(() => {
		if (globalState.stage === 'bet') {
			const id = setInterval(() => {
				if (globalState.stage === 'bet') {
					timeToBet = globalState.deadline - new Date().getTime();
				}
			}, 100);
			return () => {
				clearInterval(id);
			};
		}
	});

	let shownToBet: string | null = $derived.by(() => {
		if (globalState.stage !== 'bet') return null;
		if (name === globalState.master) return null;
		const rnd = hashString(`bet|${globalState.deadline}|${name}`);
		const idx = (rnd % (globalState.pieces.length - 1)) + 1;
		return globalState.pieces[idx].id;
	});

	$inspect(globalState);
	$inspect(shownToBet);

	function placedCards(): number {
		if ('placed' in globalState)
			return globalState.placed.reduce((acc, placed) => acc + (placed != null ? 1 : 0), 0);
		else return 0;
	}

	function showPieceUp(piece: Piece, idx: number): ShowCard {
		if (globalState.stage === 'bet') return piece.id === shownToBet ? 'show' : 'hide';
		if (globalState.stage === 'choose') {
			if (globalState.placed.find((id) => id === piece.id)) return 'blank';
			if (placedCards() === idx) return 'show';
		}
		if (globalState.stage === 'split') return 'blank';
		return 'hide';
	}
	function showPieceDown(piece?: Piece): ShowCard {
		if (globalState.stage === 'bet') return name === globalState.master ? 'slot' : 'btn';
		if (globalState.stage === 'choose') {
			if (!piece) {
				return name === globalState.master ? 'btn' : 'slot';
			}
			return globalState.placed.find((id) => id === piece.id) ? 'show' : 'hide';
		}
		if (globalState.stage === 'split') return 'show';
		return 'slot';
	}
</script>

{#if !connected}
	<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
		<div class="spinner"></div>
	</div>
{/if}
<div class="flex-down" style="position: relative; gap: 10px;">
	{#if name == null}
		<input type="text" placeholder="Nombre" bind:value={tmpName} />
		<button
			onclick={() => {
				name = tmpName.trim();
			}}>Confirmar nombre</button
		>
	{:else}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<p
			onclick={() => {
				tmpName = name ?? '';
				name = null;
			}}
		>
			Nombre: {name}
			{'master' in globalState && globalState.master === name ? '(Vocal de mesa)' : ''}
		</p>
		<h1>Wcratics</h1>
		{#if globalState.stage === 'idle' || globalState.stage === 'split'}
			<h3>Candidato a vocal: {globalState.candidate ?? ''}</h3>
			<button onclick={() => execAction({ ty: 'postular', name: name ?? '' })}>Ser vocal</button>
			<button
				onclick={() => execAction({ ty: 'comenzar' })}
				disabled={globalState.candidate == null}
			>
				{#if globalState.stage === 'idle'}
					Comenzar juego
				{:else}
					Comenzar siguiente juego
				{/if}
			</button>
		{/if}
		{#if globalState.stage === 'bet' || globalState.stage === 'choose' || globalState.stage === 'split'}
			{#if globalState.stage !== 'split'}
				<div class="flex-right">
					<h2 style="margin-right: 1em;">Categoría:</h2>
					<p>{globalState.category.text}</p>
				</div>
			{/if}
			<div class="flex-right" style="gap: 10px;">
				{#each globalState.pieces as piece, i}
					<Card {piece} kind={showPieceUp(piece, i)} idx={i} />
				{/each}
			</div>
			{#if globalState.stage === 'split'}
				<h2>Fin del juego</h2>
				<h3>Orden final:</h3>
			{/if}
			<div class="flex-right" style="gap: 10px;">
				{#each globalState.placed as placed, i}
					<div class="flex-down">
						<Card
							piece={globalState.pieces.find((piece) => piece.id === placed)}
							kind={showPieceDown(globalState.pieces.find((piece) => piece.id === placed))}
							idx={i}
							onclick={() => {
								if (globalState.stage === 'choose' && name === globalState.master) {
									execAction({
										ty: 'elegir',
										piece: globalState.pieces[placedCards()].id,
										place: i
									});
								} else if (globalState.stage === 'bet' && shownToBet) {
									execAction({
										ty: 'apostar',
										name: name ?? '',
										piece: shownToBet,
										place: i
									});
								}
							}}
						/>
						{#if globalState.stage === 'split'}
							{i + 1}
						{/if}
					</div>
				{/each}
			</div>
		{/if}
		{#if globalState.stage === 'bet'}
			<h2>
				{#if name === globalState.master}
					Que la audiencia haga sus apuestas
				{:else}
					¿Quieres apostar? ¿En qué lugar quedará?
				{/if}
			</h2>
			<h3>Tiempo restante: {Math.round(Math.max(timeToBet, 0) / 1000)}</h3>
		{:else if globalState.stage === 'choose'}
			<h2>
				{#if name === globalState.master}
					¿En qué puesto va?
				{:else}
					Decidan en qué puesto va. El vocal modera.
				{/if}
			</h2>
		{/if}
		{@const myBet =
			'master' in globalState && name !== globalState.master && name in globalState.bets
				? globalState.bets[name]
				: null}
		{#if globalState.stage === 'split'}
			<h2>Apuestas</h2>
			{#each Object.entries(globalState.bets) as [betster, bet]}
				<div class="flex-right">
					<h3 style="margin-right: 1cm;">{betster}</h3>
					<Card
						piece={globalState.pieces.find((piece) => piece.id === bet.piece)}
						idx={0}
						kind="show"
					/>
					<p style="margin-right: 1cm;">&nbsp; apostó al puesto {bet.place + 1}</p>
					{#if globalState.distr[betster]?.mult === 0}
						<h3 style="color: red;">Lo pierde todo</h3>
					{:else}
						<h3 style="color: green;">Multiplica x{globalState.distr[betster]?.mult}</h3>
					{/if}
				</div>
			{/each}
			{#if Object.entries(globalState.bets).length === 0}
				<p>No hubo apuestas</p>
			{/if}
		{:else if 'master' in globalState && myBet}
			<h2>Tu apuesta:</h2>
			<div class="flex-right">
				<Card
					piece={globalState.pieces.find((piece) => piece.id === myBet.piece)}
					idx={0}
					kind="show"
				/>
				<p>&nbsp; irá en el puesto {myBet.place + 1}</p>
			</div>
		{/if}
	{/if}
</div>
