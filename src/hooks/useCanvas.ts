import { useState, useCallback } from 'react';
import { marked } from 'marked';
import { CanvasBlock, Message, ModelResponse, ChatSession } from '../types/index';

interface UseCanvasProps {
	messages: Message[];
	currentSessionId: string | null;
	sessions: ChatSession[];
}

export const useCanvas = ({ messages, currentSessionId, sessions }: UseCanvasProps) => {
	const [isCanvasOpen, setIsCanvasOpen] = useState(false);
	const [canvasBlocks, setCanvasBlocks] = useState<CanvasBlock[]>([]);
	const [activeAiBlockId, setActiveAiBlockId] = useState<string | null>(null);

	const addCanvasBlock = useCallback((index: number) => {
		const newBlock: CanvasBlock = { id: Math.random().toString(36).substr(2, 9), content: '', type: 'user' };
		setCanvasBlocks(prev => {
			const newBlocks = [...prev];
			newBlocks.splice(index + 1, 0, newBlock);
			return newBlocks;
		});
	}, []);

	const updateCanvasBlock = useCallback((id: string, newVal: string) => {
		setCanvasBlocks(prev => prev.map(b => b.id === id ? { ...b, content: newVal } : b));
	}, []);

	const moveCanvasBlock = useCallback((index: number, direction: 'up' | 'down') => {
		setCanvasBlocks(prev => {
			const newBlocks = [...prev];
			if (direction === 'up' && index > 0) {
				[newBlocks[index], newBlocks[index - 1]] = [newBlocks[index - 1], newBlocks[index]];
			} else if (direction === 'down' && index < newBlocks.length - 1) {
				[newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
			}
			return newBlocks;
		});
	}, []);

	const removeCanvasBlock = useCallback((id: string) => {
		setCanvasBlocks(prev => prev.filter(b => b.id !== id));
	}, []);

	const closeCanvas = useCallback(() => setIsCanvasOpen(false), []);

	const openCanvas = useCallback(async () => {
		const newBlocks: CanvasBlock[] = [];
		for (const msg of messages) {
			if (msg.role === 'assistant' && msg.responses) {
				for (const resp of Object.values(msg.responses) as ModelResponse[]) {
					if (resp.status === 'success' && resp.text) {
						const renderer = new marked.Renderer();
						renderer.link = (href, title, text) => `<a target="_blank" rel="noopener noreferrer" href="${href}" title="${title || ''}">${text}</a>`;
						const htmlContent = await marked.parse(resp.text, { renderer });
						newBlocks.push({ id: Math.random().toString(36).substr(2, 9), content: htmlContent, type: 'model', sourceModel: resp.model });
					}
				}
			}
		}
		setCanvasBlocks(newBlocks);
		setIsCanvasOpen(true);
	}, [messages]);

	const generateWordDoc = useCallback(() => {
		const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export</title></head><body>`;
		const footer = "</body></html>";
		const bodyContent = canvasBlocks.map(block => `<div style="margin-bottom: 20px;">${block.content}</div>`).join('');
		const sourceHTML = header + bodyContent + footer;
		const blob = new Blob(['\ufeff', sourceHTML], { type: 'application/msword' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `${sessions.find(s => s.id === currentSessionId)?.title || 'Document'}.doc`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}, [canvasBlocks, sessions, currentSessionId]);

	return {
		isCanvasOpen,
		setIsCanvasOpen,
		canvasBlocks,
		setCanvasBlocks,
		activeAiBlockId,
		setActiveAiBlockId,
		addCanvasBlock,
		updateCanvasBlock,
		moveCanvasBlock,
		removeCanvasBlock,
		closeCanvas,
		openCanvas,
		generateWordDoc
	};
};
