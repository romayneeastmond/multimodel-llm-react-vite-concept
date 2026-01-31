const SERP_API_KEY = process.env.SERP_API_KEY;

const getJson = async (params: any, callback: (json: any) => void) => {
	try {
		const url = new URL("/api/serpapi/search", window.location.origin);
		Object.keys(params).forEach(key => {
			if (params[key] !== undefined && params[key] !== null) {
				url.searchParams.append(key, params[key]);
			}
		});

		const response = await fetch(url.toString());
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const json = await response.json();
		callback(json);
	} catch (error) {
		console.error("SerpApi fetch error:", error);
		callback({ error: error });
	}
};

export const getSerpResults = async (query: string): Promise<string> => {
	try {
		if (!SERP_API_KEY) {
			throw new Error("SERP_API_KEY is not configured");
		}

		return new Promise((resolve, reject) => {
			try {
				getJson({
					engine: "google",
					q: query,
					google_domain: "google.com",
					hl: "en",
					gl: "us",
					api_key: SERP_API_KEY
				}, (json: any) => {
					if (json.error) {
						reject(new Error(json.error));
						return;
					}

					const organicResults = json.organic_results;

					if (!organicResults || !Array.isArray(organicResults)) {
						resolve("No results found.");
						return;
					}

					const formattedResults = organicResults.map((r: any) =>
						`### [${r.title}](${r.link})\n${r.snippet}\n`
					).join('\n---\n\n');

					resolve(formattedResults);
				});
			} catch (err) {
				reject(err);
			}
		});
	} catch (error: any) {
		console.error("SERP search error:", error);
		return `Error performing search for ${query}: ${error.message}.`;
	}
};
