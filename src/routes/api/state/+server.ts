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
