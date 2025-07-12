import type { Category, Piece } from '$lib/types';

async function loadPieces(): Promise<Piece[]> {
	interface TierPiece {
		img: string;
	}

	interface Tier {
		pieces: TierPiece[];
		color: string;
		title: string;
	}

	interface Tierlist {
		tiers: Tier[];
		loose: TierPiece[];
	}

	const { default: rawSrc } = await import('../../../tierlist.tier?raw');
	const rawParsed: Tierlist = JSON.parse(rawSrc);
	const rawPieces = rawParsed.tiers.flatMap((tier) => tier.pieces).concat(rawParsed.loose);
	if (rawPieces.length === 0) throw new Error('no pieces');
	return rawPieces.map((piece, i) => ({ id: i.toString(), img: piece.img }));
}

async function loadCategories(): Promise<Category[]> {
	const { default: rawSrc } = await import('../../../categories.txt?raw');
	const rawCategories = rawSrc
		.split('\n')
		.map((s) => s.trim())
		.filter((s) => s.length > 0);
	if (rawCategories.length === 0) throw new Error('no categories');
	return rawCategories.map((category, i) => ({
		id: i.toString(),
		text: category
	}));
}

export const PIECES: Piece[] = await loadPieces();

export const CATEGORIES: Category[] = await loadCategories();
