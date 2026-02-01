import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchJSON, fetchJSONArray, fetchBlob, fetchFormData, fetchWithParams } from '../fetchUtils';

// Mock global fetch
global.fetch = vi.fn();

function createMockResponse(data: any, ok = true, status = 200) {
	return {
		ok,
		status,
		json: async () => data,
		blob: async () => new Blob([JSON.stringify(data)]),
		text: async () => JSON.stringify(data),
	};
}

describe('fetchUtils', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.spyOn(console, 'error').mockImplementation(() => { });
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('fetchJSON', () => {
		it('should fetch and parse JSON successfully', async () => {
			const mockData = { id: 1, name: 'test' };
			vi.mocked(global.fetch).mockResolvedValueOnce(createMockResponse(mockData) as any);

			const result = await fetchJSON('https://api.example.com/data');

			expect(result).toEqual(mockData);
			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/data',
				expect.objectContaining({
					method: 'GET',
					headers: expect.objectContaining({
						'Content-Type': 'application/json',
					}),
				})
			);
		});

		it('should return null on HTTP error', async () => {
			vi.mocked(global.fetch).mockResolvedValueOnce(createMockResponse({}, false, 404) as any);

			const result = await fetchJSON('https://api.example.com/data');

			expect(result).toBeNull();
			expect(console.error).toHaveBeenCalledWith('Request error:', expect.any(Error));
		});

		it('should handle POST with body', async () => {
			const requestBody = { name: 'test' };
			vi.mocked(global.fetch).mockResolvedValueOnce(createMockResponse({ success: true }) as any);

			await fetchJSON('https://api.example.com/data', {
				method: 'POST',
				body: requestBody,
			});

			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/data',
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify(requestBody),
				})
			);
		});

		it('should handle DELETE requests', async () => {
			vi.mocked(global.fetch).mockResolvedValueOnce(createMockResponse({ deleted: true }) as any);

			await fetchJSON('https://api.example.com/data/123', {
				method: 'DELETE',
			});

			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/data/123',
				expect.objectContaining({
					method: 'DELETE',
				})
			);
		});

		it('should merge custom headers', async () => {
			vi.mocked(global.fetch).mockResolvedValueOnce(createMockResponse({}) as any);

			await fetchJSON('https://api.example.com/data', {
				headers: { Authorization: 'Bearer token123' },
			});

			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/data',
				expect.objectContaining({
					headers: expect.objectContaining({
						'Content-Type': 'application/json',
						Authorization: 'Bearer token123',
					}),
				})
			);
		});

		it('should handle network errors', async () => {
			vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

			const result = await fetchJSON('https://api.example.com/data');

			expect(result).toBeNull();
			expect(console.error).toHaveBeenCalledWith('Request error:', expect.any(Error));
		});

		it('should use custom error context', async () => {
			vi.mocked(global.fetch).mockResolvedValueOnce(createMockResponse({}, false, 500) as any);

			await fetchJSON('https://api.example.com/data', {}, 'Custom operation');

			expect(console.error).toHaveBeenCalledWith('Custom operation error:', expect.any(Error));
		});
	});

	describe('fetchJSONArray', () => {
		it('should return array on success', async () => {
			const mockData = [{ id: 1 }, { id: 2 }];
			vi.mocked(global.fetch).mockResolvedValueOnce(createMockResponse(mockData) as any);

			const result = await fetchJSONArray('https://api.example.com/items');

			expect(result).toEqual(mockData);
			expect(Array.isArray(result)).toBe(true);
		});

		it('should return empty array on error', async () => {
			vi.mocked(global.fetch).mockResolvedValueOnce(createMockResponse({}, false, 404) as any);

			const result = await fetchJSONArray('https://api.example.com/items');

			expect(result).toEqual([]);
			expect(Array.isArray(result)).toBe(true);
		});

		it('should return empty array on network error', async () => {
			vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

			const result = await fetchJSONArray('https://api.example.com/items');

			expect(result).toEqual([]);
		});
	});

	describe('fetchBlob', () => {
		it('should fetch and return blob', async () => {
			const mockBlob = new Blob(['test content'], { type: 'text/plain' });
			vi.mocked(global.fetch).mockResolvedValueOnce({
				ok: true,
				status: 200,
				blob: async () => mockBlob,
			} as any);

			const result = await fetchBlob('https://api.example.com/file', { content: 'test' });

			expect(result).toBeInstanceOf(Blob);
			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/file',
				expect.objectContaining({
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ content: 'test' }),
				})
			);
		});

		it('should return null on HTTP error', async () => {
			vi.mocked(global.fetch).mockResolvedValueOnce({
				ok: false,
				status: 500,
			} as any);

			const result = await fetchBlob('https://api.example.com/file', { content: 'test' });

			expect(result).toBeNull();
		});

		it('should return null on network error', async () => {
			vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

			const result = await fetchBlob('https://api.example.com/file', { content: 'test' });

			expect(result).toBeNull();
			expect(console.error).toHaveBeenCalledWith('Content export error:', expect.any(Error));
		});
	});

	describe('fetchFormData', () => {
		it('should upload FormData successfully', async () => {
			const mockData = { uploaded: true, fileId: '123' };
			vi.mocked(global.fetch).mockResolvedValueOnce(createMockResponse(mockData) as any);

			const formData = new FormData();
			formData.append('file', new Blob(['test']), 'test.txt');

			const result = await fetchFormData('https://api.example.com/upload', formData);

			expect(result).toEqual(mockData);
			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/upload',
				expect.objectContaining({
					method: 'POST',
					body: formData,
				})
			);
		});

		it('should not set Content-Type header (browser sets it)', async () => {
			vi.mocked(global.fetch).mockResolvedValueOnce(createMockResponse({}) as any);

			const formData = new FormData();
			await fetchFormData('https://api.example.com/upload', formData);

			const call = vi.mocked(global.fetch).mock.calls[0][1];
			expect(call?.headers).toBeUndefined();
		});

		it('should return null on error', async () => {
			vi.mocked(global.fetch).mockResolvedValueOnce(createMockResponse({}, false, 400) as any);

			const formData = new FormData();
			const result = await fetchFormData('https://api.example.com/upload', formData);

			expect(result).toBeNull();
			expect(console.error).toHaveBeenCalledWith('Upload error:', expect.any(Error));
		});
	});

	describe('fetchWithParams', () => {
		it('should build URL with query parameters', async () => {
			vi.mocked(global.fetch).mockResolvedValueOnce(createMockResponse({ results: [] }) as any);

			await fetchWithParams(
				'https://api.example.com/search',
				{ q: 'test', limit: '10' }
			);

			const call = vi.mocked(global.fetch).mock.calls[0][0] as string;
			expect(call).toContain('q=test');
			expect(call).toContain('limit=10');
		});

		it('should handle multiple parameters', async () => {
			vi.mocked(global.fetch).mockResolvedValueOnce(createMockResponse({}) as any);

			await fetchWithParams(
				'https://api.example.com/data',
				{ page: '1', size: '20', sort: 'date' }
			);

			const call = vi.mocked(global.fetch).mock.calls[0][0] as string;
			expect(call).toContain('page=1');
			expect(call).toContain('size=20');
			expect(call).toContain('sort=date');
		});

		it('should encode special characters in parameters', async () => {
			vi.mocked(global.fetch).mockResolvedValueOnce(createMockResponse({}) as any);

			await fetchWithParams(
				'https://api.example.com/data',
				{ query: 'hello world', email: 'test@example.com' }
			);

			const call = vi.mocked(global.fetch).mock.calls[0][0] as string;
			expect(call).toContain('query=hello+world');
			expect(call).toContain('email=test%40example.com');
		});

		it('should return null on error', async () => {
			vi.mocked(global.fetch).mockResolvedValueOnce(createMockResponse({}, false, 404) as any);

			const result = await fetchWithParams(
				'https://api.example.com/data',
				{ id: '123' }
			);

			expect(result).toBeNull();
		});
	});
});
