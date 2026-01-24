import { CosmosClient } from "@azure/cosmos";
import schema from "./cosmos_schema.json";

export interface CosmosConfig {
	endpoint: string;
	key: string;
	databaseId: string;
}

export const testCosmosConnection = async (config: CosmosConfig): Promise<{ success: boolean; message: string }> => {
	if (!config.endpoint || !config.key || !config.databaseId) {
		return { success: false, message: "Missing required configuration." };
	}

	try {
		const client = new CosmosClient({
			endpoint: config.endpoint,
			key: config.key
		});

		const timeoutPromise = new Promise<{ success: boolean; message: string }>((_, reject) =>
			setTimeout(() => reject(new Error("Connection timed out after 10 seconds.")), 10000)
		);

		const connectionPromise = (async (): Promise<{ success: boolean; message: string }> => {
			await client.getDatabaseAccount();

			const { database } = await client.database(config.databaseId).read().catch(() => ({ database: null }));

			if (!database) {
				return { success: true, message: "Connected to Azure, but database does not exist yet. Run Schema Installation." };
			}

			return { success: true, message: "Successfully connected to Cosmos DB." };
		})();

		return await Promise.race([connectionPromise, timeoutPromise]);
	} catch (err: any) {
		console.error("Cosmos DB Connection Error:", err);
		return { success: false, message: err.message || "Failed to connect to Azure Cosmos DB." };
	}
};

export const installCosmosSchema = async (config: CosmosConfig): Promise<{ success: boolean; message: string }> => {
	if (!config.endpoint || !config.key || !config.databaseId) {
		throw new Error("Missing required configuration.");
	}

	const client = new CosmosClient({
		endpoint: config.endpoint,
		key: config.key
	});

	try {
		const databaseId = schema.database.id || config.databaseId;
		const { database } = await client.databases.createIfNotExists({ id: databaseId });
		console.log(`Database '${databaseId}' created or already exists.`);

		for (const containerDef of schema.containers) {
			await database.containers.createIfNotExists({
				id: containerDef.id,
				partitionKey: containerDef.partitionKey,
				indexingPolicy: containerDef.indexingPolicy as any
			});
			console.log(`Container '${containerDef.id}' created or already exists.`);
		}

		return { success: true, message: "Standard schema installed successfully from JSON definition." };
	} catch (err: any) {
		console.error("Cosmos DB Schema Installation Error:", err);
		throw err;
	}
};

export const saveSharedSession = async (config: CosmosConfig, session: any, partitionKey: string): Promise<void> => {
	const client = new CosmosClient({ endpoint: config.endpoint, key: config.key });
	const container = client.database(config.databaseId).container("Conversations");

	const sanitizedSession = {
		...session,
		messages: session.messages?.map((msg: any) => ({
			...msg,
			attachments: msg.attachments?.map((att: any) => ({
				...att,
				base64: "",
				content: (att.content && att.content.length > 30000) ? att.content.substring(0, 30000) + "\n...[Content Truncated for Storage]..." : att.content
			}))
		}))
	};

	const itemToSave = {
		...sanitizedSession,
		id: session.id,
		userId: partitionKey,
		type: 'chat_session'
	};

	await container.items.upsert(itemToSave);
};

export const getSharedSession = async (config: CosmosConfig, sessionId: string, partitionKey: string): Promise<any | null> => {
	const client = new CosmosClient({ endpoint: config.endpoint, key: config.key });
	const container = client.database(config.databaseId).container("Conversations");

	try {
		const { resource } = await container.item(sessionId, partitionKey).read();
		return resource || null;
	} catch (error) {
		console.error("Error fetching shared session:", error);
		return null;
	}
};

export const deleteSharedSession = async (config: CosmosConfig, sessionId: string, partitionKey: string): Promise<void> => {
	const client = new CosmosClient({ endpoint: config.endpoint, key: config.key });
	const container = client.database(config.databaseId).container("Conversations");

	try {
		await container.item(sessionId, partitionKey).delete();
	} catch (error) {
		console.error("Error deleting shared session:", error);
		throw error;
	}
};

export const listSharedSessions = async (config: CosmosConfig, partitionKey: string): Promise<any[]> => {
	const client = new CosmosClient({ endpoint: config.endpoint, key: config.key });
	const container = client.database(config.databaseId).container("Conversations");

	const { resources } = await container.items
		.query({
			query: "SELECT * FROM c WHERE c.userId = @pk AND c.type = 'chat_session'",
			parameters: [{ name: "@pk", value: partitionKey }]
		})
		.fetchAll();

	return resources;
};

export const saveResource = async (config: CosmosConfig, item: any, partitionKey: string, type: 'folder' | 'persona' | 'library_prompt' | 'workflow'): Promise<void> => {
	const client = new CosmosClient({ endpoint: config.endpoint, key: config.key });
	const container = client.database(config.databaseId).container("Resources");

	const itemToSave = {
		...item,
		id: item.id,
		userId: partitionKey,
		type: type
	};

	await container.items.upsert(itemToSave);
};

