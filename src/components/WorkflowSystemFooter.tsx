import React, { useState } from 'react';
import { Copy, CheckCheck } from 'lucide-react';
import { copyToClipboard } from '../utils/chatUtils';

interface WorkflowSystemFooterProps {
	content: string;
	timestamp: string;
}

const WorkflowSystemFooter = ({ content, timestamp }: WorkflowSystemFooterProps) => {
	const [copied, setCopied] = useState(false);
	const handleCopy = async () => {
		if (await copyToClipboard(content)) {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	return (
		<div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
			<div className="flex items-center gap-2">
				<button
					onClick={handleCopy}
					className="flex items-center gap-1.5 px-2 py-1 text-xs text-secondary hover:text-primary hover:bg-card-hover rounded transition-colors"
				>
					{copied ? <CheckCheck className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
					<span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
				</button>
			</div>
			<span className="text-[10px] text-secondary select-none">
				{new Date(parseInt(timestamp)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
			</span>
		</div>
	);
};

export default WorkflowSystemFooter;
