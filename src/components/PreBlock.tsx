import React, { useState, useRef, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ChevronRight, Copy, Download, CheckCheck } from 'lucide-react';
import { copyToClipboard, downloadCode } from '../utils/chatUtils';
import ChartBlock from './ChartBlock';

const PreBlock = ({ children, ...props }: any) => {
	if (!React.isValidElement(children)) {
		return <pre {...props}>{children}</pre>;
	}

	const childProps = children.props as any;
	const className = childProps.className || '';
	const match = /language-([\w\d:-]+)/.exec(className || '');
	const language = match ? match[1] : '';
	const codeContent = String(childProps.children || '').replace(/\n$/, '');

	if (language === 'chart' || language === 'json-chart') {
		return <ChartBlock codeContent={codeContent} />;
	}

	if (language.startsWith('mcp:') || language.startsWith('embed:')) {
		const isEmbed = language.startsWith('embed:');
		const displayName = language.split(':')[1];
		const [isOpen, setIsOpen] = useState(false);
		const contentRef = useRef<HTMLDivElement>(null);

		useEffect(() => {
			if (isOpen && contentRef.current) {
				setTimeout(() => {
					contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
				}, 100);
			}
		}, [isOpen]);

		return (
			<div className="my-4 border border-border rounded-lg overflow-hidden bg-panel">
				<button
					onClick={() => setIsOpen(!isOpen)}
					className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-mono text-secondary hover:text-primary hover:bg-card-hover transition-colors select-none ${isOpen ? 'border-b border-border' : ''}`}
				>
					<ChevronRight className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
					<span>
						{isEmbed ? 'Vector Embedding' : 'Output'} from <span className="font-bold text-accent">{displayName}</span>
					</span>
				</button>
				{isOpen && (
					<div ref={contentRef} className="overflow-x-auto">
						<SyntaxHighlighter
							language="json"
							style={vscDarkPlus}
							customStyle={{ margin: 0, padding: '12px', background: '#1a1a1a', fontSize: '12px' }}
							wrapLines={true}
							wrapLongLines={true}
						>
							{codeContent}
						</SyntaxHighlighter>
					</div>
				)}
			</div>
		);
	}

	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		const success = await copyToClipboard(codeContent);
		if (success) {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	return (
		<div className="my-4 rounded-lg overflow-hidden border border-border bg-[#1e1e1e] max-w-full">
			<div className="flex items-center justify-between px-3 py-2 bg-[#2f2f2f] border-b border-[#3e3e3e]">
				<span className="text-xs text-[#9b9b9b] font-mono lowercase">{language || 'text'}</span>
				<div className="flex gap-2">
					<button
						onClick={() => downloadCode(codeContent, language)}
						className="flex items-center gap-1 text-[10px] text-[#9b9b9b] hover:text-[#ececec] transition-colors"
					>
						<Download className="w-3.5 h-3.5" />
						<span className="hidden sm:inline">Download</span>
					</button>
					<button
						onClick={handleCopy}
						className="flex items-center gap-1 text-[10px] text-[#9b9b9b] hover:text-[#ececec] transition-colors"
					>
						{copied ? <CheckCheck className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
						<span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
					</button>
				</div>
			</div>
			<div className="text-sm">
				<SyntaxHighlighter
					language={language}
					style={vscDarkPlus}
					customStyle={{ margin: 0, padding: '16px', background: '#1e1e1e', fontSize: '13px', lineHeight: '1.5' }}
					wrapLines={true}
				>
					{codeContent}
				</SyntaxHighlighter>
			</div>
		</div>
	);
};

export default PreBlock;
