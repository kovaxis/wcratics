import type { Infer } from 'zod/v4';
import type { StateAction, StateActionResp } from './types';

export function sleep(millis: number, signal?: AbortSignal): Promise<void> {
	if (millis <= 0) return Promise.resolve();
	return new Promise((resolve, reject) => {
		const finish = () => {
			signal?.removeEventListener('abort', finish);
			if (signal?.aborted) {
				reject(signal.reason);
			} else {
				resolve();
			}
		};
		setTimeout(finish, millis);
		signal?.addEventListener('abort', finish);
	});
}

export async function execAction(action: Infer<typeof StateAction>): Promise<StateActionResp> {
	const resp = await fetch('/api/state', {
		method: 'POST',
		body: JSON.stringify(action),
		headers: { 'Content-Type': 'application/json' }
	});
	return await resp.json();
}

export function shuffle<T>(array: T[]) {
	let currentIndex = array.length;

	// While there remain elements to shuffle...
	while (currentIndex != 0) {
		// Pick a remaining element...
		const randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;

		// And swap it with the current element.
		[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
	}
}

export function takeRandom<T>(src: T[], amount: number): { taken: T[]; left: T[] } {
	const all = [...src];
	shuffle(all);
	const taken = all.slice(0, amount);
	const left = src.filter((og) => !taken.some((taken) => taken === og));
	return { taken, left };
}

export function hashString(s: string) {
	let hash = 0,
		i = 0;
	while (i < s.length) {
		hash = ((hash << 5) - hash + s.charCodeAt(i++)) << 0;
	}
	return hash + 2147483647 + 1;
}
