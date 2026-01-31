import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { useWorkflowBuilder } from './hooks/useWorkflowBuilder';
import { useDatabaseSources } from './hooks/useDatabaseSources';
import { usePromptLibrary } from './hooks/usePromptLibrary';
import { useBriefcase } from './hooks/useBriefcase';
import { useCanvas } from './hooks/useCanvas';
import ReactMarkdown from 'react-markdown';
import { marked } from 'marked';
import remarkGfm from 'remark-gfm';
import {
	Send, Paperclip, Cpu, ChevronDown, ChevronRight, Box, Check, FileText, X, Bot, Menu, SquarePen, ArrowDown, Copy, Download, CheckCheck, Share, Trash2,
	Edit2, FileJson, Folder as FolderIcon, FolderOpen, FolderPlus, Plus, MessageSquare, Sparkles, RefreshCw, Maximize2, Minimize2, List, History, Mic,
	Layout, Sun, Moon, UserCircle, Book, Search, PlusCircle, Heart, Workflow as WorkflowIcon, Activity, UploadCloud, FileDown, Database, ShieldCheck, Briefcase,
	Loader2, Users, LogOut, User, Pin, PinOff
} from 'lucide-react';
import { AVAILABLE_MODELS, MCP_SERVER_CONFIGS, DEFAULT_PERSONAS, DEFAULT_LIBRARY_PROMPTS, SUGGESTIONS } from './config/constants';
import { MultiModel, Message, AttachedFile, MCPTool, ModelResponse, ChatSession, Folder, Persona, LibraryPrompt, Workflow, DatabaseSource } from './types/index';
import { copyToClipboard, getCookie, setCookie } from './utils/chatUtils';
import { generateModelResponse, searchAzureAISearch } from './services/multiModelService';
import { saveSharedSession, getSharedSession, listSharedSessions, deleteSharedSession, saveFolder, deleteFolder, listFolders, savePersona, deletePersona, listPersonas, listLibraryPrompts, listWorkflows, listDatabaseSources, CosmosConfig } from './services/cosmosService';
import { getContentFromWebsite, getContentFromDocuments, getContentForWord, getContentForPDF, getContentForPowerPoint, removeDocumentCache, setDocumentCache } from './services/conversationalModelService';
import Admin from './components/Admin';
import Profile from './components/Profile';
import CodeBlock from './components/CodeBlock';
import PreBlock from './components/PreBlock';
import ChatInput from './components/ChatInput';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import ResponseFooter from './components/ResponseFooter';
import WorkflowSystemFooter from './components/WorkflowSystemFooter';
import PersonaModal from './components/PersonaModal';
import BranchingModal from './components/BranchingModal';
import MoveToModal from './components/MoveToModal';
import ToastNotification from './components/ToastNotification';
import WorkflowBuilderModal from './components/WorkflowBuilderModal';
import ServerConnector from './components/ServerConnector';
import DatabaseSourcesModal from './components/DatabaseSourcesModal';
import PromptLibraryModal from './components/PromptLibraryModal';
import BriefcasePanel from './components/BriefcasePanel';
import CanvasEditor from './components/CanvasEditor';
import { loginRequest } from './config/authConfig';

const useSafeMsal = () => {
	if (process.env.USE_MSAL === 'true') {
		return useMsal();
	}
	return { instance: null, accounts: [], inProgress: "none" };
};

const useSafeIsAuthenticated = () => {
	if (process.env.USE_MSAL === 'true') {
		return useIsAuthenticated();
	}
	return false;
};

