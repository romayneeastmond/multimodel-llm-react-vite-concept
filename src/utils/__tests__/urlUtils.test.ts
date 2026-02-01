import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
	getUrlParam,
	getAllUrlParams,
	updateUrlParams,
	setUrlParam,
	removeUrlParam,
	hasUrlParam,
	clearAllUrlParams,
	buildQueryString,
} from '../urlUtils';

describe('urlUtils', () => {
	beforeEach(() => {
		// Reset window.location.search before each test
		Object.defineProperty(window, 'location', {
			value: {
				...window.location,
				search: '?id=123&name=test&active=true',
				pathname: '/test-path',
			},
			writable: true,
		});

		// Clear history mock
		vi.clearAllMocks();
	});

	describe('getUrlParam', () => {
		it('should get URL parameter value', () => {
			expect(getUrlParam('id')).toBe('123');
			expect(getUrlParam('name')).toBe('test');
			expect(getUrlParam('active')).toBe('true');
		});

		it('should return null for non-existent parameter', () => {
			expect(getUrlParam('missing')).toBeNull();
			expect(getUrlParam('nothere')).toBeNull();
		});

		it('should handle empty search string', () => {
			window.location.search = '';
			expect(getUrlParam('id')).toBeNull();
		});

		it('should handle URL-encoded values', () => {
			window.location.search = '?message=hello%20world&email=test%40example.com';
			expect(getUrlParam('message')).toBe('hello world');
			expect(getUrlParam('email')).toBe('test@example.com');
		});
	});

	describe('getAllUrlParams', () => {
		it('should return all parameters as object', () => {
			const params = getAllUrlParams();
			expect(params).toEqual({
				id: '123',
				name: 'test',
				active: 'true',
			});
		});

		it('should return empty object when no parameters', () => {
			window.location.search = '';
			const params = getAllUrlParams();
			expect(params).toEqual({});
		});

		it('should handle duplicate parameter names (last wins)', () => {
			window.location.search = '?id=1&id=2&id=3';
			const params = getAllUrlParams();
			expect(params.id).toBe('3');
		});

		it('should decode URL-encoded values', () => {
			window.location.search = '?name=John%20Doe&city=New%20York';
			const params = getAllUrlParams();
			expect(params.name).toBe('John Doe');
			expect(params.city).toBe('New York');
		});
	});

	describe('hasUrlParam', () => {
		it('should check if parameter exists', () => {
			expect(hasUrlParam('id')).toBe(true);
			expect(hasUrlParam('name')).toBe(true);
			expect(hasUrlParam('missing')).toBe(false);
		});

		it('should return false for empty search', () => {
			window.location.search = '';
			expect(hasUrlParam('id')).toBe(false);
		});

		it('should return true even if value is empty', () => {
			window.location.search = '?empty=';
			expect(hasUrlParam('empty')).toBe(true);
		});
	});

	describe('updateUrlParams', () => {
		it('should update single parameter', () => {
			updateUrlParams({ id: '456' });

			expect(window.history.pushState).toHaveBeenCalledWith(
				{ path: expect.stringContaining('id=456') },
				'',
				expect.stringContaining('id=456')
			);
		});

		it('should add new parameter', () => {
			updateUrlParams({ newParam: 'value' });

			expect(window.history.pushState).toHaveBeenCalledWith(
				expect.anything(),
				'',
				expect.stringContaining('newParam=value')
			);
		});

		it('should remove parameter when value is null', () => {
			updateUrlParams({ name: null });

			const call = vi.mocked(window.history.pushState).mock.calls[0];
			const url = call[2] as string;
			expect(url).not.toContain('name=');
		});

		it('should update multiple parameters at once', () => {
			updateUrlParams({ id: '999', name: 'updated', newKey: 'newValue' });

			const call = vi.mocked(window.history.pushState).mock.calls[0];
			const url = call[2] as string;
			expect(url).toContain('id=999');
			expect(url).toContain('name=updated');
			expect(url).toContain('newKey=newValue');
		});

		it('should push to pathname only when all params removed', () => {
			updateUrlParams({ id: null, name: null, active: null });

			expect(window.history.pushState).toHaveBeenCalledWith(
				{ path: '/test-path' },
				'',
				'/test-path'
			);
		});

		it('should preserve existing params not being updated', () => {
			updateUrlParams({ id: '999' });

			const call = vi.mocked(window.history.pushState).mock.calls[0];
			const url = call[2] as string;
			expect(url).toContain('name=test');
			expect(url).toContain('active=true');
		});
	});

	describe('setUrlParam', () => {
		it('should set a single parameter', () => {
			setUrlParam('newKey', 'newValue');

			expect(window.history.pushState).toHaveBeenCalled();
			const call = vi.mocked(window.history.pushState).mock.calls[0];
			const url = call[2] as string;
			expect(url).toContain('newKey=newValue');
		});

		it('should update existing parameter', () => {
			setUrlParam('id', '999');

			const call = vi.mocked(window.history.pushState).mock.calls[0];
			const url = call[2] as string;
			expect(url).toContain('id=999');
		});

		it('should remove parameter when value is null', () => {
			setUrlParam('name', null);

			const call = vi.mocked(window.history.pushState).mock.calls[0];
			const url = call[2] as string;
			expect(url).not.toContain('name=');
		});
	});

	describe('removeUrlParam', () => {
		it('should remove specified parameter', () => {
			removeUrlParam('name');

			const call = vi.mocked(window.history.pushState).mock.calls[0];
			const url = call[2] as string;
			expect(url).not.toContain('name=');
			expect(url).toContain('id=123'); // Others should remain
		});

		it('should not push state if parameter does not exist', () => {
			removeUrlParam('nonexistent');

			// No changes made, so pushState should not be called
			expect(window.history.pushState).not.toHaveBeenCalled();
		});
	});

	describe('clearAllUrlParams', () => {
		it('should remove all parameters', () => {
			clearAllUrlParams();

			expect(window.history.pushState).toHaveBeenCalledWith(
				{ path: '/test-path' },
				'',
				'/test-path'
			);
		});

		it('should preserve pathname', () => {
			window.location.pathname = '/custom/path';
			clearAllUrlParams();

			expect(window.history.pushState).toHaveBeenCalledWith(
				{ path: '/custom/path' },
				'',
				'/custom/path'
			);
		});
	});

	describe('buildQueryString', () => {
		it('should build query string from object', () => {
			const params = { id: 123, name: 'test', active: true };
			const query = buildQueryString(params);

			expect(query).toContain('id=123');
			expect(query).toContain('name=test');
			expect(query).toContain('active=true');
		});

		it('should handle empty object', () => {
			const query = buildQueryString({});
			expect(query).toBe('');
		});

		it('should encode special characters', () => {
			const params = { message: 'hello world', email: 'test@example.com' };
			const query = buildQueryString(params);

			expect(query).toContain('message=hello+world');
			expect(query).toContain('email=test%40example.com');
		});

		it('should handle number values', () => {
			const params = { count: 42, price: 19.99 };
			const query = buildQueryString(params);

			expect(query).toContain('count=42');
			expect(query).toContain('price=19.99');
		});

		it('should handle boolean values', () => {
			const params = { active: true, disabled: false };
			const query = buildQueryString(params);

			expect(query).toContain('active=true');
			expect(query).toContain('disabled=false');
		});

		it('should handle mixed types', () => {
			const params = {
				str: 'text',
				num: 123,
				bool: true,
			};
			const query = buildQueryString(params);

			expect(query).toContain('str=text');
			expect(query).toContain('num=123');
			expect(query).toContain('bool=true');
		});
	});
});
