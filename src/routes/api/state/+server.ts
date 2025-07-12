import {
	getState,
	registerListener,
	setState,
	unregisterListener,
	type GlobalStateListener
} from '$lib/server/state';
import { StateAction, type GlobalState, type StateActionResp } from '$lib/types';
import type { Infer } from 'zod/v4';
import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { CATEGORIES, PIECES } from '$lib/server/gamedata';
import { takeRandom } from '$lib/util';

const PIECE_COUNT = 5;
const BET_TIMEOUT = 60 * 1000;
const BET_MULT = [2, 4, 4, 4, 2];

export const GET: RequestHandler = () => {
	let onChange: GlobalStateListener | null = null;
	const stream = new ReadableStream<string>({
		start(controller) {
			onChange = (state: GlobalState) => {
				controller.enqueue(`data: ${JSON.stringify(state)}\n\n`);
			};
			registerListener(onChange);
			onChange(getState());
		},
		cancel() {
			if (onChange) unregisterListener(onChange);
		}
	});
	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache'
		}
	});
};

function onFinishBetting() {
	const state = getState();
	if (state.stage === 'bet') {
		setState({
			...state,
			stage: 'choose'
		});
	}
}

function handleAction(action: Infer<typeof StateAction>): StateActionResp {
	const state = getState();
	switch (action.ty) {
		case 'postular': {
			if (state.stage === 'idle' || state.stage === 'split')
				setState({ ...state, candidate: action.name });
			return { status: 'ok' };
		}
		case 'comenzar': {
			if ((state.stage === 'idle' || state.stage === 'split') && state.candidate != null) {
				// Start game
				if (state._availPieces.length === 0) state._availPieces = PIECES.map((piece) => piece.id);
				if (state._availCategories.length === 0)
					state._availCategories = CATEGORIES.map((cat) => cat.id);
				const { taken: pieceIds, left: leftPieces } = takeRandom(state._availPieces, PIECE_COUNT);
				const {
					taken: [categoryId],
					left: leftCategories
				} = takeRandom(state._availCategories, 1);
				const pieces = pieceIds.flatMap((id) => PIECES.find((piece) => piece.id === id) ?? []);
				const category = CATEGORIES.find((cat) => cat.id === categoryId);
				if (category == null) throw new Error('no category?');
				const deadline = new Date().getTime() + BET_TIMEOUT;
				setTimeout(onFinishBetting, BET_TIMEOUT);
				setState({
					stage: 'bet',
					master: state.candidate,
					category,
					pieces,
					bets: {},
					deadline: deadline,
					placed: pieces.map(() => null),
					_availPieces: leftPieces,
					_availCategories: leftCategories
				});
			}
			return { status: 'ok' };
		}
		case 'apostar': {
			if (state.stage === 'bet') {
				const newBets = {
					...state.bets,
					[action.name]: {
						piece: action.piece,
						place: action.place
					}
				};
				if (state.bets[action.name]?.place === action.place) {
					delete newBets[action.name];
				}
				setState({
					...state,
					bets: newBets
				});
			}
			return { status: 'ok' };
		}
		case 'elegir': {
			if (state.stage === 'choose') {
				const newPlaced = [...state.placed];
				if (!state.pieces.some((piece) => piece.id === action.piece))
					throw new Error('unknown piece');
				if (newPlaced[action.place] !== null) throw new Error('position is taken');
				newPlaced[action.place] = action.piece;
				const newState: GlobalState = {
					...state,
					placed: newPlaced
				};
				if (newPlaced.every((slot) => slot !== null)) {
					// Finished placing
					const distr = Object.fromEntries(
						Object.entries(newState.bets).map(([name, bet]) => {
							if (newPlaced[bet.place] === bet.piece) {
								// Won bet
								//const idx = state.pieces.findIndex((piece) => piece.id === bet.piece); // reveal order
								const idx = newPlaced.findIndex((placed) => placed === bet.piece); // resulting place
								return [
									name,
									{
										mult: BET_MULT[idx] ?? BET_MULT[BET_MULT.length - 1]
									}
								];
							} else {
								// Lost bet
								return [name, { mult: 0 }];
							}
						})
					);
					setState({
						...newState,
						stage: 'split',
						distr,
						candidate: null
					});
				} else {
					// Continue placing
					setState(newState);
				}
			}
			return { status: 'ok' };
		}
	}
}

export const POST: RequestHandler = async ({ request }) => {
	const action = StateAction.parse(await request.json());
	const resp = handleAction(action);
	return json(resp);
};
