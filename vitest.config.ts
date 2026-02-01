import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
	plugins: [react() as any],
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: './src/test/setup.ts',
		exclude: ['**/node_modules/**', '**/e2e/**', '**/dist/**'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: [
				'node_modules/',
				'src/test/',
				'**/*.spec.ts',
				'**/*.test.ts',
				'**/*.d.ts',
				'e2e/',
				'dist/',
				'playwright-report/',
			],
			include: ['src/**/*.{ts,tsx}'],
		},
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
});