export const deleteResource = async (config: CosmosConfig, itemId: string, partitionKey: string): Promise<void> => {
	const client = new CosmosClient({ endpoint: config.endpoint, key: config.key });
	const container = client.database(config.databaseId).container("Resources");

	try {
		await container.item(itemId, partitionKey).delete();
	} catch (error) {
		console.error("Error deleting resource:", error);
		throw error;
	}
};

export const listResources = async (config: CosmosConfig, partitionKey: string, type: 'folder' | 'persona' | 'library_prompt' | 'workflow'): Promise<any[]> => {
	const client = new CosmosClient({ endpoint: config.endpoint, key: config.key });
	const container = client.database(config.databaseId).container("Resources");

	const { resources } = await container.items
		.query({
			query: "SELECT * FROM c WHERE c.userId = @pk AND c.type = @type",
			parameters: [
				{ name: "@pk", value: partitionKey },
				{ name: "@type", value: type }
			]
		})
		.fetchAll();

	return resources;
};

export const saveFolder = (config: CosmosConfig, item: any, partitionKey: string) => saveResource(config, item, partitionKey, 'folder');
export const deleteFolder = (config: CosmosConfig, itemId: string, partitionKey: string) => deleteResource(config, itemId, partitionKey);
export const listFolders = (config: CosmosConfig, partitionKey: string) => listResources(config, partitionKey, 'folder');

export const savePersona = (config: CosmosConfig, item: any, partitionKey: string) => saveResource(config, item, partitionKey, 'persona');
export const deletePersona = (config: CosmosConfig, itemId: string, partitionKey: string) => deleteResource(config, itemId, partitionKey);
export const listPersonas = (config: CosmosConfig, partitionKey: string) => listResources(config, partitionKey, 'persona');

export const saveLibraryPrompt = (config: CosmosConfig, item: any, partitionKey: string) => saveResource(config, item, partitionKey, 'library_prompt');
export const deleteLibraryPrompt = (config: CosmosConfig, itemId: string, partitionKey: string) => deleteResource(config, itemId, partitionKey);
export const listLibraryPrompts = (config: CosmosConfig, partitionKey: string) => listResources(config, partitionKey, 'library_prompt');

export const saveWorkflow = (config: CosmosConfig, item: any, partitionKey: string) => saveResource(config, item, partitionKey, 'workflow');
export const deleteWorkflow = (config: CosmosConfig, itemId: string, partitionKey: string) => deleteResource(config, itemId, partitionKey);
export const listWorkflows = (config: CosmosConfig, partitionKey: string) => listResources(config, partitionKey, 'workflow');

export const saveDatabaseSource = async (config: CosmosConfig, item: any, partitionKey: string): Promise<void> => {
	const client = new CosmosClient({ endpoint: config.endpoint, key: config.key });
	const container = client.database(config.databaseId).container("DataSources");

	const itemToSave = {
		...item,
		id: item.id,
		userId: partitionKey,
		sourceType: item.type,
		type: 'database_source'
	};

	await container.items.upsert(itemToSave);
};

export const deleteDatabaseSource = async (config: CosmosConfig, itemId: string, partitionKey: string): Promise<void> => {
	const client = new CosmosClient({ endpoint: config.endpoint, key: config.key });
	const container = client.database(config.databaseId).container("DataSources");

	try {
		await container.item(itemId, partitionKey).delete();
	} catch (error) {
		console.error("Error deleting database source:", error);
		throw error;
	}
};

export const listDatabaseSources = async (config: CosmosConfig, partitionKey: string): Promise<any[]> => {
	const client = new CosmosClient({ endpoint: config.endpoint, key: config.key });
	const container = client.database(config.databaseId).container("DataSources");

	const { resources } = await container.items
		.query({
			query: "SELECT * FROM c WHERE c.userId = @pk AND c.type = 'database_source'",
			parameters: [{ name: "@pk", value: partitionKey }]
		})
		.fetchAll();

	return resources.map(r => ({
		...r,
		type: r.sourceType || r.type
	}));
};

export const getCosmosConfig = (): CosmosConfig => {
	const getEnv = (key: string) => {
		try {
			// @ts-ignore
			return typeof process !== 'undefined' ? process.env[key] : undefined;
		} catch {
			return undefined;
		}
	};

	if (typeof window === 'undefined') return { endpoint: '', key: '', databaseId: '' };

	return {
		endpoint: localStorage.getItem('azure_cosmos_endpoint') || getEnv('AZURE_COSMOS_ENDPOINT') || '',
		key: localStorage.getItem('azure_cosmos_key') || getEnv('AZURE_COSMOS_KEY') || '',
		databaseId: localStorage.getItem('azure_cosmos_db_id') || getEnv('AZURE_COSMOS_DB_ID') || 'ConversationDB'
	};
};
