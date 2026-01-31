export enum MultiModel {
	FLASH_3 = 'gemini-3-flash-preview',
	PRO_3 = 'gemini-3-pro-preview',
	FLASH_2_5_LITE = 'gemini-flash-lite-latest',
	AZURE_GPT_35 = 'azure-gpt-35-turbo',
	AZURE_GPT_4 = 'azure-gpt-4',
	AZURE_GPT_4_O = 'azure-gpt-4o',
	AZURE_GPT_5_M = 'azure-gpt-5-mini',
	AZURE_TEXT_EMBED_2 = 'azure-text-embedding-ada-002',
	AZURE_DALL_E_3 = 'azure-dall-e-3',
	CLAUDE_4_5_SONNET = 'claude-sonnet-4-5-20250929',
	CLAUDE_4_5_OPUS = 'claude-opus-4-5-20251101',
} // Models need to be prefixed by their provider, e.g. gemini- or azure- or claude-

export interface AttachedFile {
	id: string;
	name: string;
	type: string;
	base64: string;
	content?: string;
	statistics?: {
		words?: number;
		pages?: number;
	};
	excludeFromContext?: boolean;
}

export interface MCPTool {
	id: string;
	name: string;
	description: string;
	server: string;
	inputSchema?: Record<string, any>;
}

export interface SearchMetadata {
	databaseId: string;
	searchQuery: string;
	offset: number;
	totalResults: number;
}

export interface Message {
	id: string;
	role: 'user' | 'assistant';
	content: string;
	userName?: string;
	userId?: string;
	attachments?: AttachedFile[];
	responses?: Record<string, ModelResponse>;
	isSystem?: boolean;
	searchMetadata?: SearchMetadata;
	workflowExport?: { format: 'text' | 'doc' | 'pdf' | 'excel' | 'pptx' };
	workflowStepIndex?: number;
}

export interface ModelResponseVersion {
	text: string;
	timestamp: number;
	label: string;
}

export interface ModelResponse {
	model: MultiModel;
	text: string;
	status: 'loading' | 'success' | 'error';
	error?: string;
	versions?: ModelResponseVersion[];
	currentVersionIndex?: number;
}

export interface MCPServer {
	id: string;
	name: string;
	url?: string;
	tools: MCPTool[];
}

export interface Folder {
	id: string;
	name: string;
	createdAt: number;
	isShared?: boolean;
}

export interface ChatSession {
	id: string;
	title: string;
	timestamp: number;
	messages: Message[];
	folderId?: string;
	personaId?: string;
	workflowId?: string;
	currentWorkflowStep?: number | null;
	isShared?: boolean;
	groupId?: string;
	isPinned?: boolean;
}

export interface CanvasBlock {
	id: string;
	content: string;
	type: 'model' | 'user';
	sourceModel?: string;
}

export interface Persona {
	id: string;
	name: string;
	description?: string;
	systemInstruction: string;
	multiStepInstruction?: string;
}

export interface LibraryPrompt {
	id: string;
	title: string;
	content: string;
	category: string;
	multiStepInstruction?: string;
	isDefault?: boolean;
}

export type WorkflowStepType = 'prompt' | 'file_upload' | 'mcp_tool' | 'export' | 'persona' | 'database_search' | 'vector_search' | 'web_scraper' | 'serp_search';

export interface WorkflowStep {
	id: string;
	type: WorkflowStepType;
	prompt?: string;
	model?: MultiModel;
	toolIds?: string[];
	exportFormat?: 'text' | 'doc' | 'pdf' | 'excel' | 'pptx';
	fileRequirement?: string;
	personaId?: string;
	multiStepInstruction?: string;
	databaseId?: string;
	searchQuery?: string;
	url?: string;
	includeMeta?: boolean;
}

export interface Workflow {
	id: string;
	name: string;
	description: string;
	steps: WorkflowStep[];
	isSystem?: boolean;
	userId?: string;
	allowedGroups?: string[];
}

export type DatabaseSourceType = 'csv_upload' | 'manual_entry' | 'azure_ai_search';

export interface DatabaseSource {
	id: string;
	name: string;
	type: DatabaseSourceType;
	content: string;
	rowCount: number;
	fileName?: string;
	createdAt: number;
	azureEndpoint?: string;
	azureIndexName?: string;
	azureContentField?: string;
	azureVectorField?: string;
	azureTitleField?: string;
	azureEmbeddingModel?: MultiModel;
	azureSearchKey?: string;
}
