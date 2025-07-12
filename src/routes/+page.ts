import type { GlobalState } from '$lib/statetype';
import type { PageLoad } from './$types';

interface Data {
	state: GlobalState;
	stateStream: ReadableStream<Uint8Array<ArrayBufferLike>>;
}

export const load: PageLoad = async ({ fetch }): Promise<Data> => {
	const stateStream = (await fetch('/api/state')).body;
	if (!stateStream) throw new Error('expected state stream');
	const chunk = await stateStream.getReader().read();
	if (!chunk.value) throw new Error('expected state stream chunk value');
	const state: GlobalState = JSON.parse(new TextDecoder().decode(chunk.value));
	return {
		state,
		stateStream
	};
};
