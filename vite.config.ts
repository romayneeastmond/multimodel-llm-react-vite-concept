import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, '.', '');
	return {
		server: {
			port: 3000,
			host: '0.0.0.0',
			proxy: {
				'/api/serpapi': {
					target: 'https://serpapi.com',
					changeOrigin: true,
					rewrite: (path) => path.replace(/^\/api\/serpapi/, '')
				}
			}
		},
		plugins: [
			react(),
			VitePWA({
				registerType: 'autoUpdate',
				includeAssets: ['icon-192x192.png', 'icon-512x512.png'],
				manifest: {
					name: 'Multi-Model Orchestrator',
					short_name: 'MMO',
					description: 'AI-powered multi-model orchestration platform',
					theme_color: '#10a37f',
					background_color: '#212121',
					display: 'standalone',
					scope: '/',
					start_url: '/',
					orientation: 'any',
					icons: [
						{
							src: '/icon-192x192.png',
							sizes: '192x192',
							type: 'image/png',
							purpose: 'any maskable'
						},
						{
							src: '/icon-512x512.png',
							sizes: '512x512',
							type: 'image/png',
							purpose: 'any maskable'
						}
					]
				},
				workbox: {
					globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
					maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
					runtimeCaching: [
						{
							urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
							handler: 'CacheFirst',
							options: {
								cacheName: 'google-fonts-cache',
								expiration: {
									maxEntries: 10,
									maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
								},
								cacheableResponse: {
									statuses: [0, 200]
								}
							}
						},
						{
							urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
							handler: 'CacheFirst',
							options: {
								cacheName: 'gstatic-fonts-cache',
								expiration: {
									maxEntries: 10,
									maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
								},
								cacheableResponse: {
									statuses: [0, 200]
								}
							}
						},
						{
							urlPattern: /^https:\/\/esm\.sh\/.*/i,
							handler: 'StaleWhileRevalidate',
							options: {
								cacheName: 'esm-cache',
								expiration: {
									maxEntries: 50,
									maxAgeSeconds: 60 * 60 * 24 * 30 // <== 30 days
								},
								cacheableResponse: {
									statuses: [0, 200]
								}
							}
						}
					]
				},
				devOptions: {
					enabled: true
				}
			})
		],
		define: {
			'process.env.AZURE_AD_CLIENT_ID': JSON.stringify(env.AZURE_AD_CLIENT_ID),
			'process.env.AZURE_AD_REDIRECT_URI': JSON.stringify(env.AZURE_AD_REDIRECT_URI),
			'process.env.AZURE_AD_TENANT_ID': JSON.stringify(env.AZURE_AD_TENANT_ID),
			'process.env.AZURE_API_KEY': JSON.stringify(env.AZURE_API_KEY),
			'process.env.AZURE_CACHE_ENDPOINT': JSON.stringify(env.AZURE_CACHE_ENDPOINT),
			'process.env.AZURE_COSMOS_DB_ID': JSON.stringify(env.AZURE_COSMOS_DB_ID),
			'process.env.AZURE_COSMOS_ENDPOINT': JSON.stringify(env.AZURE_COSMOS_ENDPOINT),
			'process.env.AZURE_COSMOS_KEY': JSON.stringify(env.AZURE_COSMOS_KEY),
			'process.env.AZURE_ENDPOINT': JSON.stringify(env.AZURE_ENDPOINT),
			'process.env.CLAUDE_ENDPOINT': JSON.stringify(env.CLAUDE_ENDPOINT),
			'process.env.CONTENT_COMPARISON_ENDPOINT': JSON.stringify(env.CONTENT_COMPARISON_ENDPOINT),
			'process.env.CONTENT_EXPORT_PDF': JSON.stringify(env.CONTENT_EXPORT_PDF),
			'process.env.CONTENT_EXPORT_POWERPOINT': JSON.stringify(env.CONTENT_EXPORT_POWERPOINT),
			'process.env.CONTENT_EXPORT_WORD': JSON.stringify(env.CONTENT_EXPORT_WORD),
			'process.env.CONTENT_EXTRACTOR_ENDPOINT': JSON.stringify(env.CONTENT_EXTRACTOR_ENDPOINT),
			'process.env.CONTENT_RESULTS_CLAUSES_ENDPOINT': JSON.stringify(env.CONTENT_RESULTS_CLAUSES_ENDPOINT),
			'process.env.CONTENT_RESULTS_ENDPOINT': JSON.stringify(env.CONTENT_RESULTS_ENDPOINT),
			'process.env.CONTENT_RESULTS_EXTRACTIONS_ENDPOINT': JSON.stringify(env.CONTENT_RESULTS_EXTRACTIONS_ENDPOINT),
			'process.env.CONTENT_SUMMARIZATION_ENDPOINT': JSON.stringify(env.CONTENT_SUMMARIZATION_ENDPOINT),
			'process.env.CONTENT_TRANSLATION_ENDPOINT': JSON.stringify(env.CONTENT_TRANSLATION_ENDPOINT),
			'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
			'process.env.MCP_SERVER_CONFIGS': JSON.stringify(env.MCP_SERVER_CONFIGS),
			'process.env.SERP_API_KEY': JSON.stringify(env.SERP_API_KEY),
			'process.env.USE_MSAL': JSON.stringify(env.USE_MSAL),
			'process.env.WEB_SCRAPER_ENDPOINT': JSON.stringify(env.WEB_SCRAPER_ENDPOINT)
		},
		resolve: {
			alias: {
				'@': path.resolve(__dirname, './src'),
			}
		}
	};
});
