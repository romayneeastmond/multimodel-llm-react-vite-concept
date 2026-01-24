import React, { useRef } from 'react';
import {
	Briefcase, X, AlignLeft, FileSearch, GitCompare, Database, Languages, ChevronDown, Check, Loader2, FolderClosed, Plus, Trash2,
	FileText, FileSpreadsheet, FileImage, FileCode, Presentation, Book, FileVideo, FileAudio, FileArchive
} from 'lucide-react';
import { useBriefcase } from '../hooks/useBriefcase';
import { DatabaseSource } from '../types/index';
import DeleteConfirmModal from './DeleteConfirmModal';

interface BriefcasePanelProps {
	briefcase: ReturnType<typeof useBriefcase>;
	databaseSources: DatabaseSource[];
	isGenerating: boolean;
}

const BriefcasePanel = ({ briefcase, databaseSources, isGenerating }: BriefcasePanelProps) => {
	const {
		isBriefcaseOpen,
		setIsBriefcaseOpen,
		isBriefcaseDragOver,
		setIsBriefcaseDragOver,
		handleBriefcaseDrop,
		activeBriefcaseTool,
		setActiveBriefcaseTool,
		briefcaseExtractPreset,
		setBriefcaseExtractPreset,
		setBriefcaseExtractQuery,
		briefcaseExtractQuery,
		briefcaseCompareMode,
		setBriefcaseCompareMode,
		briefcaseDbSourceId,
		setBriefcaseDbSourceId,
		briefcaseTargetLang,
		setBriefcaseTargetLang,
		selectedBriefcaseFiles,
		handleRunAnalysis,
		briefcaseFileInputRef,
		handleBriefcaseFileSelect,
		isBriefcaseUploading,
		allSessionAttachments,
		setSelectedBriefcaseFiles,
		initiateDeleteAttachment,
		attachmentToDelete,
		setAttachmentToDelete,
		confirmDeleteAttachment,
		analysisProgress
	} = briefcase;

	return (
		<div
			className={`fixed inset-y-0 right-0 z-[200] w-full md:w-[60rem] bg-panel border-l border-border transform transition-transform duration-300 ease-in-out shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col ${isBriefcaseOpen ? 'translate-x-0' : 'translate-x-full'} ${isBriefcaseDragOver ? 'opacity-80' : ''}`}
			onDragOver={(e) => { e.preventDefault(); setIsBriefcaseDragOver(true); }}
			onDragLeave={() => setIsBriefcaseDragOver(false)}
			onDrop={handleBriefcaseDrop}
		>
			<div className="flex items-center justify-between p-5 border-b border-border bg-panel shadow-sm">
				<h3 className="font-semibold flex items-center gap-2 tracking-tight"><Briefcase className="w-4 h-4 text-accent" /> Document Briefcase</h3>
				<button onClick={() => setIsBriefcaseOpen(false)} className="p-2 hover:bg-card-hover rounded-xl transition-all hover:rotate-90 hover:scale-110"><X className="w-5 h-5" /></button>
			</div>
			<div className="flex-col h-full overflow-hidden flex">
				<div className="p-5 border-b border-border bg-panel space-y-4">
					<h4 className="text-sm font-bold mb-8 flex items-center gap-2 tracking-tight">Available Tools</h4>
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
						{[
							{ id: 'summarize', icon: AlignLeft, label: 'Summarize', desc: 'Create a summary of the content' },
							{ id: 'extract', icon: FileSearch, label: 'Extract', desc: 'Extract specific information' },
							{ id: 'compare', icon: GitCompare, label: 'Compare', desc: 'Compare documents for differences or similarities' },
							{ id: 'db_search', icon: Database, label: 'Database Search', desc: 'Search database for matches' },
							{ id: 'translate', icon: Languages, label: 'Translate', desc: 'Translate document content' }
						].map((tool) => (
							<button
								key={tool.id}
								onClick={() => setActiveBriefcaseTool(activeBriefcaseTool === tool.id ? null : tool.id as any)}
								className={`flex flex-col items-center justify-start gap-1 py-4 px-2 rounded-xl border transition-all h-28 pt-5 ${activeBriefcaseTool === tool.id
									? 'bg-accent text-white border-accent shadow-lg shadow-accent/20'
									: 'bg-card border-border text-secondary hover:border-accent/50 hover:text-primary hover:shadow-md'
									}`}
							>
								<tool.icon className="w-5 h-5 mb-1" />
								<span className="text-[10px] font-bold uppercase tracking-wider">{tool.label}</span>
								<span className={`text-[9px] text-center leading-tight ${activeBriefcaseTool === tool.id ? 'text-white/80' : 'text-secondary'}`}>{tool.desc}</span>
							</button>
						))}
					</div>
					{activeBriefcaseTool && (
						<div className="text-xs text-secondary bg-card border border-border p-4 rounded-xl animate-in fade-in slide-in-from-top-2 shadow-sm">
							<div className="flex items-center gap-2 mb-3 pb-3">
								<span className="font-bold text-primary text-sm flex items-center gap-2">
									{activeBriefcaseTool === 'summarize' && <AlignLeft className="w-4 h-4 text-accent" />}
									{activeBriefcaseTool === 'extract' && <FileSearch className="w-4 h-4 text-accent" />}
									{activeBriefcaseTool === 'compare' && <GitCompare className="w-4 h-4 text-accent" />}
									{activeBriefcaseTool === 'db_search' && <Database className="w-4 h-4 text-accent" />}
									{activeBriefcaseTool === 'translate' && <Languages className="w-4 h-4 text-accent" />}

									{activeBriefcaseTool === 'summarize' ? 'Summarize Content' :
										activeBriefcaseTool === 'extract' ? 'Extract Information' :
											activeBriefcaseTool === 'compare' ? 'Compare Documents' :
												activeBriefcaseTool === 'db_search' ? 'Database Search' : 'Translate Content'}
								</span>
							</div>

							<div className="space-y-3">
								<p className="opacity-80">Select documents below to apply this tool.</p>

								{activeBriefcaseTool === 'extract' && (
									<div className="space-y-3">
										<div className="space-y-1">
											<label className="text-[10px] font-bold uppercase tracking-wider text-secondary">Presets</label>
											<div className="relative">
												<select
													className="w-full bg-input border border-border rounded-lg px-3 py-2 text-primary focus:border-accent outline-none text-sm appearance-none cursor-pointer"
													value={briefcaseExtractPreset}
													onChange={(e) => {
														const val = e.target.value;
														setBriefcaseExtractPreset(val);
														if (val === 'pii') setBriefcaseExtractQuery('Find and extract any Personally Identifiable Information (PII) such as names, phone numbers, email addresses, and home addresses.');
														else if (val === 'natural') setBriefcaseExtractQuery('Find and extract all information related to the topic(s): ');
														else if (val === 'dates') setBriefcaseExtractQuery('Find and extract all dates, timelines, and time-based events.');
														else if (val === 'money') setBriefcaseExtractQuery('Find and extract all monetary values, financial figures, and currency amounts.');
														else if (val === '') setBriefcaseExtractQuery('');
													}}
												>
													<option value="">Default Vectorized Search</option>
													<option value="natural">Natural Language Search</option>
													<option value="pii">Personable Identifiable Information (PII)</option>
													<option value="dates">Date Ranges or Timelines</option>
													<option value="money">Monetary Values</option>
												</select>
												<ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary pointer-events-none" />
											</div>
										</div>
										<div className="space-y-1">
											<label className="text-[10px] font-bold uppercase tracking-wider text-secondary">Keywords / Prompt</label>
											<input
												type="text"
												className="w-full bg-input border border-border rounded-lg px-3 py-2 text-primary focus:border-accent outline-none text-sm"
												placeholder="e.g. Find content that matches the following topics: ..."
												value={briefcaseExtractQuery}
												onChange={(e) => setBriefcaseExtractQuery(e.target.value)}
											/>
										</div>
									</div>
								)}

								{activeBriefcaseTool === 'compare' && (
									<div className="space-y-1">
										<label className="text-[10px] font-bold uppercase tracking-wider text-secondary">Comparison Mode</label>
										<div className="flex bg-input border border-border rounded-lg p-1">
											<button
												onClick={() => setBriefcaseCompareMode('diff')}
												className={`flex-1 py-1.5 text-xs font-medium rounded transition-all ${briefcaseCompareMode === 'diff' ? 'bg-accent text-white shadow-sm' : 'text-secondary hover:text-primary'}`}
											>
												Differences
											</button>
											<button
												onClick={() => setBriefcaseCompareMode('sim')}
												className={`flex-1 py-1.5 text-xs font-medium rounded transition-all ${briefcaseCompareMode === 'sim' ? 'bg-accent text-white shadow-sm' : 'text-secondary hover:text-primary'}`}
											>
												Similarities
											</button>
										</div>
									</div>
								)}

								{activeBriefcaseTool === 'db_search' && (
									<div className="space-y-1">
										<label className="text-[10px] font-bold uppercase tracking-wider text-secondary">Source Database</label>
										<div className="relative">
											<select
												className="w-full bg-input border border-border rounded-lg px-3 py-2 text-primary focus:border-accent outline-none text-sm appearance-none cursor-pointer"
												value={briefcaseDbSourceId}
												onChange={(e) => setBriefcaseDbSourceId(e.target.value)}
											>
												<option value="">Select a data source...</option>
												{[...databaseSources]
													.filter(ds =>
														ds.type === 'csv_upload' ||
														ds.type === 'manual_entry' ||
														(ds as any).sourceType === 'csv_upload' ||
														(ds as any).sourceType === 'manual_entry'
													)
													.sort((a, b) => a.name.localeCompare(b.name))
													.map(ds => (
														<option key={ds.id} value={ds.id}>
															{ds.name} ({(ds.type === 'csv_upload' || (ds as any).sourceType === 'csv_upload')
																? 'CSV'
																: (ds.type === 'manual_entry' || (ds as any).sourceType === 'manual_entry')
																	? 'Manual Entry'
																	: 'Source'
															})
														</option>
													))}
											</select>
											<ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary pointer-events-none" />
										</div>
									</div>
								)}

								{activeBriefcaseTool === 'translate' && (
									<div className="space-y-1">
										<label className="text-[10px] font-bold uppercase tracking-wider text-secondary">Target Language</label>
										<input
											type="text"
											className="w-full bg-input border border-border rounded-lg px-3 py-2 text-primary focus:border-accent outline-none text-sm"
											placeholder="e.g. Spanish, French, Japanese..."
											value={briefcaseTargetLang}
											onChange={(e) => setBriefcaseTargetLang(e.target.value)}
										/>
									</div>
								)}

								<div className="pt-2">
									<button className="w-full py-2 bg-accent hover:opacity-90 text-white rounded-lg font-bold text-sm shadow-lg shadow-accent/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed" disabled={selectedBriefcaseFiles.size === 0} onClick={() => handleRunAnalysis()}>
										Run Analysis
									</button>
								</div>
							</div>
						</div>
					)}
				</div>

				<div className="flex-1 overflow-y-auto p-5 relative">
					<input type="file" ref={briefcaseFileInputRef} onChange={handleBriefcaseFileSelect} className="hidden" multiple />
					<h4 className="text-sm font-bold mb-8 flex items-center gap-2 tracking-tight">Analysis Documents</h4>
					{isBriefcaseUploading && (
						<div className="absolute inset-0 z-50 bg-app/90 backdrop-blur-sm flex items-center justify-center">
							<div className="w-full max-w-md p-8 animate-in fade-in zoom-in duration-300">
								<h3 className="text-xl font-bold mb-6 text-center flex items-center justify-center gap-3">
									<Loader2 className="w-8 h-8 animate-spin text-accent" />
									Uploading Documents...
								</h3>
							</div>
						</div>
					)}
					{allSessionAttachments.length === 0 ? (
						<div className="flex flex-col items-center justify-center h-full text-center text-secondary border-2 border-dashed border-border/50 rounded-2xl bg-app/30">
							<FolderClosed className="w-12 h-12 mb-3 opacity-50" />
							<p className="text-sm">Drag and drop to add documents to this session.</p>
							<button onClick={() => briefcaseFileInputRef.current?.click()} className="mt-4 text-xs font-bold text-accent hover:underline">Click here to upload</button>
						</div>
					) : (
						<div className="grid grid-cols-4 gap-4">

							{isGenerating && isBriefcaseOpen && (
								<div className="absolute inset-0 z-10 bg-app/90 backdrop-blur-sm flex items-center justify-center">
									<div className="w-full max-w-md p-8 animate-in fade-in zoom-in duration-300">
										<h3 className="text-xl font-bold mb-6 text-center flex items-center justify-center gap-3">
											<Loader2 className="w-8 h-8 animate-spin text-accent" />
											Running Analysis...
										</h3>
										<div className="space-y-4">
											{[
												"Starting analysis...",
												"Moving documents to agentic runners...",
												"Processing content...",
												"Gathering final results...",
												"Completing..."
											].map((step, i) => (
												<div key={i} className={`flex items-center gap-3 transition-all duration-500 ${i <= analysisProgress ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
													<div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${i < analysisProgress ? 'bg-green-500 border-green-500 text-white' : i === analysisProgress ? 'border-accent text-accent' : 'border-border text-transparent'}`}>
														{i < analysisProgress ? <Check className="w-3.5 h-3.5" /> : i === analysisProgress ? <div className="w-2 h-2 rounded-full bg-accent animate-pulse" /> : null}
													</div>
													<span className={`text-sm font-medium ${i === analysisProgress ? 'text-primary' : i < analysisProgress ? 'text-secondary line-through opacity-70' : 'text-secondary'}`}>{step}</span>
												</div>
											))}
										</div>
									</div>
								</div>
							)}

							{allSessionAttachments.map((att) => {
								const isSelected = selectedBriefcaseFiles.has(att.id);
								const ext = att.name.split('.').pop()?.toLowerCase() || '';
								let Icon = FileText;
								let label = ext.toUpperCase() || 'FILE';

								if (['xls', 'xlsx', 'csv'].includes(ext)) { Icon = FileSpreadsheet; label = ext === 'csv' ? 'CSV' : 'EXCEL'; }
								else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) { Icon = FileImage; label = 'IMAGE'; }
								else if (['js', 'ts', 'jsx', 'tsx', 'py', 'json', 'html', 'css', 'sql', 'xml', 'yaml', 'yml'].includes(ext)) { Icon = FileCode; label = ext === 'json' ? 'JSON' : 'CODE'; }
								else if (['doc', 'docx', 'odt'].includes(ext)) { Icon = FileText; label = 'WORD'; }
								else if (['ppt', 'pptx', 'odp'].includes(ext)) { Icon = Presentation; label = 'POWERPOINT'; }
								else if (['pdf'].includes(ext)) { Icon = Book; label = 'PDF'; }
								else if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) { Icon = FileVideo; label = 'VIDEO'; }
								else if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) { Icon = FileAudio; label = 'AUDIO'; }
								else if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) { Icon = FileArchive; label = 'ARCHIVE'; }
								else if (['md', 'markdown'].includes(ext)) { Icon = FileText; label = 'MARKDOWN'; }
								else if (['txt', 'log'].includes(ext)) { Icon = FileText; label = 'TEXT'; }

								return (
									<button
										key={att.id}
										onClick={() => {
											const newSet = new Set(selectedBriefcaseFiles);
											if (newSet.has(att.id)) newSet.delete(att.id);
											else newSet.add(att.id);
											setSelectedBriefcaseFiles(newSet);
										}}
										className={`group relative flex flex-col items-center p-4 rounded-xl border transition-all text-center min-h-[9rem] h-auto ${isSelected
											? 'border-accent bg-accent/5 shadow-md'
											: 'border-border bg-card hover:border-accent/50 hover:shadow-lg'
											}`}
									>
										{isSelected && (
											<div className="absolute top-2 left-2 p-0.5 bg-accent text-white rounded-full">
												<Check className="w-3 h-3" />
											</div>
										)}
										<button
											onClick={(e) => {
												e.stopPropagation();
												initiateDeleteAttachment(att);
											}}
											className="absolute top-2 right-2 p-1.5 text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 z-10"
										>
											<Trash2 className="w-3.5 h-3.5" />
										</button>
										<div className={`p-3 rounded-xl mb-3 ${isSelected ? 'bg-accent/10 text-accent' : 'bg-app text-secondary group-hover:text-primary group-hover:bg-app/80'}`}>
											<Icon className="w-6 h-6" />
										</div>
										<div className="w-full min-h-0 flex flex-col items-center">
											<h4 className="text-xs font-semibold truncate w-full mb-1" title={att.name}>{att.name}</h4>
											<span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-border/50 text-secondary mb-1">
												{label}
											</span>
											{att.statistics && (
												<span className="text-[9px] text-secondary opacity-80 flex items-center gap-1 mt-1">
													{att.statistics.words !== undefined && <span>{att.statistics.words.toLocaleString()} {att.statistics.words === 1 ? 'word' : 'words'}</span>}
													{att.statistics.words !== undefined && att.statistics.pages !== undefined && att.statistics.pages !== -1 && <span>•</span>}
													{att.statistics.pages !== undefined && att.statistics.pages !== -1 && <span>{att.statistics.pages.toLocaleString()} {att.statistics.pages === 1 ? 'page' : 'pages'}</span>}
												</span>
											)}
										</div>
									</button>
								);
							})}
							<button
								onClick={() => briefcaseFileInputRef.current?.click()}
								className="group flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-border transition-all text-center min-h-[9rem] h-auto hover:bg-card-hover hover:border-accent text-secondary hover:text-accent"
							>
								<div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
									<Plus className="w-5 h-5" />
								</div>
								<span className="text-xs font-bold tracking-wider">Add Document</span>
							</button>
						</div>
					)}
				</div>
				{attachmentToDelete && (
					<DeleteConfirmModal
						isOpen={!!attachmentToDelete}
						title="Delete Document?"
						message={
							<span>
								Are you sure you want to delete <span className="font-medium text-primary">"{attachmentToDelete?.name}"</span>?
								This will remove it from the conversation history.
							</span>
						}
						onCancel={() => setAttachmentToDelete(null)}
						onConfirm={confirmDeleteAttachment}
					/>
				)}
			</div>
		</div>
	);
};

export default BriefcasePanel;
