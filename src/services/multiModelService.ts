import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { MultiModel, AttachedFile, MCPTool, Message, ModelResponse } from "../types";
import { MCP_SERVER_CONFIGS } from "../config/constants";

const AZURE_API_KEY = process.env.AZURE_API_KEY;
const AZURE_ENDPOINT = process.env.AZURE_ENDPOINT;
const CLAUDE_ENDPOINT = process.env.CLAUDE_ENDPOINT;

const appendToolsToPrompt = (prompt: string, tools: MCPTool[]): string => {
	if (tools.length === 0) return prompt;

	const toolDescription = tools.map(t => {
		const schemaStr = t.inputSchema ? ` Args: ${JSON.stringify(t.inputSchema)}` : '';
		return `- ${t.server}.${t.name}: ${t.description}${schemaStr}`;
	}).join('\n');

	return `${prompt}\n\n[CONTEXT: The following MCP tools are available to you in this session]\n${toolDescription}\n\n[INSTRUCTION: To call a tool, you MUST use the following format. Do NOT hallucinate tool outputs. Do NOT announce what the tool result "is" before calling it. Do NOT fake a tool response.]\n\n1. Provide a brief, user-facing explanation (e.g. "Checking database...").\n2. Create a markdown code block labeled 'json' containing an ARRAY of tool call objects.\n\nExample:\n\`\`\`json\n[\n  { "tool": "server.tool_name", "arguments": { "arg": "value" } },\n  { "tool": "server.other_tool", "arguments": { "id": 123 } }\n]\n\`\`\`\n\n[IMPORTANT: You can call multiple tools in the array. Strictly use the JSON array format inside the code block.]`;
};

const callAzureDalle = async (model: string, prompt: string): Promise<string> => {
	if (!AZURE_API_KEY || !AZURE_ENDPOINT) {
		throw new Error("Azure API Key or Endpoint not configured.");
	}

	const response = await fetch(`${AZURE_ENDPOINT}/openai/deployments/${model}/images/generations?api-version=2024-02-01`, {
		method: 'POST',
		headers: {
			'api-key': AZURE_API_KEY,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			prompt: prompt,
			n: 1,
			size: "1024x1024"
		})
	});

	if (!response.ok) {
		const err = await response.json().catch(() => ({}));
		throw new Error(err.error?.message || `Azure DALL-E Error: ${response.status} ${response.statusText}`);
	}

	const data = await response.json();
	const imageUrl = data.data?.[0]?.url;

	if (!imageUrl) {
		return "No image generated.";
	}

	return `![Generated Image](${imageUrl})`;
};

const callAzureEmbedding = async (model: string, prompt: string): Promise<string> => {
	const embedding = await getAzureEmbedding(model, prompt);
	return `\`\`\`embed:${model}\n${JSON.stringify(embedding, null, 2)}\n\`\`\``;
};

const callAzureOpenAI = async (model: string, prompt: string, attachments: AttachedFile[], systemInstruction?: string, history: Message[] = []): Promise<string> => {
	if (!AZURE_API_KEY || !AZURE_ENDPOINT) {
		throw new Error("Azure API Key or Endpoint not configured.");
	}

	const messages: any[] = [
		{ role: "system", content: systemInstruction || "You are a helpful assistant." }
	];

	let formattedHistory = history.map(msg => {
		let text = msg.content;
		if (msg.role === 'assistant' && msg.responses && Object.keys(msg.responses).length > 0) {
			const resp = (msg.responses[model as MultiModel] || Object.values(msg.responses).find(r => r.status === 'success')) as ModelResponse | undefined;
			text = resp?.text || "";
		}
		return {
			role: msg.role === 'user' ? 'user' : 'assistant',
			content: text
		};
	});

	formattedHistory = mergeConsecutiveRoles(formattedHistory);

	formattedHistory.forEach(msg => {
		messages.push({
			role: msg.role,
			content: msg.content
		});
	});

	const userContent: any[] = [{ type: "text", text: prompt }];

	attachments.forEach(file => {
		if (file.type.startsWith('image/')) {
			userContent.push({
				type: "image_url",
				image_url: { url: file.base64 }
			});
		} else {
			const textContent = decodeFileContent(file);
			if (textContent) {
				userContent.push({
					type: "text",
					text: `\n\n[Attachment: ${file.name}]\n${textContent}`
				});
			} else {
				userContent.push({
					type: "text",
					text: `\n\n[Attachment: ${file.name}] (Content type ${file.type} not supported for direct analysis)`
				});
			}
		}
	});

	messages.push({ role: "user", content: userContent });

	const isGpt5 = model.includes('gpt-5');

	try {
		const response = await fetch(`${AZURE_ENDPOINT}/openai/deployments/${model}/chat/completions?api-version=2023-03-15-preview`, {
			method: 'POST',
			headers: {
				'api-key': AZURE_API_KEY,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				messages,
				...(isGpt5
					? { max_completion_tokens: 2000, temperature: 1 }
					: { max_tokens: 2000, temperature: 0.7 })
			})
		});

		if (!response.ok) {
			const err = await response.json().catch(() => ({}));
			if (response.status === 413 || (err.error && err.error.code === 'context_length_exceeded')) {
				return "Error: The context size of the model was exceeded. Please try reducing the number/size of attachments or conversation history.";
			}
			throw new Error(err.error?.message || `Azure Error: ${response.status} ${response.statusText}`);
		}

		const data = await response.json();
		return data.choices?.[0]?.message?.content || "No response from Azure.";
	} catch (error: any) {
		if (error.message.includes('context size') || error.message.includes('413')) return error.message;
		throw error;
	}
};

