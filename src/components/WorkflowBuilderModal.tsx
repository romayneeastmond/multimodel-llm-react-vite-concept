import React, { useState } from 'react';
import { X, ArrowUp, ArrowDown, Trash2, MessageSquare, FileUp, UserCircle, Cpu, Database, Sparkles, LinkIcon, FileOutput, ChevronDown, Book, Search, Check, Layers, Play, Edit2, Plus, Workflow as WorkflowIcon, Lock } from 'lucide-react';
import { Workflow, WorkflowStep, MultiModel, Persona, MCPTool, LibraryPrompt, DatabaseSource, WorkflowStepType } from '../types/index';
import { AVAILABLE_MODELS } from '../config/constants';

interface WorkflowBuilderModalProps {
	isOpen: boolean;
	onClose: () => void;
	workflowForm: Partial<Workflow>;
	setWorkflowForm: React.Dispatch<React.SetStateAction<Partial<Workflow>>>;
	editingWorkflowId: string | null;
	setEditingWorkflowId: (id: string | null) => void;
	handleSaveWorkflow: (e: React.FormEvent) => void;
	isCreatingWorkflow: boolean;
	setIsCreatingWorkflow: (isCreating: boolean) => void;
	addWorkflowStep: (type: WorkflowStepType) => void;
	updateWorkflowStep: (stepId: string, updates: Partial<WorkflowStep>) => void;
	removeWorkflowStep: (stepId: string) => void;
	moveWorkflowStep: (index: number, direction: 'up' | 'down') => void;
	personas: Persona[];
	serverTools: Record<string, MCPTool[]>;
	databaseSources: DatabaseSource[];
	libraryPrompts: LibraryPrompt[];
	workflows: Workflow[];
	handleStartEditingWorkflow: (workflow: Workflow) => void;
	setWorkflowToDelete: (id: string | null) => void;
	playWorkflow: (workflow: Workflow) => void;
	allowSystemDelete?: boolean;
}

