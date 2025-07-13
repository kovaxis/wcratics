import z from 'zod/v4';

export type GlobalState = (
	| {
			stage: 'idle';
			candidate: string | null;
	  }
	| ({
			master: string;
			category: Category;
			pieces: Piece[];
			bets: Record<string, { piece: string; place: number }>;
			placed: (string | null)[];
	  } & (
			| { stage: 'bet'; deadline: number }
			| { stage: 'choose' }
			| { stage: 'split'; distr: Record<string, { mult: number }>; candidate: string | null }
	  ))
) & {
	_availPieces: string[];
	_availCategories: string[];
	_history?: GlobalState[];
};

export type Piece = {
	id: string;
	img: string;
};

export type Category = {
	id: string;
	text: string;
};

export const StateAction = z.union([
	z.object({
		ty: z.literal('postular'),
		name: z.string()
	}),
	z.object({
		ty: z.literal('comenzar')
	}),
	z.object({
		ty: z.literal('apostar'),
		name: z.string(),
		piece: z.string(),
		place: z.number()
	}),
	z.object({
		ty: z.literal('elegir'),
		piece: z.string(),
		place: z.number()
	})
]);

export type StateActionResp = {
	status: 'ok';
};

export type ShowCard = 'hide' | 'show' | 'slot' | 'btn' | 'blank';

export interface TierPiece {
	img: string;
}

export interface Tier {
	pieces: TierPiece[];
	color: string;
	title: string;
}

export interface Tierlist {
	tiers: Tier[];
	loose: TierPiece[];
}
