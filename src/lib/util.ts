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