const WorkflowBuilderModal = ({
	isOpen,
	onClose,
	workflowForm,
	setWorkflowForm,
	editingWorkflowId,
	setEditingWorkflowId,
	handleSaveWorkflow,
	isCreatingWorkflow,
	setIsCreatingWorkflow,
	addWorkflowStep,
	updateWorkflowStep,
	removeWorkflowStep,
	moveWorkflowStep,
	personas,
	serverTools,
	databaseSources,
	libraryPrompts,
	workflows,
	handleStartEditingWorkflow,
	setWorkflowToDelete,
	playWorkflow,
	allowSystemDelete
}: WorkflowBuilderModalProps) => {
	const [activePromptSearchStepId, setActivePromptSearchStepId] = useState<string | null>(null);
	const [promptLibrarySearchQuery, setPromptLibrarySearchQuery] = useState('');

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-[60] bg-app flex flex-col animate-in zoom-in-95 duration-200">
			<div className="flex items-center justify-between px-6 py-4 border-b border-border bg-panel shadow-sm shrink-0">
				<div className="flex items-center gap-3">
					<WorkflowIcon className="w-6 h-6 text-accent" />
					<div>
						<h2 className="text-sm font-bold tracking-tight">Workflow Builder</h2>
						<p className="text-[10px] text-secondary">Design automated multi-step sequences</p>
					</div>
				</div>
				<button
					onClick={() => {
						onClose();
						setIsCreatingWorkflow(false);
						setEditingWorkflowId(null);
						setWorkflowForm({ name: '', description: '', steps: [] });
					}}
					className="p-2 hover:bg-card-hover rounded-xl transition-all hover:rotate-90 hover:scale-110"
				>
					<X className="w-6 h-6" />
				</button>
			</div>
			<div className="flex-1 flex overflow-hidden">
				{!isCreatingWorkflow && !editingWorkflowId && (
					<div className="flex-1 overflow-y-auto p-6 md:p-10 bg-app/50">
						<div className="max-w-4xl mx-auto">
							<div className="flex items-center justify-between mb-8">
								<h3 className="text-sm font-bold tracking-tight">Your Workflows</h3>
								<button
									onClick={() => setIsCreatingWorkflow(true)}
									className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-accent/20 hover:opacity-90 active:scale-95 transition-all"
								>
									<Plus className="w-4 h-4" />
									Create Workflow
								</button>
							</div>
							{workflows.length === 0 ? (
								<div className="text-center py-20 bg-card border border-dashed border-border rounded-2xl">
									<Layers className="w-12 h-12 text-secondary/30 mx-auto mb-4" />
									<h3 className="text-lg font-medium text-primary mb-2">No Workflows Yet</h3>
									<p className="text-sm text-secondary max-w-sm mx-auto mb-6">Create complex sequences of prompts, tool calls, and file operations to automate your repetitive tasks.</p>
									<button onClick={() => setIsCreatingWorkflow(true)} className="text-accent font-bold text-sm hover:underline">Get started by creating your first workflow</button>
								</div>
							) : (
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									{[...workflows].sort((a, b) => a.name.localeCompare(b.name)).map(wf => (
										<div key={wf.id} className="group bg-card border border-border rounded-2xl p-6 hover:shadow-xl transition-all relative flex flex-col h-full">
											<div className="flex justify-between items-center mb-4 min-w-0">
												<div className="flex items-center gap-3 min-w-0">
													<div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent shrink-0">
														<WorkflowIcon className="w-5 h-5" />
													</div>
													<h3 className="text-lg font-bold truncate">{wf.name}</h3>
												</div>
												<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">

													{(wf.userId === 'System' && !allowSystemDelete) ? (
														<div title="System workflows cannot be deleted" className="p-2 text-secondary opacity-50 cursor-not-allowed">
															<Lock className="w-4 h-4" />
														</div>
													) : (
														<>
															<button
																onClick={() => handleStartEditingWorkflow(wf)}
																className="p-2 text-secondary hover:text-primary rounded-lg hover:bg-card-hover"
															>
																<Edit2 className="w-4 h-4" />
															</button>

															<button
																onClick={() => setWorkflowToDelete(wf.id)}
																className="p-2 text-secondary hover:text-red-400 rounded-lg hover:bg-card-hover"
															>
																<Trash2 className="w-4 h-4" />
															</button>
														</>
													)}
												</div>
											</div>
											<p className="text-sm text-secondary line-clamp-2 mb-6 flex-1">{wf.description}</p>
											<div className="flex items-center justify-between mt-auto">
												<span className="text-xs text-secondary font-medium bg-panel px-2.5 py-1 rounded-lg border border-border">
													{wf.steps.length} {wf.steps.length === 1 ? 'Step' : 'Steps'}
												</span>
												<button
													onClick={() => playWorkflow(wf)}
													className="flex items-center justify-center gap-2 bg-accent/10 text-accent hover:bg-accent hover:text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm border border-transparent"
												>
													<Play className="w-3.5 h-3.5 fill-current" />
													Run Workflow
												</button>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					</div>
				)}
				{(isCreatingWorkflow || editingWorkflowId) && (
					<div className="flex-1 flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in-95">
						<div className="w-full md:w-80 border-r border-border bg-panel flex flex-col">
							<div className="p-4 border-b border-border">
								<h3 className="text-xs font-bold text-secondary uppercase tracking-widest mb-4">Steps Hierarchy</h3>
								<div className="space-y-2">
									{(workflowForm.steps || []).map((step, idx) => (
										<div
											key={step.id}
											className="flex items-center gap-2 p-3 bg-card border border-border rounded-xl group relative hover:border-accent/50 transition-all"
										>
											<div className="w-6 h-6 shrink-0 bg-accent/10 rounded-lg flex items-center justify-center text-accent text-[10px] font-bold">
												{idx + 1}
											</div>
											<div className="flex-1 min-w-0">
												<p className="text-xs font-bold truncate">
													{step.type === 'prompt' ? 'Model Prompt' :
														step.type === 'file_upload' ? 'File Request' :
															step.type === 'mcp_tool' ? 'MCP Tools' :
																step.type === 'persona' ? 'System Persona' :
																	step.type === 'database_search' ? 'Database Search' :
																		step.type === 'vector_search' ? 'Vector Search' :
																			step.type === 'web_scraper' ? 'Web Scraper' : 'Result Export'}
												</p>
												<p className="text-[10px] text-secondary truncate">
													{step.prompt || step.fileRequirement || step.exportFormat ||
														(step.type === 'persona' ? (personas.find(p => p.id === step.personaId)?.name || 'Default Persona') :
															(step.type === 'database_search' || step.type === 'vector_search') ? (`Search: ${databaseSources.find(db => db.id === step.databaseId)?.name || 'Unknown'}`) :
																step.type === 'web_scraper' ? (step.url || 'Dynamic Scraper') : 'Configure step...')}
												</p>
											</div>
											<div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
												<button
													onClick={() => moveWorkflowStep(idx, 'up')}
													disabled={idx === 0}
													className="p-0.5 disabled:opacity-20 hover:bg-card-hover rounded"
												>
													<ArrowUp className="w-3 h-3" />
												</button>
												<button
													onClick={() => moveWorkflowStep(idx, 'down')}
													disabled={idx === (workflowForm.steps?.length || 1) - 1}
													className="p-0.5 disabled:opacity-20 hover:bg-card-hover rounded"
												>
													<ArrowDown className="w-3 h-3" />
												</button>
											</div>
											<button
												onClick={() => removeWorkflowStep(step.id)}
												className="absolute -top-2.5 -right-2.5 p-1 bg-gray-200 text-gray-400 rounded-full opacity-0 group-hover:opacity-100 shadow-lg hover:bg-gray-300 hover:text-gray-600 dark:bg-gray-900 dark:hover:bg-gray-800 dark:hover:text-white"
											>
												<Trash2 className="w-4 h-4" />
											</button>
										</div>
									))}
								</div>
								<div className="pt-4"><p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-2 text-center">Add Step</p>
									<div className="grid grid-cols-2 gap-2">
										<button onClick={() => addWorkflowStep('prompt')} className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-dashed border-border hover:bg-card-hover text-secondary hover:text-accent transition-all">
											<MessageSquare className="w-4 h-4" />
											<span className="text-[10px] font-bold">Prompt</span>
										</button>
										<button onClick={() => addWorkflowStep('file_upload')} className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-dashed border-border hover:bg-card-hover text-secondary hover:text-accent transition-all">
											<FileUp className="w-4 h-4" />
											<span className="text-[10px] font-bold">Files</span>
										</button>
										<button onClick={() => addWorkflowStep('persona')} className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-dashed border-border hover:bg-card-hover text-secondary hover:text-accent transition-all">
											<UserCircle className="w-4 h-4" />
											<span className="text-[10px] font-bold">Persona</span>
										</button>
										<button onClick={() => addWorkflowStep('mcp_tool')} className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-dashed border-border hover:bg-card-hover text-secondary hover:text-accent transition-all">
											<Cpu className="w-4 h-4" />
											<span className="text-[10px] font-bold">Tools</span>
										</button>
										<button onClick={() => addWorkflowStep('database_search')} className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-dashed border-border hover:bg-card-hover text-secondary hover:text-accent transition-all">
											<Database className="w-4 h-4" />
											<span className="text-[10px] font-bold">Search</span>
										</button>
										<button onClick={() => addWorkflowStep('vector_search')} className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-dashed border-border hover:bg-card-hover text-secondary hover:text-accent transition-all">
											<Sparkles className="w-4 h-4" />
											<span className="text-[10px] font-bold">Vector</span>
										</button>
										<button onClick={() => addWorkflowStep('web_scraper')} className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-dashed border-border hover:bg-card-hover text-secondary hover:text-accent transition-all">
											<LinkIcon className="w-4 h-4" />
											<span className="text-[10px] font-bold">Scraper</span>
										</button>
										<button onClick={() => addWorkflowStep('export')} className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-dashed border-border hover:bg-card-hover text-secondary hover:text-accent transition-all">
											<FileOutput className="w-4 h-4" />
											<span className="text-[10px] font-bold">Export</span>
										</button>
									</div>
								</div>
							</div>
							<div className="mt-auto p-4 border-t border-border bg-card/50">
								<button
									onClick={handleSaveWorkflow}
									className="w-full bg-accent text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-accent/20 hover:opacity-90 active:scale-95 transition-all"
								>
									{editingWorkflowId ? 'Update Workflow' : 'Save Workflow'}
								</button>
								<button
									onClick={() => {
										setIsCreatingWorkflow(false);
										setEditingWorkflowId(null);
									}}
									className="w-full mt-2 text-secondary hover:text-primary text-xs font-bold py-2"
								>
									Discard Changes
								</button>
							</div>
						</div>
						<div className="flex-1 overflow-y-auto p-6 md:p-10 bg-app/50">
							<div className="max-w-2xl mx-auto space-y-8">
								<div className="space-y-4">
									<h3 className="text-sm font-bold tracking-tight">General Information</h3>
									<div className="grid grid-cols-1 gap-4">
										<div>
											<label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5">Workflow Name</label>
											<input
												type="text"
												value={workflowForm.name}
												onChange={(e) => setWorkflowForm({ ...workflowForm, name: e.target.value })}
												placeholder="e.g. Automated Code Auditor"
												className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 ring-accent/20 transition-all shadow-sm"
											/>
										</div>
										<div>
											<label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5">Description</label>
											<textarea
												value={workflowForm.description}
												onChange={(e) => setWorkflowForm({ ...workflowForm, description: e.target.value })}
												placeholder="Briefly describe what this workflow accomplishes..."
												rows={2}
												className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 ring-accent/20 transition-all resize-none shadow-sm"
											/>
										</div>
									</div>
								</div>
								<div className="space-y-6"><h3 className="text-sm font-bold tracking-tight">Step Configurations</h3>
									{(workflowForm.steps || []).length === 0 ? <div className="p-10 border border-dashed border-border rounded-2xl text-center"><p className="text-sm text-secondary">Add your first step from the sidebar to begin building the logic.</p></div> : (workflowForm.steps || []).map((step, idx) => (
										<div key={step.id} className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4 animate-in slide-in-from-left-4 duration-300">
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-3">
													<div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center text-accent font-bold text-sm">
														{idx + 1}
													</div>
													<h3 className="font-bold text-base tracking-tight">
														{step.type === 'prompt' && 'Create Prompt'}
														{step.type === 'file_upload' && 'Accept File Upload'}
														{step.type === 'mcp_tool' && 'MCP Tool Integration'}
														{step.type === 'persona' && 'Switch System Persona'}
														{step.type === 'database_search' && 'Database Search'}
														{step.type === 'vector_search' && 'Hybrid Vector Search'}
														{step.type === 'export' && 'Export Results'}
														{step.type === 'web_scraper' && 'Website Scraper'}
													</h3>
												</div>
												<div className="flex items-center gap-1">
													<button
														onClick={() => moveWorkflowStep(idx, 'up')}
														disabled={idx === 0}
														className="p-2 text-secondary hover:text-primary disabled:opacity-20 rounded-lg hover:bg-card-hover transition-colors"
														title="Move Step Up"
													>
														<ArrowUp className="w-4 h-4" />
													</button>
													<button
														onClick={() => moveWorkflowStep(idx, 'down')}
														disabled={idx === (workflowForm.steps?.length || 0) - 1}
														className="p-2 text-secondary hover:text-primary disabled:opacity-20 rounded-lg hover:bg-card-hover transition-colors"
														title="Move Step Down"
													>
														<ArrowDown className="w-4 h-4" />
													</button>
													<div className="w-px h-4 bg-border mx-1"></div>
													<button
														onClick={() => removeWorkflowStep(step.id)}
														className="p-2 text-secondary hover:text-red-400 rounded-lg hover:bg-card-hover transition-colors"
														title="Delete Step"
													>
														<Trash2 className="w-4 h-4" />
													</button>
												</div>
											</div>
											{step.type === 'prompt' && (
												<div className="space-y-4">
													<div className="relative">
														<label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5">Select Model</label>
														<select
															value={step.model}
															onChange={(e) => updateWorkflowStep(step.id, { model: e.target.value as MultiModel })}
															className="w-full appearance-none bg-panel border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 ring-accent/20 shadow-sm"
														>
															{AVAILABLE_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
														</select>
														<ChevronDown className="absolute right-4 bottom-3.5 w-4 h-4 text-secondary pointer-events-none" />
													</div>
													<div>
														<div className="flex items-center justify-between mb-1.5">
															<label className="block text-[10px] font-bold text-secondary uppercase tracking-widest">Prompt Template</label>
															<button
																onClick={() => {
																	setActivePromptSearchStepId(activePromptSearchStepId === step.id ? null : step.id);
																	setPromptLibrarySearchQuery('');
																}}
																className="text-[10px] font-bold text-accent hover:underline flex items-center gap-1"
															>
																<Book className="w-3 h-3" /> Load from Library
															</button>
														</div>
														{activePromptSearchStepId === step.id && (
															<div className="mb-3 bg-panel border border-border rounded-xl overflow-hidden animate-in slide-in-from-top-2 duration-200 shadow-lg relative z-10">
																<div className="p-3 border-b border-border flex items-center gap-2">
																	<Search className="w-4 h-4 text-secondary" />
																	<input
																		autoFocus
																		type="text"
																		value={promptLibrarySearchQuery}
																		onChange={(e) => setPromptLibrarySearchQuery(e.target.value)}
																		placeholder="Search library prompts..."
																		className="flex-1 bg-transparent text-xs outline-none placeholder:text-secondary"
																	/>
																	<button onClick={() => setActivePromptSearchStepId(null)} className="p-1 hover:bg-card-hover rounded-lg text-secondary">
																		<X className="w-3 h-3" />
																	</button>
																</div>
																<div className="max-h-40 overflow-y-auto custom-scrollbar">
																	{libraryPrompts
																		.filter(p => !promptLibrarySearchQuery || p.title.toLowerCase().includes(promptLibrarySearchQuery.toLowerCase()) || p.content.toLowerCase().includes(promptLibrarySearchQuery.toLowerCase()))
																		.map(p => (
																			<button
																				key={p.id}
																				onClick={() => {
																					updateWorkflowStep(step.id, { prompt: p.content, multiStepInstruction: p.multiStepInstruction || step.multiStepInstruction });
																					setActivePromptSearchStepId(null);
																				}}
																				className="w-full text-left px-4 py-2.5 text-xs hover:bg-card-hover border-b border-border/50 last:border-0 transition-colors group"
																			>
																				<div className="font-bold text-primary group-hover:text-accent truncate">{p.title}</div>
																				<div className="text-[10px] text-secondary truncate">{p.content}</div>
																			</button>
																		))}
																</div>
															</div>
														)}
														<textarea
															value={step.prompt}
															onChange={(e) => updateWorkflowStep(step.id, { prompt: e.target.value })}
															placeholder="Enter the prompt that should be executed at this step..."
															rows={4}
															className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 ring-accent/20 resize-none shadow-sm font-mono"
														/>
													</div>
													<div>
														<label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5">Multi-step Instruction (Optional)</label>
														<input
															type="text"
															value={step.multiStepInstruction || ''}
															onChange={(e) => updateWorkflowStep(step.id, { multiStepInstruction: e.target.value })}
															placeholder="e.g. Please review the prompt above and provide specific context..."
															className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 ring-accent/20 shadow-sm"
														/>
														<p className="text-[10px] text-secondary mt-2">If set, the workflow will pause and display this instruction, allowing the user to modify the prompt before it's sent.</p>
													</div>
												</div>
											)}
											{step.type === 'file_upload' && (
												<div>
													<label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5">Requirement Description</label>
													<input
														type="text"
														value={step.fileRequirement}
														onChange={(e) => updateWorkflowStep(step.id, { fileRequirement: e.target.value })}
														placeholder="e.g. Please upload the codebase or a PDF of the logs..."
														className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 ring-accent/20 shadow-sm"
													/>
													<p className="text-[10px] text-secondary mt-2">The user will be prompted to attach files before proceeding past this step.</p>
												</div>
											)}
											{step.type === 'persona' && (
												<div className="space-y-4">
													<div className="relative">
														<label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5">Select Persona</label>
														<select
															value={step.personaId || ''}
															onChange={(e) => updateWorkflowStep(step.id, { personaId: e.target.value || undefined })}
															className="w-full appearance-none bg-panel border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 ring-accent/20 shadow-sm"
														>
															{<option value="">Default (No System Instruction)</option>}
															{personas.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
														</select>
														<ChevronDown className="absolute right-4 bottom-3.5 w-4 h-4 text-secondary pointer-events-none" />
													</div>
													<p className="text-[10px] text-secondary italic">This step will change the active persona for all subsequent prompts in the workflow.</p>
												</div>
											)}
											{step.type === 'mcp_tool' && (
												<div>
													<label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-3">Enabled Tools for this Step</label>
													<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
														{Object.values(serverTools).flat().map(tool => (
															<button
																key={tool.id}
																onClick={() => {
																	const currentIds = step.toolIds || [];
																	const newIds = currentIds.includes(tool.id) ? currentIds.filter(id => id !== tool.id) : [...currentIds, tool.id];
																	updateWorkflowStep(step.id, { toolIds: newIds });
																}}
																className={`text-left px-3 py-2.5 rounded-xl border transition-all flex items-center justify-between ${step.toolIds?.includes(tool.id) ? 'bg-accent/10 border-accent text-accent' : 'bg-panel border-border text-secondary hover:text-primary'}`}
															>
																<div className="min-w-0">
																	<p className="text-xs font-bold truncate">{tool.name}</p>
																	<p className="text-[10px] opacity-60 truncate">{tool.server}</p>
																</div>
																{step.toolIds?.includes(tool.id) && <Check className="w-4 h-4 shrink-0" />}
															</button>
														))}
													</div>
												</div>
											)}
											{step.type === 'export' && (
												<div>
													<label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-3">Format of the Output</label>
													<div className="flex flex-wrap gap-2">
														{['text', 'doc', 'pdf', 'excel', 'pptx'].map((fmt) => (
															<button
																key={fmt}
																onClick={() => updateWorkflowStep(step.id, { exportFormat: fmt as any })}
																className={`px-4 py-2 rounded-xl border text-xs font-bold uppercase tracking-widest transition-all ${step.exportFormat === fmt ? 'bg-accent text-white border-accent' : 'bg-panel border-border text-secondary hover:text-primary'}`}
															>
																{fmt}
															</button>
														))}
													</div>
													<p className="text-[10px] text-secondary mt-3 italic">At this stage, the current conversational context will be prepared for export in the chosen format.</p>
												</div>
											)}
											{step.type === 'database_search' && (
												<div className="space-y-4">
													<div className="relative">
														<label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5">Select Database Source</label>
														<select
															value={step.databaseId || ''}
															onChange={(e) => updateWorkflowStep(step.id, { databaseId: e.target.value })}
															className="w-full appearance-none bg-panel border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 ring-accent/20 shadow-sm"
														>
															{[...databaseSources].sort((a, b) => a.name.localeCompare(b.name)).map(db => <option key={db.id} value={db.id}>{db.name}</option>)}
														</select>
														<ChevronDown className="absolute right-4 bottom-3.5 w-4 h-4 text-secondary pointer-events-none" />
													</div>
													<div>
														<label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5">Search Query (Literal Match)</label>
														<input
															type="text"
															value={step.searchQuery || ''}
															onChange={(e) => updateWorkflowStep(step.id, { searchQuery: e.target.value })}
															placeholder="e.g. Board of Managers"
															className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 ring-accent/20 shadow-sm"
														/>
														<p className="text-[10px] text-secondary mt-2">If left empty, the user will be prompted to enter a search query during workflow execution.</p>
													</div>
													<div>
														<label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5">Pause for Review (Optional Instruction)</label>
														<input
															type="text"
															value={step.multiStepInstruction || ''}
															onChange={(e) => updateWorkflowStep(step.id, { multiStepInstruction: e.target.value })}
															placeholder="e.g. Please review these results before we continue..."
															className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 ring-accent/20 shadow-sm"
														/>
														<p className="text-[10px] text-secondary mt-2">If provided, the workflow will pause after the search, showing this instruction and allowing you to inspect the results before clicking "Next Step".</p>
													</div>
												</div>
											)}
											{step.type === 'vector_search' && (
												<div className="space-y-4">
													<div className="relative">
														<label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5">Select Azure Search Source</label>
														<select
															value={step.databaseId || ''}
															onChange={(e) => updateWorkflowStep(step.id, { databaseId: e.target.value })}
															className="w-full appearance-none bg-panel border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 ring-accent/20 shadow-sm"
														>
															<option value="">Select an Azure Source...</option>
															{databaseSources.filter(db => db.type === 'azure_ai_search').map(db => <option key={db.id} value={db.id}>{db.name}</option>)}
														</select>
														<ChevronDown className="absolute right-4 bottom-3.5 w-4 h-4 text-secondary pointer-events-none" />
													</div>
													<div>
														<label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5">Vector Search Prompt / Query</label>
														<input
															type="text"
															value={step.searchQuery || ''}
															onChange={(e) => updateWorkflowStep(step.id, { searchQuery: e.target.value })}
															placeholder="e.g. Summarize the key liability clauses"
															className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 ring-accent/20 shadow-sm"
														/>
														<p className="text-[10px] text-secondary mt-2">If left empty, the user will be prompted to enter a query. This query will be vectorized and used for semantic search.</p>
													</div>
													<div>
														<label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5">Pause for Review (Optional Instruction)</label>
														<input
															type="text"
															value={step.multiStepInstruction || ''}
															onChange={(e) => updateWorkflowStep(step.id, { multiStepInstruction: e.target.value })}
															placeholder="e.g. Please confirm if these semantic matches are relevant..."
															className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 ring-accent/20 shadow-sm"
														/>
														<p className="text-[10px] text-secondary mt-2">If provided, the workflow will pause after the vector search results are returned.</p>
													</div>
												</div>
											)}
											{step.type === 'web_scraper' && (
												<div className="space-y-4">
													<div>
														<label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5">Target URL (Optional)</label>
														<input
															type="text"
															value={step.url || ''}
															onChange={(e) => updateWorkflowStep(step.id, { url: e.target.value })}
															placeholder="e.g. https://example.com"
															className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 ring-accent/20 shadow-sm"
														/>
														<p className="text-[10px] text-secondary mt-2">If left empty, you will be prompted to enter a URL during workflow execution.</p>
													</div>
													<div className="flex items-center justify-between bg-panel border border-border rounded-xl px-4 py-3 cursor-pointer hover:bg-card-hover transition-colors" onClick={() => updateWorkflowStep(step.id, { includeMeta: !step.includeMeta })}>
														<label className="text-sm font-medium cursor-pointer select-none">Include Metadata (Description, Image)</label>
														<div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent/20 focus:ring-offset-2 ${step.includeMeta ? 'bg-accent' : 'bg-gray-200 dark:bg-gray-700'}`}>
															<span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${step.includeMeta ? 'translate-x-6' : 'translate-x-1'}`} />
														</div>
													</div>
													<div>
														<label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5">Pause for Review (Optional Instruction)</label>
														<input
															type="text"
															value={step.multiStepInstruction || ''}
															onChange={(e) => updateWorkflowStep(step.id, { multiStepInstruction: e.target.value })}
															placeholder="e.g. Verify the scraped content..."
															className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 ring-accent/20 shadow-sm"
														/>
														<p className="text-[10px] text-secondary mt-2">If provided, the workflow will pause after scraping.</p>
													</div>
												</div>
											)}
										</div>
									))
									}
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default WorkflowBuilderModal;