const callClaude = async (model: string, prompt: string, attachments: AttachedFile[], systemInstruction?: string, history: Message[] = []): Promise<string> => {
	if (!CLAUDE_ENDPOINT) {
		throw new Error("Claude Endpoint not configured.");
	}

	const messages: any[] = [];
	let formattedHistory = history.map(msg => {
		let text = msg.content;
		if (msg.role === 'assistant' && msg.responses && Object.keys(msg.responses).length > 0) {
			const resp = (msg.responses[model as MultiModel] || Object.values(msg.responses).find(r => r.status === 'success')) as ModelResponse | undefined;
			text = resp?.text || "";
		}

		return {
			role: msg.role === 'user' ? 'user' : 'assistant',
			content: text || ""
		};
	});

	formattedHistory = mergeConsecutiveRoles(formattedHistory);

	formattedHistory.forEach(msg => {
		if (msg.content) {
			messages.push({
				role: msg.role,
				content: msg.content
			});
		}
	});

	const userContent: any[] = [{ type: "text", text: prompt }];

	attachments.forEach(file => {
		if (file.type.startsWith('image/')) {
			userContent.push({
				type: "image",
				source: {
					type: "base64",
					media_type: file.type,
					data: file.base64.split(',')[1]
				}
			});
		} else {
			const textContent = decodeFileContent(file);
			if (textContent) {
				userContent.push({
					type: "text",
					text: `\n\n[Attachment: ${file.name}]\n${textContent}`
				});
			} else {
				userContent.push({
					type: "text",
					text: `\n\n[Attachment: ${file.name}] (Content type ${file.type} not supported for direct analysis)`
				});
			}
		}
	});

	messages.push({ role: "user", content: userContent });

	try {
		const response = await fetch(CLAUDE_ENDPOINT, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				model: model,
				system: systemInstruction || "You are a helpful assistant.",
				messages: messages,
				max_tokens: 4096,
				temperature: 0.7
			})
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			if (response.status === 413 || (errorData.error && errorData.error.type === 'overloaded_error')) {
				return "Error: Request too large. Please reduce the size of your attachments.";
			}
			throw new Error(errorData.error?.message || `Claude API Error: ${response.status} ${response.statusText}`);
		}

		const data = await response.json();

		if (data.content && Array.isArray(data.content)) {
			const textPart = data.content.find((part: any) => part.type === 'text');
			if (textPart) return textPart.text;
		}

		return data.text || data.completion || (typeof data === 'string' ? data : "No response generated by Claude.");
	} catch (error: any) {
		if (error.message.includes('too large') || error.message.includes('413')) return error.message;
		throw error;
	}
};

