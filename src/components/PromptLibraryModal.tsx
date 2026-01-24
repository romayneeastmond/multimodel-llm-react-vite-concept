import React from 'react';
import {
	X, Search, Edit2, Plus, PlusCircle, Book, Trash2, ArrowDown, Lock
} from 'lucide-react';
import { LibraryPrompt } from '../types/index';
import DeleteConfirmModal from './DeleteConfirmModal';

interface PromptLibraryModalProps {
	isLibraryOpen: boolean;
	setIsLibraryOpen: (isOpen: boolean) => void;
	libraryPrompts: LibraryPrompt[];
	searchLibraryQuery: string;
	setSearchLibraryQuery: (query: string) => void;
	selectedLibraryCategory: string | null;
	setSelectedLibraryCategory: (category: string | null) => void;
	editingLibraryPromptId: string | null;
	setEditingLibraryPromptId: (id: string | null) => void;
	isCreatingLibraryPrompt: boolean;
	setIsCreatingLibraryPrompt: (isCreating: boolean) => void;
	libraryPromptForm: Partial<LibraryPrompt>;
	setLibraryPromptForm: React.Dispatch<React.SetStateAction<Partial<LibraryPrompt>>>;
	libraryPromptFormToDelete: string | null;
	setLibraryPromptFormToDelete: (id: string | null) => void;

	initiateDeleteLibraryPrompt: (id: string) => void;
	confirmDeleteLibraryPrompt: () => void;
	handleSaveLibraryPrompt: (e: React.FormEvent) => void;
	startEditLibraryPrompt: (prompt: LibraryPrompt) => void;

	libraryCategories: string[];
	filteredLibraryPrompts: LibraryPrompt[];

	onUsePrompt: (prompt: LibraryPrompt) => void;
}

