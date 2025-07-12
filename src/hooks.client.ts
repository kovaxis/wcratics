import type { HandleClientError } from '@sveltejs/kit';

export const handleError: HandleClientError = async ({ error, status, message }) => {
	console.error(status, message, ':', error);
};