const callGemini = async (model: string, prompt: string, attachments: AttachedFile[], systemInstruction?: string, history: Message[] = []): Promise<string> => {
	const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

	let formattedHistory = history.map(msg => {
		let text = msg.content;
		if (msg.role === 'assistant' && msg.responses && Object.keys(msg.responses).length > 0) {
			const resp = (msg.responses[model as MultiModel] || Object.values(msg.responses).find(r => r.status === 'success')) as ModelResponse | undefined;

			text = resp?.text || "";
		}
		return {
			role: msg.role === 'user' ? 'user' : 'assistant',
			content: text
		};
	});

	formattedHistory = mergeConsecutiveRoles(formattedHistory);

	const contents: any[] = formattedHistory.map(msg => ({
		role: msg.role === 'user' ? 'user' : 'model',
		parts: [{ text: msg.content }]
	}));

	const currentParts: any[] = [{ text: prompt }];

	const geminiSupportedMimeTypes = [
		'image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif',
		'application/pdf'
	];

	attachments.forEach(file => {
		const isSupported = geminiSupportedMimeTypes.includes(file.type);

		if (isSupported) {
			currentParts.push({
				inlineData: {
					data: file.base64.split(',')[1],
					mimeType: file.type
				}
			});
		} else {
			const textContent = decodeFileContent(file);
			if (textContent) {
				currentParts.push({
					text: `\n\n[Attachment: ${file.name}]\n${textContent}`
				});
			} else if (file.content) {
				currentParts.push({
					text: `\n\n[Attachment: ${file.name}]\n${file.content}`
				});
			} else {
				currentParts.push({
					text: `\n\n[Attachment: ${file.name}] (Content type ${file.type} not supported for direct analysis)`
				});
			}
		}
	});

	contents.push({
		role: 'user',
		parts: currentParts
	});

	const validModel = model.startsWith('gemini-') || model.startsWith('veo-') ? model : MultiModel.FLASH_3;

	const response: GenerateContentResponse = await ai.models.generateContent({
		model: validModel,
		contents,
		config: {
			systemInstruction: systemInstruction || "You are a helpful assistant."
		}
	});

	return response.text || "No response generated.";
};

async function callMCPTool(serverUrl: string, name: string, args: any) {
	try {
		const body = JSON.stringify({
			jsonrpc: '2.0',
			method: 'tools/call',
			params: { name, arguments: args },
			id: 2
		});

		const response = await fetch(serverUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json, text/event-stream'
			},
			body: body,
			signal: AbortSignal.timeout(15000)
		});

		let data;
		const contentType = response.headers.get('content-type') || '';

		if (contentType.includes('text/event-stream')) {
			const reader = response.body?.getReader();
			if (!reader) throw new Error("Response body is not readable");

			const decoder = new TextDecoder();
			let buffer = '';

			while (true) {
				const { done, value } = await reader.read();
				if (value) {
					buffer += decoder.decode(value, { stream: true });
				}
				if (done) break;
			}

			buffer += decoder.decode();

			const lines = buffer.split('\n');
			for (const line of lines) {
				const trimmed = line.trim();
				if (trimmed.startsWith('data:')) {
					try {
						const jsonStr = trimmed.substring(5).trim();
						const parsed = JSON.parse(jsonStr);
						if (parsed.id === 2 || parsed.result) {
							data = parsed;
							break;
						}
					} catch (e) {

					}
				}
			}

			if (!data) {
				try {
					data = JSON.parse(buffer);
				} catch {
					throw new Error("Received event stream but could not extract valid JSON-RPC response");
				}
			}

		} else {
			data = await response.json();
		}

		if (typeof data === 'string') {
			try { data = JSON.parse(data); } catch (e) { }
		}

		if (data.error) {
			return { content: [{ type: 'text', text: `Tool call error: ${data.error.message || JSON.stringify(data.error)}` }] };
		}

		return data.result || { content: [{ type: 'text', text: 'Tool call returned no result.' }] };
	} catch (err: any) {
		return { content: [{ type: 'text', text: `Tool call failed: ${err.message}` }] };
	}
}

const callModel = async (model: MultiModel, prompt: string, attachments: AttachedFile[], systemInstruction?: string, history: Message[] = []): Promise<string> => {
	if (model.startsWith('azure-')) {
		const azureModel = model.replace('azure-', '');

		if (azureModel.startsWith('text-embedding'))
			return await callAzureEmbedding(azureModel, prompt);

		if (azureModel.startsWith('dall-e'))
			return await callAzureDalle(azureModel, prompt);

		return await callAzureOpenAI(azureModel, prompt, attachments, systemInstruction, history);
	} else if (model.startsWith('claude-')) {
		return await callClaude(model, prompt, attachments, systemInstruction, history);
	} else {
		return await callGemini(model, prompt, attachments, systemInstruction, history);
	}
};