const App = () => {
	const { instance, accounts } = useSafeMsal() as any;
	const isAuthenticated = useSafeIsAuthenticated();

	const [currentView, setCurrentView] = useState<'chat' | 'admin' | 'profile'>('chat');
	const [sessions, setSessions] = useState<ChatSession[]>([]);
	const [folders, setFolders] = useState<Folder[]>([]);
	const [currentSessionId, setCurrentSessionId] = useState<string | null>(() => {
		if (typeof window !== 'undefined') {
			const params = new URLSearchParams(window.location.search);
			return params.get('session');
		}
		return null;
	});

	const [workflows, setWorkflows] = useState<Workflow[]>([]);
	const [userGroups, setUserGroups] = useState<string[]>([]);

	const [currentUser, setCurrentUser] = useState<string>(() => {
		if (process.env.USE_MSAL === 'true') {
			if (typeof window !== 'undefined') {
				const storedUsername = localStorage.getItem('chat_username');
				if (storedUsername && storedUsername !== 'default_user') {
					return storedUsername;
				}
			}
			return '';
		}

		return 'default_user';
	});

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
	} = useWorkflowBuilder({ workflows, setWorkflows, currentUser });

	const [currentFolderViewId, setCurrentFolderViewId] = useState<string | null>(() => {
		if (typeof window !== 'undefined') {
			const params = new URLSearchParams(window.location.search);
			return params.get('folder');
		}
		return null;
	});
	const [messages, setMessages] = useState<Message[]>([]);
	const [readOnlyMode, setReadOnlyMode] = useState(() => {
		if (typeof window !== 'undefined') {
			const params = new URLSearchParams(window.location.search);
			return params.has('share');
		}
		return false;
	});
	const [isIdle, setIsIdle] = useState(false);

	useEffect(() => {
		let timer: any;
		const resetTimer = () => {
			setIsIdle(false);
			clearTimeout(timer);
			timer = setTimeout(() => setIsIdle(true), 30000);
		};
		window.addEventListener('mousemove', resetTimer);
		window.addEventListener('keydown', resetTimer);
		window.addEventListener('click', resetTimer);
		window.addEventListener('scroll', resetTimer);
		resetTimer();
		return () => {
			clearTimeout(timer);
			window.removeEventListener('mousemove', resetTimer);
			window.removeEventListener('keydown', resetTimer);
			window.removeEventListener('click', resetTimer);
			window.removeEventListener('scroll', resetTimer);
		};
	}, []);

	useEffect(() => {
		const fetchUserGroups = async () => {
			if (process.env.USE_MSAL !== 'true' || !isAuthenticated || !instance || !accounts[0]) return;

			try {
				const response = await instance.acquireTokenSilent({
					...loginRequest,
					account: accounts[0]
				});

				const headers = new Headers();
				const bearer = `Bearer ${response.accessToken}`;
				headers.append("Authorization", bearer);

				const options = {
					method: "GET",
					headers: headers
				};

				const graphResponse = await fetch("https://graph.microsoft.com/v1.0/me/transitiveMemberOf/microsoft.graph.group?$select=id,displayName", options);

				if (graphResponse.ok) {
					const data = await graphResponse.json();
					if (data.value) {
						// @ts-ignore
						const ids = data.value.map(g => g.id);
						// @ts-ignore
						const names = data.value.map(g => g.displayName);
						setUserGroups([...ids, ...names].filter(Boolean));
					}
				}
			} catch (err) {
				console.error("Failed to fetch user groups from Graph:", err);
			}
		};

		fetchUserGroups();
	}, [isAuthenticated, instance, accounts]);

	const [isShareLoading, setIsShareLoading] = useState(() => {
		if (typeof window !== 'undefined') {
			const params = new URLSearchParams(window.location.search);
			return params.has('share');
		}
		return false;
	});

	const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
	const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
	const [editTitle, setEditTitle] = useState('');
	const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
	const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
	const [folderEditTitle, setFolderEditTitle] = useState('');
	const [folderToDelete, setFolderToDelete] = useState<string | null>(null);
	const [branchingData, setBranchingData] = useState<{ messageId: string, model: MultiModel, continueWorkflow?: boolean } | null>(null);
	const [branchTitle, setBranchTitle] = useState('');
	const [moveToSessionId, setMoveToSessionId] = useState<string | null>(null);
	const [newFolderName, setNewFolderName] = useState('');
	const [regenMenuOpen, setRegenMenuOpen] = useState<{ msgId: string, model: string } | null>(null);
	const [isOutlineOpen, setIsOutlineOpen] = useState(false);
	const cachedFileIdsRef = useRef<Set<string>>(new Set());
	const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const [input, setInput] = useState('');
	const [selectedModels, setSelectedModels] = useState<MultiModel[]>([MultiModel.FLASH_3]);
	const [attachments, setAttachments] = useState<AttachedFile[]>([]);
	const [selectedTools, setSelectedTools] = useState<MCPTool[]>([]);
	const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
	const [isMCPSelectorOpen, setIsMCPSelectorOpen] = useState(false);
	const [isSidebarOpen, setIsSidebarOpen] = useState(true);
	const [isGenerating, setIsGenerating] = useState(false);
	const [showScrollButton, setShowScrollButton] = useState(false);
	const [guidedPromptMessage, setGuidedPromptMessage] = useState<string | null>(null);
	const [isListening, setIsListening] = useState(false);

	const [landingView, setLandingView] = useState<'home' | 'welcome'>(() => {
		if (typeof window !== 'undefined' && process.env.USE_MSAL === 'true') {
			return 'welcome';
		}
		return 'home';
	});

	const [personas, setPersonas] = useState<Persona[]>([]);
	const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
	const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);
	const [editingPersonaId, setEditingPersonaId] = useState<string | null>(null);
	const [personaForm, setPersonaForm] = useState<Partial<Persona>>({ name: '', description: '', systemInstruction: '', multiStepInstruction: '' });
	const [personaToDelete, setPersonaToDelete] = useState<string | null>(null);
	const [isPersonaQuickViewOpen, setIsPersonaQuickViewOpen] = useState(false);
	const [quickPersonaSearch, setQuickPersonaSearch] = useState('');
	const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
	const [responseToDelete, setResponseToDelete] = useState<{ messageId: string, model: MultiModel } | null>(null);

	const [libraryPrompts, setLibraryPrompts] = useState<LibraryPrompt[]>([]);

	const {
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
	} = usePromptLibrary({ libraryPrompts, setLibraryPrompts, currentUser });

	const [databaseSources, setDatabaseSources] = useState<DatabaseSource[]>([]);

	const {
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
	} = useDatabaseSources({ databaseSources, setDatabaseSources, currentUser });

	const [serverTools, setServerTools] = useState<Record<string, MCPTool[]>>({});
	const serverToolsRef = useRef(serverTools);
	const sessionsRef = useRef(sessions);
	const workflowsRef = useRef(workflows);
	const databaseSourcesRef = useRef(databaseSources);
	const guidedPromptMessageRef = useRef(guidedPromptMessage);

	useEffect(() => {
		sessionsRef.current = sessions;
		workflowsRef.current = workflows;
		databaseSourcesRef.current = databaseSources;
		serverToolsRef.current = serverTools;
		guidedPromptMessageRef.current = guidedPromptMessage;
	}, [sessions, workflows, databaseSources, serverTools, guidedPromptMessage]);

	const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null);

	const [isChatSearchActive, setIsChatSearchActive] = useState(false);
	const [chatSearchQuery, setChatSearchQuery] = useState('');

	const [userDisplayName, setUserDisplayName] = useState<string>(() => {
		if (typeof window !== 'undefined') {
			return localStorage.getItem('chat_display_name') || localStorage.getItem('chat_username') || '';
		}
		return '';
	});
	const [isNameModalOpen, setIsNameModalOpen] = useState(false);
	const [isInviteCopied, setIsInviteCopied] = useState(false);
	const [isUploading, setIsUploading] = useState(false);

	const briefcase = useBriefcase({
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
	});

	const {
		isBriefcaseOpen, setIsBriefcaseOpen,
		isBriefcaseDragOver, setIsBriefcaseDragOver,
		isBriefcaseUploading, setIsBriefcaseUploading,
		selectedBriefcaseFiles, setSelectedBriefcaseFiles,
		activeBriefcaseTool, setActiveBriefcaseTool,
		briefcaseExtractQuery, setBriefcaseExtractQuery,
		briefcaseExtractPreset, setBriefcaseExtractPreset,
		briefcaseCompareMode, setBriefcaseCompareMode,
		briefcaseDbSourceId, setBriefcaseDbSourceId,
		briefcaseTargetLang, setBriefcaseTargetLang,
		briefcaseFileInputRef,
		handleBriefcaseDrop,
		handleBriefcaseFileSelect,
		handleRunAnalysis
	} = briefcase;

	const {
		isCanvasOpen,
		setIsCanvasOpen,
		canvasBlocks,
		activeAiBlockId,
		setActiveAiBlockId,
		addCanvasBlock,
		updateCanvasBlock,
		moveCanvasBlock,
		removeCanvasBlock,
		closeCanvas,
		openCanvas,
		generateWordDoc
	} = useCanvas({ messages, currentSessionId, sessions });

	const [activeGroupId, setActiveGroupId] = useState<string | null>(() => {
		if (typeof window !== 'undefined') {
			const params = new URLSearchParams(window.location.search);
			return params.get('group');
		}
		return null;
	});

	const [theme, setTheme] = useState<'light' | 'dark'>(() => {
		if (typeof window !== 'undefined') {
			const cookieTheme = getCookie('theme') as 'light' | 'dark';
			if (cookieTheme) return cookieTheme;

			if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';

			return 'light';
		}

		return 'dark';
	});

	const getCosmosConfig = useCallback((): CosmosConfig => {
		const config = {
			endpoint: localStorage.getItem('azure_cosmos_endpoint') || process.env.AZURE_COSMOS_ENDPOINT || '',
			key: localStorage.getItem('azure_cosmos_key') || process.env.AZURE_COSMOS_KEY || '',
			databaseId: localStorage.getItem('azure_cosmos_db_id') || process.env.AZURE_COSMOS_DB_ID || 'ConversationDB'
		};

		return config;
	}, []);

	const chatEndRef = useRef<HTMLDivElement>(null);
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const modelMenuRef = useRef<HTMLDivElement>(null);
	const mcpMenuRef = useRef<HTMLDivElement>(null);
	const regenMenuRef = useRef<HTMLDivElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const messagesRef = useRef<Message[]>([]);
	const unsavedChangesRef = useRef(false);
	const lastScheduledSessionRef = useRef<ChatSession | null>(null);

	const handleToolsLoaded = useCallback((serverId: string, tools: MCPTool[]) => {
		setServerTools(prev => {
			if (JSON.stringify(prev[serverId]) === JSON.stringify(tools)) return prev;
			return { ...prev, [serverId]: tools };
		});
	}, []);

	useEffect(() => {
		if (input === '' && textareaRef.current) {
			textareaRef.current.style.height = 'auto';
		}
	}, [input]);

	useEffect(() => {
		document.documentElement.setAttribute('data-theme', theme);
	}, [theme]);

	useEffect(() => {
		if (process.env.USE_MSAL === 'true' && isAuthenticated && accounts.length > 0) {
			const account = accounts[0];
			const username = account.name || account.username || 'azure_user';
			if (username !== currentUser) {
				setCurrentUser(username);
				if (typeof window !== 'undefined') {
					localStorage.setItem('chat_username', username);
				}
			}
		}
	}, [isAuthenticated, accounts, currentUser]);

	useEffect(() => {
		if (process.env.USE_MSAL === 'true' && typeof window !== 'undefined') {
			const storedUsername = localStorage.getItem('chat_username');
			if (storedUsername === 'default_user') {
				localStorage.removeItem('chat_username');

				if (currentUser === 'default_user') {
					setCurrentUser('');
				}
			}
		}
	}, []);

	useEffect(() => {
		messagesRef.current = messages;
	}, [messages]);

	useEffect(() => {
		if (currentSessionId && messages.length > 0 && !readOnlyMode) {
			setSessions(prev => prev.map(session =>
				session.id === currentSessionId
					? { ...session, messages: messages, title: session.title || messages[0].content.slice(0, 30) }
					: session
			));
		}
	}, [messages, currentSessionId, readOnlyMode]);

	useEffect(() => {
		if (process.env.USE_MSAL === 'true' && isAuthenticated && !currentSessionId && !currentFolderViewId) {
			setLandingView('welcome');
		}
	}, [isAuthenticated, currentSessionId, currentFolderViewId]);

	useEffect(() => {
		if (!currentFolderViewId) scrollToBottom();
	}, [messages, isGenerating, currentFolderViewId]);

	useEffect(() => {
		if (sessions.length > 0) {

		}
	}, [sessions]);

	useEffect(() => {
		if (typeof window !== 'undefined') {
			if (activeGroupId) localStorage.setItem('active_group_id', activeGroupId);
			else localStorage.removeItem('active_group_id');

			if (selectedPersonaId) localStorage.setItem('active_persona_id', selectedPersonaId);
			else localStorage.removeItem('active_persona_id');
		}
	}, [currentUser, activeGroupId, selectedPersonaId]);

	useEffect(() => {
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		const handleChange = (e: MediaQueryListEvent) => {
			if (!getCookie('theme')) setTheme(e.matches ? 'dark' : 'light');
		};
		mediaQuery.addEventListener('change', handleChange);
		return () => mediaQuery.removeEventListener('change', handleChange);
	}, []);

	const loadedUserRef = useRef<string | null>(null);

	useEffect(() => {
		const loadDataFromCosmos = async () => {
			if (loadedUserRef.current === currentUser) return;
			loadedUserRef.current = currentUser;

			const config = {
				endpoint: localStorage.getItem('azure_cosmos_endpoint') || process.env.AZURE_COSMOS_ENDPOINT || '',
				key: localStorage.getItem('azure_cosmos_key') || process.env.AZURE_COSMOS_KEY || '',
				databaseId: localStorage.getItem('azure_cosmos_db_id') || process.env.AZURE_COSMOS_DB_ID || 'ConversationDB'
			};

			if (!config.endpoint || !config.key) return;
			if (!currentUser) return;

			setCurrentSessionId(null);
			setMessages([]);
			setCurrentFolderViewId(null);

			try {
				const [fetchedFolders, fetchedPersonas, fetchedLibrary, fetchedWorkflows, fetchedDbSources, mySessions] = await Promise.all([
					listFolders(config, currentUser),
					listPersonas(config, currentUser),
					listLibraryPrompts(config, currentUser),
					Promise.all([
						listWorkflows(config, currentUser),
						listWorkflows(config, 'System')
					]),
					listDatabaseSources(config, currentUser),
					listSharedSessions(config, currentUser)
				]);

				setFolders(fetchedFolders as Folder[]);
				setPersonas((fetchedPersonas.length > 0 ? fetchedPersonas as Persona[] : DEFAULT_PERSONAS).sort((a, b) => a.name.localeCompare(b.name)));
				setLibraryPrompts((fetchedLibrary.length > 0 ? fetchedLibrary as LibraryPrompt[] : DEFAULT_LIBRARY_PROMPTS).sort((a, b) => a.title.localeCompare(b.title)));

				const [userWorkflows, systemWorkflows] = fetchedWorkflows as unknown as [Workflow[], Workflow[]];
				const allWorkflows = [...(systemWorkflows || []), ...(userWorkflows || [])];
				const uniqueWorkflows = Array.from(new Map(allWorkflows.map(w => [w.id, w])).values());
				setWorkflows(uniqueWorkflows);

				setDatabaseSources(fetchedDbSources.length > 0 ? fetchedDbSources as DatabaseSource[] : []);

				const sharedFolders = (fetchedFolders as Folder[]).filter((f: any) => f.isShared);
				let sharedSessions: any[] = [];
				if (sharedFolders.length > 0) {
					const sharedSessionsArrays = await Promise.all(sharedFolders.map((f: any) => listSharedSessions(config, f.id)));
					sharedSessions = sharedSessionsArrays.flat();
				}

				const allSessions = [...mySessions, ...sharedSessions];
				const uniqueSessionsMap = new Map();
				allSessions.forEach(s => uniqueSessionsMap.set(s.id, s));
				setSessions(Array.from(uniqueSessionsMap.values()).sort((a: any, b: any) => b.timestamp - a.timestamp));

				const storedActivePersonaId = localStorage.getItem('active_persona_id');
				if (storedActivePersonaId && (fetchedPersonas.find((p: any) => p.id === storedActivePersonaId) || DEFAULT_PERSONAS.find(p => p.id === storedActivePersonaId))) {
					setSelectedPersonaId(storedActivePersonaId);
				}

				const storedGroupId = localStorage.getItem('active_group_id');
				if (storedGroupId) setActiveGroupId(storedGroupId);

			} catch (error) {
				console.error("Failed to load data from Cosmos DB:", error);
				setFolders([]);
				setPersonas(DEFAULT_PERSONAS);
				setLibraryPrompts(DEFAULT_LIBRARY_PROMPTS);
				setWorkflows([]);
				setDatabaseSources([]);
				setSessions([]);

				loadedUserRef.current = null;
			}
		};

		loadDataFromCosmos();
	}, [currentUser]);

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		let updated = false;

		const updateParam = (key: string, value: string | null) => {
			if (value) {
				if (params.get(key) !== value) {
					params.set(key, value);
					updated = true;
				}
			} else if (params.has(key)) {
				params.delete(key);
				updated = true;
			}
		};

		if (currentSessionId) {
			updateParam('session', currentSessionId);
			updateParam('folder', null);
		} else if (currentFolderViewId) {
			updateParam('folder', currentFolderViewId);
			updateParam('session', null);
		} else {
			updateParam('session', null);
			updateParam('folder', null);
		}

		updateParam('group', activeGroupId);

		if (updated) {
			const newUrl = `${window.location.pathname}?${params.toString()}`;
			window.history.pushState({ path: newUrl }, '', newUrl);
		}
	}, [currentSessionId, currentFolderViewId, activeGroupId]);

	useEffect(() => {
		if (currentFolderViewId && folders.length > 0) {
			const folder = folders.find(f => f.id === currentFolderViewId);
			if (folder) {
				if (folder.isShared) {
					setActiveGroupId(folder.id);
				} else {
					setActiveGroupId(null);
				}
			}
		}
	}, [currentFolderViewId, folders]);

	useEffect(() => {
		const handleUrlChange = () => {
			const params = new URLSearchParams(window.location.search);
			const urlSession = params.get('session');
			const urlFolder = params.get('folder');
			const urlGroup = params.get('group');

			if (urlGroup && urlGroup !== activeGroupId) {
				setActiveGroupId(urlGroup);
			} else if (!urlGroup && activeGroupId) {
				setActiveGroupId(null);
			}

			const shareId = params.get('share');
			if (shareId) {
				setReadOnlyMode(true);
				const config = getCosmosConfig();
				if (config.endpoint && config.key) {
					const existing = sessions.find(s => s.id === shareId);
					if (existing) {
						setCurrentSessionId(shareId);
						setMessages(existing.messages || []);
					} else {
						setCurrentSessionId(shareId);
					}
				}
			} else if (urlSession && urlSession !== currentSessionId) {
				const session = sessions.find(s => s.id === urlSession);
				if (session) {
					setCurrentSessionId(urlSession);
					setMessages(session.messages || []);
					setCurrentFolderViewId(null);
					setLandingView('home');
					setAttachments([]);
					setGuidedPromptMessage(null);
					if (window.innerWidth < 768) setIsSidebarOpen(false);
				}
			} else if (urlFolder && urlFolder !== currentFolderViewId) {
				const folder = folders.find(f => f.id === urlFolder);
				if (folder) {
					setCurrentFolderViewId(urlFolder);
					setCurrentSessionId(null);
					setMessages([]);
					if (window.innerWidth < 768) setIsSidebarOpen(false);
				}
			} else if (!urlSession && !urlFolder) {
				if (currentSessionId || currentFolderViewId) {
					setCurrentSessionId(null);
					setCurrentFolderViewId(null);
					setMessages([]);
					setLandingView('home');
				}
			}

			if (isShareLoading) {
				setTimeout(() => {
					setIsShareLoading(false);
				}, 2000);
			}
		};

		window.addEventListener('popstate', handleUrlChange);

		const hasUrlParams = window.location.search.length > 1;
		const isStateEmpty = !currentSessionId && !currentFolderViewId;
		const isDataLoaded = sessions.length > 0 || folders.length > 0;

		if (hasUrlParams && isStateEmpty) {
			handleUrlChange();
		}

		return () => window.removeEventListener('popstate', handleUrlChange);
	}, [sessions, folders, currentSessionId, currentFolderViewId, activeGroupId]);

	useEffect(() => {
		if (!currentSessionId) {
			return;
		}
		if (!currentUser) {
			console.warn("[DebounceSave] Cannot save session: No currentUser set. Make sure 'chat_username' is in localStorage.");
			return;
		}

		const session = sessions.find(s => s.id === currentSessionId);
		if (!session) {
			return;
		}

		if (session === lastScheduledSessionRef.current) {
			return;
		}

		lastScheduledSessionRef.current = session;

		if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

		unsavedChangesRef.current = true;

		saveTimeoutRef.current = setTimeout(() => {
			const config = getCosmosConfig();
			if (config.endpoint && config.key) {
				const partitionKey = (session.isShared && session.groupId) ? session.groupId : currentUser;
				saveSharedSession(config, session, partitionKey)
					.then(() => {
						console.log("[DebounceSave] Save Success:", session.id);
						unsavedChangesRef.current = false;
					})
					.catch(err => {
						console.error("[DebounceSave] Save Failed:", err);
						unsavedChangesRef.current = false;
					});
			} else {
				console.warn("[DebounceSave] Aborting save: Missing Cosmos Configuration.");
				unsavedChangesRef.current = false;
			}
		}, 2000);

		return () => {
			if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
		};
	}, [sessions, currentSessionId, currentUser, getCosmosConfig]);

	useEffect(() => {
		if (isInviteCopied) {
			const timer = setTimeout(() => setIsInviteCopied(false), 5000);
			return () => clearTimeout(timer);
		}
	}, [isInviteCopied]);

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const groupParam = params.get('group');
		const sessionParam = params.get('session');

		if (groupParam) {
			setActiveGroupId(groupParam);
			if (!userDisplayName || userDisplayName === 'default_user') setIsNameModalOpen(true);

			const config = getCosmosConfig();
			if (config.endpoint && config.key) {
				listSharedSessions(config, groupParam).then(sharedSessions => {
					setSessions(prev => {
						const existingIds = new Set(prev.map(s => s.id));
						const newSessions = sharedSessions.filter(s => !existingIds.has(s.id));
						return [...prev, ...newSessions];
					});

					setFolders(prev => {
						if (prev.find(f => f.id === groupParam)) return prev;
						return [...prev, { id: groupParam, name: 'Shared Group', createdAt: Date.now(), isShared: true }];
					});
				});

				if (sessionParam) {
					setCurrentSessionId(sessionParam);

					getSharedSession(config, sessionParam, groupParam).then(session => {
						if (session) {
							setSessions(prev => {
								if (prev.find(s => s.id === session.id)) return prev.map(s => s.id === session.id ? session : s);
								return [...prev, session];
							});
							setMessages(session.messages);
						}
					});
				} else {
					setCurrentFolderViewId(groupParam);
				}
			}
		}
	}, [currentUser, getCosmosConfig]);

	useEffect(() => {
		const session = sessionsRef.current.find(s => s.id === currentSessionId);
		if (currentSessionId && activeGroupId && session?.isShared && session?.groupId === activeGroupId) {
			const interval = setInterval(() => {
				if (isGenerating || unsavedChangesRef.current) return;

				const config = getCosmosConfig();
				if (config.endpoint && config.key) {
					getSharedSession(config, currentSessionId, activeGroupId).then(fetched => {
						if (fetched && JSON.stringify(fetched.messages) !== JSON.stringify(messagesRef.current)) {

							setMessages(fetched.messages);
							setSessions(prev => prev.map(s => s.id === fetched.id ? fetched : s));
						}
					});
				}
			}, 5000);
			return () => clearInterval(interval);
		}
	}, [currentSessionId, activeGroupId, getCosmosConfig, isGenerating]);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (modelMenuRef.current && !modelMenuRef.current.contains(event.target as Node)) setIsModelSelectorOpen(false);
			if (mcpMenuRef.current && !mcpMenuRef.current.contains(event.target as Node)) setIsMCPSelectorOpen(false);
			if (regenMenuRef.current && !regenMenuRef.current.contains(event.target as Node)) setRegenMenuOpen(null);
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const shareId = params.get('share');
		if (shareId && sessions.length > 0) {
			const session = sessions.find(s => s.id === shareId);
			if (session) {
				setCurrentSessionId(shareId);
				setMessages(session.messages);
				setReadOnlyMode(true);
			}
		}
	}, [sessions]);

	const cancelBranch = () => { setBranchingData(null); setBranchTitle(''); };

	const cancelDeleteFolder = () => setFolderToDelete(null);

	const cancelDeleteSession = () => setSessionToDelete(null);

	const cancelGuidedPrompt = () => { setInput(''); setGuidedPromptMessage(null); };

	const confirmBranch = () => {
		if (!branchingData) return;
		const msgIndex = messages.findIndex(m => m.id === branchingData.messageId);
		if (msgIndex === -1) return;
		const history = messages.slice(0, msgIndex);
		const targetMsg = { ...messages[msgIndex] };
		if (targetMsg.responses && targetMsg.responses[branchingData.model]) {
			targetMsg.responses = { [branchingData.model]: targetMsg.responses[branchingData.model] };
		}
		const newMessages = [...history, targetMsg];
		const newSessionId = Date.now().toString();
		const newSession: ChatSession = {
			id: newSessionId,
			title: branchTitle || 'New Branch',
			timestamp: Date.now(),
			messages: newMessages,
			folderId: sessions.find(s => s.id === currentSessionId)?.folderId,
			personaId: sessions.find(s => s.id === currentSessionId)?.personaId,
			workflowId: branchingData.continueWorkflow ? sessions.find(s => s.id === currentSessionId)?.workflowId : undefined,
			currentWorkflowStep: branchingData.continueWorkflow
				? (targetMsg.workflowStepIndex !== undefined ? targetMsg.workflowStepIndex : sessions.find(s => s.id === currentSessionId)?.currentWorkflowStep)
				: undefined
		};
		setSessions(prev => [newSession, ...prev]);
		setCurrentSessionId(newSessionId);
		setMessages(newMessages);
		setInput('');
		setSelectedModels([branchingData.model]);
		if (readOnlyMode) { window.history.pushState({}, '', window.location.pathname); setReadOnlyMode(false); }
		setBranchingData(null);
		setBranchTitle('');
		if (window.innerWidth < 768) setIsSidebarOpen(false);
	};

	const confirmDeletePersona = () => {
		if (personaToDelete) {
			const config = getCosmosConfig();
			if (config.endpoint && config.key && currentUser) {
				deletePersona(config, personaToDelete, currentUser).catch(console.error);
			}
			setPersonas(prev => prev.filter(p => p.id !== personaToDelete));
			if (selectedPersonaId === personaToDelete) setSelectedPersonaId(null);
			setPersonaToDelete(null);
		}
	};

	const confirmDeleteSession = () => {
		if (sessionToDelete) {
			const session = sessions.find(s => s.id === sessionToDelete);
			if (session) {
				session.messages.forEach(m => {
					m.attachments?.forEach(a => {
						removeDocumentCache(a.id);
						cachedFileIdsRef.current.delete(a.id);
					});
				});

				const config = getCosmosConfig();
				if (config.endpoint && config.key) {
					const partitionKey = (session.isShared && session.groupId) ? session.groupId : currentUser;
					if (partitionKey) {
						deleteSharedSession(config, session.id, partitionKey).catch(console.error);
					}
				}
			}

			setSessions(prev => prev.filter(s => s.id !== sessionToDelete));
			if (currentSessionId === sessionToDelete) handleNewChat();
			setSessionToDelete(null);
		}
	};

	const confirmDeleteFolder = () => {
		if (folderToDelete) {
			const config = getCosmosConfig();
			if (config.endpoint && config.key && currentUser) {
				deleteFolder(config, folderToDelete, currentUser).catch(console.error);
			}
			setSessions(prev => prev.map(s => s.folderId === folderToDelete ? { ...s, folderId: undefined } : s));
			setFolders(prev => prev.filter(f => f.id !== folderToDelete));
			if (currentFolderViewId === folderToDelete) setCurrentFolderViewId(null);
			setFolderToDelete(null);
		}
	};

	const executeWorkflowStep = async (sessionId: string, workflowId: string, stepIndex: number, currentPersonaId?: string, queryOverride?: string) => {
		const workflow = workflowsRef.current.find(w => w.id === workflowId);
		if (!workflow) return;

		const effectiveUser = currentUser || (typeof window !== 'undefined' ? localStorage.getItem('chat_username') : undefined) || undefined;

		const step = workflow.steps[stepIndex];
		if (!step) {
			setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, currentWorkflowStep: null } : s));
			setGuidedPromptMessage(null);
			return;
		}

		setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, currentWorkflowStep: stepIndex } : s));

		if (step.type === 'prompt' && step.prompt) {
			if (step.model) setSelectedModels([step.model]);

			let effectivePrompt = step.prompt;
			const nextStep = workflow.steps[stepIndex + 1];
			if (nextStep && nextStep.type === 'export' && nextStep.exportFormat === 'pptx') {
				effectivePrompt += "\n\n(IMPORTANT: Please format the output as a presentation. Separate each slide with a horizontal rule '---' on a new line so it can be parsed correctly.)";
			}

			setInput(effectivePrompt);

			if (step.multiStepInstruction) {
				setGuidedPromptMessage(step.multiStepInstruction);
			} else {
				setTimeout(() => handleSendWithText(effectivePrompt, sessionId, currentPersonaId, step.model), 50);
			}
		} else if (step.type === 'file_upload') {
			setGuidedPromptMessage(step.fileRequirement || "Please upload required files.");
		} else if (step.type === 'mcp_tool') {
			const allTools = Object.values(serverToolsRef.current).flat();
			const toolsToEnable = allTools.filter(t => step.toolIds?.includes(t.id));
			setSelectedTools(toolsToEnable);
			setTimeout(() => executeWorkflowStep(sessionId, workflowId, stepIndex + 1, currentPersonaId), 50);
		} else if (step.type === 'export') {
			const exportMsg: Message = {
				id: Date.now().toString(),
				role: 'user',
				isSystem: true,
				content: `**Workflow Export Ready**\n\nThe current context has been prepared for export in **${step.exportFormat?.toUpperCase() || 'TEXT'}** format. Click the button below to download the file.`,
				workflowExport: { format: step.exportFormat || 'text' },
				userName: userDisplayName || effectiveUser,
				userId: effectiveUser,
				workflowStepIndex: stepIndex
			};
			setMessages(prev => {
				const last = prev[prev.length - 1];
				if (last && last.workflowExport && last.workflowExport.format === (step.exportFormat || 'text')) {
					return prev;
				}
				return [...prev, exportMsg];
			});
			setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, messages: [...s.messages, exportMsg] } : s));
			setGuidedPromptMessage(null);
			setTimeout(() => executeWorkflowStep(sessionId, workflowId, stepIndex + 1, currentPersonaId), 50);
		} else if (step.type === 'persona') {
			setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, personaId: step.personaId } : s));
			setTimeout(() => executeWorkflowStep(sessionId, workflowId, stepIndex + 1, step.personaId), 50);
		} else if (step.type === 'database_search' || step.type === 'vector_search') {
			const dbSource = databaseSourcesRef.current.find(db => db.id === step.databaseId);

			if (dbSource) {
				const query = queryOverride || step.searchQuery || '';

				if (!query) {
					setGuidedPromptMessage(`Workflow Search: Please enter search query for ${dbSource.name}`);
					return;
				}

				setGuidedPromptMessage(`Searching ${dbSource.name} for "${query}"...`);

				let filteredRecords: { content: string; title?: string }[] = [];

				if (dbSource.type === 'azure_ai_search') {
					try {
						setIsGenerating(true);
						filteredRecords = await searchAzureAISearch(
							dbSource.azureEndpoint!,
							dbSource.azureSearchKey!,
							dbSource.azureIndexName!,
							dbSource.azureContentField!,
							dbSource.azureVectorField!,
							dbSource.azureEmbeddingModel!,
							query,
							dbSource.azureTitleField
						);
						setIsGenerating(false);
					} catch (err: any) {
						setIsGenerating(false);
						console.error("Azure Search error:", err);
						setGuidedPromptMessage(`Azure Search Error: ${err.message}`);
						setTimeout(() => executeWorkflowStep(sessionId, workflowId, stepIndex + 1, currentPersonaId), 3000);
						return;
					}
				} else {
					const allRows = dbSource.content.split('\n').filter(line => line.trim());
					const dataRows = dbSource.type === 'csv_upload' ? allRows.slice(1) : allRows;
					filteredRecords = dataRows.filter(row => row.toLowerCase().includes(query.toLowerCase())).map(row => ({ content: row }));
				}

				const searchResultsMessage: Message = {
					id: Date.now().toString(),
					role: 'user',
					isSystem: true,
					content: `**Database Search Results**\nSource: ${dbSource.name}\nQuery: "${query}"\nFound ${filteredRecords.length} records. These are now part of the conversation context.`,
					userName: userDisplayName || effectiveUser,
					userId: effectiveUser,
					searchMetadata: {
						databaseId: step.databaseId!,
						searchQuery: query,
						offset: 10,
						totalResults: filteredRecords.length
					},
					workflowStepIndex: stepIndex
				};

				if (filteredRecords.length > 0) {
					const sanitizedRecords = filteredRecords.map(r => {
						let content = r.content.replace(/[\r\n\t]+/g, ' ').trim();
						const firstCapIndex = content.search(/[A-Z]/);
						if (firstCapIndex !== -1) {
							content = content.slice(firstCapIndex);
						}
						return { ...r, content };
					});

					const hasTitles = sanitizedRecords.some(r => r.title);
					if (hasTitles) {
						searchResultsMessage.content += `\n\n| &nbsp; | Source Document | Record Content |\n| :--- | :--- | :--- |\n`;
						sanitizedRecords.slice(0, 10).forEach((r, i) => {
							searchResultsMessage.content += `| ${i + 1} | **${r.title?.replace(/\|/g, '\\|') || 'Unknown'}** | ${r.content.replace(/\|/g, '\\|')} |\n`;
						});
					} else {
						searchResultsMessage.content += `\n\n| Index | Record Content |\n| :--- | :--- |\n`;
						sanitizedRecords.slice(0, 10).forEach((r, i) => {
							searchResultsMessage.content += `| ${i + 1} | ${r.content.replace(/\|/g, '\\|')} |\n`;
						});
					}

					if (sanitizedRecords.length > 10) {
						searchResultsMessage.content += `\n*...and ${sanitizedRecords.length - 10} more records available.*`;
					}
				} else {
					searchResultsMessage.content += `\n\n*No matching records were found.*`;
				}

				setGuidedPromptMessage(`Database Search: Found ${filteredRecords.length} records.`);
				setMessages(prev => [...prev, searchResultsMessage]);
				setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, messages: [...s.messages, searchResultsMessage] } : s));

				if (step.multiStepInstruction) {
					setGuidedPromptMessage(step.multiStepInstruction);
				} else {
					if (stepIndex + 1 < workflow.steps.length) {
						setTimeout(() => executeWorkflowStep(sessionId, workflowId, stepIndex + 1, currentPersonaId), 3000);
					} else {
						setTimeout(() => {
							setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, currentWorkflowStep: null } : s));
							setGuidedPromptMessage(null);
						}, 3000);
					}
				}
			} else {
				setGuidedPromptMessage("Database source not found. Skipping search...");
				if (stepIndex + 1 < workflow.steps.length) {
					setTimeout(() => executeWorkflowStep(sessionId, workflowId, stepIndex + 1, currentPersonaId), 1500);
				} else {
					setTimeout(() => {
						setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, currentWorkflowStep: null } : s));
						setGuidedPromptMessage(null);
					}, 1500);
				}
			}
		} else if (step.type === 'web_scraper') {
			const targetUrl = queryOverride || step.url;
			if (!targetUrl) {
				setGuidedPromptMessage("Workflow Scraper: Please enter URL to scrape");
				return;
			}
			setGuidedPromptMessage(`Scraping ${targetUrl}...`);
			setIsGenerating(true);

			try {
				const content = await getContentFromWebsite(targetUrl, step.includeMeta || false);
				setIsGenerating(false);

				const scraperMessage: Message = {
					id: Date.now().toString(),
					role: 'user',
					isSystem: true,
					content: content,
					userName: userDisplayName || effectiveUser,
					userId: effectiveUser,
					//content: `**Web Scraper Results**\nURL: ${targetUrl}\n\n${content}`
				};

				setMessages(prev => [...prev, scraperMessage]);
				setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, messages: [...s.messages, scraperMessage] } : s));

				if (step.multiStepInstruction) {
					setGuidedPromptMessage(step.multiStepInstruction);
				} else {
					if (stepIndex + 1 < workflow.steps.length) {
						setTimeout(() => executeWorkflowStep(sessionId, workflowId, stepIndex + 1, currentPersonaId), 3000);
					} else {
						setTimeout(() => {
							setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, currentWorkflowStep: null } : s));
							setGuidedPromptMessage(null);
						}, 3000);
					}
				}
			} catch (err: any) {
				setIsGenerating(false);
				setGuidedPromptMessage(`Scraping failed: ${err.message}`);
				if (stepIndex + 1 < workflow.steps.length) {
					setTimeout(() => executeWorkflowStep(sessionId, workflowId, stepIndex + 1, currentPersonaId), 3000);
				} else {
					setTimeout(() => {
						setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, currentWorkflowStep: null } : s));
						setGuidedPromptMessage(null);
					}, 3000);
				}
			}
		}
	};

	const formatTime = (timestamp: string) => new Date(parseInt(timestamp)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

	const formatSessionDate = (timestamp: number) => {
		const date = new Date(timestamp);
		const now = new Date();
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
		const sessionDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

		const diffTime = today - sessionDate;
		const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

		if (diffDays === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
		if (diffDays === 1) return 'Yesterday';
		if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'long' });

		const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
		if (date.getFullYear() !== now.getFullYear()) {
			options.year = 'numeric';
		}
		return date.toLocaleDateString([], options);
	};

	const groupSessions = (sessionsToGroup: ChatSession[]) => {
		const groups: { title: string; sessions: ChatSession[] }[] = [];

		const pinned = sessionsToGroup.filter(s => s.isPinned).sort((a, b) => b.timestamp - a.timestamp);
		if (pinned.length > 0) {
			groups.push({ title: 'Pinned', sessions: pinned });
		}

		const now = new Date();
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

		const sorted = sessionsToGroup.filter(s => !s.isPinned).sort((a, b) => b.timestamp - a.timestamp);

		const buckets = {
			today: [] as ChatSession[],
			yesterday: [] as ChatSession[],
			lastWeek: [] as ChatSession[],
			lastMonth: [] as ChatSession[],
			thirtyDays: [] as ChatSession[],
			sixtyDays: [] as ChatSession[],
			older: [] as ChatSession[]
		};

		sorted.forEach(session => {
			const date = new Date(session.timestamp);
			const sessionDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
			const diffTime = today - sessionDate;
			const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

			if (diffDays === 0) buckets.today.push(session);
			else if (diffDays === 1) buckets.yesterday.push(session);
			else if (diffDays <= 7) buckets.lastWeek.push(session);
			else if (diffDays <= 30) buckets.lastMonth.push(session);
			else if (diffDays <= 60) buckets.thirtyDays.push(session);
			else if (date.getFullYear() === now.getFullYear()) buckets.sixtyDays.push(session);
			else buckets.older.push(session);
		});

		if (buckets.today.length) groups.push({ title: 'Today', sessions: buckets.today });
		if (buckets.yesterday.length) groups.push({ title: 'Yesterday', sessions: buckets.yesterday });
		if (buckets.lastWeek.length) groups.push({ title: 'Last Week', sessions: buckets.lastWeek });
		if (buckets.lastMonth.length) groups.push({ title: 'Previous 30 Days', sessions: buckets.lastMonth });
		if (buckets.thirtyDays.length) groups.push({ title: 'Previous 60 Days', sessions: buckets.thirtyDays });
		if (buckets.sixtyDays.length) groups.push({ title: 'Earlier this Year', sessions: buckets.sixtyDays });
		if (buckets.older.length) groups.push({ title: 'Previous Years', sessions: buckets.older });

		return groups;
	};

	const handleExportWorkflowResult = async (format: 'text' | 'doc' | 'pdf' | 'excel' | 'pptx' = 'text', exportMsgId?: string) => {
		let relevantMessages = [...messages];
		if (exportMsgId) {
			const index = relevantMessages.findIndex(m => m.id === exportMsgId);
			if (index !== -1) {
				relevantMessages = relevantMessages.slice(0, index);
			}
		}

		const lastMsg = relevantMessages.reverse().find(m =>
			!m.workflowExport &&
			((m.role === 'assistant' && m.responses && Object.values(m.responses).some((r: any) => (r as any).status === 'success')) ||
				(m.isSystem && m.content))
		);

		if (!lastMsg) return;

		let text = "";
		if (lastMsg.role === 'assistant' && lastMsg.responses) {
			const successResp = (Object.values(lastMsg.responses) as ModelResponse[]).find(r => r.status === 'success');
			if (!successResp) return;
			text = successResp.text;
		} else {
			text = lastMsg.content;
		}

		let blob: Blob;
		let filename = `${sessions.find(s => s.id === currentSessionId)?.title || 'Workflow-Export-' + Date.now()}`;

		if (format === 'doc') {
			const html = await marked.parse(text);
			const blobResponse = await getContentForWord(html);
			if (blobResponse) {
				blob = blobResponse;
			} else {
				const content = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'></head><body>${html}</body></html>`;
				blob = new Blob(['\ufeff', content], { type: 'application/msword' });
			}
			filename += '.doc';
		} else if (format === 'excel') {
			blob = new Blob([text], { type: 'text/csv' });
			filename += '.csv';
		} else if (format === 'pdf') {
			const html = await marked.parse(text);
			const blobResponse = await getContentForPDF(html);
			if (blobResponse) {
				blob = blobResponse;
				filename += '.pdf';
			} else {
				blob = new Blob([html], { type: 'text/html' });
				filename += '.html';
			}
		} else if (format === 'pptx') {
			const slideTexts = text.split(/\n-{3,}\n/);
			const slidesHTML = await Promise.all(slideTexts.map(async (slideText) => {
				return await marked.parse(slideText);
			}));

			const blobResponse = await getContentForPowerPoint(slidesHTML);
			if (blobResponse) {
				blob = blobResponse;
				filename += '.pptx';
			} else {
				const html = await marked.parse(text);
				blob = new Blob([html], { type: 'text/html' });
				filename += '.html';
			}
		} else {
			blob = new Blob([text], { type: 'text/plain' });
			filename += '.txt';
		}

		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	const handleLoadMoreSearchResults = (messageId: string) => {
		const msg = messagesRef.current.find(m => m.id === messageId);
		if (!msg || !msg.searchMetadata) return;

		const { databaseId, searchQuery, offset, totalResults } = msg.searchMetadata;
		const dbSource = databaseSources.find(db => db.id === databaseId);
		if (!dbSource) return;

		const effectiveUser = currentUser || (typeof window !== 'undefined' ? localStorage.getItem('chat_username') : undefined) || undefined;

		const nextOffset = offset + 10;
		const allRows = dbSource.content.split('\n').filter(line => line.trim());
		const dataRows = dbSource.type === 'csv_upload' ? allRows.slice(1) : allRows;
		const filteredRecords = dataRows.filter(row => row.toLowerCase().includes(searchQuery.toLowerCase()));

		if (offset >= totalResults) return;

		const moreResultsMessage: Message = {
			id: Date.now().toString(),
			role: 'user',
			isSystem: true,
			content: `**Additional Database Results** (Records ${offset + 1} - ${Math.min(nextOffset, totalResults)})\nSource: ${dbSource.name}\nQuery: "${searchQuery}"`,
			userName: userDisplayName || effectiveUser,
			userId: effectiveUser,
			searchMetadata: {
				databaseId,
				searchQuery,
				offset: nextOffset,
				totalResults
			}
		};

		moreResultsMessage.content += `\n\n| Index | Record Content |\n| :--- | :--- |\n`;
		filteredRecords.slice(offset, nextOffset).forEach((r, i) => {
			moreResultsMessage.content += `| ${offset + i + 1} | ${r.replace(/\|/g, '\\|')} |\n`;
		});

		if (nextOffset < totalResults) {
			moreResultsMessage.content += `\n\n*...and ${totalResults - nextOffset} more records available.*`;
		} else {
			moreResultsMessage.content += `\n\n*All matching records have been loaded.*`;
		}

		setMessages(prev => [...prev, moreResultsMessage]);
		if (currentSessionId) {
			setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, moreResultsMessage] } : s));
		}
	};

	const handleLogout = () => {
		if (process.env.USE_MSAL === 'true' && instance) {
			setCurrentSessionId(null);
			setMessages([]);
			setCurrentFolderViewId(null);
			setSessions([]);
			setFolders([]);

			localStorage.removeItem('chat_username');
			localStorage.removeItem('chat_display_name');
			localStorage.removeItem('active_group_id');
			localStorage.removeItem('active_persona_id');

			instance.logoutRedirect({
				postLogoutRedirectUri: window.location.origin
			});
		}
	};

	const handleNextWorkflowStep = () => {
		const session = sessions.find(s => s.id === currentSessionId);
		if (session?.workflowId && session.currentWorkflowStep != null) {
			const nextStepIndex = session.currentWorkflowStep + 1;
			executeWorkflowStep(session.id, session.workflowId, nextStepIndex, session.personaId);
		}
	};

	const handleSavePersona = (e: React.FormEvent) => {
		e.preventDefault();
		if (!personaForm.name || !personaForm.systemInstruction) return;

		let savedPersona: Persona;


		if (editingPersonaId) {
			setPersonas(prev => prev.map(p => {
				if (p.id === editingPersonaId) {
					savedPersona = { ...p, ...personaForm } as Persona;
					return savedPersona;
				}
				return p;
			}).sort((a, b) => a.name.localeCompare(b.name)));
			setEditingPersonaId(null);
		} else {
			savedPersona = {
				id: Date.now().toString(),
				name: personaForm.name!,
				description: personaForm.description || '',
				systemInstruction: personaForm.systemInstruction!,
				multiStepInstruction: personaForm.multiStepInstruction || ''
			};
			setPersonas(prev => [...prev, savedPersona].sort((a, b) => a.name.localeCompare(b.name)));
		}

		const config = getCosmosConfig();
		if (config.endpoint && config.key && currentUser) {
			// @ts-ignore - savedPersona is definitely assigned if we get here
			savePersona(config, savedPersona, currentUser).catch(console.error);
		}

		setPersonaForm({ name: '', description: '', systemInstruction: '', multiStepInstruction: '' });
	};

	const handleNewChat = (specificPersonaId?: string, multiStepMsg?: string) => {
		if (readOnlyMode) {
			window.history.pushState({}, '', window.location.pathname);
			setReadOnlyMode(false);
		}
		setActiveGroupId(null);
		setCurrentSessionId(null);
		setCurrentFolderViewId(null);
		setMessages([]);
		setInput('');
		setAttachments([]);
		setGuidedPromptMessage(null);
		setShowScrollButton(false);
		if (window.innerWidth < 768) setIsSidebarOpen(false);
		setIsOutlineOpen(false);
		setActiveBriefcaseTool(null);
		setBriefcaseExtractQuery('');
		setBriefcaseExtractPreset('');
		setBriefcaseCompareMode('diff');
		setBriefcaseDbSourceId('');
		setBriefcaseTargetLang('');
		setSelectedBriefcaseFiles(new Set());

		const activeId = specificPersonaId !== undefined ? specificPersonaId : selectedPersonaId;

		if (multiStepMsg) {
			setGuidedPromptMessage(multiStepMsg);
		} else {
			const activePersona = personas.find(p => p.id === activeId);
			if (activePersona?.multiStepInstruction) {
				setGuidedPromptMessage(activePersona.multiStepInstruction);
			}
		}
	};

	const handleScroll = () => {
		if (scrollContainerRef.current) {
			const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
			const isBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 100;
			setShowScrollButton(!isBottom);
		}
	};

	const handleStartEditing = (e: React.MouseEvent, session: ChatSession) => {
		e.stopPropagation();
		setEditingSessionId(session.id);
		setEditTitle(session.title);
	};

	const handleSaveTitle = (e?: React.FormEvent) => {
		if (e) e.preventDefault();
		if (editingSessionId) {
			const session = sessions.find(s => s.id === editingSessionId);
			if (session) {
				const updatedSession = { ...session, title: editTitle };
				setSessions(prev => prev.map(s => s.id === editingSessionId ? updatedSession : s));

				const config = getCosmosConfig();
				if (config.endpoint && config.key) {
					const partitionKey = (updatedSession.isShared && updatedSession.groupId) ? updatedSession.groupId : currentUser;
					if (partitionKey) saveSharedSession(config, updatedSession, partitionKey).catch(console.error);
				}
			}
			setEditingSessionId(null);
		}
	};

	const handleTogglePin = (e: React.MouseEvent, sessionId: string) => {
		e.stopPropagation();
		const session = sessions.find(s => s.id === sessionId);
		if (session) {
			const updatedSession = { ...session, isPinned: !session.isPinned };
			setSessions(prev => prev.map(s => s.id === sessionId ? updatedSession : s));

			const config = getCosmosConfig();
			if (config.endpoint && config.key) {
				const partitionKey = (updatedSession.isShared && updatedSession.groupId) ? updatedSession.groupId : currentUser;
				if (partitionKey) saveSharedSession(config, updatedSession, partitionKey).catch(console.error);
			}
		}
	};

	const handleCreateGroup = () => {
		const newGroup: Folder = {
			id: crypto.randomUUID(),
			name: 'New Group',
			createdAt: Date.now(),
			isShared: true
		};
		setFolders(prev => [newGroup, ...prev]);

		const config = getCosmosConfig();
		if (config.endpoint && config.key && currentUser) {
			saveFolder(config, newGroup, currentUser).catch(console.error);
		}

		setEditingFolderId(newGroup.id);
		setFolderEditTitle(newGroup.name);
		setExpandedFolders(prev => ({ ...prev, [newGroup.id]: true }));

		setActiveGroupId(newGroup.id);
		handleOpenFolderView(newGroup.id);
	};

	const handleCreateFolder = () => {
		const newFolder: Folder = {
			id: Date.now().toString(),
			name: 'New Folder',
			createdAt: Date.now()
		};
		setFolders(prev => [newFolder, ...prev]);

		const config = getCosmosConfig();
		if (config.endpoint && config.key && currentUser) {
			saveFolder(config, newFolder, currentUser).catch(console.error);
		}

		setEditingFolderId(newFolder.id);
		setFolderEditTitle(newFolder.name);
		setExpandedFolders(prev => ({ ...prev, [newFolder.id]: true }));
	};

	const handleMoveToFolder = (folderId: string | undefined) => {
		if (!moveToSessionId) return;
		const session = sessions.find(s => s.id === moveToSessionId);
		if (session) {
			const updatedSession = { ...session, folderId };
			setSessions(prev => prev.map(s => s.id === moveToSessionId ? updatedSession : s));

			const config = getCosmosConfig();
			if (config.endpoint && config.key) {
				const partitionKey = (updatedSession.isShared && updatedSession.groupId) ? updatedSession.groupId : currentUser;
				if (partitionKey) saveSharedSession(config, updatedSession, partitionKey).catch(console.error);
			}
		}
		setMoveToSessionId(null);
	};

	const handleOpenFolderView = (folderId: string) => {
		setCurrentSessionId(null);
		setCurrentFolderViewId(folderId);
		setMessages([]);
		setInput('');
		setGuidedPromptMessage(null);
		setShowScrollButton(false);
		if (window.innerWidth < 768) setIsSidebarOpen(false);
		setIsOutlineOpen(false);
	};

	const handleCreateFolderAndMove = () => {
		if (!moveToSessionId || !newFolderName.trim()) return;
		const newFolder: Folder = { id: Date.now().toString(), name: newFolderName.trim(), createdAt: Date.now() };
		setFolders(prev => [...prev, newFolder]);

		const config = getCosmosConfig();
		if (config.endpoint && config.key && currentUser) {
			saveFolder(config, newFolder, currentUser).catch(console.error);
		}

		const session = sessions.find(s => s.id === moveToSessionId);
		if (session) {
			const updatedSession = { ...session, folderId: newFolder.id };
			setSessions(prev => prev.map(s => s.id === moveToSessionId ? updatedSession : s));

			if (config.endpoint && config.key) {
				const partitionKey = (updatedSession.isShared && updatedSession.groupId) ? updatedSession.groupId : currentUser;
				if (partitionKey) saveSharedSession(config, updatedSession, partitionKey).catch(console.error);
			}
		}
		setExpandedFolders(prev => ({ ...prev, [newFolder.id]: true }));
		setMoveToSessionId(null);
		setNewFolderName('');
	};

	const handleExport = () => {
		if (!messages.length) return;
		const exportData = JSON.stringify({
			title: sessions.find(s => s.id === currentSessionId)?.title || 'Chat Export',
			date: new Date().toISOString(),
			messages: messages
		}, null, 2);
		const blob = new Blob([exportData], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `chat-export-${Date.now()}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	const handleShare = async () => {
		if (!currentSessionId) return;
		const url = `${window.location.origin}${window.location.pathname}?share=${currentSessionId}`;
		await copyToClipboard(url);
		setIsInviteCopied(true);
		setTimeout(() => setIsInviteCopied(false), 3000);
	};

	const handleStartEditingFolder = (e: React.MouseEvent, folder: Folder) => {
		e.stopPropagation();
		setEditingFolderId(folder.id);
		setFolderEditTitle(folder.name);
	};

	const handleSaveFolderTitle = (e?: React.FormEvent) => {
		if (e) e.preventDefault();
		if (editingFolderId) {
			const folder = folders.find(f => f.id === editingFolderId);
			if (folder) {
				const updated = { ...folder, name: folderEditTitle };
				setFolders(prev => prev.map(f => f.id === editingFolderId ? updated : f));

				const config = getCosmosConfig();
				if (config.endpoint && config.key && currentUser) {
					saveFolder(config, updated, currentUser).catch(console.error);
				}
			}
			setEditingFolderId(null);
		}
	};

	const handleRegenerate = async (msgId: string, model: MultiModel, type: 'retry' | 'expand' | 'concise') => {
		setRegenMenuOpen(null);
		const assistantMsgIndex = messages.findIndex(m => m.id === msgId);
		if (assistantMsgIndex === -1) return;
		const userMsg = messages[assistantMsgIndex - 1];
		if (!userMsg || userMsg.role !== 'user') return;

		const history = messages.slice(0, assistantMsgIndex - 1);

		let prompt = userMsg.content;
		let label = 'Retry';
		if (type === 'expand') { prompt += "\n\n(Please provide a detailed and expanded response)"; label = 'Expanded'; }
		else if (type === 'concise') { prompt += "\n\n(Please keep the response concise)"; label = 'Concise'; }

		const currentSession = sessions.find(s => s.id === currentSessionId);
		const activePersonaId = currentSession?.personaId || selectedPersonaId;
		const activePersona = personas.find(p => p.id === activePersonaId);
		const systemInstruction = activePersona?.systemInstruction;

		setMessages(prev => {
			const newMsgs = [...prev];
			const msg = newMsgs[assistantMsgIndex];
			if (msg.responses && msg.responses[model]) msg.responses[model] = { ...msg.responses[model], status: 'loading' };
			return newMsgs;
		});
		try {
			const allTools = Object.values(serverTools).flat();
			const text = await generateModelResponse(model, prompt, userMsg.attachments || [], allTools, systemInstruction, history);
			setMessages(prev => {
				const newMsgs = [...prev];
				const msg = newMsgs[assistantMsgIndex];
				if (msg.responses && msg.responses[model]) {
					const existingVersions = msg.responses[model].versions || [];
					const isDuplicate = existingVersions.some(v => v.text === text);
					const updatedVersions = isDuplicate ? existingVersions : [...existingVersions, { text, timestamp: Date.now(), label }];
					const currentVersionIndex = updatedVersions.findIndex(v => v.text === text);
					msg.responses[model] = { ...msg.responses[model], text, status: 'success', versions: updatedVersions, currentVersionIndex };
				}
				return newMsgs;
			});
		} catch (err: any) {
			setMessages(prev => {
				const newMsgs = [...prev];
				const msg = newMsgs[assistantMsgIndex];
				if (msg.responses && msg.responses[model]) msg.responses[model] = { ...msg.responses[model], status: 'error', error: err.message };
				return newMsgs;
			});
		}
	};

	const handleVersionChange = (msgId: string, model: MultiModel, direction: 'prev' | 'next') => {
		setMessages(prev => {
			const newMsgs = [...prev];
			const msgIndex = newMsgs.findIndex(m => m.id === msgId);
			if (msgIndex === -1) return prev;
			const msg = newMsgs[msgIndex];
			if (msg.responses && msg.responses[model]) {
				const response = msg.responses[model];
				const versions = response.versions || [];
				if (versions.length <= 1) return prev;
				const uniqueVersions = versions.filter((v, i, a) => a.findIndex(t => t.text === v.text) === i);
				const currentUniqueIndex = uniqueVersions.findIndex(v => v.text === response.text);
				let newUniqueIndex = (currentUniqueIndex !== -1 ? currentUniqueIndex : 0) + (direction === 'next' ? 1 : -1);

				if (newUniqueIndex < 0) newUniqueIndex = 0;
				if (newUniqueIndex >= uniqueVersions.length) newUniqueIndex = uniqueVersions.length - 1;

				const targetVersion = uniqueVersions[newUniqueIndex];
				const newIndex = versions.findIndex(v => v.text === targetVersion.text);

				msg.responses[model] = { ...response, currentVersionIndex: newIndex, text: targetVersion.text };
			}
			return newMsgs;
		});
	};

	const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
		let files: FileList | null = null;
		if ('dataTransfer' in e) {
			e.preventDefault();
			files = e.dataTransfer.files;
		} else {
			files = (e.target as HTMLInputElement).files;
		}

		if (!files || files.length === 0) return;

		setIsUploading(true);

		const promises = Array.from(files).map((file: File) => {
			return new Promise<void>((resolve) => {
				const reader = new FileReader();
				reader.onload = (event) => {
					const base64 = event.target?.result as string;
					setAttachments(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), name: file.name, type: file.type, base64: base64 }]);
					resolve();
				};
				reader.onerror = () => {
					console.error("File upload failed");
					resolve();
				};
				reader.readAsDataURL(file);
			});
		});

		Promise.all(promises).then(() => {
			setIsUploading(false);
			if (fileInputRef.current) fileInputRef.current.value = '';
		});
	};

	const handleMicClick = () => {
		const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitRecognition;
		if (!SpeechRecognition) { alert("Your browser does not support voice recognition."); return; }
		if (isListening) { window.location.reload(); } else {
			const recognition = new SpeechRecognition();
			recognition.lang = 'en-US';
			recognition.onstart = () => setIsListening(true);
			recognition.onresult = (e: any) => setInput(prev => prev + (prev ? ' ' : '') + e.results[0][0].transcript);
			recognition.onend = () => setIsListening(false);
			recognition.onerror = () => setIsListening(false);
			recognition.start();
		}
	};

	const initiateDeleteMessage = useCallback((messageId: string) => {
		setMessageToDelete(messageId);
	}, []);

	const initiateDeleteResponse = useCallback((messageId: string, model: MultiModel) => {
		setResponseToDelete({ messageId, model });
	}, []);

	const handleDeleteMessage = useCallback(async () => {
		if (!messageToDelete) return;

		const currentMsgs = messagesRef.current;
		const msgToDelete = currentMsgs.find(m => m.id === messageToDelete);
		if (!msgToDelete) {
			setMessageToDelete(null);
			return;
		}

		if (msgToDelete.attachments) {
			for (const att of msgToDelete.attachments) {
				if (att.id) {
					await removeDocumentCache(att.id).catch(e => console.error("Failed to cleanup cache", e));
				}
			}
		}

		const newMessages = currentMsgs.filter(m => m.id !== messageToDelete);
		setMessages(newMessages);

		if (newMessages.length === 0) {
			if (currentSessionId) {
				const session = sessionsRef.current.find(s => s.id === currentSessionId);
				if (session) {
					const config = getCosmosConfig();
					if (config.endpoint && config.key) {
						const partitionKey = (session.isShared && session.groupId) ? session.groupId : currentUser;
						try {
							await deleteSharedSession(config, currentSessionId, partitionKey);
						} catch (e) {
							console.error("Failed to delete empty session", e);
						}
					}
					setSessions(prev => prev.filter(s => s.id !== currentSessionId));
				}
			}
			setCurrentSessionId(null);
			setLandingView('home');
		}

		setMessageToDelete(null);
	}, [messageToDelete, currentSessionId, currentUser, getCosmosConfig]);

	const handleDeleteResponse = useCallback(async () => {
		if (!responseToDelete) return;
		const { messageId, model } = responseToDelete;

		const currentMsgs = messagesRef.current;
		const msg = currentMsgs.find(m => m.id === messageId);
		if (!msg || !msg.responses) {
			setResponseToDelete(null);
			return;
		}

		const currentResponseCount = Object.keys(msg.responses).length;

		if (currentResponseCount <= 1) {

			if (msg.attachments) {
				for (const att of msg.attachments) {
					if (att.id) await removeDocumentCache(att.id).catch(e => console.error(e));
				}
			}
			const newMessages = currentMsgs.filter(m => m.id !== messageId);
			setMessages(newMessages);
			if (newMessages.length === 0) {
				if (currentSessionId) {
					const session = sessionsRef.current.find(s => s.id === currentSessionId);
					if (session) {
						const config = getCosmosConfig();
						if (config.endpoint && config.key) {
							const partitionKey = (session.isShared && session.groupId) ? session.groupId : currentUser;
							try { await deleteSharedSession(config, currentSessionId, partitionKey); } catch (e) { }
						}
						setSessions(prev => prev.filter(s => s.id !== currentSessionId));
					}
				}
				setCurrentSessionId(null);
				setLandingView('home');
			}
		} else {
			setMessages(prev => {
				const newMsgs = [...prev];
				const idx = newMsgs.findIndex(m => m.id === messageId);
				if (idx === -1) return prev;
				const m = { ...newMsgs[idx] };
				if (m.responses) {
					const nr = { ...m.responses };
					delete nr[model];
					m.responses = nr;
				}
				newMsgs[idx] = m;
				return newMsgs;
			});
		}
		setResponseToDelete(null);
	}, [responseToDelete, currentSessionId, currentUser, getCosmosConfig]);

	const handleSendWithText = async (textOverride?: string, sessionIdOverride?: string, personaIdOverride?: string, modelOverride?: MultiModel) => {
		let textToUse = textOverride !== undefined ? textOverride : input;
		let autoAttachment: AttachedFile | null = null;

		if (textToUse.length > 20000) {
			const wordCount = textToUse.trim().split(/\s+/).length;
			autoAttachment = {
				id: Math.random().toString(36).substr(2, 9),
				name: `large-input-${Date.now()}.txt`,
				type: 'text/plain',
				content: textToUse,
				base64: '',
				statistics: {
					words: wordCount,
					pages: -1
				}
			};

			if (textOverride === undefined) setInput('');
			textToUse = `[Large text input converted to attachment]\n\n${textToUse.slice(0, 200)}...`;
		}

		if ((!textToUse.trim() && attachments.length === 0 && !autoAttachment) || isGenerating || readOnlyMode) return;

		const history = [...messagesRef.current];

		let activeSessionId = sessionIdOverride || currentSessionId;

		const currentSessions = sessionsRef.current;

		if (!activeSessionId || currentFolderViewId) {
			activeSessionId = Date.now().toString();
			console.log("[handleSendWithText] Creating new session:", activeSessionId);
			setCurrentSessionId(activeSessionId);
			const activeFolder = folders.find(f => f.id === currentFolderViewId);

			const newSession: ChatSession = {
				id: activeSessionId!,
				title: (textToUse || autoAttachment?.name || '').slice(0, 30) || 'New Conversation',
				timestamp: Date.now(),
				messages: [],
				folderId: currentFolderViewId || undefined,
				personaId: personaIdOverride || selectedPersonaId || undefined,
				isShared: activeFolder?.isShared,
				groupId: activeFolder?.isShared ? activeFolder.id : undefined
			};

			setSessions(prev => [newSession, ...prev]);

			if (currentFolderViewId) setCurrentFolderViewId(null);
		}
		const currentAttachments = [...attachments];
		if (autoAttachment) currentAttachments.push(autoAttachment);
		let contextAttachments = [...currentAttachments];
		let omissionNotice = '';

		if (currentAttachments.length > 0) {
			setIsGenerating(true);
			try {
				const processed = await getContentFromDocuments(currentAttachments.filter(att => att.base64));
				if (Array.isArray(processed)) {
					processed.forEach((meta: any) => {
						const index = currentAttachments.findIndex(att => att.name === meta.filename);
						if (index !== -1) {
							currentAttachments[index] = {
								...currentAttachments[index],
								content: meta.content,
								statistics: meta.statistics
							};
						}
					});
				}

				// Check specifically if the autoAttachment needs caching (since it was skipped by getContentFromDocuments)
				if (autoAttachment && autoAttachment.statistics.words > 10000 && autoAttachment.content) {
					await setDocumentCache(autoAttachment.id, autoAttachment.content);
					autoAttachment.content = undefined;
				}

				const largeFiles = currentAttachments.filter(att => att.statistics && att.statistics.words && att.statistics.words > 10000);
				if (largeFiles.length > 0) {
					await Promise.all(largeFiles.map(async (f) => {
						if (f.content) {
							await setDocumentCache(f.id, f.content);
							f.content = undefined;
						}
					}));

					// Ensure we filter out any files (including autoAttachment) that have had their content removed
					contextAttachments = currentAttachments.filter(att => att.content !== undefined);

					const largeFilesList = currentAttachments.filter(att => att.content === undefined);
					if (largeFilesList.length > 0) {
						const fileList = largeFilesList.map(f => `**${f.name}**`).join(', ');
						omissionNotice = `> **Document Limit Notice**: The following documents exceed the word limit (10,000 words) and were not added to the conversation context: ${fileList}. They are available for analysis in the **Document Briefcase**.\n\n`;
					}
				}
			} catch (err) {
				console.error("Error processing documents", err);
			}
		}
		const currentModels = modelOverride ? [modelOverride] : [...selectedModels];
		const currentTools = [...selectedTools];

		if (!textToUse.trim() && contextAttachments.length === 0 && currentAttachments.length > 0 && omissionNotice) {
			setGuidedPromptMessage(null);
			const userMessage: Message = {
				id: Date.now().toString(),
				role: 'user',
				content: textToUse,
				attachments: currentAttachments,
				userName: userDisplayName || currentUser || undefined,
				userId: currentUser ? (activeGroupId ? (userDisplayName || currentUser) : currentUser) : undefined
			};
			setMessages(prev => [...prev, userMessage]);
			setInput('');
			setAttachments([]);

			const initialResponses: Record<string, ModelResponse> = {};
			currentModels.forEach(m => {
				initialResponses[m] = {
					model: m,
					text: omissionNotice + "*No context available.*",
					status: 'success',
					versions: [{ text: omissionNotice + "*No context available.*", timestamp: Date.now(), label: 'Original' }],
					currentVersionIndex: 0
				};
			});
			setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: '', responses: initialResponses }]);
			setIsGenerating(false);
			return;
		}

		const currentSession = currentSessions.find(s => s.id === activeSessionId);
		const activePersonaId = personaIdOverride || currentSession?.personaId || selectedPersonaId;
		const activePersona = personas.find(p => p.id === activePersonaId);
		let systemInstruction = activePersona?.systemInstruction;
		if (!systemInstruction) {
			systemInstruction = `You are a helpful assistant. Today is ${new Date().toLocaleDateString()}. You accept documents and attachments that can be further analyzed in the Document Briefcase. You can visualize data, BUT ONLY VISUALIZE IF ASKED, by outputting a code block with language "chart" or "json-chart" containing a JSON object with this schema: { type: "bar"|"line"|"area"|"pie", title?: string, description?: string, data: any[], xAxisKey: string, series: [{ key: string, name?: string, color?: string }] }.`;
		}

		if (currentSession?.workflowId && currentSession.currentWorkflowStep != null) {
			const workflow = workflowsRef.current.find(w => w.id === currentSession.workflowId);
			const step = workflow?.steps[currentSession.currentWorkflowStep];

			if (step?.type === 'file_upload' && currentAttachments.length > 0 && textOverride === undefined) {
				setGuidedPromptMessage(null);
				const userMessage: Message = {
					id: Date.now().toString(),
					role: 'user',
					content: textToUse,
					attachments: currentAttachments,
					userName: userDisplayName || currentUser || undefined,
					userId: currentUser ? (activeGroupId ? (userDisplayName || currentUser) : currentUser) : undefined
				};
				setMessages(prev => [...prev, userMessage]);
				setInput('');
				setAttachments([]);

				executeWorkflowStep(activeSessionId!, currentSession.workflowId, currentSession.currentWorkflowStep + 1, activePersonaId);
				return;
			}
		}

		if (currentSession?.workflowId && currentSession.currentWorkflowStep != null && guidedPromptMessageRef.current?.startsWith('Workflow Search:')) {
			const workflow = workflowsRef.current.find(w => w.id === currentSession.workflowId);
			const step = workflow?.steps[currentSession.currentWorkflowStep];
			if ((step?.type === 'database_search' || step?.type === 'vector_search') && !step.searchQuery) {
				setIsGenerating(false);
				executeWorkflowStep(activeSessionId!, currentSession.workflowId, currentSession.currentWorkflowStep, activePersonaId, textToUse);
				setInput('');
				return;
			}
		}

		if (currentSession?.workflowId && currentSession.currentWorkflowStep != null && guidedPromptMessageRef.current?.startsWith('Workflow Scraper:')) {
			const workflow = workflowsRef.current.find(w => w.id === currentSession.workflowId);
			const step = workflow?.steps[currentSession.currentWorkflowStep];
			if (step?.type === 'web_scraper' && !step.url) {
				setIsGenerating(false);
				executeWorkflowStep(activeSessionId!, currentSession.workflowId, currentSession.currentWorkflowStep, activePersonaId, textToUse);
				setInput('');
				return;
			}
		}

		setGuidedPromptMessage(null);
		const userMessage: Message = {
			id: Date.now().toString(),
			role: 'user',
			content: textToUse,
			attachments: currentAttachments,
			userName: userDisplayName || currentUser || undefined,
			userId: currentUser ? (activeGroupId ? (userDisplayName || currentUser) : currentUser) : undefined,
			workflowStepIndex: currentSession?.currentWorkflowStep ?? undefined
		};
		setMessages(prev => [...prev, userMessage]);
		setInput('');
		setAttachments([]);
		setIsGenerating(true);
		const initialResponses: Record<string, ModelResponse> = {};
		currentModels.forEach(m => { initialResponses[m] = { model: m, text: '', status: 'loading', versions: [], currentVersionIndex: 0 }; });
		setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: '', responses: initialResponses, workflowStepIndex: currentSession?.currentWorkflowStep ?? undefined }]);

		await Promise.all(currentModels.map(async (modelId) => {
			try {
				let text = await generateModelResponse(modelId, textToUse, contextAttachments, currentTools, systemInstruction, history);
				if (omissionNotice) text = omissionNotice + text;

				setMessages(prev => {
					const newMessages = [...prev];
					const last = newMessages[newMessages.length - 1];
					if (last.responses && last.responses[modelId]) {
						const firstVersion = { text, timestamp: Date.now(), label: 'Original' };
						last.responses[modelId] = { model: modelId, text, status: 'success', versions: [firstVersion], currentVersionIndex: 0 };
					}
					return newMessages;
				});
			} catch (err: any) {
				setMessages(prev => {
					const newMessages = [...prev];
					const last = newMessages[newMessages.length - 1];
					if (last.responses && last.responses[modelId]) last.responses[modelId] = { model: modelId, text: '', status: 'error', error: err.message || 'Error' };
					return newMessages;
				});
			}
		}));
		setIsGenerating(false);
	};

	const handleJumpToMessage = (msgId: string) => {
		const el = document.getElementById(`msg-${msgId}`);
		if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); setIsOutlineOpen(false); }
	};

	const handleSuggestionClick = (suggestion: typeof SUGGESTIONS[0]) => {
		if (suggestion.guided) {
			setInput(suggestion.text);
			setGuidedPromptMessage(suggestion.instruction || null);
		} else {
			handleSendWithText(suggestion.text);
		}
	};

	const initiateBranch = (messageId: string, model: MultiModel, continueWorkflow: boolean = false) => {
		const currentSession = sessions.find(s => s.id === currentSessionId);
		setBranchTitle(`${currentSession?.title || 'Conversation'} (Branch)`);
		setBranchingData({ messageId, model, continueWorkflow });
	};

	const initiateDeleteSession = (e: React.MouseEvent, sessionId: string) => {
		e.stopPropagation();
		setSessionToDelete(sessionId);
	};

	const initiateDeleteFolder = (e: React.MouseEvent, folderId: string) => {
		e.stopPropagation();
		setFolderToDelete(folderId);
	};

	const initiateDeletePersona = (id: string) => {
		setPersonaToDelete(id);
	};

	const loadSession = (session: ChatSession) => {
		if (editingSessionId) return;
		if (readOnlyMode) {
			window.history.pushState({}, '', window.location.pathname);
			setReadOnlyMode(false);
		}

		if (session.groupId) {
			setActiveGroupId(session.groupId);
		} else {
			setActiveGroupId(null);
		}

		setCurrentFolderViewId(null);
		setCurrentSessionId(session.id);
		setMessages(session.messages);
		setInput('');
		setGuidedPromptMessage(null);
		setShowScrollButton(false);
		if (window.innerWidth < 768) setIsSidebarOpen(false);
		setIsOutlineOpen(false);
		setActiveBriefcaseTool(null);
		setBriefcaseExtractQuery('');
		setBriefcaseExtractPreset('');
		setBriefcaseCompareMode('diff');
		setBriefcaseDbSourceId('');
		setBriefcaseTargetLang('');
		setSelectedBriefcaseFiles(new Set());
	};

	const openMoveToModal = (sessionId?: string) => {
		const targetId = sessionId || currentSessionId;
		if (targetId) setMoveToSessionId(targetId);
	};

	const playWorkflow = (workflow: Workflow) => {
		setIsWorkflowBuilderOpen(false);
		if (readOnlyMode) {
			window.history.pushState({}, '', window.location.pathname);
			setReadOnlyMode(false);
		}

		const initialPersona = selectedPersonaId || undefined;
		const newSessionId = Date.now().toString();
		const newSession: ChatSession = {
			id: newSessionId,
			title: `${workflow.name} Run`,
			timestamp: Date.now(),
			messages: [],
			workflowId: workflow.id,
			currentWorkflowStep: 0,
			personaId: initialPersona
		};

		setSessions(prev => [newSession, ...prev]);
		setCurrentSessionId(newSessionId);
		setMessages([]);
		setInput('');
		setAttachments([]);
		setGuidedPromptMessage(null);
		setIsOutlineOpen(false);
		if (window.innerWidth < 768) setIsSidebarOpen(false);

		setTimeout(() => {
			executeWorkflowStep(newSessionId, workflow.id, 0, initialPersona);
		}, 150);
	};

	const removeAttachment = (id: string) => setAttachments(prev => prev.filter(a => a.id !== id));

	const renderInputArea = (mode: 'default' | 'folder' | 'centered' = 'default') => {
		if (readOnlyMode) {
			return (
				<div className={`${mode === 'default' ? 'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-app via-app to-transparent pt-4 md:pt-10 pb-2 md:pb-6 px-4 z-20 flex justify-center' : 'w-full py-4'}`}>
					<div className="bg-card border border-border rounded-2xl shadow-2xl p-6 md:p-8 max-w-3xl w-full flex flex-col items-center text-center gap-2 animate-in slide-in-from-bottom-2">
						<button
							onClick={() => {
								setReadOnlyMode(false);
								setCurrentSessionId(null);
								setMessages([]);
								setLandingView('home');
								window.history.pushState({}, '', window.location.pathname);
							}}
							className="mt-2 px-8 py-3 bg-accent text-white rounded-xl text-sm font-bold shadow-lg shadow-accent/20 hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
						>
							<Bot className="w-4 h-4" /> Start your own conversation
						</button>
					</div>
				</div>
			);
		}

		const activeModel = AVAILABLE_MODELS.find(m => m.id === selectedModels[0]);
		const selectedModelName = selectedModels.length === 1 ? activeModel?.name : `${selectedModels.length} Models`;

		const currentSession = sessions.find(s => s.id === currentSessionId);
		const currentPersonaId = currentSession?.personaId || selectedPersonaId;
		const activePersona = personas.find(p => p.id === currentPersonaId);

		const folderName = mode === 'folder' ? folders.find(f => f.id === currentFolderViewId)?.name : '';

		let containerClass = '';
		if (mode === 'default') {
			containerClass = 'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-app via-app to-transparent pt-4 md:pt-10 pb-2 md:pb-6 px-4 z-20';
		} else if (mode === 'folder') {
			containerClass = 'relative mb-6';
		} else if (mode === 'centered') {
			containerClass = 'relative w-full';
		}

		const isWorkflowActive = currentSession?.workflowId && currentSession.currentWorkflowStep != null;
		const workflow = isWorkflowActive ? workflows.find(w => w.id === currentSession.workflowId) : null;
		const hasNextStep = workflow && currentSession && currentSession.currentWorkflowStep! < workflow.steps.length - 1;
		const currentStepType = workflow?.steps[currentSession?.currentWorkflowStep!]?.type;
		const stepIsComplete = !['prompt', 'file_upload', 'database_search', 'vector_search', 'web_scraper'].includes(currentStepType || '') ||
			(messages.length > 0 && messages[messages.length - 1].workflowStepIndex === currentSession?.currentWorkflowStep);

		return (
			<div className={containerClass}>
				<div className="max-w-3xl mx-auto relative overflow-visible">
					{(isWorkflowActive || guidedPromptMessage) && (
						<div className="mb-3 bg-card border border-border rounded-xl shadow-xl backdrop-blur-md overflow-hidden flex flex-col divide-y divide-border/30 z-30 animate-in slide-in-from-bottom-2 duration-300">
							{isWorkflowActive && (
								<div className="px-4 py-3 flex items-center justify-between bg-panel/40">
									<div className="flex flex-col gap-0.5">
										<div className="flex items-center gap-2">
											<Activity className="w-3.5 h-3.5 text-accent animate-pulse" />
											<span className="text-[11px] text-accent font-bold uppercase tracking-wider">
												Workflow Step {currentSession.currentWorkflowStep! + 1} of {workflow?.steps.length}
											</span>
										</div>
									</div>
									{hasNextStep && !isGenerating && stepIsComplete && (
										<button
											onClick={handleNextWorkflowStep}
											className="flex items-center gap-1.5 text-[10px] font-extrabold text-white bg-accent px-3 py-1.5 rounded-lg hover:opacity-90 transition-all shadow-sm uppercase tracking-tight"
										>
											Next Step <ChevronRight className="w-3 h-3" />
										</button>
									)}
								</div>
							)}
							{guidedPromptMessage && (
								<div className="px-4 py-3.5 flex items-center justify-between bg-accent/5">
									<div className="flex items-center gap-3 min-w-0">
										<Sparkles className="w-4 h-4 text-accent shrink-0" />
										<div className="flex flex-col min-w-0">
											<span className="text-[10px] text-accent font-bold uppercase tracking-wider mb-0.5">Instruction</span>
											<span className="text-sm text-primary font-semibold truncate leading-tight">{guidedPromptMessage}</span>
										</div>
									</div>
									{!isWorkflowActive && (
										<button onClick={cancelGuidedPrompt} className="ml-4 flex items-center gap-1.5 text-[10px] text-secondary hover:text-red-400 font-extrabold uppercase transition-all hover:scale-105 active:scale-95 shrink-0 bg-card px-2.5 py-1.5 rounded-lg border border-border shadow-sm"><X className="w-3 h-3" /> Cancel</button>
									)}
								</div>
							)}
						</div>
					)}
					<div className={`relative flex flex-col bg-card rounded-2xl border ${guidedPromptMessage || isWorkflowActive ? 'border-accent/50 ring-1 ring-accent/20' : 'border-border'} ${mode === 'centered' ? 'shadow-lg' : 'shadow-2xl'} overflow-visible ${isIdle ? 'idle-glow' : ''}`}>
						{(attachments.length > 0 || isUploading) && (
							<div className="px-4 pt-3 flex flex-wrap gap-2">
								{attachments.map(att => (
									<div key={att.id} className="flex items-center gap-2 bg-panel px-3 py-1.5 rounded-xl border border-border text-xs shadow-sm group">
										<FileText className="w-3.5 h-3.5 text-secondary" />
										<span className="font-medium truncate max-w-[150px]" title={att.name}>{att.name}</span>
										<button onClick={() => removeAttachment(att.id)} className="p-0.5 hover:bg-red-500/10 hover:text-red-500 rounded-full transition-colors"><X className="w-3 h-3" /></button>
									</div>
								))}
								{isUploading && (
									<div className="flex items-center gap-2 bg-panel px-3 py-1.5 rounded-xl border border-border text-xs shadow-sm text-secondary animate-pulse">
										<Loader2 className="w-3.5 h-3.5 animate-spin" />
										<span className="font-medium">Uploading...</span>
									</div>
								)}
							</div>
						)}
						<ChatInput
							ref={textareaRef}
							value={input}
							onValueChange={setInput}
							onSend={(val) => handleSendWithText(val)}
							isGenerating={isGenerating}
							rows={1}
							placeholder={isGenerating ? "Processing..." : (mode === 'folder' ? `New Conversation in ${folderName}...` : "Message AI...")}
							className={`w-full bg-transparent border-none focus:ring-0 text-primary p-3 md:p-4 text-sm md:text-base resize-none outline-none pr-8 custom-input-scrollbar ${isGenerating ? 'opacity-50 cursor-wait' : ''}`}
						/>
						<div className="flex items-center justify-between px-2 md:px-3 pb-2 md:pb-3 overflow-visible">
							<div className="flex items-center gap-2 overflow-visible">
								<button onClick={() => fileInputRef.current?.click()} className="p-2 text-secondary hover:text-primary rounded-lg shrink-0"><Paperclip className="w-5 h-5" /></button>
								<input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" multiple />
								<button onClick={handleMicClick} className={`p-2 rounded-lg shrink-0 ${isListening ? 'text-red-500 bg-red-500/10 animate-pulse' : 'text-secondary hover:text-primary'}`}><Mic className="w-5 h-5" /></button>
								<div className="h-4 w-px bg-border mx-1 shrink-0"></div>

								<div className="relative shrink-0 overflow-visible" ref={modelMenuRef}>
									<button onClick={() => setIsModelSelectorOpen(!isModelSelectorOpen)} className={`flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-semibold ${isModelSelectorOpen ? 'bg-card-hover text-primary' : 'text-secondary hover:text-primary hover:bg-card-hover'}`}>
										<Box className="w-4 h-4" /><span>{selectedModelName}</span><ChevronDown className="w-3 h-3" />
									</button>
									{isModelSelectorOpen && (
										<div className={`absolute ${mode !== 'default' ? 'top-full mt-2 slide-in-from-top-2' : 'bottom-full mb-3 slide-in-from-bottom-2'} left-0 w-64 bg-card border border-border rounded-xl shadow-[0_25px_70px_rgba(0,0,0,0.4)] p-1.5 z-[100] animate-in duration-200`}>
											<div className="px-3 py-1.5 text-[10px] font-bold text-secondary uppercase tracking-wider">Select Models</div>
											{AVAILABLE_MODELS.map(m => (<button key={m.id} onClick={() => toggleModel(m.id)} className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-card-hover rounded-lg text-left text-xs font-medium text-primary transition-colors">{m.name}{selectedModels.includes(m.id) && <Check className="w-4 h-4 text-accent" />}</button>))}
										</div>
									)}
								</div>

								<div className="relative shrink-0 overflow-visible" ref={mcpMenuRef}>
									<button onClick={() => setIsMCPSelectorOpen(!isMCPSelectorOpen)} className={`flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-semibold ${isMCPSelectorOpen ? 'bg-card-hover text-primary' : 'text-secondary hover:text-primary hover:bg-card-hover'}`}>
										<Cpu className="w-4 h-4" /><span>{selectedTools.length === 1 ? '1 Tool' : `${selectedTools.length} Tools`}</span><ChevronDown className="w-3 h-3" />
									</button>
									{isMCPSelectorOpen && (
										<div className={`absolute ${mode !== 'default' ? 'top-full mt-2 slide-in-from-top-2' : 'bottom-full mb-3 slide-in-from-bottom-2'} left-0 w-64 bg-card border border-border rounded-xl shadow-[0_25px_70px_rgba(0,0,0,0.4)] p-1.5 z-[100] max-h-80 overflow-y-auto animate-in duration-200`}>
											<div className="px-3 py-1.5 text-[10px] font-bold text-secondary uppercase tracking-wider">MCP Tools</div>
											{MCP_SERVER_CONFIGS.map(server => (
												<div key={server.id} className="mb-2">
													<p className="px-3 py-1 text-[10px] font-bold text-secondary uppercase opacity-60">{server.name}</p>
													{(serverTools[server.name] || []).map(tool => (<button key={tool.id} onClick={() => toggleTool(tool)} className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-card-hover rounded-lg text-left text-xs text-primary transition-colors">{tool.name}{selectedTools.find(t => t.id === tool.id) && <Check className="w-4 h-4 text-accent" />}</button>))}
													{(!serverTools[server.name] || serverTools[server.name].length === 0) && <p className="px-3 py-1 text-[10px] text-secondary italic opacity-50">No tools found</p>}
												</div>
											))}
										</div>
									)}
								</div>

								{activePersona && (
									<div className="flex items-center gap-2 px-2.5 py-2 bg-accent/10 text-accent rounded-lg text-xs font-bold shrink-0 border border-accent/20">
										<UserCircle className="w-4 h-4" />
										<span>{activePersona.name}</span>
									</div>
								)}
							</div>
							<button onClick={() => handleSendWithText()} disabled={(!input.trim() && attachments.length === 0) || isGenerating} className={`p-2.5 rounded-xl transition-all shadow-sm shrink-0 ${(!input.trim() && attachments.length === 0) || isGenerating ? 'text-border cursor-not-allowed' : 'bg-primary text-card hover:opacity-90 active:scale-95'}`}><Send className="w-5 h-5" /></button>
						</div>
					</div>
				</div>

				<style>{`
					.small-table table {
						font-size: 0.75rem !important;
						line-height: 1.2 !important;
					}
					.small-table th, .small-table td {
							padding: 4px 8px !important;
					}
				`}</style>
			</div>
		);
	};

	const renderSessionItem = (session: ChatSession) => (
		<div key={session.id} className={`group relative rounded-xl transition-all mb-1 ${currentSessionId === session.id ? 'bg-card border border-border shadow-md' : 'hover:bg-card-hover border border-transparent'}`}>
			{editingSessionId === session.id ? (
				<form onSubmit={handleSaveTitle} className="p-2">
					<input autoFocus type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} onBlur={() => handleSaveTitle()} className="w-full bg-input border border-border text-primary text-sm px-2 py-1.5 rounded-lg outline-none" />
				</form>
			) : (
				<button onClick={() => loadSession(session)} className="w-full text-left px-3.5 py-3 rounded-xl text-sm flex flex-col gap-0.5 min-w-0">
					<span className={`truncate w-full font-medium ${currentSessionId === session.id ? 'text-primary' : 'text-content'} flex items-center gap-2`}>
						{session.workflowId && <WorkflowIcon className="w-3 h-3 text-accent shrink-0" />}
						{session.isShared && <Users className="w-3 h-3 text-accent shrink-0" />}
						<span className="truncate">{session.title}</span>
					</span>
					<div className="flex items-center justify-between h-4">
						<span className="text-[10px] text-secondary">{formatSessionDate(session.timestamp)}</span>
					</div>
				</button>
			)}
			{!editingSessionId && !readOnlyMode && (
				<div className="absolute right-2 bottom-2 hidden group-hover:flex items-center gap-1 bg-transparent z-10">
					<button onClick={(e) => handleTogglePin(e, session.id)} className="p-1 text-secondary hover:text-accent bg-transparent transition-colors" title={session.isPinned ? "Unpin" : "Pin"}>{session.isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}</button>
					<button onClick={(e) => handleStartEditing(e, session)} className="p-1 text-secondary hover:text-primary bg-transparent transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
					<button onClick={(e) => initiateDeleteSession(e, session.id)} className="p-1 text-secondary hover:text-red-400 bg-transparent transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
				</div>
			)}
		</div>
	);

	const scrollToBottom = () => {
		chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	};

	const selectPersona = (id: string | null) => {
		setSelectedPersonaId(id);
	};

	const startEditPersona = (persona: Persona) => {
		setEditingPersonaId(persona.id);
		setPersonaForm({ name: persona.name, description: persona.description, systemInstruction: persona.systemInstruction, multiStepInstruction: persona.multiStepInstruction });
	};

	const toggleFolder = (folderId: string) => {
		setExpandedFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
	};

	const toggleTheme = () => {
		const newTheme = theme === 'light' ? 'dark' : 'light';
		const style = document.createElement('style');
		style.appendChild(document.createTextNode(`* { transition: none !important; }`));
		document.head.appendChild(style);
		setTheme(newTheme);
		setCookie('theme', newTheme, 365);
		setTimeout(() => { document.head.removeChild(style); }, 50);
	};

	const toggleTool = (tool: MCPTool) => {
		setSelectedTools(prev => prev.find(t => t.id === tool.id) ? prev.filter(t => t.id !== tool.id) : [...prev, tool]);
	};

	const toggleModel = (modelId: MultiModel) => {
		setSelectedModels(prev =>
			prev.includes(modelId)
				? (prev.length > 1 ? prev.filter(m => m !== modelId) : prev)
				: [...prev, modelId]
		);
	};

	const useLibraryPrompt = (prompt: LibraryPrompt) => {
		setIsLibraryOpen(false);
		handleNewChat(undefined, prompt.multiStepInstruction);
		setTimeout(() => {
			setInput(prompt.content);
			textareaRef.current?.focus();
		}, 50);
	};

	const activeFolder = folders.find(f => f.id === currentFolderViewId);
	const folderSessions = currentFolderViewId ? sessions.filter(s => s.folderId === currentFolderViewId) : [];

	const currentSession = sessions.find(s => s.id === currentSessionId);
	const activeWorkflowStep = currentSession?.workflowId && currentSession.currentWorkflowStep != null
		? workflows.find(w => w.id === currentSession.workflowId)?.steps[currentSession.currentWorkflowStep]
		: null;

	const isWorkflowAtFileUpload = activeWorkflowStep?.type === 'file_upload';
	const isWorkflowAtExport = activeWorkflowStep?.type === 'export';

	if (process.env.USE_MSAL === 'true' && !isAuthenticated) {
		return (
			<div className="flex flex-col items-center justify-center h-screen bg-app text-primary gap-6">
				<div className="flex flex-col items-center gap-2">
					<h1 className="text-3xl font-bold tracking-tight">Welcome to Multi-Model Orchestrator</h1>
					<p className="text-secondary text-sm">A next-generation AI interface that goes beyond simple chat.</p>
				</div>
				<button
					onClick={() => instance?.loginRedirect(loginRequest)}
					className="px-6 py-3 bg-accent text-white rounded-xl shadow-lg hover:opacity-90 transition-all font-semibold flex items-center gap-2 hover:scale-105 active:scale-95 duration-200"
				>
					<ShieldCheck className="w-5 h-5" />
					Sign in with Microsoft Entra
				</button>
			</div>
		);
	}

	if (currentView === 'profile') {
		return (
			<Profile
				onBack={() => setCurrentView('chat')}
				isSidebarOpen={isSidebarOpen}
				onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
			/>
		);
	}

	if (currentView === 'admin') {
		return (
			<Admin
				onBack={() => setCurrentView('chat')}
				isSidebarOpen={isSidebarOpen}
				onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
				personas={personas}
				libraryPrompts={libraryPrompts}
				databaseSources={databaseSources}
				serverTools={serverTools}
				onPlayWorkflow={playWorkflow}
			/>
		);
	}

	return (
		<div className="flex h-[100dvh] w-full bg-app text-primary overflow-hidden">
			{isSidebarOpen && !readOnlyMode && <div className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />}
			{!readOnlyMode && (
				<aside className={`fixed md:relative z-40 h-full bg-panel border-r border-border transition-all duration-300 ease-in-out flex flex-col ${isSidebarOpen ? 'translate-x-0 w-[80vw] sm:w-64' : '-translate-x-full md:translate-x-0 md:w-0 md:overflow-hidden w-[80vw] sm:w-64'}`}>
					<div className="p-3 flex items-center justify-between">
						<button onClick={() => handleNewChat()} className="flex-1 flex items-center gap-2 px-3 py-3 hover:bg-card-hover rounded-xl transition-colors text-sm font-medium"><SquarePen className="w-4 h-4" /> New Chat</button>
						<button onClick={() => setIsSidebarOpen(false)} className="p-3 hover:bg-card-hover rounded-xl text-secondary hover:text-primary ml-2"><Menu className="w-5 h-5" /></button>
					</div>
					<div className="flex-1 overflow-y-auto px-2 py-2">
						{isChatSearchActive ? (
							<div className="space-y-1">
								<div className="relative mb-2 px-1">
									<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-secondary" />
									<input
										autoFocus
										type="text"
										value={chatSearchQuery}
										onChange={(e) => setChatSearchQuery(e.target.value)}
										placeholder="Search chats..."
										className="w-full bg-input border border-border rounded-lg pl-8 pr-8 py-2 text-sm text-primary focus:border-accent outline-none"
									/>
									<button
										onClick={() => { setIsChatSearchActive(false); setChatSearchQuery(''); }}
										className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-secondary hover:text-primary rounded-md"
									>
										<X className="w-3.5 h-3.5" />
									</button>
								</div>
								{sessions.filter(s => s.title.toLowerCase().includes(chatSearchQuery.toLowerCase())).length === 0 ? (
									<div className="text-center py-8 text-secondary italic text-xs">No matches found</div>
								) : (
									sessions
										.filter(s => s.title.toLowerCase().includes(chatSearchQuery.toLowerCase()))
										.sort((a, b) => b.timestamp - a.timestamp)
										.map(renderSessionItem)
								)}
							</div>
						) : (
							<div className="space-y-1">
								<button
									onClick={() => setIsChatSearchActive(true)}
									className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-secondary hover:text-primary hover:bg-card-hover rounded-xl transition-colors mb-2"
								>
									<Search className="w-4 h-4" />
									Search Chats
								</button>
								<button
									onClick={handleCreateFolder}
									className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-secondary hover:text-primary hover:bg-card-hover rounded-xl transition-colors mb-2"
								>
									<Plus className="w-4 h-4" />
									New Folder
								</button>
								<button
									onClick={handleCreateGroup}
									className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-secondary hover:text-primary hover:bg-card-hover rounded-xl transition-colors mb-2"
								>
									<Users className="w-4 h-4" />
									New Group
								</button>
								{folders.map(folder => {
									const isExpanded = expandedFolders[folder.id];
									return (
										<div key={folder.id} className="mb-1 relative">
											{editingFolderId === folder.id ? (
												<form onSubmit={handleSaveFolderTitle} className="px-3 py-2">
													<input
														autoFocus
														type="text"
														value={folderEditTitle}
														onChange={(e) => setFolderEditTitle(e.target.value)}
														onBlur={() => handleSaveFolderTitle()}
														className="w-full bg-input border border-border text-primary text-sm px-2 py-1.5 rounded-lg outline-none"
													/>
												</form>
											) : (
												<div className="relative flex items-center pr-12 group/folder">
													<button onClick={() => toggleFolder(folder.id)} className="p-3 text-secondary hover:text-primary transition-colors">{isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}</button>
													<button onClick={() => handleOpenFolderView(folder.id)} className={`flex-1 flex items-center gap-2 py-2 text-sm transition-colors truncate ${currentFolderViewId === folder.id ? 'text-primary font-medium' : 'text-secondary hover:text-primary'}`}>
														{folder.isShared ? <Users className="w-4 h-4 text-accent" /> : (isExpanded ? <FolderOpen className="w-4 h-4 text-secondary" /> : <FolderIcon className="w-4 h-4 text-secondary" />)}
														<span className="truncate">{folder.name}</span>
													</button>
													<div className="absolute right-0 top-1/2 -translate-y-1/2 hidden group-hover/folder:flex items-center gap-0.5 z-10 px-2">
														<button
															onClick={(e) => handleStartEditingFolder(e, folder)}
															className="p-1.5 text-secondary hover:text-primary bg-transparent transition-colors"
														>
															<Edit2 className="w-3.5 h-3.5" />
														</button>
														<button
															onClick={(e) => initiateDeleteFolder(e, folder.id)}
															className="p-1.5 text-secondary hover:text-red-400 bg-transparent transition-colors"
														>
															<Trash2 className="w-3.5 h-3.5" />
														</button>
													</div>
												</div>
											)}
											{isExpanded && <div className="ml-3 pl-2 border-l border-border mt-1">{sessions.filter(s => s.folderId === folder.id).length === 0 ? <div className="px-3 py-2 text-xs text-secondary italic">Empty</div> : groupSessions(sessions.filter(s => s.folderId === folder.id)).map(group => (
												<div key={group.title} className="mb-2">
													<div className="px-3 py-1 text-[10px] font-bold text-secondary uppercase opacity-60">{group.title}</div>
													{group.sessions.map(renderSessionItem)}
												</div>
											))}</div>}
										</div>
									);
								})}
								{folders.length > 0 && <div className="my-4 border-t border-border mx-2"></div>}
								<div className="pt-1">
									{groupSessions(sessions.filter(s => !s.folderId)).map(group => (
										<div key={group.title} className="mb-2">
											<div className="px-3 py-1 text-[10px] font-bold text-secondary uppercase opacity-60">{group.title}</div>
											{group.sessions.map(renderSessionItem)}
										</div>
									))}
								</div>
							</div>
						)}
					</div>
					<div className="p-3 border-t border-border mt-auto bg-panel z-10 flex flex-col gap-1">
						<div className="relative group/persona">
							<button
								onClick={() => setIsPersonaModalOpen(true)}
								className="w-full flex items-center gap-2 px-3 py-2 text-sm text-secondary hover:text-primary hover:bg-card-hover rounded-xl transition-colors"
							>
								<UserCircle className="w-4 h-4" />
								<span>Persona Settings</span>
							</button>
							<button
								onClick={(e) => { e.stopPropagation(); setIsPersonaQuickViewOpen(!isPersonaQuickViewOpen); setTimeout(() => document.getElementById('quick-persona-search')?.focus(), 50); }}
								className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-secondary hover:text-primary hover:bg-card-hover rounded-lg transition-colors opacity-0 group-hover/persona:opacity-100 focus:opacity-100"
							>
								<Search className="w-3.5 h-3.5" />
							</button>
							{isPersonaQuickViewOpen && (
								<>
									<div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsPersonaQuickViewOpen(false)} />
									<div className="absolute bottom-full left-0 w-full mb-2 bg-card border border-border rounded-xl shadow-xl z-50 flex flex-col overflow-hidden max-h-[400px] animate-in slide-in-from-bottom-2 duration-200">
										<div className="p-2 border-b border-border">
											<div className="relative">
												<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-secondary" />
												<input
													id="quick-persona-search"
													type="text"
													value={quickPersonaSearch}
													onChange={(e) => setQuickPersonaSearch(e.target.value)}
													placeholder="Search personas..."
													className="w-full bg-input border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-primary focus:border-accent outline-none"
													autoComplete="off"
												/>
											</div>
										</div>
										<div className="overflow-y-auto p-1 custom-scrollbar">
											{(!quickPersonaSearch || "default assistant".toLowerCase().includes(quickPersonaSearch.toLowerCase())) && (
												<button
													onClick={(e) => {
														e.stopPropagation();
														setSelectedPersonaId(null);
														setIsPersonaQuickViewOpen(false);
														setQuickPersonaSearch('');
													}}
													className={`w-full text-left px-3 py-2 rounded-lg hover:bg-card-hover group flex items-center justify-between gap-2 min-w-0 mb-1 ${selectedPersonaId === null ? 'bg-accent/10 border border-accent/20' : ''}`}
												>
													<div className="flex flex-col gap-0.5 min-w-0">
														<span className={`text-xs font-medium truncate w-full block ${selectedPersonaId === null ? 'text-accent' : 'text-primary'}`}>Default Assistant</span>
														<span className="text-[10px] text-secondary truncate w-full block opacity-70">No specific instruction</span>
													</div>
													{selectedPersonaId === null && <Check className="w-3.5 h-3.5 text-accent shrink-0" />}
												</button>
											)}
											{personas.filter(p => !quickPersonaSearch || p.name.toLowerCase().includes(quickPersonaSearch.toLowerCase())).length === 0 && (!quickPersonaSearch || !"default assistant".includes(quickPersonaSearch.toLowerCase())) ? (
												<div className="p-4 text-center text-[10px] text-secondary italic">No personas found</div>
											) : (
												personas
													.filter(p => !quickPersonaSearch || p.name.toLowerCase().includes(quickPersonaSearch.toLowerCase()))
													.map(persona => (
														<button
															key={persona.id}
															onClick={(e) => {
																e.stopPropagation();
																if (selectedPersonaId === persona.id) {
																	setSelectedPersonaId(null);
																} else {
																	setSelectedPersonaId(persona.id);
																}
																setIsPersonaQuickViewOpen(false);
																setQuickPersonaSearch('');
															}}
															className={`w-full text-left px-3 py-2 rounded-lg hover:bg-card-hover group flex items-center justify-between gap-2 min-w-0 ${selectedPersonaId === persona.id ? 'bg-accent/10 border border-accent/20' : ''}`}
														>
															<div className="flex flex-col gap-0.5 min-w-0">
																<span className={`text-xs font-medium truncate w-full block ${selectedPersonaId === persona.id ? 'text-accent' : 'text-primary'}`}>{persona.name}</span>
																<span className="text-[10px] text-secondary truncate w-full block opacity-70">{persona.description || "No description"}</span>
															</div>
															{selectedPersonaId === persona.id && <Check className="w-3.5 h-3.5 text-accent shrink-0" />}
														</button>
													))
											)}
										</div>
									</div>
								</>
							)}
						</div>
						<div className="relative group/library">
							<button
								onClick={() => setIsLibraryOpen(true)}
								className="w-full flex items-center gap-2 px-3 py-2 text-sm text-secondary hover:text-primary hover:bg-card-hover rounded-xl transition-colors"
							>
								<Book className="w-4 h-4" />
								<span>Prompt Library</span>
							</button>
							<button
								onClick={(e) => { e.stopPropagation(); setIsPromptQuickViewOpen(!isPromptQuickViewOpen); setTimeout(() => document.getElementById('quick-prompt-search')?.focus(), 50); }}
								className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-secondary hover:text-primary hover:bg-card-hover rounded-lg transition-colors opacity-0 group-hover/library:opacity-100 focus:opacity-100"
							>
								<Search className="w-3.5 h-3.5" />
							</button>
							{isPromptQuickViewOpen && (
								<>
									<div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsPromptQuickViewOpen(false)} />
									<div className="absolute bottom-full left-0 w-full mb-2 bg-card border border-border rounded-xl shadow-xl z-50 flex flex-col overflow-hidden max-h-[400px] animate-in slide-in-from-bottom-2 duration-200">
										<div className="p-2 border-b border-border">
											<div className="relative">
												<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-secondary" />
												<input
													id="quick-prompt-search"
													type="text"
													value={quickPromptSearch}
													onChange={(e) => setQuickPromptSearch(e.target.value)}
													placeholder="Search..."
													className="w-full bg-input border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-primary focus:border-accent outline-none"
													autoComplete="off"
												/>
											</div>
										</div>
										<div className="overflow-y-auto p-1 custom-scrollbar">
											{libraryPrompts.filter(p => !quickPromptSearch || p.title.toLowerCase().includes(quickPromptSearch.toLowerCase()) || p.content.toLowerCase().includes(quickPromptSearch.toLowerCase())).length === 0 ? (
												<div className="p-4 text-center text-[10px] text-secondary italic">No matches found</div>
											) : (
												libraryPrompts
													.filter(p => !quickPromptSearch || p.title.toLowerCase().includes(quickPromptSearch.toLowerCase()) || p.content.toLowerCase().includes(quickPromptSearch.toLowerCase()))
													.map(prompt => (
														<button
															key={prompt.id}
															onClick={(e) => {
																e.stopPropagation();
																setInput(prompt.content);
																setIsPromptQuickViewOpen(false);
																setQuickPromptSearch('');
																if (textareaRef.current) textareaRef.current.focus();
															}}
															className="w-full text-left px-3 py-2 rounded-lg hover:bg-card-hover group flex flex-col gap-0.5 min-w-0"
														>
															<span className="text-xs font-medium text-primary truncate w-full block">{prompt.title}</span>
															<span className="text-[10px] text-secondary truncate w-full block opacity-70">{prompt.content}</span>
														</button>
													))
											)}
										</div>
									</div>
								</>
							)}
						</div>
						<button
							onClick={() => setIsDatabaseSourcesOpen(true)}
							className="w-full flex items-center gap-2 px-3 py-2 text-sm text-secondary hover:text-primary hover:bg-card-hover rounded-xl transition-colors"
						>
							<Database className="w-4 h-4" />
							<span>Database Sources</span>
						</button>
						<button
							onClick={() => setIsWorkflowBuilderOpen(true)}
							className="w-full flex items-center gap-2 px-3 py-2 text-sm text-secondary hover:text-primary hover:bg-card-hover rounded-xl transition-colors"
						>
							<WorkflowIcon className="w-4 h-4" />
							<span>Workflow Builder</span>
						</button>
						<button
							onClick={() => setCurrentView('admin')}
							className="w-full flex items-center gap-2 px-3 py-2 text-sm text-secondary hover:text-primary hover:bg-card-hover rounded-xl transition-colors"
						>
							<ShieldCheck className="w-4 h-4" />
							<span>Administration Section</span>
						</button>
						<button
							onClick={toggleTheme}
							className="w-full flex items-center gap-2 px-3 py-2 text-sm text-secondary hover:text-primary hover:bg-card-hover rounded-xl transition-colors"
						>
							{theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
							<span>{theme === 'dark' ? 'Light' : 'Dark'} Mode</span>
						</button>

						{process.env.USE_MSAL === 'true' && isAuthenticated && (
							<>
								<button
									onClick={() => setCurrentView('profile')}
									className="w-full flex items-center gap-2 px-3 py-2 text-sm text-secondary hover:text-primary hover:bg-card-hover rounded-xl transition-colors"
								>
									<User className="w-4 h-4" />
									<span>Profile</span>
								</button>
								<button
									onClick={handleLogout}
									className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-xl transition-colors"
								>
									<LogOut className="w-4 h-4" />
									<span>Log Out</span>
								</button>
							</>
						)}
					</div>
				</aside>
			)
			}
			<main className="flex-1 flex flex-col relative w-full h-full min-w-0">
				{isShareLoading && (
					<div className="absolute inset-0 z-[300] bg-app flex flex-col items-center justify-center animate-in fade-in duration-300">
						<div className="relative mb-6">
							<div className="w-16 h-16 border-4 border-accent/20 border-t-accent rounded-full animate-spin"></div>
							<div className="absolute inset-0 flex items-center justify-center">
								<Bot className="w-6 h-6 text-accent animate-pulse" />
							</div>
						</div>
						<h3 className="text-lg font-bold tracking-tight text-primary">Loading Shared Session...</h3>
					</div>
				)}

				{!isSidebarOpen && !readOnlyMode && (
					<button
						onClick={() => setIsSidebarOpen(true)}
						className="absolute top-4 left-4 z-50 p-2 bg-card border border-border hover:bg-card-hover rounded-xl shadow-sm transition-colors"
					>
						<Menu className="w-5 h-5 text-secondary hover:text-primary" />
					</button>
				)}

				{!readOnlyMode && messages.length > 0 && !currentFolderViewId && (
					<div className="flex items-center justify-end gap-2 px-4 py-2 bg-transparent z-10 shrink-0">
						{!sessions.find(s => s.id === currentSessionId)?.isShared && (
							<button
								onClick={() => openMoveToModal()}
								className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-primary hover:bg-card-hover rounded-xl transition-colors"
							>
								<FolderPlus className="w-4 h-4" />
								<span className="hidden md:inline">Move To</span>
							</button>
						)}
						<button
							onClick={handleExport}
							className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-primary hover:bg-card-hover rounded-xl transition-colors"
						>
							<FileJson className="w-4 h-4" />
							<span className="hidden md:inline">Export</span>
						</button>
						<button
							onClick={openCanvas}
							className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-primary hover:bg-card-hover rounded-xl transition-colors"
						>
							<Layout className="w-4 h-4" />
							<span className="hidden md:inline">Canvas</span>
						</button>
						<button
							onClick={handleShare}
							className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-primary hover:bg-card-hover rounded-xl transition-colors"
						>
							<Share className="w-4 h-4" />
							<span className="hidden md:inline">Share</span>
						</button>
					</div>
				)}
				{isNameModalOpen && (
					<div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
						<div className="bg-card border border-border rounded-xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95">
							<h3 className="text-lg font-bold mb-4">Join Group Chat</h3>
							<p className="text-sm text-secondary mb-4">Please enter your name to join this conversation.</p>
							<input
								autoFocus
								type="text"
								value={userDisplayName}
								onChange={(e) => setUserDisplayName(e.target.value)}
								placeholder="Your Name"
								className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm mb-4 outline-none focus:border-accent"
								onKeyDown={(e) => { if (e.key === 'Enter' && userDisplayName.trim()) { setIsNameModalOpen(false); localStorage.setItem('chat_display_name', userDisplayName); localStorage.setItem('chat_username', userDisplayName); } }}
							/>
							<button
								disabled={!userDisplayName.trim()}
								onClick={() => { setIsNameModalOpen(false); localStorage.setItem('chat_display_name', userDisplayName); localStorage.setItem('chat_username', userDisplayName); }}
								className="w-full py-2.5 bg-accent text-white rounded-lg font-bold text-sm disabled:opacity-50"
							>
								Join Chat
							</button>
						</div>
					</div>
				)}

				<div className="flex-1 overflow-y-auto w-full relative" ref={scrollContainerRef} onScroll={handleScroll}>
					{currentFolderViewId ? (
						<div className="max-w-3xl mx-auto w-full px-4 pt-4 pb-20">
							{activeFolder?.isShared && (
								<div className="mb-6 p-4 bg-accent/10 border border-accent/20 rounded-xl flex items-center justify-between gap-4">
									<div className="flex items-center gap-3">
										<div className="p-2 bg-accent/20 rounded-lg text-accent">
											<Users className="w-5 h-5" />
										</div>
										<div className="min-w-0">
											<h3 className="text-sm font-bold text-primary">Shared Group</h3>
											<div className="flex items-center gap-1 text-xs text-secondary mt-0.5">
												<span className="shrink-0">Invite others:</span>
												<code className="bg-panel px-1.5 py-0.5 rounded border border-border select-all truncate block flex-1 min-w-0 max-w-[200px] md:max-w-md">
													{`${window.location.origin}${window.location.pathname}?group=${activeFolder.id}`}
												</code>
											</div>
										</div>
									</div>
									<button
										onClick={() => {
											copyToClipboard(`${window.location.origin}${window.location.pathname}?group=${activeFolder.id}`);
											setIsInviteCopied(true);
											setTimeout(() => setIsInviteCopied(false), 2000);
										}}
										className="p-2 hover:bg-accent/20 text-accent rounded-lg transition-colors"
										title="Copy Invitiation Link"
									>
										{isInviteCopied ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
									</button>
								</div>
							)}
							{renderInputArea('folder')}

							<div className="mt-8">
								<h3 className="text-xs font-bold text-secondary uppercase mb-4 px-1">
									Conversations in {activeFolder?.name}
								</h3>

								{folderSessions.length === 0 ? (
									<div className="text-center py-12 text-secondary border border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2">
										<MessageSquare className="w-10 h-10 opacity-10 mb-2" />
										<p className="font-medium">This folder is empty</p>
										<p className="text-xs opacity-60 max-w-sm">
											Start a new conversation above to add it directly to this folder, or
											move existing chats here from the main list.
										</p>
									</div>
								) : (
									<div className="space-y-6">
										{groupSessions(folderSessions).map(group => (
											<div key={group.title}>
												<h4 className="text-xs font-bold text-secondary uppercase mb-3 px-1 opacity-70 border-b border-border/50 pb-1">{group.title}</h4>
												<div className="space-y-3">
													{group.sessions.map(session => (
														<div
															key={session.id}
															className="group bg-card hover:bg-card-hover border border-border rounded-xl p-4 transition-colors"
														>
															<div className="flex justify-between items-start gap-4">
																<div
																	onClick={() => loadSession(session)}
																	className="flex-1 cursor-pointer min-w-0"
																>
																	<h4 className="text-sm font-medium text-primary mb-1 truncate">
																		{session.title}
																	</h4>
																	<p className="text-xs text-secondary">
																		{formatSessionDate(session.timestamp)}
																	</p>
																</div>

																<div className="flex items-center gap-2">
																	{!session.isShared && (
																		<button
																			onClick={() => openMoveToModal(session.id)}
																			className="p-2 text-secondary hover:text-primary rounded-xl"
																		>
																			<FolderPlus className="w-4 h-4" />
																		</button>
																	)}

																	<button
																		onClick={(e) => initiateDeleteSession(e, session.id)}
																		className="p-2 text-secondary hover:text-red-400 rounded-xl"
																	>
																		<Trash2 className="w-4 h-4" />
																	</button>
																</div>
															</div>
														</div>
													))}
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						</div>
					) : (
						<div className="max-w-3xl mx-auto w-full px-4 pt-4 pb-32 md:pb-60">
							{messages.length === 0 && !isWorkflowAtFileUpload && !isWorkflowAtExport ? (
								landingView === 'home' ? (
									!input.trim() && !guidedPromptMessage && !isGenerating && (
										<div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-8">
											<div className="flex flex-col items-center space-y-4">
												<button onClick={() => setLandingView('welcome')} className="w-12 h-12 bg-card rounded-full flex items-center justify-center border border-border shadow-inner hover:bg-card-hover transition-colors"><Bot className="w-6 h-6 text-primary" /></button>
												<h2 className="text-2xl font-medium tracking-tight">How can I help you today?</h2>
											</div>
											<div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full max-w-4xl px-2 md:px-4">
												{SUGGESTIONS.map((s, i) => (<button key={i} onClick={() => handleSuggestionClick(s)} className="text-left p-4 rounded-xl border border-border bg-card hover:bg-card-hover transition-all flex flex-col gap-3 h-full hover:border-secondary shadow-sm hover:shadow-md"><div className="p-2 w-fit rounded-lg bg-card-hover">{s.guided ? <Sparkles className="w-4 h-4 text-blue-400" /> : <MessageSquare className="w-4 h-4 text-primary" />}</div><span className="text-sm text-primary leading-relaxed">{s.text}</span></button>))}
											</div>
										</div>
									)
								) : (
									<div className="flex flex-col justify-center min-h-[60vh] w-full max-w-3xl mx-auto px-4">
										{!input.trim() && !guidedPromptMessage && !isGenerating && (
											<div className="mb-6 pl-1">
												<div className="flex flex-col items-center space-y-4 mb-4">
													<button onClick={() => setLandingView('home')} className="w-12 h-12 bg-card rounded-full flex items-center justify-center border border-border shadow-inner hover:bg-card-hover transition-colors"><Bot className="w-6 h-6 text-primary" /></button>
												</div>
												<h1 className="text-4xl font-bold tracking-tight text-primary mb-2">Welcome, {currentUser && currentUser !== 'default_user' ? currentUser.split(' ')[0] : 'User'}</h1>
												<h2 className="text-2xl font-medium tracking-tight">How can I help you today?</h2>
											</div>
										)}
										<div className="w-full">
											{renderInputArea('centered')}
										</div>
									</div>
								)
							) : (
								<>
									{messages.map((msg, index) => {
										const showDateSeparator = index === 0 || new Date(parseInt(msg.id)).toDateString() !== new Date(parseInt(messages[index - 1].id)).toDateString();
										return (
											<React.Fragment key={msg.id}>
												{showDateSeparator && (
													<div className="flex items-center justify-center my-6">
														<div className="bg-panel border border-border px-3 py-1 rounded-full text-[10px] font-bold text-secondary uppercase tracking-widest shadow-sm">
															{new Date(parseInt(msg.id)).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric', year: new Date(parseInt(msg.id)).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined })}
														</div>
													</div>
												)}
												<div id={`msg-${msg.id}`} className="py-6 group w-full scroll-mt-32">
													<div className="relative">
														{msg.role === 'assistant' && (<><div className="hidden md:flex absolute top-0.5 -left-10 md:-left-12 w-8 h-8 bg-accent rounded-full items-center justify-center text-white ring-2 ring-app z-10 shadow-md"><Bot className="w-5 h-5" /></div><div className="md:hidden mb-2 flex items-center gap-2"><div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center text-white shadow-sm"><Bot className="w-3.5 h-3.5" /></div><span className="text-xs font-bold text-secondary tracking-wide">ASSISTANT</span></div></>)}
														<div className={`w-full ${msg.role === 'user' ? 'flex justify-end items-center gap-2' : ''}`}>
															{msg.role === 'user' ? (
																<>
																	{msg.userName && activeGroupId && <div className="absolute -top-5 right-0 text-[10px] uppercase font-bold text-secondary">{msg.userName}</div>}
																	{msg.isSystem ? (
																		<div className="w-full">
																			<div className="bg-panel border border-border rounded-2xl p-6 mb-4 shadow-sm animate-in fade-in duration-300">
																				<div className="flex items-center gap-2 mb-3 text-accent font-bold text-xs uppercase tracking-widest">
																					<Database className="w-4 h-4" /> Workflow System
																				</div>
																				<div className="text-primary text-xs md:text-sm leading-normal markdown-body scroll-pt-4 small-table">
																					<ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code: CodeBlock, pre: PreBlock, a: (props) => <a target="_blank" rel="noopener noreferrer" {...props} /> }}>{msg.content}</ReactMarkdown>
																				</div>
																				{msg.searchMetadata && msg.searchMetadata.offset < msg.searchMetadata.totalResults && (
																					<div className="mt-4 flex justify-start">
																						<button
																							onClick={() => handleLoadMoreSearchResults(msg.id)}
																							className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border border-accent/20"
																						>
																							<PlusCircle className="w-3 h-3" /> Load Next 10 Records ({msg.searchMetadata.totalResults - msg.searchMetadata.offset} remaining)
																						</button>
																					</div>
																				)}
																				{msg.workflowExport && (
																					<div className="mt-4 flex justify-start">
																						<button
																							onClick={() => handleExportWorkflowResult(msg.workflowExport?.format, msg.id)}
																							className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md hover:bg-accent-hover transition-all"
																						>
																							<Download className="w-4 h-4" /> Download as {msg.workflowExport.format.toUpperCase()}
																						</button>
																					</div>
																				)}
																				<WorkflowSystemFooter content={msg.content} timestamp={msg.id} />
																			</div>
																		</div>
																	) : (
																		<>
																			<button
																				onClick={() => initiateDeleteMessage(msg.id)}
																				className="p-2 rounded-full transition-all shrink-0 text-secondary opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-card-hover"
																				title="Delete Message"
																			>
																				<Trash2 className="w-4 h-4" />
																			</button>
																			<button
																				onClick={() => handleToggleFavorite(msg.content)}
																				className={`p-2 rounded-full transition-all shrink-0 ${isFavorited(msg.content)
																					? 'text-gray-400 opacity-100'
																					: 'text-secondary opacity-0 group-hover:opacity-100 hover:bg-card-hover'
																					}`}
																				title={isFavorited(msg.content) ? "Remove from Favourites" : "Save to Favourites"}
																			>
																				<Heart className={`w-4 h-4 ${isFavorited(msg.content) ? 'fill-current' : ''}`} />
																			</button>
																			<div className="max-w-[90%] md:max-w-[85%] bg-card rounded-3xl px-5 py-4 shadow-sm border border-border">
																				<div className="text-primary whitespace-pre-wrap leading-7 text-sm md:text-base" style={{ fontSize: '14px' }}>
																					{msg.content}
																					{msg.attachments && msg.attachments.length > 0 && (
																						<div className="mt-4 flex flex-wrap gap-2">
																							{msg.attachments.map(f => (
																								<div key={f.id} className="flex flex-col gap-0.5 bg-panel px-3 py-2 rounded-xl border border-border text-xs shadow-sm">
																									<div className="flex items-center gap-2 font-medium"><FileText className="w-3.5 h-3.5" /> {f.name}</div>
																									{f.statistics && (
																										<div className="text-[10px] text-secondary opacity-80 pl-6 flex gap-2">
																											{f.statistics.words !== undefined && <span>{f.statistics.words.toLocaleString()} {f.statistics.words === 1 ? 'word' : 'words'}</span>}
																											{f.statistics.pages !== undefined && f.statistics.pages !== -1 && <span>{f.statistics.pages.toLocaleString()} {f.statistics.pages === 1 ? 'page' : 'pages'}</span>}
																										</div>
																									)}
																								</div>
																							))}
																						</div>
																					)}
																				</div>
																				<div className="text-[10px] text-secondary mt-1.5 text-right select-none opacity-60">{formatTime(msg.id)}</div>
																			</div>
																		</>
																	)}
																</>
															) : (
																<div className="w-full">
																	{msg.content && msg.isSystem && (!msg.responses || Object.keys(msg.responses).length === 0) && (
																		<div className="bg-panel border border-border rounded-2xl p-6 mb-4 shadow-sm animate-in fade-in duration-300">
																			<div className="flex items-center gap-2 mb-3 text-accent font-bold text-xs uppercase tracking-widest">
																				<Database className="w-4 h-4" /> Workflow System
																			</div>
																			<div className="text-primary text-xs md:text-sm leading-normal markdown-body scroll-pt-4 small-table">
																				<ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code: CodeBlock, pre: PreBlock, a: (props) => <a target="_blank" rel="noopener noreferrer" {...props} /> }}>{msg.content}</ReactMarkdown>
																			</div>
																			<div className="text-primary text-xs md:text-sm leading-normal markdown-body scroll-pt-4 small-table">
																				<ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code: CodeBlock, pre: PreBlock, a: (props) => <a target="_blank" rel="noopener noreferrer" {...props} /> }}>{msg.content}</ReactMarkdown>
																			</div>
																			<WorkflowSystemFooter content={msg.content} timestamp={msg.id} />
																		</div>
																	)}
																	{msg.role === 'assistant' && msg.responses && Object.keys(msg.responses).length > 1 && (
																		<div className="sticky top-0 z-20 flex justify-end mb-3 px-1 py-1.5 bg-app/85 rounded-b-xl">
																			<button
																				onClick={() => setExpandedMessageId(msg.id)}
																				className="flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border rounded-lg text-[11px] font-bold text-secondary hover:text-primary hover:bg-card-hover hover:border-accent/40 transition-all shadow-sm active:scale-95"
																			>
																				<Maximize2 className="w-3.5 h-3.5" />
																				<span>Full Compare View</span>
																			</button>
																		</div>
																	)}
																	<div className={`${Object.keys(msg.responses || {}).length === 2 ? 'grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6' : ''} ${Object.keys(msg.responses || {}).length > 2 ? 'flex gap-4 lg:gap-6 overflow-x-auto pb-4' : ''}`}>
																		{Object.values(msg.responses || {}).map((resp: ModelResponse) => (
																			<div key={resp.model} className="relative min-w-[300px] flex-1">
																				<div className="text-sm leading-relaxed text-content markdown-body">
																					<div className="mb-1 text-[10px] font-bold text-accent uppercase tracking-widest flex items-center gap-2">
																						{AVAILABLE_MODELS.find(m => m.id === resp.model)?.name || resp.model}
																					</div>
																					{resp.status === 'loading' ? (
																						<div className="flex gap-2 py-3 items-center">
																							<div className="w-2 h-2 bg-[#10a37f] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
																							<div className="w-2 h-2 bg-[#10a37f] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
																							<div className="w-2 h-2 bg-[#10a37f] rounded-full animate-bounce"></div>
																						</div>
																					) : resp.status === 'error' ? (
																						<span className="text-red-400 italic bg-red-400/5 px-2 py-1 rounded">{resp.error}</span>
																					) : (
																						<>
																							<ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code: CodeBlock, pre: PreBlock, a: (props) => <a target="_blank" rel="noopener noreferrer" {...props} /> }}>{resp.text}</ReactMarkdown>
																							<ResponseFooter
																								text={resp.text}
																								timestamp={msg.id}
																								model={resp.model}
																								response={resp}
																								onBranch={(id, m, cw) => initiateBranch(id, m, cw)}
																								onRegenClick={(e, msgId, mdl) => setRegenMenuOpen(prev => prev?.msgId === msgId && prev.model === mdl ? null : { msgId, model: mdl })}
																								onVersionChange={handleVersionChange}
																								isCompact={Object.keys(msg.responses || {}).length >= 3}
																								readOnlyMode={readOnlyMode}
																								currentSessionId={currentSessionId}
																								sessions={sessions}
																								onDelete={() => initiateDeleteResponse(msg.id, resp.model)}
																							/>
																							{regenMenuOpen?.msgId === msg.id && regenMenuOpen?.model === resp.model && (
																								<div ref={regenMenuRef} className="absolute bottom-10 left-0 bg-card border border-border rounded-xl shadow-2xl z-[100] overflow-hidden min-w-[180px] p-1.5">
																									<button onClick={() => handleRegenerate(msg.id, resp.model, 'retry')} className="w-full text-left px-3 py-2 text-xs hover:bg-card-hover rounded-lg flex items-center gap-2 transition-colors"><RefreshCw className="w-3.5 h-3.5" /> Try Again</button>
																									<button onClick={() => handleRegenerate(msg.id, resp.model, 'expand')} className="w-full text-left px-3 py-2 text-xs hover:bg-card-hover rounded-lg flex items-center gap-2 transition-colors"><Maximize2 className="w-3.5 h-3.5" /> Expand</button>
																									<button onClick={() => handleRegenerate(msg.id, resp.model, 'concise')} className="w-full text-left px-3 py-2 text-xs hover:bg-card-hover rounded-lg flex items-center gap-2 transition-colors"><Minimize2 className="w-3.5 h-3.5" /> Concise</button>
																								</div>
																							)}
																						</>
																					)}
																				</div>
																			</div>
																		))}
																	</div>
																</div>
															)}
														</div>
													</div>
												</div>
											</React.Fragment>
										);
									})}

									{(isWorkflowAtFileUpload || isWorkflowAtExport) && !isGenerating && (
										<div className="py-10">
											<div>
												{isWorkflowAtFileUpload ? (
													<div
														onClick={() => fileInputRef.current?.click()}
														onDragOver={(e) => e.preventDefault()}
														onDrop={handleFileUpload}
														className="group relative flex flex-col items-center justify-center border-2 border-dashed border-accent/30 rounded-3xl p-12 bg-accent/5 hover:bg-accent/10 hover:border-accent transition-all cursor-pointer shadow-sm hover:shadow-md"
													>
														<input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" multiple />
														<div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center text-accent mb-6 group-hover:scale-110 transition-transform">
															<UploadCloud className="w-8 h-8" />
														</div>
														<h3 className="text-lg font-bold text-primary mb-1">Workflow: Upload Files</h3>
														<p className="text-sm text-secondary text-center max-sm mb-6 leading-relaxed">
															{activeWorkflowStep?.fileRequirement || "Please drop the necessary documents to continue the workflow."}
														</p>
														<div className="flex flex-wrap gap-2 justify-center">
															{attachments.length > 0 ? (
																attachments.map(att => (
																	<div key={att.id} className="flex items-center gap-2 bg-card px-4 py-2 rounded-xl border border-accent/20 text-xs text-accent font-bold shadow-sm">
																		<FileText className="w-4 h-4" />
																		<span className="truncate max-w-[140px]">{att.name}</span>
																		<button onClick={(e) => { e.stopPropagation(); removeAttachment(att.id); }} className="hover:text-red-400 transition-colors ml-1">
																			<X className="w-4 h-4" />
																		</button>
																	</div>
																))
															) : (
																<span className="text-xs text-secondary italic opacity-50">No files selected</span>
															)}
														</div>
														{attachments.length > 0 && (
															<button
																onClick={(e) => { e.stopPropagation(); handleNextWorkflowStep(); }}
																className="mt-8 flex items-center gap-2 bg-accent text-white px-8 py-3 rounded-2xl text-sm font-extrabold shadow-lg shadow-accent/20 hover:opacity-95 active:scale-95 transition-all"
															>
																Continue Workflow <ChevronRight className="w-4 h-4" />
															</button>
														)}
													</div>
												) : (
													<div className="flex flex-col items-center justify-center border border-border rounded-3xl p-12 bg-panel shadow-xl">
														<div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center text-accent mb-6">
															<FileDown className="w-8 h-8" />
														</div>
														<h3 className="text-lg font-bold text-primary mb-1">Workflow: Export Result</h3>
														<p className="text-sm text-secondary text-center max-w-sm mb-8 leading-relaxed">
															The workflow has prepared your result for export in <span className="text-accent font-bold uppercase">{activeWorkflowStep?.exportFormat}</span> format.
														</p>
														<div className="flex flex-col sm:flex-row gap-3 w-full">
															<button
																onClick={() => handleExportWorkflowResult(activeWorkflowStep?.exportFormat)}
																className="flex-1 flex items-center justify-center gap-2 bg-accent text-white px-6 py-3.5 rounded-2xl text-sm font-bold shadow-lg shadow-accent/20 hover:opacity-95 active:scale-95 transition-all"
															>
																<Download className="w-4 h-4" /> Download as {activeWorkflowStep?.exportFormat?.toUpperCase()}
															</button>
														</div>
													</div>
												)}
											</div>
										</div>
									)}


									<div ref={chatEndRef} />
								</>

							)
							}
						</div>
					)}
				</div>

				{
					showScrollButton && (
						<button
							onClick={scrollToBottom}
							className="absolute bottom-28 left-1/2 -translate-x-1/2 bg-card border border-border p-2.5 rounded-full shadow-xl text-primary hover:bg-card-hover z-30 transition-all hover:scale-110"
						>
							<ArrowDown className="w-5 h-5" />
						</button>
					)
				}

				{!currentFolderViewId && (messages.length > 0 || landingView === 'home') && !isWorkflowAtFileUpload && renderInputArea('default')}

				{
					messages
						.filter(m => m.role === 'user')
						.length > 5 &&
					!currentFolderViewId &&
					!isLibraryOpen &&
					!isWorkflowBuilderOpen &&
					!isDatabaseSourcesOpen &&
					!isPersonaModalOpen &&
					!isCanvasOpen && (
						<button
							onClick={() => {
								setIsOutlineOpen(true);
								setIsBriefcaseOpen(false);
							}}
							className="fixed right-0 top-[calc(50%+60px)] -translate-y-1/2 z-[100] bg-card border border-border p-3.5 rounded-l-2xl shadow-2xl hover:bg-card-hover transition-all hover:pr-5 group"
						>
							<List className="w-5 h-5 text-secondary group-hover:text-primary" />
						</button>
					)
				}

				{
					!currentFolderViewId &&
					!isLibraryOpen &&
					!isWorkflowBuilderOpen &&
					!isDatabaseSourcesOpen &&
					!isPersonaModalOpen &&
					!isCanvasOpen &&
					!readOnlyMode && (
						<button
							onClick={() => { setIsBriefcaseOpen(true); setIsOutlineOpen(false); }}
							onDragOver={(e) => { e.preventDefault(); setIsBriefcaseDragOver(true); }}
							onDragLeave={() => setIsBriefcaseDragOver(false)}
							onDrop={handleBriefcaseDrop}
							className={`fixed right-0 top-1/2 -translate-y-1/2 z-[100] bg-card border border-border p-3.5 rounded-l-2xl shadow-2xl transition-all hover:pr-5 group ${isBriefcaseDragOver ? 'bg-accent/20 border-accent scale-110' : 'hover:bg-card-hover'}`}
						>
							<Briefcase className={`w-5 h-5 ${isBriefcaseDragOver ? 'text-accent animate-bounce' : 'text-secondary group-hover:text-primary'}`} />
						</button>
					)
				}

				{
					(isOutlineOpen || isBriefcaseOpen) && (
						<div
							className="fixed inset-0 z-[65] bg-black/10 backdrop-blur-[1px] transition-opacity"
							onClick={() => { setIsOutlineOpen(false); setIsBriefcaseOpen(false); }}
						/>
					)
				}

				<div className={`fixed inset-y-0 right-0 z-[200] w-80 bg-panel border-l border-border transform transition-transform duration-300 ease-in-out shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col ${isOutlineOpen ? 'translate-x-0' : 'translate-x-full'}`}>
					<div className="flex items-center justify-between p-5 border-b border-border bg-panel shadow-sm">
						<h3 className="font-semibold flex items-center gap-2 tracking-tight"><History className="w-4 h-4 text-accent" /> Chat Timeline</h3>
						<button onClick={() => setIsOutlineOpen(false)} className="p-2 hover:bg-card-hover rounded-xl transition-all hover:rotate-90 hover:scale-110"><X className="w-5 h-5" /></button>
					</div>
					<div className="flex-1 overflow-y-auto p-5 space-y-6">
						{(() => {
							const userMessages = messages.filter(m => m.role === 'user');
							const groupedMessages = userMessages.reduce((acc, msg) => {
								const date = new Date(parseInt(msg.id)).toLocaleDateString([], { month: 'short', day: 'numeric', year: new Date(parseInt(msg.id)).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined });
								if (!acc[date]) acc[date] = [];
								acc[date].push(msg);
								return acc;
							}, {} as Record<string, typeof messages>);

							return Object.entries(groupedMessages).map(([date, msgs]) => (
								<div key={date} className="relative">
									<div className="sticky top-0 bg-panel z-10 py-1 mb-2">
										<span className="text-[10px] font-bold text-secondary uppercase tracking-widest bg-card border border-border px-2 py-0.5 rounded-md shadow-sm">{date}</span>
									</div>
									<div className="space-y-6 pl-1 border-l border-border/50 ml-2">
										{msgs.map((msg) => (
											<button key={msg.id} onClick={() => handleJumpToMessage(msg.id)} className="w-full text-left group pl-4 hover:translate-x-1 transition-all py-1 relative">
												<div className="absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full bg-border group-hover:bg-accent transition-colors ring-4 ring-panel"></div>
												<div className="text-[10px] text-secondary font-bold group-hover:text-accent transition-colors uppercase tracking-widest">{formatTime(msg.id)}</div>
												<p className="text-sm line-clamp-2 text-content group-hover:text-primary transition-colors mt-1">{msg.content}</p>
											</button>
										))}
									</div>
								</div>
							));
						})()}
					</div>
				</div>

				<BriefcasePanel
					briefcase={briefcase}
					databaseSources={databaseSources}
					isGenerating={isGenerating}
				/>

				<CanvasEditor
					isOpen={isCanvasOpen}
					onClose={closeCanvas}
					sessionTitle={sessions.find(s => s.id === currentSessionId)?.title || 'Canvas Editor'}
					canvasBlocks={canvasBlocks}
					onAddBlock={addCanvasBlock}
					onUpdateBlock={updateCanvasBlock}
					onMoveBlock={moveCanvasBlock}
					onRemoveBlock={removeCanvasBlock}
					activeAiBlockId={activeAiBlockId}
					setActiveAiBlockId={setActiveAiBlockId}
					onExport={generateWordDoc}
				/>

				{
					expandedMessageId && (() => {
						const expandedMsg = messages.find(m => m.id === expandedMessageId);
						if (!expandedMsg || !expandedMsg.responses) return null;
						return (
							<div className="fixed inset-0 z-[100] bg-app animate-in fade-in duration-200 flex flex-col">
								<div className="flex items-center justify-between px-6 py-4 border-b border-border bg-panel shadow-sm shrink-0">
									<div className="flex items-center gap-3">
										<div className="p-2 bg-accent/10 rounded-lg text-accent">
											<Bot className="w-5 h-5" />
										</div>
										<div>
											<h2 className="text-sm font-bold tracking-tight">Compare Model Responses</h2>
											<p className="text-[10px] text-secondary">{Object.keys(expandedMsg.responses).length} Models Responded</p>
										</div>
									</div>
									<button
										onClick={() => setExpandedMessageId(null)}
										className="p-2 hover:bg-card-hover rounded-xl transition-all hover:rotate-90 hover:scale-110"
									>
										<X className="w-6 h-6" />
									</button>
								</div>
								<div className="flex-1 overflow-x-auto overflow-y-hidden p-6 bg-app/50">
									<div className="flex gap-6 h-full min-w-max">
										{Object.values(expandedMsg.responses).map((resp) => (
											<div key={resp.model} className="w-[500px] md:w-[600px] flex flex-col bg-card border border-border rounded-2xl shadow-xl overflow-hidden h-full">
												<div className="px-5 py-4 border-b border-border bg-panel/50 flex items-center justify-between shrink-0">
													<div className="font-bold text-sm flex items-center gap-2 text-primary">
														<div className="w-2 h-2 rounded-full bg-accent"></div>
														{AVAILABLE_MODELS.find(m => m.id === resp.model)?.name || resp.model}
													</div>
													<div className="text-[10px] text-secondary font-mono">{formatTime(expandedMsg.id)}</div>
												</div>
												<div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
													<div className="markdown-body text-sm md:text-base leading-relaxed text-primary">
														<ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code: CodeBlock, pre: PreBlock, a: (props) => <a target="_blank" rel="noopener noreferrer" {...props} /> }}>{resp.text}</ReactMarkdown>
													</div>
												</div>
											</div>
										))}
									</div>
								</div>
							</div>
						);
					})()
				}

				<PromptLibraryModal
					isLibraryOpen={isLibraryOpen}
					setIsLibraryOpen={setIsLibraryOpen}
					libraryPrompts={libraryPrompts}
					searchLibraryQuery={searchLibraryQuery}
					setSearchLibraryQuery={setSearchLibraryQuery}
					selectedLibraryCategory={selectedLibraryCategory}
					setSelectedLibraryCategory={setSelectedLibraryCategory}
					editingLibraryPromptId={editingLibraryPromptId}
					setEditingLibraryPromptId={setEditingLibraryPromptId}
					isCreatingLibraryPrompt={isCreatingLibraryPrompt}
					setIsCreatingLibraryPrompt={setIsCreatingLibraryPrompt}
					libraryPromptForm={libraryPromptForm}
					setLibraryPromptForm={setLibraryPromptForm}
					libraryPromptFormToDelete={libraryPromptFormToDelete}
					setLibraryPromptFormToDelete={setLibraryPromptFormToDelete}
					initiateDeleteLibraryPrompt={initiateDeleteLibraryPrompt}
					confirmDeleteLibraryPrompt={confirmDeleteLibraryPrompt}
					handleSaveLibraryPrompt={handleSaveLibraryPrompt}
					startEditLibraryPrompt={startEditLibraryPrompt}
					libraryCategories={libraryCategories}
					filteredLibraryPrompts={filteredLibraryPrompts}
					onUsePrompt={(prompt) => {
						useLibraryPrompt(prompt);
					}}
				/>

				<DatabaseSourcesModal
					isDatabaseSourcesOpen={isDatabaseSourcesOpen}
					setIsDatabaseSourcesOpen={setIsDatabaseSourcesOpen}
					databaseSources={databaseSources}
					selectedDatabaseSourceId={selectedDatabaseSourceId}
					setSelectedDatabaseSourceId={setSelectedDatabaseSourceId}
					isCreatingDatabaseSource={isCreatingDatabaseSource}
					setIsCreatingDatabaseSource={setIsCreatingDatabaseSource}
					databaseSourceForm={databaseSourceForm}
					setDatabaseSourceForm={setDatabaseSourceForm}
					dbSourceToDelete={dbSourceToDelete}
					setDbSourceToDelete={setDbSourceToDelete}
					dbPhraseSearchQuery={dbPhraseSearchQuery}
					setDbPhraseSearchQuery={setDbPhraseSearchQuery}
					isTestingAzureConnection={isTestingAzureConnection}
					azureTestResult={azureTestResult}
					setAzureTestResult={setAzureTestResult}
					dbFileInputRef={dbFileInputRef}
					handleTestAzureConnection={handleTestAzureConnection}
					handleSaveDatabaseSource={handleSaveDatabaseSource}
					handleDbFileUpload={handleDbFileUpload}
					initiateDeleteDatabaseSource={initiateDeleteDatabaseSource}
					confirmDeleteDatabaseSource={confirmDeleteDatabaseSource}
					startEditDatabaseSource={startEditDatabaseSource}
					filteredRows={filteredRows}
					csvData={csvData}
				/>

				<WorkflowBuilderModal
					isOpen={isWorkflowBuilderOpen}
					onClose={() => setIsWorkflowBuilderOpen(false)}
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
					workflows={workflows}
					handleStartEditingWorkflow={handleStartEditingWorkflow}
					setWorkflowToDelete={setWorkflowToDelete}
					playWorkflow={playWorkflow}
					userGroups={userGroups}
					isMsalEnabled={process.env.USE_MSAL === 'true'}
					allowSystemDelete={false}
				/>

				<PersonaModal
					isOpen={isPersonaModalOpen}
					onClose={() => {
						setIsPersonaModalOpen(false);
						setEditingPersonaId(null);
						setPersonaForm({ name: '', description: '', systemInstruction: '', multiStepInstruction: '' });
					}}
					personas={personas}
					selectedPersonaId={selectedPersonaId}
					onSelectPersona={selectPersona}
					onEditPersona={startEditPersona}
					onDeletePersona={initiateDeletePersona}
					editingPersonaId={editingPersonaId}
					personaForm={personaForm}
					setPersonaForm={setPersonaForm}
					onSave={handleSavePersona}
					onCancelEdit={() => {
						setEditingPersonaId(null);
						setPersonaForm({ name: '', description: '', systemInstruction: '', multiStepInstruction: '' });
					}}
				/>

				<DeleteConfirmModal
					isOpen={!!sessionToDelete}
					title="Delete Chat?"
					message="This conversation will be permanently removed."
					onCancel={cancelDeleteSession}
					onConfirm={confirmDeleteSession}
				/>
				<DeleteConfirmModal
					isOpen={!!folderToDelete}
					title="Delete Folder?"
					message="The folder will be deleted. Chat sessions inside will remain in your main list."
					onCancel={cancelDeleteFolder}
					onConfirm={confirmDeleteFolder}
				/>
				<DeleteConfirmModal
					isOpen={!!personaToDelete}
					title="Delete Persona?"
					message="This persona will be permanently removed."
					onCancel={() => setPersonaToDelete(null)}
					onConfirm={confirmDeletePersona}
				/>

				<DeleteConfirmModal
					isOpen={!!workflowToDelete}
					title="Delete Workflow?"
					message="This workflow and all its steps will be permanently removed."
					onCancel={() => setWorkflowToDelete(null)}
					onConfirm={confirmDeleteWorkflow}
				/>

				<DeleteConfirmModal
					isOpen={!!messageToDelete}
					title="Delete Message?"
					message={
						<span>
							Are you sure you want to delete this message?<br /><br />
							<span className="font-bold text-red-400">Warning:</span> Removing parts of a conversation can cause a disjointed context window for future responses.
						</span>
					}
					onCancel={() => setMessageToDelete(null)}
					onConfirm={handleDeleteMessage}
				/>

				<DeleteConfirmModal
					isOpen={!!responseToDelete}
					title="Delete Response?"
					message={
						<span>
							Are you sure you want to delete this response?<br /><br />
							<span className="font-bold text-red-400">Warning:</span> Removing parts of a conversation can cause a disjointed context window for future responses.
						</span>
					}
					onCancel={() => setResponseToDelete(null)}
					onConfirm={handleDeleteResponse}
				/>

				<BranchingModal
					isOpen={!!branchingData}
					branchTitle={branchTitle}
					onBranchTitleChange={setBranchTitle}
					onCancel={cancelBranch}
					onConfirm={confirmBranch}
				/>

				<MoveToModal
					isOpen={!!moveToSessionId}
					folders={folders}
					onMoveToFolder={handleMoveToFolder}
					newFolderName={newFolderName}
					setNewFolderName={setNewFolderName}
					onCreateFolderAndMove={handleCreateFolderAndMove}
					onClose={() => setMoveToSessionId(null)}
				/>

				<ToastNotification
					isVisible={isInviteCopied}
					onClose={() => setIsInviteCopied(false)}
					title="Success"
					message="Link copied to clipboard"
				/>

				{
					MCP_SERVER_CONFIGS.map(server => (
						<ServerConnector
							key={server.id}
							url={server.url!}
							name={server.name}
							onToolsLoaded={handleToolsLoaded}
						/>
					))
				}
			</main >
		</div >
	);
};

export default App;