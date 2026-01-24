import { AttachedFile } from '../types/index';

const CONTENT_COMPARISON_ENDPOINT = process.env.CONTENT_COMPARISON_ENDPOINT;
const CONTENT_EXTRACTOR_ENDPOINT = process.env.CONTENT_EXTRACTOR_ENDPOINT;
const CONTENT_RESULTS_ENDPOINT = process.env.CONTENT_RESULTS_ENDPOINT;
const CONTENT_RESULTS_CLAUSES_ENDPOINT = process.env.CONTENT_RESULTS_CLAUSES_ENDPOINT;
const CONTENT_RESULTS_EXTRACTIONS_ENDPOINT = process.env.CONTENT_RESULTS_EXTRACTIONS_ENDPOINT;
const CONTENT_SUMMARIZATION_ENDPOINT = process.env.CONTENT_SUMMARIZATION_ENDPOINT;
const CONTENT_TRANSLATION_ENDPOINT = process.env.CONTENT_TRANSLATION_ENDPOINT;
const WEB_SCRAPER_ENDPOINT = process.env.WEB_SCRAPER_ENDPOINT;
const AZURE_CACHE_ENDPOINT = process.env.AZURE_CACHE_ENDPOINT;

export const getComparisonFromContent = async (prompt: string, files: AttachedFile[]): Promise<any[]> => {
	try {
		const endpoint = `${CONTENT_COMPARISON_ENDPOINT}`;

		const payload = files.map(file => ({
			fileName: file.name,
			content: file.content || ''
		}));

		const response = await fetch(endpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ prompt, files: payload })
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}

		return await response.json();
	} catch (error: any) {
		console.error("Content extraction error:", error);
		return [];
	}
};

export const getContentFromDocuments = async (files: AttachedFile[]): Promise<any[]> => {
	try {
		const endpoint = `${CONTENT_EXTRACTOR_ENDPOINT}`;
		const formData = new FormData();

		files.forEach(file => {
			if (file.base64) {
				try {
					const byteCharacters = atob(file.base64.split(',')[1]);
					const byteNumbers = new Array(byteCharacters.length);
					for (let i = 0; i < byteCharacters.length; i++) {
						byteNumbers[i] = byteCharacters.charCodeAt(i);
					}
					const byteArray = new Uint8Array(byteNumbers);
					const blob = new Blob([byteArray], { type: file.type });
					formData.append('files', blob, file.name);
				} catch (e) {
					console.error("Error converting file to blob:", file.name, e);
				}
			}
		});

		const response = await fetch(endpoint, {
			method: 'POST',
			body: formData
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}

		return await response.json();
	} catch (error: any) {
		console.error("Content extraction error:", error);
		return [];
	}
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
	try {
		const endpoint = `${AZURE_CACHE_ENDPOINT}/cache/get?key=${documentId}`;
		const response = await fetch(endpoint, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json'
			}
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}

		return await response.json();
	} catch (error: any) {
		console.error("Cache error:", error);
		return null;
	}
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
	try {
		const endpoint = `${CONTENT_RESULTS_EXTRACTIONS_ENDPOINT}`;

		const payload = files.map(file => ({
			fileName: file.name,
			content: file.content || ''
		}));

		const response = await fetch(endpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ query: prompt, files: payload })
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}

		return await response.json();
	} catch (error: any) {
		console.error("Content extraction error:", error);
		return [];
	}
};

export const getSummaryFromDocuments = async (files: AttachedFile[]): Promise<any[]> => {
	try {
		const endpoint = `${CONTENT_SUMMARIZATION_ENDPOINT}`;

		const payload = files.map(file => ({
			fileName: file.name,
			content: file.content || ''
		}));

		const response = await fetch(endpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ files: payload })
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}

		return await response.json();
	} catch (error: any) {
		console.error("Content extraction error:", error);
		return [];
	}
};

export const getTranslationFromDocuments = async (prompt: string, files: AttachedFile[]): Promise<any[]> => {
	try {
		const endpoint = `${CONTENT_TRANSLATION_ENDPOINT}`;

		const payload = files.map(file => ({
			fileName: file.name,
			content: file.content || ''
		}));

		const response = await fetch(endpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ prompt, files: payload })
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}

		return await response.json();
	} catch (error: any) {
		console.error("Content extraction error:", error);
		return [];
	}
};

export const removeDocumentCache = async (documentId: string) => {
	try {
		const endpoint = `${AZURE_CACHE_ENDPOINT}/cache/delete?key=${documentId}`;
		const response = await fetch(endpoint, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			}
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}
	} catch (error: any) {
		console.error("Cache error:", error);
	}
};

export const setDocumentCache = async (documentId: string, content: string) => {
	try {
		const endpoint = `${AZURE_CACHE_ENDPOINT}/cache/set`;
		const response = await fetch(endpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ key: documentId, value: content })
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}
	} catch (error: any) {
		console.error("Cache error:", error);
	}
};