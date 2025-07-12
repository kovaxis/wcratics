<script lang="ts">
	import type { Piece, ShowCard } from './types';

	const {
		piece,
		kind,
		idx,
		onclick
	}: { piece?: Piece; kind: ShowCard; idx: number; onclick?: () => void } = $props();
</script>

{#if kind === 'show' && piece}
	<img width="100" height="100" src={piece.img} alt={`Piece #${piece.id}`} />
{:else if kind === 'hide'}
	<div class="cardback" style="width: 100px; height: 100px;"></div>
{:else if kind === 'slot'}
	<div
		class="flex-down"
		style="width: 100px; height: 100px; background: black; color: #222; justify-content: center; font-size: 50px;"
	>
		{idx + 1}
	</div>
{:else if kind === 'btn'}
	<button
		class="flex-down"
		style="width: 100px; height: 100px; background: black; color: #222; justify-content: center; font-size: 50px; cursor: pointer;"
		{onclick}
	>
		{idx + 1}
	</button>
{:else if kind === 'blank' || !piece}
	<div style="width: 100px; height: 100px; background: none;"></div>
{/if}

<style>
	.cardback {
		background:
			linear-gradient(45deg, #dde 12%, transparent 0, transparent 88%, #dde 0),
			linear-gradient(135deg, transparent 37%, #aab 0, #aab 63%, transparent 0),
			linear-gradient(45deg, transparent 37%, #dde 0, #dde 63%, transparent 0), #335;
		background-size: 20px 20px;
	}
</style>
