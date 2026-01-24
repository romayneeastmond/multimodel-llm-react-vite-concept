import React from 'react';
import {
	X, Plus, Edit2, Upload, AlignLeft, Search, ChevronDown, RefreshCw, ShieldCheck, CheckCircle2,
	UploadCloud, FileSpreadsheet, TableProperties, Check, Eye, Filter, Database, Trash2, PlusCircle,
	ChevronLeft
} from 'lucide-react';
import { DatabaseSource, MultiModel } from '../types/index';
import { AVAILABLE_MODELS } from '../config/constants';
import DeleteConfirmModal from './DeleteConfirmModal';

export interface DatabaseSourcesModalProps {
	isDatabaseSourcesOpen: boolean;
	setIsDatabaseSourcesOpen: (isOpen: boolean) => void;
	databaseSources: DatabaseSource[];
	selectedDatabaseSourceId: string | null;
	setSelectedDatabaseSourceId: (id: string | null) => void;
	isCreatingDatabaseSource: boolean;
	setIsCreatingDatabaseSource: (isCreating: boolean) => void;
	databaseSourceForm: Partial<DatabaseSource>;
	setDatabaseSourceForm: React.Dispatch<React.SetStateAction<Partial<DatabaseSource>>>;
	dbSourceToDelete: string | null;
	setDbSourceToDelete: (id: string | null) => void;
	dbPhraseSearchQuery: string;
	setDbPhraseSearchQuery: (query: string) => void;
	isTestingAzureConnection: boolean;
	azureTestResult: { success: boolean; message: string } | null;
	setAzureTestResult: (result: { success: boolean; message: string } | null) => void;
	dbFileInputRef: React.RefObject<HTMLInputElement>;
	handleTestAzureConnection: () => void;
	handleSaveDatabaseSource: () => void;
	handleDbFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
	initiateDeleteDatabaseSource: (id: string) => void;
	confirmDeleteDatabaseSource: () => void;
	startEditDatabaseSource: (db: DatabaseSource) => void;
	filteredRows: string[][];
	csvData: { headers: string[]; rows: string[][] };
}

