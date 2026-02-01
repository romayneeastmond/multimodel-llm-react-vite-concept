interface FetchOptions {
	method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
	headers?: Record<string, string>;
	body?: any;
}

export const fetchBlob = async (endpoint: string, body: any, errorContext: string = 'Content export'): Promise<Blob | null> => {
	try {
		const response = await fetch(endpoint, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}

		return await response.blob();
	} catch (error: any) {
		console.error(`${errorContext} error:`, error);
		return null;
	}
};

export const fetchFormData = async <T = any>(endpoint: string, formData: FormData, errorContext: string = 'Upload'): Promise<T | null> => {
	try {
		const response = await fetch(endpoint, {
			method: 'POST',
			body: formData
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}

		return await response.json();
	} catch (error: any) {
		console.error(`${errorContext} error:`, error);
		return null;
	}
};

export const fetchJSON = async <T = any>(endpoint: string, options: FetchOptions = {}, errorContext: string = 'Request'): Promise<T | null> => {
	try {
		const response = await fetch(endpoint, {
			method: options.method || 'GET',
			headers: {
				'Content-Type': 'application/json',
				...options.headers
			},
			body: options.body ? JSON.stringify(options.body) : undefined
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}

		return await response.json();
	} catch (error: any) {
		console.error(`${errorContext} error:`, error);
		return null;
	}
};

export const fetchJSONArray = async <T = any>(endpoint: string, options: FetchOptions = {}, errorContext: string = 'Request'): Promise<T[]> => {
	const result = await fetchJSON<T[]>(endpoint, options, errorContext);
	return result || [];
};

export const fetchWithParams = async <T = any>(endpoint: string, params: Record<string, string>, errorContext: string = 'Request'): Promise<T | null> => {
	try {
		const url = new URL(endpoint, window.location.origin);
		Object.entries(params).forEach(([key, value]) => {
			url.searchParams.append(key, value);
		});

		const response = await fetch(url.toString());

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}

		return await response.json();
	} catch (error: any) {
		console.error(`${errorContext} error:`, error);
		return null;
	}
};
