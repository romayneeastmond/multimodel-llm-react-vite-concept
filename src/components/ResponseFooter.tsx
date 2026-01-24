import React, { useState } from 'react';
import { Copy, CheckCheck, Square, Volume2, RefreshCw, GitFork, Workflow as WorkflowIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { copyToClipboard } from '../utils/chatUtils';
import { MultiModel, ModelResponse, ChatSession } from '../types/index';

interface ResponseFooterProps {
	text: string;
	timestamp: string;
	model: MultiModel;
	response: ModelResponse;
	onBranch: (messageId: string, model: MultiModel, continueWorkflow?: boolean) => void;
	onRegenClick: (e: React.MouseEvent, messageId: string, model: MultiModel) => void;
	onVersionChange: (timestamp: string, model: MultiModel, direction: 'prev' | 'next') => void;
	isCompact?: boolean;
	readOnlyMode: boolean;
	currentSessionId: string | null;
	sessions: ChatSession[];
}

const ResponseFooter = ({
	text,
	timestamp,
	model,
	response,
	onBranch,
	onRegenClick,
	onVersionChange,
	isCompact,
	readOnlyMode,
	currentSessionId,
	sessions
}: ResponseFooterProps) => {
	const [copied, setCopied] = useState(false);
	const [isSpeaking, setIsSpeaking] = useState(false);

	const handleCopy = async () => {
		if (await copyToClipboard(text)) {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	const handleSpeak = () => {
		if (isSpeaking) {
			window.speechSynthesis.cancel();
			setIsSpeaking(false);
		} else {
			window.speechSynthesis.cancel();
			const utterance = new SpeechSynthesisUtterance(text);
			utterance.onend = () => setIsSpeaking(false);
			window.speechSynthesis.speak(utterance);
			setIsSpeaking(true);
		}
	};

	const formatTime = (timestamp: string) => {
		return new Date(parseInt(timestamp)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	};

	const allVersions = response?.versions || [];
	const versions = allVersions.filter((v: any, i: number, a: any[]) => a.findIndex((t: any) => t.text === v.text) === i);
	const currentIdx = versions.findIndex((v: any) => v.text === text);

	return (
		<div className="flex flex-col gap-2 mt-3 pt-3 border-t border-border/50">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div className="flex items-center gap-1">
					{versions.length > 1 && (
						<div className="flex items-center gap-1 mr-2 bg-app rounded-lg p-0.5 border border-border">
							<button onClick={() => onVersionChange(timestamp, model, 'prev')} disabled={currentIdx === 0} className="p-1 text-secondary hover:text-primary disabled:opacity-30 rounded"><ChevronLeft className="w-3 h-3" /></button>
							<span className="text-[10px] text-secondary px-1 min-w-[30px] text-center">{currentIdx + 1} / {versions.length}</span>
							<button onClick={() => onVersionChange(timestamp, model, 'next')} disabled={currentIdx === versions.length - 1} className="p-1 text-secondary hover:text-primary disabled:opacity-30 rounded"><ChevronRight className="w-3 h-3" /></button>
						</div>
					)}
					<button onClick={handleCopy} className="flex items-center gap-1.5 px-2 py-1 text-xs text-secondary hover:text-primary hover:bg-card-hover rounded transition-colors" title={isCompact ? "Copy" : undefined}>
						{copied ? <CheckCheck className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
						<span className={isCompact ? "hidden" : "hidden sm:inline"}>{copied ? 'Copied' : 'Copy'}</span>
					</button>
					<div className="h-3 w-px bg-border"></div>
					<button onClick={handleSpeak} className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded transition-colors ${isSpeaking ? 'text-accent bg-card-hover' : 'text-secondary hover:text-primary hover:bg-card-hover'}`} title={isCompact ? (isSpeaking ? "Stop Reading" : "Read Aloud") : undefined}>
						{isSpeaking ? <Square className="w-3.5 h-3.5 fill-current" /> : <Volume2 className="w-3.5 h-3.5" />}
						<span className={isCompact ? "hidden" : "hidden sm:inline"}>{isSpeaking ? 'Stop' : 'Read'}</span>
					</button>
					{!readOnlyMode && (
						<>
							<div className="h-3 w-px bg-border"></div>
							<button onClick={(e) => onRegenClick(e, timestamp, model)} className="flex items-center gap-1.5 px-2 py-1 text-xs text-secondary hover:text-primary hover:bg-card-hover rounded transition-colors" title={isCompact ? "Regenerate" : undefined}>
								<RefreshCw className="w-3.5 h-3.5" />
								<span className={isCompact ? "hidden" : "hidden sm:inline"}>Regenerate</span>
							</button>
							<div className="h-3 w-px bg-border"></div>
							<button onClick={() => onBranch(timestamp, model, false)} className="flex items-center gap-2 px-2 py-1 text-xs text-secondary hover:text-primary hover:bg-card-hover rounded transition-colors" title={isCompact ? "Branch Conversation" : undefined}>
								<GitFork className="w-3.5 h-3.5" />
								<span className={isCompact ? "hidden" : ""}>Branch</span>
							</button>
							{sessions.find(s => s.id === currentSessionId)?.workflowId && (
								<>
									<div className="h-3 w-px bg-border"></div>
									<button onClick={() => onBranch(timestamp, model, true)} className="flex items-center gap-2 px-2 py-1 text-xs text-secondary hover:text-primary hover:bg-card-hover rounded transition-colors" title={isCompact ? "Branch Workflow" : undefined}>
										<WorkflowIcon className="w-3.5 h-3.5" />
										<span className={isCompact ? "hidden" : ""}>Branch Workflow</span>
									</button>
								</>
							)}
						</>
					)}
				</div>
				<div className="text-[10px] text-secondary select-none">{formatTime(timestamp)}</div>
			</div>
		</div>
	);
};

export default ResponseFooter;