const DatabaseSourcesModal = ({
	isDatabaseSourcesOpen,
	setIsDatabaseSourcesOpen,
	databaseSources,
	selectedDatabaseSourceId,
	setSelectedDatabaseSourceId,
	isCreatingDatabaseSource,
	setIsCreatingDatabaseSource,
	databaseSourceForm,
	setDatabaseSourceForm,
	dbSourceToDelete,
	setDbSourceToDelete,
	dbPhraseSearchQuery,
	setDbPhraseSearchQuery,
	isTestingAzureConnection,
	azureTestResult,
	setAzureTestResult,
	dbFileInputRef,
	handleTestAzureConnection,
	handleSaveDatabaseSource,
	handleDbFileUpload,
	initiateDeleteDatabaseSource,
	confirmDeleteDatabaseSource,
	startEditDatabaseSource,
	filteredRows,
	csvData
}: DatabaseSourcesModalProps) => {

	if (!isDatabaseSourcesOpen) return null;

	return (
		<>
			<div className="fixed inset-0 z-[82] bg-app flex flex-col animate-in zoom-in-95 duration-200">
				<div className="flex items-center justify-between px-6 py-4 border-b border-border bg-panel shadow-sm shrink-0">
					<div className="flex items-center gap-3 min-w-0">
						<Database className="w-6 h-6 text-accent shrink-0" />
						<div className="min-w-0">
							<h2 className="text-sm font-bold tracking-tight">Database Sources</h2>
							<p className="text-[10px] text-secondary truncate sm:whitespace-normal">CSV records for document analysis and Azure AI Search Indexes for semantic search</p>
						</div>
					</div>
					<button onClick={() => { setIsDatabaseSourcesOpen(false); setSelectedDatabaseSourceId(null); setIsCreatingDatabaseSource(false); setDatabaseSourceForm({ name: '', type: 'csv_upload', content: '', rowCount: 0, azureEndpoint: '', azureIndexName: '', azureContentField: '', azureVectorField: '', azureEmbeddingModel: MultiModel.AZURE_TEXT_EMBED_2, azureSearchKey: '' }); setAzureTestResult(null); }} className="p-2 hover:bg-card-hover rounded-xl transition-all hover:rotate-90 hover:scale-110"><X className="w-6 h-6" /></button>
				</div>
				<div className="flex-1 flex flex-col md:flex-row overflow-hidden">
					<div className={`w-full md:w-80 border-r border-border bg-panel overflow-y-auto p-4 flex-col ${selectedDatabaseSourceId || isCreatingDatabaseSource ? 'hidden md:flex' : 'flex'}`}>
						<button
							onClick={() => { setIsCreatingDatabaseSource(true); setSelectedDatabaseSourceId(null); setDatabaseSourceForm({ name: '', type: 'csv_upload', content: '', rowCount: 0, azureEndpoint: '', azureIndexName: '', azureContentField: '', azureVectorField: '', azureEmbeddingModel: MultiModel.AZURE_TEXT_EMBED_2, azureSearchKey: '' }); setAzureTestResult(null); }}
							className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-border text-sm font-bold text-secondary hover:text-accent hover:border-accent hover:bg-accent/5 transition-all mb-4"
						>
							<PlusCircle className="w-4 h-4" /> Add Source
						</button>
						<div className="space-y-2">
							{databaseSources.length === 0 ? (
								<div className="text-center py-8 opacity-40">
									<FileSpreadsheet className="w-10 h-10 mx-auto mb-2 text-secondary" />
									<p className="text-[10px] uppercase font-bold tracking-widest">No Sources</p>
								</div>
							) : (
								[...databaseSources].sort((a, b) => a.name.localeCompare(b.name)).map(db => (
									<div key={db.id} className="relative group">
										<button
											onClick={() => startEditDatabaseSource(db)}
											className={`w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center gap-3 pr-16 ${selectedDatabaseSourceId === db.id ? 'bg-accent/10 border-accent text-accent' : 'bg-card border-border hover:bg-card-hover'}`}
										>
											<div className={`p-1.5 rounded-lg ${selectedDatabaseSourceId === db.id ? 'bg-accent/20' : 'bg-panel border border-border'}`}>
												{db.type === 'csv_upload' ? <FileSpreadsheet className="w-4 h-4" /> : <AlignLeft className="w-4 h-4" />}
											</div>
											<div className="min-w-0 flex-1">
												<p className="text-sm font-bold truncate">{db.name}</p>
												{db.type === 'azure_ai_search' ? (
													db.rowCount > 0 && <p className="text-[10px] truncate opacity-60 uppercase tracking-tight">{db.rowCount} {db.rowCount === 1 ? 'record' : 'records'}</p>
												) : (
													<p className="text-[10px] truncate opacity-60 uppercase tracking-tight">{db.rowCount} {db.rowCount === 1 ? 'record' : 'records'}</p>
												)}
											</div>
										</button>
										<button
											onClick={(e) => { e.stopPropagation(); initiateDeleteDatabaseSource(db.id); }}
											className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-secondary hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
										>
											<Trash2 className="w-3.5 h-3.5" />
										</button>
									</div>
								))
							)}
						</div>
					</div>
					<div className={`flex-1 overflow-y-auto p-4 md:p-10 bg-app/50 ${!selectedDatabaseSourceId && !isCreatingDatabaseSource ? 'hidden md:block' : 'block'}`}>
						<div className="max-w-4xl mx-auto flex flex-col gap-10">
							{selectedDatabaseSourceId || isCreatingDatabaseSource ? (
								<>
									<div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
										<div className="flex items-center justify-between border-b border-border pb-4">
											<div className="flex items-center gap-2">
												<button
													onClick={() => { setSelectedDatabaseSourceId(null); setIsCreatingDatabaseSource(false); setAzureTestResult(null); }}
													className="md:hidden p-2 -ml-2 hover:bg-card-hover rounded-xl text-secondary transition-all"
												>
													<ChevronLeft className="w-6 h-6" />
												</button>
												<h3 className="text-lg font-bold tracking-tight flex items-center gap-2.5">
													{isCreatingDatabaseSource ? <><Plus className="w-5 h-5 text-accent" /> New Record Source</> : <><Edit2 className="w-5 h-5 text-accent" /> Configure Source</>}
												</h3>
											</div>
										</div>

										<div className="space-y-6">
											<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
												<div>
													<label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5">Source Name</label>
													<input type="text" value={databaseSourceForm.name} onChange={(e) => setDatabaseSourceForm({ ...databaseSourceForm, name: e.target.value })} placeholder="e.g. Legal Phrases, Medical Terms" className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 ring-accent/20 shadow-sm" required />
												</div>
												<div>
													<label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5">Import Method</label>
													<div className="flex flex-col sm:flex-row gap-2 p-1 bg-panel border border-border rounded-xl">
														<button
															onClick={() => setDatabaseSourceForm({ ...databaseSourceForm, type: 'csv_upload' })}
															className={`flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${databaseSourceForm.type === 'csv_upload' ? 'bg-accent text-white shadow-sm' : 'text-secondary hover:text-primary'}`}
														>
															<Upload className="w-3.5 h-3.5" /> <span className="sm:hidden">CSV File</span><span className="hidden sm:inline">CSV File</span>
														</button>
														<button
															onClick={() => setDatabaseSourceForm({ ...databaseSourceForm, type: 'manual_entry' })}
															className={`flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${databaseSourceForm.type === 'manual_entry' ? 'bg-accent text-white shadow-sm' : 'text-secondary hover:text-primary'}`}
														>
															<AlignLeft className="w-3.5 h-3.5" /> <span className="sm:hidden">Manual Paste</span><span className="hidden sm:inline">Manual Paste</span>
														</button>
														<button
															onClick={() => setDatabaseSourceForm({ ...databaseSourceForm, type: 'azure_ai_search' })}
															className={`flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${databaseSourceForm.type === 'azure_ai_search' ? 'bg-accent text-white shadow-sm' : 'text-secondary hover:text-primary'}`}
														>
															<Search className="w-3.5 h-3.5" /> <span className="sm:hidden">Azure Search</span><span className="hidden sm:inline">Azure AI Search</span>
														</button>
													</div>
												</div>
											</div>

											{databaseSourceForm.type === 'azure_ai_search' ? (
												<div className="space-y-4 animate-in fade-in duration-300">
													<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
														<div>
															<label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5">Azure Endpoint</label>
															<input type="text" value={databaseSourceForm.azureEndpoint} onChange={(e) => setDatabaseSourceForm({ ...databaseSourceForm, azureEndpoint: e.target.value })} placeholder="https://your-service.search.windows.net" className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 ring-accent/20 shadow-sm" />
														</div>
														<div>
															<label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5">API Key</label>
															<input type="password" value={databaseSourceForm.azureSearchKey} onChange={(e) => setDatabaseSourceForm({ ...databaseSourceForm, azureSearchKey: e.target.value })} placeholder="Azure Search Admin Key" className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 ring-accent/20 shadow-sm" />
														</div>
														<div>
															<label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5">Index Name</label>
															<input type="text" value={databaseSourceForm.azureIndexName} onChange={(e) => setDatabaseSourceForm({ ...databaseSourceForm, azureIndexName: e.target.value })} placeholder="e.g. products-index" className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 ring-accent/20 shadow-sm" />
														</div>
														<div>
															<label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5">Embedding Model</label>
															<div className="relative">
																<select value={databaseSourceForm.azureEmbeddingModel} onChange={(e) => setDatabaseSourceForm({ ...databaseSourceForm, azureEmbeddingModel: e.target.value as MultiModel })} className="w-full appearance-none bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 ring-accent/20 shadow-sm">
																	{AVAILABLE_MODELS.map(m => (
																		<option key={m.id} value={m.id}>{m.name}</option>
																	))}
																</select>
																<ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary pointer-events-none" />
															</div>
														</div>
														<div>
															<label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5">Content Field</label>
															<input type="text" value={databaseSourceForm.azureContentField} onChange={(e) => setDatabaseSourceForm({ ...databaseSourceForm, azureContentField: e.target.value })} placeholder="e.g. content" className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 ring-accent/20 shadow-sm" />
														</div>
														<div>
															<label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5">Vector Field</label>
															<input type="text" value={databaseSourceForm.azureVectorField} onChange={(e) => setDatabaseSourceForm({ ...databaseSourceForm, azureVectorField: e.target.value })} placeholder="e.g. content_vector" className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 ring-accent/20 shadow-sm" />
														</div>
														<div>
															<label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5">Title Field (Optional)</label>
															<input type="text" value={databaseSourceForm.azureTitleField} onChange={(e) => setDatabaseSourceForm({ ...databaseSourceForm, azureTitleField: e.target.value })} placeholder="e.g. title, metadata_title" className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 ring-accent/20 shadow-sm" />
														</div>
													</div>
													<div className="flex flex-col gap-3">
														<button
															type="button"
															onClick={handleTestAzureConnection}
															disabled={isTestingAzureConnection}
															className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-accent/30 bg-accent/5 text-accent hover:bg-accent/10 transition-all text-xs font-bold disabled:opacity-50"
														>
															{isTestingAzureConnection ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
															{isTestingAzureConnection ? 'Testing Connection...' : 'Test Azure Connection'}
														</button>
														{azureTestResult && (
															<div className={`p-3 rounded-xl text-[11px] font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200 ${azureTestResult.success ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
																{azureTestResult.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
																{azureTestResult.message}
															</div>
														)}
													</div>
												</div>
											) : databaseSourceForm.type === 'csv_upload' ? (
												<div
													onClick={() => dbFileInputRef.current?.click()}
													className="group relative flex flex-col items-center justify-center border-2 border-dashed border-border rounded-3xl p-10 bg-card hover:bg-card-hover hover:border-accent/50 transition-all cursor-pointer shadow-sm"
												>
													<input type="file" ref={dbFileInputRef} accept=".csv" onChange={handleDbFileUpload} className="hidden" />
													<div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center text-accent mb-4 group-hover:scale-110 transition-transform">
														<UploadCloud className="w-7 h-7" />
													</div>
													<h4 className="text-sm font-bold text-primary mb-1">Click to upload CSV</h4>
													<p className="text-xs text-secondary mb-4">Support for records separated by rows</p>
													{databaseSourceForm.fileName && (
														<div className="flex items-center gap-2 bg-accent/5 px-3 py-1.5 rounded-lg border border-accent/20 text-xs text-accent font-bold">
															<FileSpreadsheet className="w-3.5 h-3.5" />
															{databaseSourceForm.fileName}
														</div>
													)}
												</div>
											) : (
												<div>
													<label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5">Paste Row Records (one per line)</label>
													<textarea
														value={databaseSourceForm.content}
														onChange={(e) => setDatabaseSourceForm({ ...databaseSourceForm, content: e.target.value })}
														placeholder="Place each phrase on a new line..."
														rows={10}
														className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 ring-accent/20 shadow-sm font-mono resize-none"
													/>
												</div>
											)}

											<div className="flex items-center justify-between p-4 bg-panel border border-border rounded-2xl">
												<div className="flex items-center gap-3">
													<div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
														<TableProperties className="w-5 h-5" />
													</div>
													<div>
														<p className="text-sm font-bold tracking-tight">Record Intelligence</p>
														<p className="text-[10px] text-secondary">
															{databaseSourceForm.type === 'azure_ai_search'
																? 'Connected to Azure AI Search Index'
																: <>Detected <span className="text-accent font-bold">{(databaseSourceForm.content || '').split('\n').filter(l => l.trim()).length}</span> phrase records</>
															}
														</p>
													</div>
												</div>
												<div className="flex gap-3">
													<button
														type="button"
														onClick={() => { setIsCreatingDatabaseSource(false); setSelectedDatabaseSourceId(null); }}
														className="px-6 py-2.5 text-xs font-bold border border-border rounded-xl hover:bg-card-hover transition-colors"
													>
														Cancel
													</button>
													<button
														onClick={() => handleSaveDatabaseSource()}
														className="flex items-center gap-2 bg-accent text-white px-8 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-accent/20 hover:opacity-95 active:scale-95 transition-all"
													>
														<Check className="w-4 h-4" /> {isCreatingDatabaseSource ? 'Create Source' : 'Save Changes'}
													</button>
												</div>
											</div>
										</div>
									</div>

									{databaseSourceForm.type !== 'azure_ai_search' && (
										<div className="space-y-6 pt-4 border-t border-border animate-in fade-in slide-in-from-bottom-4 duration-500">
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-2.5">
													<Eye className="w-5 h-5 text-secondary" />
													<h3 className="text-sm font-bold tracking-tight">Record Preview</h3>
												</div>
												<div className="relative w-64">
													<Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-secondary" />
													<input
														type="text"
														value={dbPhraseSearchQuery}
														onChange={(e) => setDbPhraseSearchQuery(e.target.value)}
														placeholder="Filter records..."
														className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2 text-xs outline-none focus:ring-2 ring-accent/20 shadow-sm"
													/>
												</div>
											</div>

											<div className="bg-panel border border-border rounded-2xl overflow-hidden shadow-inner max-h-[400px] flex flex-col">
												<div className="overflow-x-auto">
													<div className="min-w-[600px]">
														<div className="flex items-center px-4 py-2 bg-card border-b border-border text-[10px] font-bold text-secondary uppercase tracking-widest divide-x divide-border">
															<span className="w-10 pr-2">Idx</span>
															{csvData.headers.map((header, idx) => (
																<span key={idx} className="flex-1 px-4 truncate">{header}</span>
															))}
															<span className="w-12 text-right pl-2">Len</span>
														</div>
														<div className="overflow-y-auto max-h-[350px] custom-scrollbar">
															{filteredRows.length > 0 ? (
																filteredRows.map((row, rowIdx) => (
																	<div key={rowIdx} className="flex items-center px-4 py-3 border-b border-border/40 hover:bg-card/50 transition-colors last:border-0 group divide-x divide-border/20">
																		<span className="text-[10px] font-mono text-secondary w-10 shrink-0 pr-2">{rowIdx + 1}</span>
																		{row.map((cell, cellIdx) => (
																			<span key={cellIdx} className="flex-1 text-[11px] font-medium text-primary px-4 truncate group-hover:text-accent transition-colors" title={cell}>{cell}</span>
																		))}
																		<span className="text-[10px] font-mono text-secondary w-12 text-right shrink-0 opacity-50 pl-2">{row.join(',').length}</span>
																	</div>
																))
															) : (
																<div className="p-12 text-center text-secondary opacity-40">
																	<Search className="w-8 h-8 mx-auto mb-2" />
																	<p className="text-xs">No records found matching "{dbPhraseSearchQuery}"</p>
																</div>
															)}
														</div>
													</div>
												</div>
												<div className="px-4 py-2 bg-card border-t border-border flex justify-between items-center">
													<span className="text-[10px] text-secondary font-medium">Showing {filteredRows.length} of {csvData.rows.length} total records</span>
													{dbPhraseSearchQuery && (
														<button onClick={() => setDbPhraseSearchQuery('')} className="text-[10px] text-accent font-bold hover:underline">Clear Filter</button>
													)}
												</div>
											</div>
										</div>
									)}
								</>
							) : (
								<div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
									<div className="w-24 h-24 bg-card border border-border rounded-3xl flex items-center justify-center text-secondary shadow-lg">
										<Database className="w-12 h-12 opacity-20" />
									</div>
									<div className="space-y-2">
										<h3 className="text-2xl font-bold tracking-tight">Source Management</h3>
										<p className="text-sm text-secondary max-w-md mx-auto leading-relaxed">
											Upload collections of records via CSV or manual entry. These records act as a lookup database for analyzing and validating documents during chat sessions.
										</p>
									</div>
									<button
										onClick={() => { setIsCreatingDatabaseSource(true); setDatabaseSourceForm({ name: '', type: 'csv_upload', content: '', rowCount: 0, azureEndpoint: '', azureIndexName: '', azureContentField: '', azureVectorField: '', azureEmbeddingModel: MultiModel.AZURE_TEXT_EMBED_2, azureSearchKey: '' }); setAzureTestResult(null); }}
										className="flex items-center gap-3 bg-accent text-white px-10 py-3.5 rounded-2xl text-sm font-bold shadow-xl shadow-accent/20 hover:scale-105 active:scale-95 transition-all"
									>
										<Plus className="w-5 h-5" /> Initialize New Source
									</button>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			<DeleteConfirmModal
				isOpen={!!dbSourceToDelete}
				title="Delete Source?"
				message="This record source will be permanently removed."
				onCancel={() => setDbSourceToDelete(null)}
				onConfirm={confirmDeleteDatabaseSource}
			/>
		</>
	);
};

export default DatabaseSourcesModal;
