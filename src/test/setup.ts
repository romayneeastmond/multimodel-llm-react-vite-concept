import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cleanup after each test
afterEach(() => {
	cleanup();
});

// Mock localStorage
const localStorageMock = (() => {
	let store: Record<string, string> = {};

	return {
		getItem: (key: string) => store[key] || null,
		setItem: (key: string, value: string) => {
			store[key] = value.toString();
		},
		removeItem: (key: string) => {
			delete store[key];
		},
		clear: () => {
			store = {};
		},
	};
})();

Object.defineProperty(window, 'localStorage', {
	value: localStorageMock,
});

// Mock window.location
delete (window as any).location;
(window as any).location = {
	href: 'http://localhost:3000',
	origin: 'http://localhost:3000',
	protocol: 'http:',
	host: 'localhost:3000',
	hostname: 'localhost',
	port: '3000',
	pathname: '/',
	search: '',
	hash: '',
	assign: vi.fn(),
	reload: vi.fn(),
	replace: vi.fn(),
	toString: () => 'http://localhost:3000',
	ancestorOrigins: {} as DOMStringList,
} as Location;

// Mock window.history
window.history.pushState = vi.fn();

// Mock process.env for tests
process.env = {
	...process.env,
	AZURE_COSMOS_ENDPOINT: '',
	AZURE_COSMOS_KEY: '',
	AZURE_COSMOS_DB_ID: '',
};
