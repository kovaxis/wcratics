import type { GlobalState } from '$lib/statetype';

export type GlobalStateListener = (state: GlobalState) => void;

let state: GlobalState = { stage: 'idle', candidate: null };
const listeners: Set<GlobalStateListener> = new Set();

export function getState(): GlobalState {
	return state;
}

export function setState(newState: GlobalState) {
	state = newState;
	for (const listener of listeners) {
		try {
			listener(state);
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
