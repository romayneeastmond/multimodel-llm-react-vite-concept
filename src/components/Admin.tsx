
import React, { useState, useEffect } from 'react';
import { Database, Server, ShieldCheck, Play, RefreshCw, CheckCircle, ArrowLeft, Lock, Menu, DatabaseZap, LayoutGrid, AlertCircle, Workflow as WorkflowIcon, Layers, Edit2, Trash2 } from 'lucide-react';
import { testCosmosConnection, installCosmosSchema, listWorkflows, getCosmosConfig } from '../services/cosmosService';
import { Workflow, Persona, LibraryPrompt, DatabaseSource, MCPTool } from '../types/index';
import { useWorkflowBuilder } from '../hooks/useWorkflowBuilder';
import WorkflowBuilderModal from './WorkflowBuilderModal';
import DeleteConfirmModal from './DeleteConfirmModal';

interface AdminProps {
	onBack: () => void;
	isSidebarOpen: boolean;
	onToggleSidebar: () => void;
	personas: Persona[];
	libraryPrompts: LibraryPrompt[];
	databaseSources: DatabaseSource[];
	serverTools: Record<string, MCPTool[]>;
	onPlayWorkflow: (workflow: Workflow) => void;
}

const Admin = ({ onBack, isSidebarOpen, onToggleSidebar, personas, libraryPrompts, databaseSources, serverTools, onPlayWorkflow }: AdminProps) => {
	const [activeTab, setActiveTab] = useState<'cosmos' | 'workflows'>('cosmos');

	const [isInstalling, setIsInstalling] = useState(false);
	const [installStatus, setInstallStatus] = useState<'idle' | 'success' | 'error'>('idle');
	const [endpoint, setEndpoint] = useState(() => localStorage.getItem('azure_cosmos_endpoint') || process.env.AZURE_COSMOS_ENDPOINT || '');
	const [key, setKey] = useState(() => localStorage.getItem('azure_cosmos_key') || process.env.AZURE_COSMOS_KEY || '');
	const [dbId, setDbId] = useState(() => localStorage.getItem('azure_cosmos_db_id') || process.env.AZURE_COSMOS_DB_ID || 'ConversationDB');
	const [testStatus, setTestStatus] = useState<{ status: 'idle' | 'testing' | 'success' | 'error'; message: string }>({ status: 'idle', message: '' });

	const [systemWorkflows, setSystemWorkflows] = useState<Workflow[]>([]);
	const [isLoadingWorkflows, setIsLoadingWorkflows] = useState(false);

	const {
		isWorkflowBuilderOpen,
		setIsWorkflowBuilderOpen,
		editingWorkflowId,
		setEditingWorkflowId,
		isCreatingWorkflow,
		setIsCreatingWorkflow,
		workflowForm,
		setWorkflowForm,
		workflowToDelete,
		setWorkflowToDelete,
		addWorkflowStep,
		updateWorkflowStep,
		removeWorkflowStep,
		moveWorkflowStep,
		handleSaveWorkflow,
		handleStartEditingWorkflow,
		confirmDeleteWorkflow
	} = useWorkflowBuilder({
		workflows: systemWorkflows,
		setWorkflows: setSystemWorkflows,
		currentUser: 'System'
	});

	useEffect(() => {
		localStorage.setItem('azure_cosmos_endpoint', endpoint);
		localStorage.setItem('azure_cosmos_key', key);
		localStorage.setItem('azure_cosmos_db_id', dbId);
	}, [endpoint, key, dbId]);

	useEffect(() => {
		if (activeTab === 'workflows') {
			fetchSystemWorkflows();
		}
	}, [activeTab]);

	const fetchSystemWorkflows = async () => {
		setIsLoadingWorkflows(true);
		const config = getCosmosConfig();
		if (config.endpoint && config.key) {
			try {
				const workflows = await listWorkflows(config, 'System');
				setSystemWorkflows(workflows.map(w => ({ ...w, isSystem: true })));
			} catch (error) {
				console.error("Failed to fetch system workflows:", error);
			} finally {
				setIsLoadingWorkflows(false);
			}
		} else {
			setIsLoadingWorkflows(false);
		}
	};

	const handleTestConnection = async () => {
		setTestStatus({ status: 'testing', message: 'Testing connection...' });
		try {
			const result = await testCosmosConnection({ endpoint, key, databaseId: dbId });
			setTestStatus({
				status: result.success ? 'success' : 'error',
				message: result.message
			});
		} catch (err: any) {
			setTestStatus({ status: 'error', message: err.message || 'An unexpected error occurred.' });
		}
	};

	const handleInstallSchema = async () => {
		setIsInstalling(true);
		setInstallStatus('idle');

		try {
			await installCosmosSchema({ endpoint, key, databaseId: dbId });
			setInstallStatus('success');
		} catch (err) {
			console.error("Schema Installation Error:", err);
			setInstallStatus('error');
		} finally {
			setIsInstalling(false);
		}
	};

	const handlePlayAndClose = (wf: Workflow) => {
		onPlayWorkflow(wf);
		onBack();
	};

	return (
		<main className="fixed inset-0 flex flex-col bg-app overflow-hidden">
			<div className="shrink-0 bg-panel/80 backdrop-blur-md border-b border-border px-4 py-4 md:px-8 flex items-center justify-between shadow-sm z-20">
				<div className="flex items-center gap-4">
					{!isSidebarOpen && (
						<button onClick={onToggleSidebar} className="p-2 hover:bg-card-hover rounded-xl text-secondary transition-colors md:hidden">
							<Menu className="w-5 h-5" />
						</button>
					)}
					<button onClick={onBack} className="p-2 hover:bg-card-hover rounded-xl text-secondary hover:text-primary transition-all active:scale-95 group">
						<ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
					</button>
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
							<ShieldCheck className="w-5 h-5" />
						</div>
						<div>
							<h1 className="text-sm font-bold tracking-tight">Administration Section</h1>
							<p className="text-[10px] text-secondary">System Infrastructure & Maintenance</p>
						</div>
					</div>
				</div>
			</div>

			<div className="flex-1 flex md:flex-row flex-col min-h-0 overflow-hidden">
				<div className="shrink-0 w-full md:w-64 bg-panel border-r border-border p-4 space-y-2 overflow-y-auto">
					<button
						onClick={() => setActiveTab('cosmos')}
						className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'cosmos' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-secondary hover:text-primary hover:bg-card-hover'}`}
					>
						<DatabaseZap className="w-4 h-4" />
						Cosmos DB Setup
					</button>
					<button
						onClick={() => setActiveTab('workflows')}
						className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'workflows' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-secondary hover:text-primary hover:bg-card-hover'}`}
					>
						<WorkflowIcon className="w-4 h-4" />
						System Workflows
					</button>
				</div>

				<div className="flex-1 overflow-y-auto p-6 md:p-8 relative">
					{activeTab === 'cosmos' && (
						<div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-300">
							<div>
								<div className="mb-6">
									<h2 className="text-lg font-bold tracking-tight text-primary mb-2">Cosmos DB Configuration</h2>
									<p className="text-sm text-secondary leading-relaxed">
										Configure your Azure Cosmos DB connection parameters. This database stores all conversational history, user personas, prompt libraries, and automation workflows.
									</p>
								</div>
								<div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
										<div className="space-y-2">
											<label className="text-[10px] font-bold text-secondary uppercase tracking-widest pl-1">Azure Endpoint</label>
											<div className="relative">
												<Server className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary opacity-40" />
												<input
													type="text"
													value={endpoint}
													onChange={(e) => setEndpoint(e.target.value)}
													placeholder="https://your-cosmos-db.documents.azure.com:443/"
													className="w-full bg-input border border-border rounded-xl pl-11 pr-4 py-3 text-sm outline-none focus:ring-2 ring-accent/20 transition-all font-mono"
												/>
											</div>
										</div>
										<div className="space-y-2">
											<label className="text-[10px] font-bold text-secondary uppercase tracking-widest pl-1">Primary Key</label>
											<div className="relative">
												<Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary opacity-40" />
												<input
													type="password"
													value={key}
													onChange={(e) => setKey(e.target.value)}
													placeholder="••••••••••••••••••••••••••••••"
													className="w-full bg-input border border-border rounded-xl pl-11 pr-4 py-3 text-sm outline-none focus:ring-2 ring-accent/20 transition-all font-mono"
												/>
											</div>
										</div>
									</div>
									<div className="space-y-2">
										<label className="text-[10px] font-bold text-secondary uppercase tracking-widest pl-1">Database ID</label>
										<div className="relative">
											<Database className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary opacity-40" />
											<input
												type="text"
												value={dbId}
												onChange={(e) => setDbId(e.target.value)}
												placeholder="AiOrchestratorDB"
												className="w-full bg-input border border-border rounded-xl pl-11 pr-4 py-3 text-sm outline-none focus:ring-2 ring-accent/20 transition-all font-mono"
											/>
										</div>
									</div>
									<div className="pt-2 flex flex-col md:flex-row items-center justify-between gap-4">
										<div className="flex-1">
											{testStatus.status !== 'idle' && (
												<div className={`flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-left-2 duration-300 ${testStatus.status === 'success' ? 'text-accent' : testStatus.status === 'error' ? 'text-red-400' : 'text-secondary'}`}>
													{testStatus.status === 'success' ? <CheckCircle className="w-4 h-4" /> : testStatus.status === 'error' ? <AlertCircle className="w-4 h-4" /> : <RefreshCw className="w-4 h-4 animate-spin" />}
													{testStatus.message}
												</div>
											)}
										</div>
										<button
											onClick={handleTestConnection}
											disabled={testStatus.status === 'testing' || !endpoint || !key}
											className="flex items-center gap-2 px-6 py-2.5 bg-panel border border-border rounded-xl text-xs font-bold text-primary hover:bg-card-hover transition-all active:scale-95 shadow-sm disabled:opacity-50"
										>
											<RefreshCw className={`w-4 h-4 ${testStatus.status === 'testing' ? 'animate-spin' : ''}`} />
											{testStatus.status === 'testing' ? 'Testing...' : 'Test Connection'}
										</button>
									</div>
								</div>
							</div>

							<div className="bg-panel border border-border rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-6 shadow-sm border-dashed">
								<div className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all duration-500 ${installStatus === 'success' ? 'bg-accent/20 text-accent' : 'bg-card border border-border text-secondary'}`}>
									{isInstalling ? <RefreshCw className="w-8 h-8 animate-spin" /> : (installStatus === 'success' ? <CheckCircle className="w-8 h-8" /> : <LayoutGrid className="w-8 h-8" />)}
								</div>

								<div className="max-w-xl space-y-2">
									<h3 className="text-2xl font-bold tracking-tight text-primary">Schema Installation</h3>
									<p className="text-sm text-secondary leading-relaxed">
										Install the standard AI Orchestrator schema into your Azure Cosmos DB instance. This will create the required containers with optimized indexing policies.
									</p>
								</div>

								<div className="flex flex-col sm:flex-row gap-4">
									<button
										onClick={handleInstallSchema}
										disabled={isInstalling || !endpoint || !key}
										className={`flex items-center justify-center gap-3 px-10 py-4 rounded-2xl text-sm font-extrabold shadow-xl transition-all active:scale-95 ${installStatus === 'success' ? 'bg-accent text-white shadow-accent/20' : 'bg-primary text-card hover:opacity-90 disabled:opacity-30'}`}
									>
										{isInstalling ? 'Provisioning Containers...' : (installStatus === 'success' ? 'Schema Installed Successfully' : 'Execute Schema Installation')}
										{!isInstalling && installStatus !== 'success' && <Play className="w-4 h-4 fill-current" />}
									</button>
								</div>

								{installStatus === 'success' && (
									<div className="flex items-center gap-2 text-accent text-xs font-bold animate-in fade-in duration-500">
										<CheckCircle className="w-4 h-4" />
										Index policy optimization complete (Consistency: Session)
									</div>
								)}
							</div>
						</div>
					)}

					{activeTab === 'workflows' && (
						<div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-300">
							<div className="mb-6 flex justify-between items-center">
								<div>
									<h2 className="text-lg font-bold tracking-tight text-primary mb-1">System Workflows</h2>
									<p className="text-sm text-secondary">Manage global workflows accessible to all users.</p>
								</div>
								<button
									onClick={() => setIsCreatingWorkflow(true)}
									className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-accent/20 hover:opacity-90 active:scale-95 transition-all"
								>
									<Play className="w-4 h-4" /> Create Workflow
								</button>
							</div>

							{isLoadingWorkflows ? (
								<div className="flex-1 flex flex-col items-center justify-center">
									<RefreshCw className="w-8 h-8 text-accent animate-spin mb-4" />
									<p className="text-sm text-secondary">Loading system workflows...</p>
								</div>
							) : systemWorkflows.length === 0 ? (
								<div className="text-center py-20 bg-card border border-dashed border-border rounded-2xl">
									<Layers className="w-12 h-12 text-secondary/30 mx-auto mb-4" />
									<h3 className="text-lg font-medium text-primary mb-2">No System Workflows Found</h3>
									<p className="text-sm text-secondary max-w-sm mx-auto mb-6">Create complex sequences of prompts, tool calls, and file operations for all users.</p>
									<button onClick={() => setIsCreatingWorkflow(true)} className="text-accent font-bold text-sm hover:underline">Get started by creating your first workflow</button>
								</div>
							) : (
								<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
									{systemWorkflows.map(wf => (
										<div key={wf.id} className="group bg-card border border-border rounded-2xl p-6 hover:shadow-xl transition-all relative flex flex-col h-full">
											<div className="flex justify-between items-center mb-4 min-w-0">
												<div className="flex items-center gap-3 min-w-0">
													<div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent shrink-0">
														<WorkflowIcon className="w-5 h-5" />
													</div>
													<h3 className="text-lg font-bold truncate">{wf.name}</h3>
												</div>
												<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
												</div>
											</div>
											<p className="text-sm text-secondary line-clamp-2 mb-6 flex-1">{wf.description}</p>
											<div className="flex items-center justify-between mt-auto">
												<span className="text-xs text-secondary font-medium bg-panel px-2.5 py-1 rounded-lg border border-border">
													{wf.steps.length} {wf.steps.length === 1 ? 'Step' : 'Steps'}
												</span>
												<button
													onClick={() => handlePlayAndClose(wf)}
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
					)}
				</div>
			</div>

			{(isCreatingWorkflow || editingWorkflowId) && (
				<WorkflowBuilderModal
					isOpen={true}
					onClose={() => {
						setIsCreatingWorkflow(false);
						setEditingWorkflowId(null);
					}}
					workflowForm={workflowForm}
					setWorkflowForm={setWorkflowForm}
					editingWorkflowId={editingWorkflowId}
					setEditingWorkflowId={setEditingWorkflowId}
					handleSaveWorkflow={handleSaveWorkflow}
					isCreatingWorkflow={isCreatingWorkflow}
					setIsCreatingWorkflow={setIsCreatingWorkflow}
					addWorkflowStep={addWorkflowStep}
					updateWorkflowStep={updateWorkflowStep}
					removeWorkflowStep={removeWorkflowStep}
					moveWorkflowStep={moveWorkflowStep}
					personas={personas}
					serverTools={serverTools}
					databaseSources={databaseSources}
					libraryPrompts={libraryPrompts}
					workflows={systemWorkflows}
					handleStartEditingWorkflow={handleStartEditingWorkflow}
					setWorkflowToDelete={setWorkflowToDelete}
					playWorkflow={handlePlayAndClose}
					allowSystemDelete={true}
				/>
			)}

			<DeleteConfirmModal
				isOpen={!!workflowToDelete}
				title="Delete System Workflow?"
				message="Are you sure you want to delete this workflow? This action cannot be undone and will affect all users."
				onCancel={() => setWorkflowToDelete(null)}
				onConfirm={confirmDeleteWorkflow}
			/>
		</main>
	);
};

export default Admin;