const decodeFileContent = (file: AttachedFile): string | null => {
	if (file.type.startsWith('text/') ||
		file.type.includes('json') ||
		file.type.includes('javascript') ||
		file.type.includes('typescript') ||
		file.type.includes('xml') ||
		file.type === 'application/x-sh' ||
		file.type === 'application/sql') {
		try {
			const base64Data = file.base64.split(',')[1];
			const binaryStr = atob(base64Data);
			const bytes = new Uint8Array(binaryStr.length);
			for (let i = 0; i < binaryStr.length; i++) {
				bytes[i] = binaryStr.charCodeAt(i);
			}
			return new TextDecoder().decode(bytes);
		} catch (e) {
			console.error("Failed to decode file:", file.name);
			return null;
		}
	}
	return null;
};

const executeMCPTool = async (tool: MCPTool, args: any): Promise<string> => {
	const serverConfig = MCP_SERVER_CONFIGS.find(s => s.name === tool.server);

	if (!serverConfig) {
		return JSON.stringify({ error: `Server configuration not found for: ${tool.server}` });
	}

	try {
		const result = await callMCPTool(serverConfig.url, tool.name, args);

		return JSON.stringify(result, null, 2);
	} catch (e: any) {
		console.error("Tool execution error:", e);
		return JSON.stringify({ error: e.message });
	}
};

const filterRelevantTools = (prompt: string, tools: MCPTool[]): MCPTool[] => {
	if (tools.length === 0) return [];

	const promptLower = prompt.toLowerCase();

	const toolActionKeywords = [
		'search', 'find', 'lookup', 'query', 'get', 'fetch', 'retrieve',
		'check', 'analyze', 'scan', 'read', 'list', 'show', 'display',
		'database', 'db', 'index', 'document', 'file', 'data'
	];

	const hasToolIntent = toolActionKeywords.some(keyword => promptLower.includes(keyword));

	if (!hasToolIntent) {
		return [];
	}

	const relevantTools = tools.filter(tool => {
		const toolSearchText = [
			tool.name,
			tool.description,
			tool.server,
			...(tool.inputSchema?.properties ? Object.keys(tool.inputSchema.properties) : [])
		].join(' ').toLowerCase();
		const promptWords = promptLower
			.split(/\s+/)
			.filter(word => word.length > 3);

		return promptWords.some(word => toolSearchText.includes(word));
	});

	return relevantTools;
};

const getAzureEmbedding = async (model: string, prompt: string): Promise<number[]> => {
	if (!AZURE_API_KEY || !AZURE_ENDPOINT) {
		throw new Error("Azure API Key or Endpoint not configured.");
	}

	const response = await fetch(`${AZURE_ENDPOINT}/openai/deployments/${model}/embeddings?api-version=2023-05-15`, {
		method: 'POST',
		headers: {
			'api-key': AZURE_API_KEY,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ input: prompt })
	});

	if (!response.ok) {
		const err = await response.json().catch(() => ({}));
		throw new Error(err.error?.message || `Azure Embedding Error: ${response.status} ${response.statusText}`);
	}

	const data = await response.json();
	return data.data[0].embedding;
};

const mergeConsecutiveRoles = (messages: any[]): any[] => {
	if (messages.length <= 1) return messages;
	const merged: any[] = [];
	let current = { ...messages[0] };

	for (let i = 1; i < messages.length; i++) {
		if (messages[i].role === current.role) {
			current.content += "\n\n" + messages[i].content;
		} else {
			merged.push(current);
			current = { ...messages[i] };
		}
	}
	merged.push(current);
	return merged;
};

export const searchAzureAISearch = async (endpoint: string, key: string, indexName: string, contentField: string, vectorField: string, embeddingModel: string, query: string, titleField?: string, top: number = 5): Promise<{ content: string; title?: string }[]> => {
	const queryVector = await getAzureEmbedding(embeddingModel.replace('azure-', ''), query);

	const searchUrl = `${endpoint}/indexes/${indexName}/docs/search?api-version=2023-11-01`;

	const selectFields = [contentField];
	if (titleField) selectFields.push(titleField);

	const response = await fetch(searchUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'api-key': key
		},
		body: JSON.stringify({
			search: query,
			vectorQueries: [
				{
					kind: 'vector',
					vector: queryVector,
					fields: vectorField,
					k: top
				}
			],
			select: selectFields.join(','),
			top: top
		})
	});

	if (!response.ok) {
		const err = await response.json().catch(() => ({}));
		throw new Error(err.error?.message || `Azure AI Search Error: ${response.status} ${response.statusText}`);
	}

	const data = await response.json();

	return data.value.map((item: any) => ({
		content: item[contentField],
		title: titleField ? item[titleField] : undefined
	}));
};