const PromptLibraryModal = ({
	isLibraryOpen,
	setIsLibraryOpen,
	libraryPrompts,
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
	initiateDeleteLibraryPrompt,
	confirmDeleteLibraryPrompt,
	handleSaveLibraryPrompt,
	startEditLibraryPrompt,
	libraryCategories,
	filteredLibraryPrompts,
	onUsePrompt
}: PromptLibraryModalProps) => {

	if (!isLibraryOpen) return null;

	return (
		<>
			<div className="fixed inset-0 z-[80] bg-app flex flex-col animate-in zoom-in-95 duration-200">
				<div className="flex items-center justify-between px-6 py-4 border-b border-border bg-panel shadow-sm shrink-0">
					<div className="flex items-center gap-3">
						<Book className="w-6 h-6 text-accent" />
						<div>
							<h2 className="text-sm font-bold tracking-tight">Prompt Library</h2>
							<p className="text-[10px] text-secondary">Manage and use saved prompts</p>
						</div>
					</div>
					<button
						onClick={() => {
							setIsLibraryOpen(false);
							setEditingLibraryPromptId(null);
							setIsCreatingLibraryPrompt(false);
							setLibraryPromptForm({ title: '', content: '', category: '', multiStepInstruction: '' });
						}}
						className="p-2 hover:bg-card-hover rounded-xl transition-all hover:rotate-90 hover:scale-110"
					>
						<X className="w-6 h-6" />
					</button>
				</div>
				<div className="flex-1 flex overflow-hidden">
					<div className="w-64 border-r border-border bg-panel overflow-y-auto p-4 hidden md:block">
						<h3 className="text-xs font-bold text-secondary uppercase mb-3 px-2">Categories</h3>
						<div className="space-y-1">
							<button
								onClick={() => setSelectedLibraryCategory(null)}
								className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between ${!selectedLibraryCategory ? 'bg-accent/10 text-accent' : 'text-primary hover:bg-card-hover'}`}
							>
								All Prompts
								<span className="text-xs opacity-60">{libraryPrompts.length}</span>
							</button>
							{libraryCategories.map(cat => (
								<button
									key={cat}
									onClick={() => setSelectedLibraryCategory(cat)}
									className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between ${selectedLibraryCategory === cat ? 'bg-accent/10 text-accent' : 'text-primary hover:bg-card-hover'}`}
								>
									{cat}
									<span className="text-xs opacity-60">{libraryPrompts.filter(p => p.category === cat).length}</span>
								</button>
							))}
						</div>
					</div>
					<div className="flex-1 overflow-y-auto p-6 md:p-8 bg-app/50">
						<div className="max-w-5xl mx-auto">
							<div className="flex flex-col md:flex-row gap-4 mb-8">
								<div className="relative flex-1">
									<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
									<input type="text" placeholder="Search library..." value={searchLibraryQuery} onChange={(e) => setSearchLibraryQuery(e.target.value)} className="w-full bg-card border border-border rounded-xl pl-10 pr-9 py-3 text-sm outline-none focus:ring-2 ring-accent/20 transition-all shadow-sm" />
									{searchLibraryQuery && <button onClick={() => setSearchLibraryQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-secondary hover:text-primary rounded-full hover:bg-card-hover"><X className="w-3 h-3" /></button>}
								</div>
							</div>
							{(editingLibraryPromptId || isCreatingLibraryPrompt) && (
								<div className="mb-8 bg-card border border-border rounded-xl p-6 shadow-sm animate-in fade-in slide-in-from-top-4">
									<h3 className="text-sm font-bold mb-6 flex items-center gap-2 tracking-tight">{editingLibraryPromptId ? <><Edit2 className="w-4 h-4 text-accent" /> Edit Prompt</> : <><Plus className="w-4 h-4 text-accent" /> Create New Prompt</>}</h3>
									<form onSubmit={handleSaveLibraryPrompt} className="space-y-5">
										<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
											<div>
												<label className="block text-xs font-bold text-secondary mb-2 uppercase tracking-widest">Title</label>
												<input
													type="text"
													value={libraryPromptForm.title}
													onChange={(e) => setLibraryPromptForm({ ...libraryPromptForm, title: e.target.value })}
													placeholder="e.g. Code Review"
													className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-accent/20 transition-all"
													required
												/>
											</div>
											<div>
												<label className="block text-xs font-bold text-secondary mb-2 uppercase tracking-widest">Category</label>
												<input
													type="text"
													value={libraryPromptForm.category}
													onChange={(e) => setLibraryPromptForm({ ...libraryPromptForm, category: e.target.value })}
													placeholder="e.g. Coding"
													className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-accent/20 transition-all"
												/>
											</div>
										</div>
										<div>
											<label className="block text-xs font-bold text-secondary mb-2 uppercase tracking-widest">Prompt Content</label>
											<p className="text-[11px] text-secondary mb-2">This content will be inserted into your input box.</p>
											<textarea
												value={libraryPromptForm.content}
												onChange={(e) => setLibraryPromptForm({ ...libraryPromptForm, content: e.target.value })}
												placeholder="Write the full prompt here..."
												rows={5}
												className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 ring-accent/20 transition-all resize-y font-mono"
												required
											/>
										</div>
										<div>
											<label className="block text-xs font-bold text-secondary mb-2 uppercase tracking-widest">Multi-step Instruction (Optional)</label>
											<p className="text-[11px] text-secondary mb-2">If set, ask the user for specific input before starting the chat.</p>
											<input
												type="text"
												value={libraryPromptForm.multiStepInstruction}
												onChange={(e) => setLibraryPromptForm({ ...libraryPromptForm, multiStepInstruction: e.target.value })}
												placeholder="e.g. Please paste the code you want reviewed."
												className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-accent/20 transition-all"
											/>
										</div>
										<div className="flex justify-end gap-3 pt-2">
											<button
												type="button"
												onClick={() => {
													setEditingLibraryPromptId(null);
													setIsCreatingLibraryPrompt(false);
													setLibraryPromptForm({ title: '', content: '', category: '', multiStepInstruction: '' });
												}}
												className="px-5 py-2.5 text-xs font-bold border border-border rounded-xl hover:bg-card-hover transition-colors"
											>
												Cancel
											</button>
											<button
												type="submit"
												className="px-6 py-2.5 text-xs font-bold bg-accent text-white rounded-xl shadow-lg shadow-accent/20 hover:opacity-90 active:scale-95 transition-all"
											>
												Save Prompt
											</button>
										</div>
									</form>
								</div>
							)}
							{!editingLibraryPromptId && !isCreatingLibraryPrompt && (
								<button
									onClick={() => {
										setIsCreatingLibraryPrompt(true);
										setLibraryPromptForm({ title: '', content: '', category: '', multiStepInstruction: '' });
									}}
									className="w-full py-3 mb-6 border border-dashed border-border rounded-xl text-secondary hover:text-primary hover:bg-card-hover hover:border-accent/50 transition-all flex items-center justify-center gap-2 text-sm font-medium"
								>
									<PlusCircle className="w-4 h-4" />
									Add New Prompt to Library
								</button>
							)}
							{filteredLibraryPrompts.length === 0 ? <div className="text-center py-12 opacity-60"><Book className="w-12 h-12 mx-auto mb-3 text-secondary" /><p className="text-sm font-medium">No prompts found</p></div> : (
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
									{filteredLibraryPrompts.map(prompt => (
										<div key={prompt.id} className="group bg-card border border-border rounded-xl p-5 hover:border-accent/50 hover:shadow-lg transition-all flex flex-col h-full relative">
											<div className="flex items-start justify-between mb-3"><span className="py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-accent/10 text-accent">{prompt.category || 'General'}</span><div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">{!prompt.isDefault ? <><button onClick={() => startEditLibraryPrompt(prompt)} className="p-1.5 text-secondary hover:text-primary rounded-lg hover:bg-card-hover"><Edit2 className="w-3.5 h-3.5" /></button><button onClick={() => initiateDeleteLibraryPrompt(prompt.id)} className="p-1.5 text-secondary hover:text-red-400 rounded-lg hover:bg-card-hover"><Trash2 className="w-3.5 h-3.5" /></button></> : <div title="Default prompts cannot be deleted" className="p-1.5 text-secondary opacity-50 cursor-not-allowed"><Lock className="w-3.5 h-3.5" /></div>}</div></div>
											<h3 className="font-bold text-sm mb-2 truncate" title={prompt.title}>{prompt.title}</h3>
											<div className="text-xs text-secondary line-clamp-3 mb-4 flex-1 font-mono bg-panel p-2 rounded border border-border/50 select-none">{prompt.content}</div>
											<button onClick={() => onUsePrompt(prompt)} className="w-full mt-auto flex items-center justify-center gap-2 bg-accent/10 text-accent hover:bg-accent hover:text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm border border-transparent">Use Prompt <ArrowDown className="w-3 h-3" /></button>
										</div>
									))}
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			<DeleteConfirmModal
				isOpen={!!libraryPromptFormToDelete}
				title="Delete Prompt?"
				message="This saved prompt will be permanently removed from your library."
				onCancel={() => setLibraryPromptFormToDelete(null)}
				onConfirm={confirmDeleteLibraryPrompt}
			/>
		</>
	);
};

export default PromptLibraryModal;
