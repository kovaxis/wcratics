import {
	getState,
	registerListener,
	unregisterListener,
	type GlobalStateListener
} from '$lib/server/state';
import type { GlobalState } from '$lib/statetype';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => {
	let onChange: GlobalStateListener | null = null;
	const stream = new ReadableStream<Uint8Array<ArrayBufferLike>>({
		start(controller) {
			onChange = (state: GlobalState) => {
				controller.enqueue(new TextEncoder().encode(JSON.stringify(state)));
			};
			registerListener(onChange);
			onChange(getState());
		},
		cancel() {
			if (onChange) unregisterListener(onChange);
		}
	});
	return new Response(stream);
};
