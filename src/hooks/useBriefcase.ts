import { useState, useRef, useCallback, useMemo } from 'react';
import { AttachedFile, Message, ChatSession, DatabaseSource, MultiModel } from '../types/index';
import { getResultsExtractionsFromDocuments, getResultsFromDocuments, getComparisonFromContent, getResultsClausesFromDocuments, getTranslationFromDocuments, removeDocumentCache, getContentFromDocuments, setDocumentCache, getDocumentCache } from '../services/conversationalModelService';

interface UseBriefcaseProps {
	messages: Message[];
	setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
	currentSessionId: string | null;
	setCurrentSessionId: (id: string | null) => void;
	setSessions: React.Dispatch<React.SetStateAction<ChatSession[]>>;
	folders: any[];
	currentFolderViewId: string | null;
	setCurrentFolderViewId: (id: string | null) => void;
	selectedPersonaId: string | null;
	userDisplayName: string;
	currentUser: string;
	databaseSources: DatabaseSource[];
	setIsGenerating: (isGenerating: boolean) => void;
	cachedFileIdsRef: React.MutableRefObject<Set<string>>;
}

export const useBriefcase = ({
	messages,
	setMessages,
	currentSessionId,
	setCurrentSessionId,
	setSessions,
	folders,
	currentFolderViewId,
	setCurrentFolderViewId,
	selectedPersonaId,
	userDisplayName,
	currentUser,
	databaseSources,
	setIsGenerating,
	cachedFileIdsRef
}: UseBriefcaseProps) => {
	const [isBriefcaseOpen, setIsBriefcaseOpen] = useState(false);
	const [isBriefcaseDragOver, setIsBriefcaseDragOver] = useState(false);
	const [isBriefcaseUploading, setIsBriefcaseUploading] = useState(false);
	const [selectedBriefcaseFiles, setSelectedBriefcaseFiles] = useState<Set<string>>(new Set());
	const [activeBriefcaseTool, setActiveBriefcaseTool] = useState<'summarize' | 'extract' | 'compare' | 'db_search' | 'translate' | null>(null);
	const [briefcaseExtractQuery, setBriefcaseExtractQuery] = useState('');
	const [briefcaseExtractPreset, setBriefcaseExtractPreset] = useState('');
	const [briefcaseCompareMode, setBriefcaseCompareMode] = useState<'diff' | 'sim'>('diff');
	const [briefcaseDbSourceId, setBriefcaseDbSourceId] = useState('');
	const [briefcaseTargetLang, setBriefcaseTargetLang] = useState('');
	const [analysisProgress, setAnalysisProgress] = useState(0);
	const [attachmentToDelete, setAttachmentToDelete] = useState<AttachedFile | null>(null);

	const briefcaseFileInputRef = useRef<HTMLInputElement>(null);

	const allSessionAttachments = useMemo(() => {
		return messages.flatMap(m => m.attachments || []);
	}, [messages]);

	const initiateDeleteAttachment = (att: AttachedFile) => {
		setAttachmentToDelete(att);
	};

	const confirmDeleteAttachment = useCallback(() => {
		if (!attachmentToDelete) return;

		if (cachedFileIdsRef.current.has(attachmentToDelete.id)) {
			removeDocumentCache(attachmentToDelete.id);
			cachedFileIdsRef.current.delete(attachmentToDelete.id);
		}

		setMessages(prev => prev.map(msg => ({
			...msg,
			attachments: msg.attachments?.filter(a => a.id !== attachmentToDelete.id)
		})));

		if (currentSessionId) {
			setSessions(prev => prev.map(s => s.id === currentSessionId ? {
				...s,
				messages: s.messages.map(msg => ({
					...msg,
					attachments: msg.attachments?.filter(a => a.id !== attachmentToDelete.id)
				}))
			} : s));
		}

		setAttachmentToDelete(null);
	}, [attachmentToDelete, currentSessionId, setMessages, setSessions, cachedFileIdsRef]);

	const handleBriefcaseDrop = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsBriefcaseDragOver(false);
		const files = e.dataTransfer.files;

		if (!files || files.length === 0) return;

		setIsBriefcaseUploading(true);

		const newAttachments: AttachedFile[] = [];
		const promises = Array.from(files).map((file: File) => {
			return new Promise<void>((resolve) => {
				const reader = new FileReader();
				reader.onload = (event) => {
					const base64 = event.target?.result as string;
					newAttachments.push({
						id: Math.random().toString(36).substr(2, 9),
						name: file.name,
						type: file.type,
						base64: base64,
						excludeFromContext: true
					});
					resolve();
				};
				reader.readAsDataURL(file);
			});
		});

		Promise.all(promises).then(async () => {
			if (newAttachments.length > 0) {
				let omissionNotice = '';
				try {
					const processed = await getContentFromDocuments(newAttachments);
					if (Array.isArray(processed)) {
						processed.forEach((meta: any) => {
							const index = newAttachments.findIndex(att => att.name === meta.filename);
							if (index !== -1) {
								newAttachments[index] = {
									...newAttachments[index],
									content: meta.content,
									statistics: meta.statistics
								};
							}
						});
					}
				} catch (err) {
					console.error("Error processing documents", err);
				}

				const largeFiles = newAttachments.filter(att => att.statistics && att.statistics.words && att.statistics.words > 10000);
				if (largeFiles.length > 0) {
					await Promise.all(largeFiles.map(async (f) => {
						if (f.content) {
							await setDocumentCache(f.id, f.content);
							f.content = undefined;
						}
					}));
					const fileList = largeFiles.map(f => `**${f.name}**`).join(', ');
					omissionNotice = `\n\n> **Document Limit Notice**: The following documents exceed the word limit (10,000 words) and were not added to the conversation context: ${fileList}. They are available for analysis in the **Document Briefcase**.`;
				}

				const effectiveUser = currentUser || (typeof window !== 'undefined' ? localStorage.getItem('chat_username') : undefined) || undefined;
				const fileCount = newAttachments.length;

				const newMessage: Message = {
					id: Date.now().toString(),
					role: 'user',
					isSystem: true,
					content: `**Document Briefcase Upload**\nAdded ${fileCount} ${fileCount === 1 ? 'file' : 'files'} to the conversation.${omissionNotice}`,
					userName: userDisplayName || effectiveUser,
					userId: effectiveUser,
					attachments: newAttachments
				};
				setMessages(prev => [...prev, newMessage]);
				if (currentSessionId) {
					setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, newMessage] } : s));
				} else {
					const newSessionId = Date.now().toString();
					const activeFolder = folders.find(f => f.id === currentFolderViewId);
					const newSession: ChatSession = {
						id: newSessionId,
						title: 'New Conversation (Briefcase)',
						timestamp: Date.now(),
						messages: [newMessage],
						folderId: currentFolderViewId || undefined,
						personaId: selectedPersonaId || undefined,
						isShared: activeFolder?.isShared,
						groupId: activeFolder?.isShared ? activeFolder.id : undefined
					};

					setCurrentSessionId(newSessionId);
					setSessions(prev => [newSession, ...prev]);
					if (currentFolderViewId) setCurrentFolderViewId(null);
				}
			}
			setIsBriefcaseUploading(false);
		});
	}, [currentSessionId, currentUser, userDisplayName, folders, currentFolderViewId, selectedPersonaId, setMessages, setSessions, setCurrentSessionId, setCurrentFolderViewId]);

	const handleBriefcaseFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files || files.length === 0) return;

		setIsBriefcaseUploading(true);

		const newAttachments: AttachedFile[] = [];
		const promises = Array.from(files).map((file: File) => {
			return new Promise<void>((resolve) => {
				const reader = new FileReader();
				reader.onload = (event) => {
					const base64 = event.target?.result as string;
					newAttachments.push({
						id: Math.random().toString(36).substr(2, 9),
						name: file.name,
						type: file.type,
						base64: base64,
						excludeFromContext: true
					});
					resolve();
				};
				reader.readAsDataURL(file);
			});
		});

		Promise.all(promises).then(async () => {
			if (newAttachments.length > 0) {
				let omissionNotice = '';
				try {
					const processed = await getContentFromDocuments(newAttachments);
					if (Array.isArray(processed)) {
						processed.forEach((meta: any) => {
							const index = newAttachments.findIndex(att => att.name === meta.filename);
							if (index !== -1) {
								newAttachments[index] = {
									...newAttachments[index],
									content: meta.content,
									statistics: meta.statistics
								};
							}
						});
					}
				} catch (err) {
					console.error("Error processing documents", err);
				}

				const largeFiles = newAttachments.filter(att => att.statistics && att.statistics.words && att.statistics.words > 10000);
				if (largeFiles.length > 0) {
					await Promise.all(largeFiles.map(async (f) => {
						if (f.content) {
							await setDocumentCache(f.id, f.content);
							f.content = undefined;
						}
					}));
					const fileList = largeFiles.map(f => `**${f.name}**`).join(', ');
					omissionNotice = `\n\n> **Document Limit Notice**: The following documents exceed the word limit (10,000 words) and were not added to the conversation context: ${fileList}. They are available for analysis in the **Document Briefcase**.`;
				}

				const effectiveUser = currentUser || (typeof window !== 'undefined' ? localStorage.getItem('chat_username') : undefined) || undefined;
				const fileCount = newAttachments.length;

				const newMessage: Message = {
					id: Date.now().toString(),
					role: 'user',
					isSystem: true,
					content: `**Document Briefcase Upload**\nAdded ${fileCount} ${fileCount === 1 ? 'file' : 'files'} to the conversation.${omissionNotice}`,
					userName: userDisplayName || effectiveUser,
					userId: effectiveUser,
					attachments: newAttachments
				};
				setMessages(prev => [...prev, newMessage]);
				if (currentSessionId) {
					setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, newMessage] } : s));
				} else {
					const newSessionId = Date.now().toString();
					const activeFolder = folders.find(f => f.id === currentFolderViewId);
					const newSession: ChatSession = {
						id: newSessionId,
						title: 'New Conversation (Briefcase)',
						timestamp: Date.now(),
						messages: [newMessage],
						folderId: currentFolderViewId || undefined,
						personaId: selectedPersonaId || undefined,
						isShared: activeFolder?.isShared,
						groupId: activeFolder?.isShared ? activeFolder.id : undefined
					};

					setCurrentSessionId(newSessionId);
					setSessions(prev => [newSession, ...prev]);
					if (currentFolderViewId) setCurrentFolderViewId(null);
				}
			}
			setIsBriefcaseUploading(false);
			if (briefcaseFileInputRef.current) briefcaseFileInputRef.current.value = '';
		});
	}, [currentSessionId, currentUser, userDisplayName, folders, currentFolderViewId, selectedPersonaId, setMessages, setSessions, setCurrentSessionId, setCurrentFolderViewId]);

	const handleRunAnalysis = async () => {
		if (!activeBriefcaseTool || selectedBriefcaseFiles.size === 0) return;

		setIsGenerating(true);
		setAnalysisProgress(0);

		const simulateProgress = () => {
			let p = 0;
			const interval = setInterval(() => {
				p++;
				setAnalysisProgress(p);
				if (p >= 4) clearInterval(interval);
			}, 800);
			return interval;
		};

		const progressInterval = simulateProgress();

		const loadedFiles = await Promise.all(allSessionAttachments
			.filter(a => selectedBriefcaseFiles.has(a.id))
			.map(async (a) => {
				const file = { ...a };
				if (!file.content) {
					try {
						const cached = await getDocumentCache(file.id);
						if (cached && cached.value) {
							file.content = cached.value;
						} else if (typeof cached === 'string') {
							file.content = cached;
						}
					} catch (err) {
						console.error(`Failed to hydrate content for ${file.name}`, err);
					}
				}
				return file;
			}));
		const effectiveUser = currentUser || (typeof window !== 'undefined' ? localStorage.getItem('chat_username') : undefined) || undefined;

		try {
			switch (activeBriefcaseTool) {
				case 'summarize':
					try {
						const prompt = "Please provide a detailed summary of the attached documents. Focus on key insights, main topics, and important details.";
						const summaries = await getResultsFromDocuments(prompt, loadedFiles);

						let summaryData = summaries;
						if (summaries && !Array.isArray(summaries) && (summaries as any).results) {
							summaryData = (summaries as any).results;
						}

						if (!Array.isArray(summaryData)) {
							console.error("Invalid summary format:", summaries);
							throw new Error("Invalid summary format received from server.");
						}

						const summaryText = summaryData.map((item: any) => {
							const name = item.fileName || 'Document';
							const contents = item.contents;

							let contentBlock = "";
							if (Array.isArray(contents) && contents.length > 0) {
								contentBlock = contents.map((row: any) => row.content?.replace(/\n/g, ' ') || '').join('\n\n');
							} else {
								contentBlock = "_No summary content generated._";
							}

							return `### ${name}\n\n${contentBlock}`;
						}).join('\n\n---\n\n');

						const summaryMessage: Message = {
							id: Date.now().toString(),
							role: 'user',
							isSystem: true,
							content: `**Document Summary**\n\n${summaryText}`,
							userName: userDisplayName || effectiveUser,
							userId: effectiveUser
						};

						setMessages(prev => [...prev, summaryMessage]);
						if (currentSessionId) {
							setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, summaryMessage] } : s));
						}
					} catch (err) {
						console.error("Summary error", err);
					}
					break;
				case 'extract':
					if (!briefcaseExtractQuery.trim()) { setIsGenerating(false); return; }

					const promptExtract = `Please extract the following information from the documents: "${briefcaseExtractQuery}". Present the extracted data in a clear, structured format.`;
					let extractionResults: any = [];

					try {
						if (briefcaseExtractPreset) {
							extractionResults = await getResultsExtractionsFromDocuments(promptExtract, loadedFiles);

							let extractionData = extractionResults;
							if (extractionResults && !Array.isArray(extractionResults) && (extractionResults as any).extractions) {
								extractionData = (extractionResults as any).extractions;
							}

							if (!Array.isArray(extractionData)) {
								console.error("Invalid extraction format:", extractionResults);
								throw new Error("Invalid extraction format received from server.");
							}

							const extractionText = extractionData.map((item: any) => {
								const name = item.fileName || 'Document';
								const text = item.extraction || "_No extracted content._";
								return `### ${name}\n\n${text}`;
							}).join('\n\n---\n\n');

							const extractionMessage: Message = {
								id: Date.now().toString(),
								role: 'user',
								isSystem: true,
								content: `**Document Extraction (${briefcaseExtractQuery})**\n\n${extractionText}`,
								userName: userDisplayName || effectiveUser,
								userId: effectiveUser
							};

							setMessages(prev => [...prev, extractionMessage]);
							if (currentSessionId) {
								setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, extractionMessage] } : s));
							}
						} else {
							extractionResults = await getResultsFromDocuments(promptExtract, loadedFiles);

							let extractionData = extractionResults;
							if (extractionResults && !Array.isArray(extractionResults) && (extractionResults as any).results) {
								extractionData = (extractionResults as any).results;
							}

							if (!Array.isArray(extractionData)) {
								console.error("Invalid extraction format:", extractionResults);
								throw new Error("Invalid extraction format received from server.");
							}

							const extractionText = extractionData.map((item: any) => {
								const name = item.fileName || 'Document';
								const contents = item.contents;

								let contentBlock = "";
								if (Array.isArray(contents) && contents.length > 0) {
									contentBlock = "| Content | Similarity |\n|---|---|\n" +
										contents.map((row: any) => `| ${row.content?.replace(/\n/g, ' ') || ''} | ${row.similarity || ''} |`).join('\n');
								} else {
									contentBlock = "_No matching content found._";
								}

								return `### ${name}\n\n${contentBlock}`;
							}).join('\n\n---\n\n');

							const extractionMessage: Message = {
								id: Date.now().toString(),
								role: 'user',
								isSystem: true,
								content: `**Document Extraction (${briefcaseExtractQuery})**\n\n${extractionText}`,
								userName: userDisplayName || effectiveUser,
								userId: effectiveUser
							};

							setMessages(prev => [...prev, extractionMessage]);
							if (currentSessionId) {
								setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, extractionMessage] } : s));
							}
						}
					} catch (err) {
						console.error("Extraction error", err);
					}
					break;
				case 'compare':
					const mode = briefcaseCompareMode === 'diff' ? 'differences' : 'similarities';
					const comparePrompt = `Please analyze the ${mode} between the attached documents. Compare them point-by-point and highlight significant ${briefcaseCompareMode === 'diff' ? 'divergences' : 'overlaps'}.`;

					try {
						const comparisons = await getComparisonFromContent(comparePrompt, loadedFiles);

						const comparisonText = (comparisons as any).result || (comparisons as any).comparison || (comparisons as any).content || (typeof comparisons === 'string' ? comparisons : JSON.stringify(comparisons));

						const comparisonMessage: Message = {
							id: Date.now().toString(),
							role: 'user',
							isSystem: true,
							content: `**Document Comparison (${mode})**\n\n${comparisonText}`,
							userName: userDisplayName || effectiveUser,
							userId: effectiveUser
						};

						setMessages(prev => [...prev, comparisonMessage]);
						if (currentSessionId) {
							setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, comparisonMessage] } : s));
						}
					} catch (err) {
						console.error("Comparison error", err);
					}
					break;
				case 'db_search':
					if (!briefcaseDbSourceId) { setIsGenerating(false); return; }
					const db = databaseSources.find(d => d.id === briefcaseDbSourceId);
					if (!db) { setIsGenerating(false); return; }

					try {
						const clauses = db.content ? db.content.split('\n').filter(line => line.trim() !== '') : [];

						if (clauses.length === 0) {
							console.error("Database source has no content");
							setIsGenerating(false);
							return;
						}

						const similarity = 0.75;
						const dbResults = await getResultsClausesFromDocuments(clauses, loadedFiles, similarity);

						if (!Array.isArray(dbResults)) {
							throw new Error("Invalid results format received from server.");
						}

						const dbResultsText = dbResults.map((item: any) => {
							const name = item.fileName || 'Document';
							const contents = item.contents;

							let contentBlock = "";
							if (Array.isArray(contents) && contents.length > 0) {
								const filteredContents = contents.filter((row: any) => (typeof row.similarity === 'number' && row.similarity >= similarity));

								if (filteredContents.length > 0) {
									contentBlock = "| Content | Similarity |\n|---|---|\n" +
										filteredContents.map((row: any) => `| ${row.clause?.replace(/\n/g, ' ') || ''} | ${row.similarity || ''} |`).join('\n');
								} else {
									contentBlock = "_No matching content found above threshold._";
								}
							} else {
								contentBlock = "_No matching content found._";
							}

							return `### ${name}\n\n${contentBlock}`;
						}).join('\n\n---\n\n');

						const dbMessage: Message = {
							id: Date.now().toString(),
							role: 'user',
							isSystem: true,
							content: `**Database Analysis (${db.name})**\n\n${dbResultsText}`,
							userName: userDisplayName || effectiveUser,
							userId: effectiveUser
						};

						setMessages(prev => [...prev, dbMessage]);
						if (currentSessionId) {
							setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, dbMessage] } : s));
						}
					} catch (err) {
						console.error("DB Search error", err);
					}
					break;
				case 'translate':
					if (!briefcaseTargetLang.trim()) { setIsGenerating(false); return; }

					try {
						const translatePrompt = `Please translate the content of the attached documents into ${briefcaseTargetLang}. Maintain the original formatting and tone.`;
						const translations = await getTranslationFromDocuments(translatePrompt, loadedFiles);

						let translationData = translations;
						if (translations && !Array.isArray(translations) && (translations as any).translations) {
							translationData = (translations as any).translations;
						}

						if (!Array.isArray(translationData)) {
							console.error("Invalid translation format:", translations);
							throw new Error("Invalid translation format received from server.");
						}

						const translationText = translationData.map((t: any) => {
							const name = t.fileName || 'Document';
							const text = t.translation || t.content || t.text || (typeof t === 'string' ? t : JSON.stringify(t));
							return `### ${name} (${briefcaseTargetLang})\n${text}`;
						}).join('\n\n---\n\n');

						const translationMessage: Message = {
							id: Date.now().toString(),
							role: 'user',
							isSystem: true,
							content: `**Document Translation (${briefcaseTargetLang})**\n\n${translationText}`,
							userName: userDisplayName || effectiveUser,
							userId: effectiveUser
						};

						setMessages(prev => [...prev, translationMessage]);
						if (currentSessionId) {
							setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, translationMessage] } : s));
						}
					} catch (err) {
						console.error("Translation error", err);
					}
					break;
			}
		} finally {
			clearInterval(progressInterval);
			setIsGenerating(false);
			setIsBriefcaseOpen(false);
		}
	};

	return {
		isBriefcaseOpen,
		setIsBriefcaseOpen,
		isBriefcaseDragOver,
		setIsBriefcaseDragOver,
		isBriefcaseUploading,
		setIsBriefcaseUploading,
		selectedBriefcaseFiles,
		setSelectedBriefcaseFiles,
		activeBriefcaseTool,
		setActiveBriefcaseTool,
		briefcaseExtractQuery,
		setBriefcaseExtractQuery,
		briefcaseExtractPreset,
		setBriefcaseExtractPreset,
		briefcaseCompareMode,
		setBriefcaseCompareMode,
		briefcaseDbSourceId,
		setBriefcaseDbSourceId,
		briefcaseTargetLang,
		setBriefcaseTargetLang,
		analysisProgress,
		setAnalysisProgress,

		briefcaseFileInputRef,
		allSessionAttachments,
		attachmentToDelete,

		handleBriefcaseDrop,
		handleBriefcaseFileSelect,
		handleRunAnalysis,
		initiateDeleteAttachment,
		confirmDeleteAttachment,
		setAttachmentToDelete
	};
};
