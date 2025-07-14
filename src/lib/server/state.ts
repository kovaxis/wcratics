import type { GlobalState } from '$lib/types';
import * as fs from 'fs';

export type GlobalStateListener = (state: GlobalState) => void;

let state: GlobalState = {
	stage: 'idle',
	candidate: null,
	_availPieces: [],
	_availCategories: [],
	_history: []
};
try {
	const rawState = fs.readFileSync('./storage/state.json', 'utf8');
	state = JSON.parse(rawState);
	state._history = state._history ?? [];
} catch (e) {
	console.warn('failed to read state.json:', e);
}

const listeners: Set<GlobalStateListener> = new Set();

export function getState(): GlobalState {
	return state;
}

function filterState(val: unknown): unknown {
	if (typeof val === 'object' && !(val instanceof Array) && val != null) {
		const newEntries = [];
		for (const [k, v] of Object.entries(val)) {
			if (!k.startsWith('_')) {
				newEntries.push([k, filterState(v)]);
			}
		}
		return Object.fromEntries(newEntries);
	} else {
		return val;
	}
}

export function setState(newState: GlobalState) {
	state = newState;
	fs.writeFileSync('./storage/state.json', JSON.stringify(state), 'utf8');
	const publicState = filterState(state) as GlobalState;
	for (const listener of listeners) {
		try {
			listener(publicState);
		} catch (e) {
			console.error('Error in global-state-listener:', e);
		}
	}
}

export function registerListener(listener: GlobalStateListener) {
	listeners.add(listener);
}

export function unregisterListener(listener: GlobalStateListener) {
	listeners.delete(listener);
}
