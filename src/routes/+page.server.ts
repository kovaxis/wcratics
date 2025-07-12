import { getState } from '$lib/server/state';
import type { GlobalState } from '$lib/types';
import type { PageServerLoad } from './$types';

interface Data {
	stateInitial: GlobalState;
}

export const load: PageServerLoad = async (): Promise<Data> => {
	return {
		stateInitial: getState()
	};
};
