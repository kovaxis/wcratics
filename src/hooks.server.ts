import type { HandleServerError } from '@sveltejs/kit';

export const handleError: HandleServerError = async ({ error, status, message }) => {
	if (status === 404) return;
	console.error(status, message, ':', error);
};
