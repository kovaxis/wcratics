import * as fs from 'fs';
import type { Category, Piece, Tierlist } from '$lib/types';

async function loadPieces(): Promise<Piece[]> {
	let rawParsed: Tierlist;
	try {
		const rawSrc = fs.readFileSync('./storage/tierlist.tier', 'utf8');
		rawParsed = JSON.parse(rawSrc);
	} catch (e) {
		console.warn(e);
		console.warn('failed to read tierlist, defaulting to no pieces');
		rawParsed = { tiers: [], loose: [] };
	}
	const rawPieces = rawParsed.tiers.flatMap((tier) => tier.pieces).concat(rawParsed.loose);
	return rawPieces.map((piece, i) => ({ id: i.toString(), img: piece.img }));
}

async function loadCategories(): Promise<Category[]> {
	let rawSrc: string;
	try {
		rawSrc = fs.readFileSync('./storage/categories.txt', 'utf8');
	} catch (e) {
		console.warn(e);
		console.warn('failed to read categories, defaulting to no categories');
		rawSrc = '';
	}
	const rawCategories = rawSrc
		.split('\n')
		.map((s) => s.trim())
		.filter((s) => s.length > 0);
	return rawCategories.map((category, i) => ({
		id: i.toString(),
		text: category
	}));
}

export const PIECES: Piece[] = await loadPieces();

export const CATEGORIES: Category[] = await loadCategories();
