import { useState, useMemo } from 'react';
import { LibraryPrompt } from '../types/index';
import { saveLibraryPrompt, deleteLibraryPrompt, getCosmosConfig } from '../services/cosmosService';

interface UsePromptLibraryProps {
	libraryPrompts: LibraryPrompt[];
	setLibraryPrompts: React.Dispatch<React.SetStateAction<LibraryPrompt[]>>;
	currentUser: string;
}

export const usePromptLibrary = ({ libraryPrompts, setLibraryPrompts, currentUser }: UsePromptLibraryProps) => {
	const [isLibraryOpen, setIsLibraryOpen] = useState(false);
	const [searchLibraryQuery, setSearchLibraryQuery] = useState('');
	const [selectedLibraryCategory, setSelectedLibraryCategory] = useState<string | null>(null);
	const [editingLibraryPromptId, setEditingLibraryPromptId] = useState<string | null>(null);
	const [isCreatingLibraryPrompt, setIsCreatingLibraryPrompt] = useState(false);
	const [libraryPromptForm, setLibraryPromptForm] = useState<Partial<LibraryPrompt>>({ title: '', content: '', category: '', multiStepInstruction: '' });
	const [libraryPromptFormToDelete, setLibraryPromptFormToDelete] = useState<string | null>(null);
	const [isPromptQuickViewOpen, setIsPromptQuickViewOpen] = useState(false);
	const [quickPromptSearch, setQuickPromptSearch] = useState('');


	const initiateDeleteLibraryPrompt = (id: string) => {
		const prompt = libraryPrompts.find(p => p.id === id);
		if (prompt?.isDefault) return;
		setLibraryPromptFormToDelete(id);
	};

	const confirmDeleteLibraryPrompt = () => {
		if (libraryPromptFormToDelete) {
			const config = getCosmosConfig();
			if (config.endpoint && config.key && currentUser) {
				deleteLibraryPrompt(config, libraryPromptFormToDelete, currentUser).catch(console.error);
			}
			setLibraryPrompts(prev => prev.filter(p => p.id !== libraryPromptFormToDelete));
			setLibraryPromptFormToDelete(null);
		}
	};

	const handleSaveLibraryPrompt = (e: React.FormEvent) => {
		e.preventDefault();
		if (!libraryPromptForm.title || !libraryPromptForm.content) return;

		let savedPrompt: LibraryPrompt;

		if (editingLibraryPromptId) {
			setLibraryPrompts(prev => prev.map(p => {
				if (p.id === editingLibraryPromptId) {
					savedPrompt = { ...p, ...libraryPromptForm } as LibraryPrompt;
					return savedPrompt;
				}
				return p;
			}).sort((a, b) => a.title.localeCompare(b.title)));
			setEditingLibraryPromptId(null);
		} else {
			savedPrompt = {
				id: Date.now().toString(),
				title: libraryPromptForm.title!,
				content: libraryPromptForm.content!,
				category: libraryPromptForm.category || 'General',
				multiStepInstruction: libraryPromptForm.multiStepInstruction,
				isDefault: false
			};
			setLibraryPrompts(prev => [...prev, savedPrompt].sort((a, b) => a.title.localeCompare(b.title)));
		}

		const config = getCosmosConfig();
		if (config.endpoint && config.key && currentUser) {
			// @ts-ignore
			saveLibraryPrompt(config, savedPrompt, currentUser).catch(console.error);
		}

		setLibraryPromptForm({ title: '', content: '', category: '', multiStepInstruction: '' });
		setIsCreatingLibraryPrompt(false);
	};

	const startEditLibraryPrompt = (prompt: LibraryPrompt) => {
		setEditingLibraryPromptId(prompt.id);
		setIsCreatingLibraryPrompt(false);
		setLibraryPromptForm({ ...prompt });
	};

	const isFavorited = (content: string) => {
		return libraryPrompts.some(p => p.content === content && p.category === 'Favourites');
	};

	const handleToggleFavorite = (content: string) => {
		if (isFavorited(content)) {
			const pToRemove = libraryPrompts.find(p => p.content === content && p.category === 'Favourites');
			if (pToRemove) {
				const config = getCosmosConfig();
				if (config.endpoint && config.key && currentUser) {
					deleteLibraryPrompt(config, pToRemove.id, currentUser).catch(console.error);
				}
				setLibraryPrompts(prev => prev.filter(p => p.id !== pToRemove.id));
			}
		} else {
			const newPrompt: LibraryPrompt = {
				id: Date.now().toString(),
				title: content.length > 30 ? content.slice(0, 30) + '...' : content,
				content: content,
				category: 'Favourites',
				isDefault: false
			};
			setLibraryPrompts(prev => [...prev, newPrompt]);

			const config = getCosmosConfig();
			if (config.endpoint && config.key && currentUser) {
				saveLibraryPrompt(config, newPrompt, currentUser).catch(console.error);
			}
		}
	};

	const libraryCategories = useMemo(() => {
		return Array.from(new Set(libraryPrompts.map(p => p.category))).filter(Boolean);
	}, [libraryPrompts]);

	const filteredLibraryPrompts = useMemo(() => {
		return libraryPrompts.filter(prompt => {
			const matchesSearch = prompt.title.toLowerCase().includes(searchLibraryQuery.toLowerCase()) ||
				prompt.content.toLowerCase().includes(searchLibraryQuery.toLowerCase());
			const matchesCategory = !selectedLibraryCategory || prompt.category === selectedLibraryCategory;
			return matchesSearch && matchesCategory;
		});
	}, [libraryPrompts, searchLibraryQuery, selectedLibraryCategory]);

	return {
		isLibraryOpen,
		setIsLibraryOpen,
		searchLibraryQuery,
		setSearchLibraryQuery,
		selectedLibraryCategory,
		setSelectedLibraryCategory,
		editingLibraryPromptId,
		setEditingLibraryPromptId,
		isCreatingLibraryPrompt,
		setIsCreatingLibraryPrompt,
		libraryPromptForm,
		setLibraryPromptForm,
		libraryPromptFormToDelete,
		setLibraryPromptFormToDelete,
		isPromptQuickViewOpen,
		setIsPromptQuickViewOpen,
		quickPromptSearch,
		setQuickPromptSearch,

		initiateDeleteLibraryPrompt,
		confirmDeleteLibraryPrompt,
		handleSaveLibraryPrompt,
		startEditLibraryPrompt,
		handleToggleFavorite,
		isFavorited,

		libraryCategories,
		filteredLibraryPrompts
	};
};
