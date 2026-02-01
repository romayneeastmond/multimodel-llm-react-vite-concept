import { AttachedFile } from '../types/index';
import { fetchJSON, fetchBlob, fetchFormData, fetchWithParams } from '../utils/fetchUtils';
import { attachedFilesToFormData, mapFilesToPayload } from '../utils/fileUtils';

const AZURE_CACHE_ENDPOINT = process.env.AZURE_CACHE_ENDPOINT;
const CONTENT_COMPARISON_ENDPOINT = process.env.CONTENT_COMPARISON_ENDPOINT;
const CONTENT_EXPORT_PDF = process.env.CONTENT_EXPORT_PDF;
const CONTENT_EXPORT_POWERPOINT = process.env.CONTENT_EXPORT_POWERPOINT;
const CONTENT_EXPORT_WORD = process.env.CONTENT_EXPORT_WORD;
const CONTENT_EXTRACTOR_ENDPOINT = process.env.CONTENT_EXTRACTOR_ENDPOINT;
const CONTENT_RESULTS_ENDPOINT = process.env.CONTENT_RESULTS_ENDPOINT;
const CONTENT_RESULTS_CLAUSES_ENDPOINT = process.env.CONTENT_RESULTS_CLAUSES_ENDPOINT;
const CONTENT_RESULTS_EXTRACTIONS_ENDPOINT = process.env.CONTENT_RESULTS_EXTRACTIONS_ENDPOINT;
const CONTENT_SUMMARIZATION_ENDPOINT = process.env.CONTENT_SUMMARIZATION_ENDPOINT;
const CONTENT_TRANSLATION_ENDPOINT = process.env.CONTENT_TRANSLATION_ENDPOINT;
const WEB_SCRAPER_ENDPOINT = process.env.WEB_SCRAPER_ENDPOINT;

export const getComparisonFromContent = async (prompt: string, files: AttachedFile[]): Promise<any[]> => {
	const payload = mapFilesToPayload(files);
	const result = await fetchJSON<any[]>(
		`${CONTENT_COMPARISON_ENDPOINT}`,
		{ method: 'POST', body: { prompt, files: payload } },
		'Content comparison'
	);
	return result || [];
};

export const getContentForWord = async (content: string): Promise<any> => {
	return await fetchBlob(`${CONTENT_EXPORT_WORD}`, { content }, 'Word export');
};

export const getContentForPDF = async (content: string): Promise<any> => {
	return await fetchBlob(`${CONTENT_EXPORT_PDF}`, { content }, 'PDF export');
};

export const getContentForPowerPoint = async (slides: string[]): Promise<any> => {
	return await fetchBlob(`${CONTENT_EXPORT_POWERPOINT}`, { slides }, 'PowerPoint export');
};

export const getContentFromDocuments = async (files: AttachedFile[]): Promise<any[]> => {
	const formData = attachedFilesToFormData(files);
	const result = await fetchFormData<any[]>(
		`${CONTENT_EXTRACTOR_ENDPOINT}`,
		formData,
		'Content extraction'
	);
	return result || [];
};

export const getContentFromWebsite = async (url: string, includeMeta: boolean = false): Promise<string> => {
	try {
		const endpoint = `${WEB_SCRAPER_ENDPOINT}?query=${encodeURIComponent(url)}&meta=${includeMeta}`;
		const response = await fetch(endpoint);

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}

		const results: Array<{
			url: string;
			content: string;
			statistics: {
				words: string;
				pages: number;
			};
			meta?: {
				description?: string;
				image?: string;
			};
		}> = await response.json();

		const combinedContent = results.map(r => {
			let block = `Source: ${r.url}\n\n**Main Content:**\n\n${r.content}`;

			if (includeMeta && r.meta) {
				block += `\n\nMetadata:\n`;
				if (r.meta.description) block += `- Description: ${r.meta.description}\n`;
				if (r.meta.image) block += `- Image: ${r.meta.image}\n`;
			}

			//block += `\n\nStatistics:\n- Words: ${r.statistics.words}\n- Pages: ${r.statistics.pages}`;

			return block;
		}).join('\n\n---\n\n');

		return combinedContent;

		//return combinedContent.slice(0, 20000);
	} catch (error: any) {
		console.error("Scraping error:", error);
		return `Error scraping ${url}: ${error.message}. (CORS restrictions may apply)`;
	}
};

