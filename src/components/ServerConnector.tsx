import React, { useEffect } from 'react';
import { useMcp } from 'use-mcp/react';
import { MCPTool } from '../types/index';

const ServerConnector = ({ url, name, onToolsLoaded }: { url: string, name: string, onToolsLoaded: (serverId: string, tools: MCPTool[]) => void }) => {
	const { tools, error } = useMcp({
		url,
		debug: true,
		autoRetry: true,
		popupFeatures: 'width=500,height=600,resizable=yes,scrollbars=yes',
		transportType: 'http' as const
	});

	useEffect(() => {
		if (tools) {
			const formattedTools: MCPTool[] = tools.map((t: any) => ({
				id: t.name,
				name: t.name,
				description: t.description || '',
				server: name,
				inputSchema: t.inputSchema
			}));

			onToolsLoaded(name, formattedTools);
		}
	}, [tools, name, onToolsLoaded]);

	useEffect(() => {
		if (error) {
			console.error(`Error connecting to ${name}:`, error);
		}
	}, [error, name]);

	return null;
};

export default ServerConnector;