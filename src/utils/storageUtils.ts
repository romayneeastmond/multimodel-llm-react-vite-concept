import { CosmosConfig } from '../services/cosmosService';

export const getActivePersonaId = (): string | null => {
	if (typeof window === 'undefined') return null;
	return localStorage.getItem('active_persona_id');
};

export const getActiveGroupId = (): string | null => {
	if (typeof window === 'undefined') return null;
	return localStorage.getItem('active_group_id');
};

export const getCosmosConfig = (): CosmosConfig => {
	const getEnv = (key: string) => {
		const value = (process.env as any)[key];
		return typeof value === 'string' ? value : '';
	};

	return {
		endpoint: localStorage.getItem('azure_cosmos_endpoint') || getEnv('AZURE_COSMOS_ENDPOINT') || '',
		key: localStorage.getItem('azure_cosmos_key') || getEnv('AZURE_COSMOS_KEY') || '',
		databaseId: localStorage.getItem('azure_cosmos_db_id') || getEnv('AZURE_COSMOS_DB_ID') || 'ConversationDB'
	};
};

export const getEffectiveUser = (currentUser: string): string | undefined => {
	return currentUser || (typeof window !== 'undefined' ? localStorage.getItem('chat_username') : undefined) || undefined;
};

export const getStoredUsername = (): string | null => {
	if (typeof window === 'undefined') return null;
	return localStorage.getItem('chat_username');
};

export const getUserDisplayName = (): string => {
	if (typeof window === 'undefined') return '';
	return localStorage.getItem('chat_display_name') || localStorage.getItem('chat_username') || '';
};

export const setActiveGroupId = (groupId: string | null) => {
	if (typeof window === 'undefined') return;
	if (groupId) {
		localStorage.setItem('active_group_id', groupId);
	} else {
		localStorage.removeItem('active_group_id');
	}
};

export const setActivePersonaId = (personaId: string | null) => {
	if (typeof window === 'undefined') return;
	if (personaId) {
		localStorage.setItem('active_persona_id', personaId);
	} else {
		localStorage.removeItem('active_persona_id');
	}
};

export const setCosmosConfig = (endpoint: string, key: string, dbId: string) => {
	if (typeof window === 'undefined') return;
	localStorage.setItem('azure_cosmos_endpoint', endpoint);
	localStorage.setItem('azure_cosmos_key', key);
	localStorage.setItem('azure_cosmos_db_id', dbId);
};

export const setUserData = (username: string, displayName?: string) => {
	if (typeof window === 'undefined') return;
	localStorage.setItem('chat_username', username);
	if (displayName) {
		localStorage.setItem('chat_display_name', displayName);
	}
};