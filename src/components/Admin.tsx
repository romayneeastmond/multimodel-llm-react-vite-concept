
import React, { useState, useEffect } from 'react';
import { Database, Server, ShieldCheck, Play, RefreshCw, CheckCircle, ArrowLeft, Lock, Menu, DatabaseZap, LayoutGrid, AlertCircle } from 'lucide-react';
import { testCosmosConnection, installCosmosSchema } from '../services/cosmosService';

interface AdminProps {
	onBack: () => void;
	isSidebarOpen: boolean;
	onToggleSidebar: () => void;
}

const Admin = ({ onBack, isSidebarOpen, onToggleSidebar }: AdminProps) => {
	const [isInstalling, setIsInstalling] = useState(false);
	const [installStatus, setInstallStatus] = useState<'idle' | 'success' | 'error'>('idle');
	const [endpoint, setEndpoint] = useState(() => localStorage.getItem('azure_cosmos_endpoint') || process.env.AZURE_COSMOS_ENDPOINT || '');
	const [key, setKey] = useState(() => localStorage.getItem('azure_cosmos_key') || process.env.AZURE_COSMOS_KEY || '');
	const [dbId, setDbId] = useState(() => localStorage.getItem('azure_cosmos_db_id') || process.env.AZURE_COSMOS_DB_ID || 'ConversationDB');
	const [testStatus, setTestStatus] = useState<{ status: 'idle' | 'testing' | 'success' | 'error'; message: string }>({ status: 'idle', message: '' });

	useEffect(() => {
		localStorage.setItem('azure_cosmos_endpoint', endpoint);
		localStorage.setItem('azure_cosmos_key', key);
		localStorage.setItem('azure_cosmos_db_id', dbId);
	}, [endpoint, key, dbId]);

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

	return (
		<main className="flex-1 flex flex-col relative w-full h-full min-w-0 bg-app overflow-y-auto">
			<div className="sticky top-0 z-20 bg-panel/80 backdrop-blur-md border-b border-border px-4 py-4 md:px-8 flex items-center justify-between shadow-sm">
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
							<p className="text-[10px] text-secondary">System Infrastructure & Database Setup</p>
						</div>
					</div>
				</div>
			</div>
			<div className="max-w-6xl mx-auto w-full px-4 md:px-8 py-8 md:py-12 space-y-10">
				<div>
					<div className="mb-6">
						<div className="flex items-center gap-3 text-primary mb-2">
							<DatabaseZap className="w-5 h-5 text-accent" />
							<h2 className="text-sm font-bold tracking-tight">Cosmos DB Setup</h2>
						</div>
						<p className="text-sm text-secondary leading-relaxed">
							Configure your Azure Cosmos DB connection parameters. This database will store all conversational history, user personas, prompt libraries, and automation workflows.
						</p>
					</div>
					<div>
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
				</div>
				<div className="bg-panel border border-border rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-6 shadow-sm border-dashed">
					<div className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all duration-500 ${installStatus === 'success' ? 'bg-accent/20 text-accent' : 'bg-card border border-border text-secondary'}`}>
						{isInstalling ? <RefreshCw className="w-8 h-8 animate-spin" /> : (installStatus === 'success' ? <CheckCircle className="w-8 h-8" /> : <LayoutGrid className="w-8 h-8" />)}
					</div>

					<div className="max-w-xl space-y-2">
						<h3 className="text-2xl font-bold tracking-tight text-primary">Schema Installation</h3>
						<p className="text-sm text-secondary leading-relaxed">
							Install the standard AI Orchestrator schema into your Azure Cosmos DB instance. This will create the
							<span className="text-primary font-bold"> Conversations</span>,
							<span className="text-primary font-bold"> Resources</span>, and
							<span className="text-primary font-bold"> DataSources</span> containers with optimized indexing policies.
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
		</main>
	);
};

export default Admin;
