import { useState, useRef, useMemo } from 'react';
import { DatabaseSource, MultiModel } from '../types/index';
import {
	saveDatabaseSource,
	deleteDatabaseSource,
	getCosmosConfig
} from '../services/cosmosService';
import { searchAzureAISearch, getAzureIndexCount } from '../services/multiModelService';

interface UseDatabaseSourcesProps {
	databaseSources: DatabaseSource[];
	setDatabaseSources: React.Dispatch<React.SetStateAction<DatabaseSource[]>>;
	currentUser: string;
}

export const useDatabaseSources = ({ databaseSources, setDatabaseSources, currentUser }: UseDatabaseSourcesProps) => {
	const [isDatabaseSourcesOpen, setIsDatabaseSourcesOpen] = useState(false);
	const [selectedDatabaseSourceId, setSelectedDatabaseSourceId] = useState<string | null>(null);
	const [isCreatingDatabaseSource, setIsCreatingDatabaseSource] = useState(false);
	const [databaseSourceForm, setDatabaseSourceForm] = useState<Partial<DatabaseSource>>({
		name: '',
		type: 'csv_upload',
		content: '',
		rowCount: 0,
		azureEndpoint: '',
		azureIndexName: '',
		azureContentField: '',
		azureVectorField: '',
		azureTitleField: '',
		azureEmbeddingModel: MultiModel.AZURE_TEXT_EMBED_2,
		azureSearchKey: ''
	});
	const [dbSourceToDelete, setDbSourceToDelete] = useState<string | null>(null);
	const [dbPhraseSearchQuery, setDbPhraseSearchQuery] = useState('');
	const [isTestingAzureConnection, setIsTestingAzureConnection] = useState(false);
	const [azureTestResult, setAzureTestResult] = useState<{ success: boolean; message: string } | null>(null);

	const dbFileInputRef = useRef<HTMLInputElement>(null);

	const handleTestAzureConnection = async () => {
		if (!databaseSourceForm.azureEndpoint || !databaseSourceForm.azureSearchKey || !databaseSourceForm.azureIndexName) {
			setAzureTestResult({ success: false, message: 'Missing required Azure configuration fields.' });
			return;
		}

		setIsTestingAzureConnection(true);
		setAzureTestResult(null);

		try {
			const [results, count] = await Promise.all([
				searchAzureAISearch(
					databaseSourceForm.azureEndpoint!,
					databaseSourceForm.azureSearchKey!,
					databaseSourceForm.azureIndexName!,
					databaseSourceForm.azureContentField || 'content',
					databaseSourceForm.azureVectorField || 'content_vector',
					databaseSourceForm.azureEmbeddingModel || MultiModel.AZURE_TEXT_EMBED_2,
					'test connection',
					databaseSourceForm.azureTitleField,
					1
				),
				getAzureIndexCount(
					databaseSourceForm.azureEndpoint!,
					databaseSourceForm.azureSearchKey!,
					databaseSourceForm.azureIndexName!
				)
			]);
			setAzureTestResult({ success: true, message: `Successfully connected! Found ${results.length} results for test query. Index contains ${count} total records.` });
			setDatabaseSourceForm(prev => ({ ...prev, rowCount: count }));
		} catch (err: any) {
			setAzureTestResult({ success: false, message: `Connection failed: ${err.message}` });
		} finally {
			setIsTestingAzureConnection(false);
		}
	};

	const handleSaveDatabaseSource = async (e?: React.FormEvent) => {
		if (e) e.preventDefault();
		if (!databaseSourceForm.name) return;

		let rowCount = (databaseSourceForm.content || '').split('\n').filter(line => line.trim()).length;

		if (databaseSourceForm.type === 'azure_ai_search') {
			try {
				rowCount = await getAzureIndexCount(
					databaseSourceForm.azureEndpoint!,
					databaseSourceForm.azureSearchKey!,
					databaseSourceForm.azureIndexName!
				);
			} catch (err) {
				console.error("Failed to fetch Azure index count:", err);
				rowCount = 0;
			}
		}

		let dbToSave: DatabaseSource;

		if (selectedDatabaseSourceId && !isCreatingDatabaseSource) {
			const existing = databaseSources.find(db => db.id === selectedDatabaseSourceId);
			if (existing) {
				dbToSave = { ...existing, ...databaseSourceForm, rowCount } as DatabaseSource;
				setDatabaseSources(prev => prev.map(db => db.id === selectedDatabaseSourceId ? dbToSave : db));
			} else {
				return;
			}
		} else {
			dbToSave = {
				id: Math.random().toString(36).substr(2, 9),
				name: databaseSourceForm.name!,
				type: databaseSourceForm.type || 'csv_upload',
				content: databaseSourceForm.content || '',
				rowCount: rowCount,
				fileName: databaseSourceForm.fileName,
				createdAt: Date.now(),
				azureEndpoint: databaseSourceForm.azureEndpoint,
				azureIndexName: databaseSourceForm.azureIndexName,
				azureContentField: databaseSourceForm.azureContentField,
				azureVectorField: databaseSourceForm.azureVectorField,
				azureTitleField: databaseSourceForm.azureTitleField,
				azureEmbeddingModel: databaseSourceForm.azureEmbeddingModel,
				azureSearchKey: databaseSourceForm.azureSearchKey
			};
			setDatabaseSources(prev => [...prev, dbToSave]);
			setSelectedDatabaseSourceId(dbToSave.id);
		}

		const config = getCosmosConfig();
		if (config.endpoint && config.key && currentUser) {
			saveDatabaseSource(config, dbToSave!, currentUser).catch(console.error);
		}

		setIsCreatingDatabaseSource(false);
		setDatabaseSourceForm({ name: '', type: 'csv_upload', content: '', rowCount: 0, azureEndpoint: '', azureIndexName: '', azureContentField: '', azureVectorField: '', azureEmbeddingModel: MultiModel.AZURE_TEXT_EMBED_2, azureSearchKey: '' });
		setAzureTestResult(null);
	};

	const handleDbFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (event) => {
			const text = event.target?.result as string;
			const rowCount = text.split('\n').filter(line => line.trim()).length;
			setDatabaseSourceForm({
				...databaseSourceForm,
				content: text,
				fileName: file.name,
				name: databaseSourceForm.name || file.name.replace('.csv', ''),
				rowCount: rowCount
			});
		};
		reader.readAsText(file);
		if (dbFileInputRef.current) dbFileInputRef.current.value = '';
	};

	const initiateDeleteDatabaseSource = (id: string) => {
		setDbSourceToDelete(id);
	};

	const confirmDeleteDatabaseSource = () => {
		if (dbSourceToDelete) {
			const config = getCosmosConfig();
			if (config.endpoint && config.key && currentUser) {
				deleteDatabaseSource(config, dbSourceToDelete, currentUser).catch(console.error);
			}
			setDatabaseSources(prev => prev.filter(db => db.id !== dbSourceToDelete));
			if (selectedDatabaseSourceId === dbSourceToDelete) setSelectedDatabaseSourceId(null);
			setDbSourceToDelete(null);
		}
	};

	const startEditDatabaseSource = (db: DatabaseSource) => {
		setSelectedDatabaseSourceId(db.id);
		setIsCreatingDatabaseSource(false);
		setDatabaseSourceForm({ ...db });
		setDbPhraseSearchQuery('');
		setAzureTestResult(null);
	};

	const phrases = (databaseSourceForm.content || '').split('\n').filter(l => l.trim());

	const parseCsv = (content: string) => {
		const lines = content.split('\n').filter(l => l.trim());
		if (lines.length === 0) return { headers: [], rows: [] };
		const headers = lines[0].split(',').map(h => h.trim());
		const rows = lines.slice(1).map(l => {
			const cells: string[] = [];
			let currentCell = '';
			let inQuotes = false;
			for (let i = 0; i < l.length; i++) {
				const char = l[i];
				if (char === '"') {
					inQuotes = !inQuotes;
				} else if (char === ',' && !inQuotes) {
					cells.push(currentCell.trim());
					currentCell = '';
				} else {
					currentCell += char;
				}
			}
			cells.push(currentCell.trim());
			return cells;
		});
		return { headers, rows };
	};

	const csvData = useMemo(() => {
		if (databaseSourceForm.type === 'csv_upload') {
			return parseCsv(databaseSourceForm.content || '');
		}
		return { headers: ['Record Content'], rows: phrases.map(p => [p]) };
	}, [databaseSourceForm.content, databaseSourceForm.type, phrases]);

	const filteredRows = csvData.rows.filter(row =>
		row.some(cell => cell.toLowerCase().includes(dbPhraseSearchQuery.toLowerCase()))
	);

	return {
		isDatabaseSourcesOpen,
		setIsDatabaseSourcesOpen,
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
	};
};
