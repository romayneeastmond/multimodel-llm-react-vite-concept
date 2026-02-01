export const buildQueryString = (params: Record<string, string | number | boolean>): string => {
	const searchParams = new URLSearchParams();
	Object.entries(params).forEach(([key, value]) => {
		searchParams.append(key, String(value));
	});
	return searchParams.toString();
};

export const clearAllUrlParams = () => {
	if (typeof window === 'undefined') return;
	window.history.pushState({ path: window.location.pathname }, '', window.location.pathname);
};

export const getAllUrlParams = (): Record<string, string> => {
	if (typeof window === 'undefined') return {};
	const params = new URLSearchParams(window.location.search);
	const result: Record<string, string> = {};
	params.forEach((value, key) => {
		result[key] = value;
	});
	return result;
};

export const getUrlParam = (key: string): string | null => {
	if (typeof window === 'undefined') return null;
	const params = new URLSearchParams(window.location.search);
	return params.get(key);
};

export const hasUrlParam = (key: string): boolean => {
	if (typeof window === 'undefined') return false;
	const params = new URLSearchParams(window.location.search);
	return params.has(key);
};

export const removeUrlParam = (key: string) => {
	updateUrlParams({ [key]: null });
};

export const setUrlParam = (key: string, value: string | null) => {
	updateUrlParams({ [key]: value });
};

export const updateUrlParams = (updates: Record<string, string | null>) => {
	if (typeof window === 'undefined') return;

	const params = new URLSearchParams(window.location.search);
	let updated = false;

	Object.entries(updates).forEach(([key, value]) => {
		if (value !== null) {
			if (params.get(key) !== value) {
				params.set(key, value);
				updated = true;
			}
		} else if (params.has(key)) {
			params.delete(key);
			updated = true;
		}
	});

	if (updated) {
		const newUrl = `${window.location.pathname}?${params.toString()}`;
		window.history.pushState({ path: newUrl }, '', newUrl);
	}
};