export const getDocumentCache = async (documentId: string) => {
	return await fetchJSON(
		`${AZURE_CACHE_ENDPOINT}/cache/get?key=${documentId}`,
		{ method: 'GET' },
		'Cache get'
	);
};

export const getResultsFromDocuments = async (prompt: string, files: AttachedFile[]): Promise<any[]> => {
	try {
		const endpoint = `${CONTENT_RESULTS_ENDPOINT}`;

		const promises = files.map(async (file) => {
			const payload = {
				fileName: file.name,
				content: file.content || ''
			};

			try {
				const response = await fetch(endpoint, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ query: prompt, content: payload.content })
				});

				if (!response.ok) {
					throw new Error(`HTTP ${response.status}`);
				}

				const jsonResponse = await response.json();
				return { fileName: file.name, contents: jsonResponse };
			} catch (err: any) {
				console.error(`Error processing file ${file.name}:`, err);
				return { fileName: file.name, error: err.message };
			}
		});

		return await Promise.all(promises);
	} catch (error: any) {
		console.error("Content extraction error:", error);
		return [];
	}
};

export const getResultsClausesFromDocuments = async (clauses: any[], files: AttachedFile[], similarity = 0.30): Promise<any[]> => {
	try {
		const endpoint = `${CONTENT_RESULTS_CLAUSES_ENDPOINT}`;

		const promises = files.map(async (file) => {
			const payload = {
				fileName: file.name,
				content: file.content || ''
			};

			try {
				const response = await fetch(endpoint, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ clauses: clauses.join('\n'), content: payload.content, similarity })
				});

				if (!response.ok) {
					throw new Error(`HTTP ${response.status}`);
				}

				const jsonResponse = await response.json();
				return { fileName: file.name, contents: jsonResponse };
			} catch (err: any) {
				console.error(`Error processing file ${file.name}:`, err);
				return { fileName: file.name, error: err.message };
			}
		});

		return await Promise.all(promises);

	} catch (error: any) {
		console.error("Content extraction error:", error);
		return [];
	}
};

export const getResultsExtractionsFromDocuments = async (prompt: string, files: AttachedFile[]): Promise<any[]> => {
	const payload = mapFilesToPayload(files);
	const result = await fetchJSON<any[]>(
		`${CONTENT_RESULTS_EXTRACTIONS_ENDPOINT}`,
		{ method: 'POST', body: { query: prompt, files: payload } },
		'Content extraction'
	);
	return result || [];
};

export const getSummaryFromDocuments = async (files: AttachedFile[]): Promise<any[]> => {
	const payload = mapFilesToPayload(files);
	const result = await fetchJSON<any[]>(
		`${CONTENT_SUMMARIZATION_ENDPOINT}`,
		{ method: 'POST', body: { files: payload } },
		'Content summarization'
	);
	return result || [];
};

export const getTranslationFromDocuments = async (prompt: string, files: AttachedFile[]): Promise<any[]> => {
	const payload = mapFilesToPayload(files);
	const result = await fetchJSON<any[]>(
		`${CONTENT_TRANSLATION_ENDPOINT}`,
		{ method: 'POST', body: { prompt, files: payload } },
		'Content translation'
	);
	return result || [];
};

export const removeDocumentCache = async (documentId: string) => {
	await fetchJSON(
		`${AZURE_CACHE_ENDPOINT}/cache/delete?key=${documentId}`,
		{ method: 'DELETE' },
		'Cache delete'
	);
};

export const setDocumentCache = async (documentId: string, content: string) => {
	await fetchJSON(
		`${AZURE_CACHE_ENDPOINT}/cache/set`,
		{ method: 'POST', body: { key: documentId, value: content } },
		'Cache set'
	);
};