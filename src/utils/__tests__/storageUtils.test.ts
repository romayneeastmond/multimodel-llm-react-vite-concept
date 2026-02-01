import { describe, it, expect, beforeEach } from 'vitest';
import {
	getCosmosConfig,
	getEffectiveUser,
	getUserDisplayName,
	setUserData,
	getStoredUsername,
	setActiveGroupId,
	getActiveGroupId,
	setActivePersonaId,
	getActivePersonaId,
	setCosmosConfig,
} from '../storageUtils';

describe('storageUtils', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	describe('getCosmosConfig', () => {
		it('should return config from localStorage', () => {
			localStorage.setItem('azure_cosmos_endpoint', 'https://test.documents.azure.com');
			localStorage.setItem('azure_cosmos_key', 'test-key-12345');
			localStorage.setItem('azure_cosmos_db_id', 'TestDB');

			const config = getCosmosConfig();

			expect(config).toEqual({
				endpoint: 'https://test.documents.azure.com',
				key: 'test-key-12345',
				databaseId: 'TestDB',
			});
		});

		it('should use default databaseId when not set', () => {
			localStorage.setItem('azure_cosmos_endpoint', 'https://test.documents.azure.com');
			localStorage.setItem('azure_cosmos_key', 'test-key');

			const config = getCosmosConfig();

			expect(config.databaseId).toBe('ConversationDB');
		});

		it('should return empty strings when nothing is configured', () => {
			const config = getCosmosConfig();

			expect(config).toEqual({
				endpoint: '',
				key: '',
				databaseId: 'ConversationDB',
			});
		});

		it('should prefer localStorage over environment variables', () => {
			process.env.AZURE_COSMOS_ENDPOINT = 'https://env.documents.azure.com';
			localStorage.setItem('azure_cosmos_endpoint', 'https://local.documents.azure.com');

			const config = getCosmosConfig();

			expect(config.endpoint).toBe('https://local.documents.azure.com');
		});
	});

	describe('getEffectiveUser', () => {
		it('should return currentUser when provided', () => {
			expect(getEffectiveUser('testUser')).toBe('testUser');
		});

		it('should fall back to localStorage username when currentUser is empty', () => {
			localStorage.setItem('chat_username', 'storedUser');
			expect(getEffectiveUser('')).toBe('storedUser');
		});

		it('should return undefined when no user found', () => {
			expect(getEffectiveUser('')).toBeUndefined();
		});

		it('should prioritize currentUser over localStorage', () => {
			localStorage.setItem('chat_username', 'storedUser');
			expect(getEffectiveUser('providedUser')).toBe('providedUser');
		});
	});

	describe('getUserDisplayName', () => {
		it('should return display name from localStorage', () => {
			localStorage.setItem('chat_display_name', 'John Doe');
			expect(getUserDisplayName()).toBe('John Doe');
		});

		it('should fall back to username when display name not set', () => {
			localStorage.setItem('chat_username', 'johndoe');
			expect(getUserDisplayName()).toBe('johndoe');
		});

		it('should return empty string when nothing is set', () => {
			expect(getUserDisplayName()).toBe('');
		});

		it('should prefer display name over username', () => {
			localStorage.setItem('chat_username', 'johndoe');
			localStorage.setItem('chat_display_name', 'John Doe');
			expect(getUserDisplayName()).toBe('John Doe');
		});
	});

	describe('setUserData', () => {
		it('should set username in localStorage', () => {
			setUserData('newUser');
			expect(localStorage.getItem('chat_username')).toBe('newUser');
		});

		it('should set both username and displayName', () => {
			setUserData('newUser', 'New User Display');
			expect(localStorage.getItem('chat_username')).toBe('newUser');
			expect(localStorage.getItem('chat_display_name')).toBe('New User Display');
		});

		it('should not set display name when not provided', () => {
			setUserData('newUser');
			expect(localStorage.getItem('chat_display_name')).toBeNull();
		});

		it('should update existing user data', () => {
			setUserData('user1', 'User One');
			setUserData('user2', 'User Two');
			expect(localStorage.getItem('chat_username')).toBe('user2');
			expect(localStorage.getItem('chat_display_name')).toBe('User Two');
		});
	});

	describe('getStoredUsername', () => {
		it('should return username from localStorage', () => {
			localStorage.setItem('chat_username', 'testuser');
			expect(getStoredUsername()).toBe('testuser');
		});

		it('should return null when not set', () => {
			expect(getStoredUsername()).toBeNull();
		});
	});

	describe('getActiveGroupId', () => {
		it('should return group ID from localStorage', () => {
			localStorage.setItem('active_group_id', 'group-123');
			expect(getActiveGroupId()).toBe('group-123');
		});

		it('should return null when not set', () => {
			expect(getActiveGroupId()).toBeNull();
		});
	});

	describe('setActiveGroupId', () => {
		it('should set group ID in localStorage', () => {
			setActiveGroupId('group-456');
			expect(localStorage.getItem('active_group_id')).toBe('group-456');
		});

		it('should remove group ID when null is passed', () => {
			localStorage.setItem('active_group_id', 'group-456');
			setActiveGroupId(null);
			expect(localStorage.getItem('active_group_id')).toBeNull();
		});

		it('should update existing group ID', () => {
			setActiveGroupId('group-1');
			setActiveGroupId('group-2');
			expect(localStorage.getItem('active_group_id')).toBe('group-2');
		});
	});

	describe('getActivePersonaId', () => {
		it('should return persona ID from localStorage', () => {
			localStorage.setItem('active_persona_id', 'persona-789');
			expect(getActivePersonaId()).toBe('persona-789');
		});

		it('should return null when not set', () => {
			expect(getActivePersonaId()).toBeNull();
		});
	});

	describe('setActivePersonaId', () => {
		it('should set persona ID in localStorage', () => {
			setActivePersonaId('persona-abc');
			expect(localStorage.getItem('active_persona_id')).toBe('persona-abc');
		});

		it('should remove persona ID when null is passed', () => {
			localStorage.setItem('active_persona_id', 'persona-abc');
			setActivePersonaId(null);
			expect(localStorage.getItem('active_persona_id')).toBeNull();
		});

		it('should update existing persona ID', () => {
			setActivePersonaId('persona-1');
			setActivePersonaId('persona-2');
			expect(localStorage.getItem('active_persona_id')).toBe('persona-2');
		});
	});

	describe('setCosmosConfig', () => {
		it('should set all Cosmos DB configuration in localStorage', () => {
			setCosmosConfig('https://test.documents.azure.com', 'test-key', 'TestDB');

			expect(localStorage.getItem('azure_cosmos_endpoint')).toBe('https://test.documents.azure.com');
			expect(localStorage.getItem('azure_cosmos_key')).toBe('test-key');
			expect(localStorage.getItem('azure_cosmos_db_id')).toBe('TestDB');
		});

		it('should update existing config', () => {
			setCosmosConfig('https://old.documents.azure.com', 'old-key', 'OldDB');
			setCosmosConfig('https://new.documents.azure.com', 'new-key', 'NewDB');

			expect(localStorage.getItem('azure_cosmos_endpoint')).toBe('https://new.documents.azure.com');
			expect(localStorage.getItem('azure_cosmos_key')).toBe('new-key');
			expect(localStorage.getItem('azure_cosmos_db_id')).toBe('NewDB');
		});
	});
});