export const getAzureIndexCount = async (endpoint: string, key: string, indexName: string): Promise<number> => {
	const countUrl = `${endpoint}/indexes/${indexName}/docs/$count?api-version=2023-11-01`;
	const response = await fetch(countUrl, {
		method: 'GET',
		headers: {
			'api-key': key
		}
	});

	if (!response.ok) {
		const err = await response.json().catch(() => ({}));
		throw new Error(err.error?.message || `Azure AI Search Count Error: ${response.status} ${response.statusText}`);
	}

	const text = await response.text();
	return parseInt(text, 10);
};

export const generateModelResponse = async (model: MultiModel, prompt: string, attachments: AttachedFile[], activeTools: MCPTool[], systemInstruction?: string, history: Message[] = []): Promise<string> => {
	const relevantTools = filterRelevantTools(prompt, activeTools);

	const initialPrompt = relevantTools.length > 0 ? appendToolsToPrompt(prompt, relevantTools) : prompt;

	let currentPrompt = initialPrompt;
	let combinedResponse = "";
	let conversationTrace = "";
	const MAX_LOOPS = 5;

	try {
		for (let i = 0; i < MAX_LOOPS; i++) {
			let textResponse = await callModel(model, currentPrompt, i === 0 ? attachments : [], systemInstruction, history);

			if (relevantTools.length > 0) {
				try {
					const codeBlockRegex = /```json\s*([\s\S]*?)\s*```/gi;
					const matches = [...textResponse.matchAll(codeBlockRegex)];

					if (matches.length > 0) {
						let toolsFound = false;
						const toolExecutions: Promise<any>[] = [];
						const matchedBlocks: string[] = [];

						for (const match of matches) {
							const jsonStr = match[1];
							const fullMatch = match[0];

							let parsedPromises: Promise<any>[] = [];

							try {
								const parsed = JSON.parse(jsonStr);
								const calls = Array.isArray(parsed) ? parsed : [parsed];

								for (const call of calls) {
									if (call.tool && call.arguments) {
										const [serverName, toolName] = call.tool.includes('.') ? call.tool.split('.') : [null, call.tool];
										const tool = relevantTools.find(t => t.name === toolName || (serverName && t.server === serverName && t.name === toolName));

										if (tool) {
											parsedPromises.push(
												executeMCPTool(tool, call.arguments).then(output => ({
													toolName: tool.name,
													output: output
												}))
											);
										}
									}
								}
							} catch (e) {
								console.error("Error parsing JSON from matching block:", e);
							}

							if (parsedPromises.length > 0) {
								toolsFound = true;
								toolExecutions.push(...parsedPromises);
								matchedBlocks.push(fullMatch);
							}
						}

						if (toolsFound) {
							const results = await Promise.all(toolExecutions);

							let cleanTextResponse = textResponse;
							let currentStepOutput = "";

							for (const block of matchedBlocks) {
								cleanTextResponse = cleanTextResponse.replace(block, '');
							}

							for (const res of results) {
								cleanTextResponse += `\n\n\`\`\`mcp:${res.toolName}\n${res.output}\n\`\`\``;

								currentStepOutput += `Tool Call: ${res.toolName}\nOutput: ${res.output}\n\n`;
							}

							combinedResponse += cleanTextResponse.trim() + "\n\n";
							conversationTrace += currentStepOutput;
							currentPrompt = `Original Request: ${prompt}\n\n[CONTEXT - PREVIOUS TOOL OUTPUTS]:\n${conversationTrace}\n\n[INSTRUCTION]: Use the available information to answer the original request. If you need more information, call another tool. If you have the answer, state it clearly.`;

							continue;
						}
					}
				} catch (parseError) {
					console.error("Failed to parse tool call:", parseError);
				}
			}

			combinedResponse += textResponse;
			break;
		}

		return combinedResponse;

	} catch (error: any) {
		console.error(`Error with model ${model}:`, error);
		throw new Error(error.message || "An unknown error occurred.");
	}
};