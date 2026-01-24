import { useEffect, useRef, useState } from 'react';
import { generateModelResponse } from '../services/multiModelService';
import { marked } from 'marked';
import { MultiModel } from '../types/index';
import {
	ChevronDown, Plus, Sparkles, RefreshCw, List, ArrowUp, ArrowDown, Bold, Italic, Underline, Heading1, Heading2, Heading3, Heading4, Heading5, Heading6, Pilcrow, ListOrdered, Trash2
} from 'lucide-react';
import { AVAILABLE_MODELS } from '../config/constants';

const linkRenderer = new marked.Renderer();
linkRenderer.link = (href, title, text) => `<a target="_blank" rel="noopener noreferrer" href="${href}" title="${title || ''}">${text}</a>`;

interface RichTextEditorProps {
	initialContent: string;
	onChange: (html: string) => void;
	onAiModeChange?: (isOpen: boolean) => void;
	onMoveUp?: () => void;
	onMoveDown?: () => void;
	onDelete?: () => void;
	isFirst?: boolean;
	isLast?: boolean;
	className?: string;
}

const RichTextEditor = ({ initialContent, onChange, onAiModeChange, onMoveUp, onMoveDown, onDelete, isFirst, isLast, className }: RichTextEditorProps) => {
	const editorRef = useRef<HTMLDivElement>(null);
	const savedRangeRef = useRef<Range | null>(null);
	const [showAiInput, setShowAiInput] = useState(false);
	const [aiPrompt, setAiPrompt] = useState('');
	const [isAiLoading, setIsAiLoading] = useState(false);
	const [selectedModel, setSelectedModel] = useState<MultiModel>(MultiModel.FLASH_3);

	const [floatingMenuPos, setFloatingMenuPos] = useState<{ top: number, left: number } | null>(null);
	const [showFloatingButton, setShowFloatingButton] = useState(false);
	const [showFloatingMenu, setShowFloatingMenu] = useState(false);
	const [selectedText, setSelectedText] = useState('');
	const [customInstruction, setCustomInstruction] = useState('');
	const [menuDirection, setMenuDirection] = useState<'up' | 'down'>('down');

	useEffect(() => {
		if (editorRef.current && document.activeElement !== editorRef.current) {
			if (editorRef.current.innerHTML !== initialContent) {
				editorRef.current.innerHTML = initialContent;
			}
		}
	}, [initialContent]);

	useEffect(() => {
		if (onAiModeChange) {
			onAiModeChange(showAiInput);
		}
	}, [showAiInput, onAiModeChange]);

	const exec = (command: string, value: string | undefined = undefined) => {
		document.execCommand(command, false, value);
		if (editorRef.current) {
			onChange(editorRef.current.innerHTML);
		}
	};

	const handleAiSubmit = async () => {
		if (!aiPrompt.trim()) return;
		setIsAiLoading(true);

		try {
			const generatedText = await generateModelResponse(selectedModel, aiPrompt, [], []);
			const renderer = new marked.Renderer();
			renderer.link = (href, title, text) => `<a target="_blank" rel="noopener noreferrer" href="${href}" title="${title || ''}">${text}</a>`;
			const html = await marked.parse(generatedText, { renderer });

			if (editorRef.current) {
				editorRef.current.focus();
				const selection = window.getSelection();
				if (selection && savedRangeRef.current) {
					selection.removeAllRanges();
					selection.addRange(savedRangeRef.current);
				}
				document.execCommand('insertHTML', false, html);
				onChange(editorRef.current.innerHTML);
			}
		} catch (error) {
			console.error("AI Insertion Error:", error);
		} finally {
			setIsAiLoading(false);
			setShowAiInput(false);
			setAiPrompt('');
		}
	};

	const saveSelection = () => {
		const selection = window.getSelection();
		if (selection && selection.rangeCount > 0) {
			const range = selection.getRangeAt(0);
			if (editorRef.current && editorRef.current.contains(selection.anchorNode)) {
				savedRangeRef.current = range;
				const text = selection.toString().trim();

				if (text.length > 0) {
					const rects = range.getClientRects();
					if (rects.length > 0) {
						const lastRect = rects[0];
						const editorRect = editorRef.current.getBoundingClientRect();
						const relativeTop = lastRect.top - editorRect.top;
						const shouldShowUp = relativeTop > (editorRect.height * 0.6);
						setMenuDirection(shouldShowUp ? 'up' : 'down');

						setFloatingMenuPos({
							top: relativeTop - (shouldShowUp ? 10 : 40),
							left: lastRect.left - editorRect.left + (lastRect.width / 2)
						});
						setShowFloatingButton(true);
						setSelectedText(text);
					}
				} else {
					setShowFloatingButton(false);
					setShowFloatingMenu(false);
				}
			}
		} else {
			setShowFloatingButton(false);
			setShowFloatingMenu(false);
		}
	};

	const applyRedlining = async (instruction: string) => {
		if (!selectedText || isAiLoading) return;
		setIsAiLoading(true);

		try {
			const prompt = `Act as a professional editor. I have selected the following text: "${selectedText}". ${instruction}. Output ONLY the revised text.`;
			const revisedText = await generateModelResponse(selectedModel, prompt, [], []);

			const id = Date.now().toString(36);
			const formattedHtml = `
				<span id="rl-${id}" class="redline-group" data-original="${selectedText.replace(/"/g, '&quot;')}" style="display: inline-block;">
					<span class="redline-old" style="color: #ff4444; text-decoration: line-through; opacity: 0.7;">${selectedText}</span>
					<br/>
					<span class="redline-new" style="color: #38bdf8; font-weight: 500;">${revisedText}</span>
					<span contentEditable="false" style="display: inline-flex; gap: 4px; margin-left: 8px; vertical-align: middle; background: rgba(0,0,0,0.05); padding: 2px 4px; rounded-md: 4px; border-radius: 4px;">
						<button data-rl-id="${id}" data-action="accept" style="color: #22c55e; padding: 2px; display: flex; align-items: center;" title="Accept">
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
						</button>
						<button data-rl-id="${id}" data-action="undo" style="color: #ef4444; padding: 2px; display: flex; align-items: center;" title="Undo">
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><polyline points="3 3 3 8 8 8"></polyline></svg>
						</button>
					</span>
				</span>
			`.trim().replace(/\n/g, '');

			if (editorRef.current) {
				editorRef.current.focus();
				const selection = window.getSelection();
				if (selection && savedRangeRef.current) {
					selection.removeAllRanges();
					selection.addRange(savedRangeRef.current);
				}
				document.execCommand('insertHTML', false, formattedHtml);
				onChange(editorRef.current.innerHTML);
			}
		} catch (error) {
			console.error("Red-lining Error:", error);
		} finally {
			setIsAiLoading(false);
			setShowFloatingMenu(false);
			setShowFloatingButton(false);
			setFloatingMenuPos(null);
			setCustomInstruction('');
		}
	};

	const handleEditorClick = (e: React.MouseEvent) => {
		const target = e.target as HTMLElement;
		const btn = target.closest('button[data-rl-id]');
		if (btn) {
			e.preventDefault();
			e.stopPropagation();
			const id = (btn as HTMLElement).dataset.rlId;
			const action = (btn as HTMLElement).dataset.action;
			if (id) {
				const wrapper = editorRef.current?.querySelector(`#rl-${id}`);
				if (wrapper) {
					if (action === 'accept') {
						const newText = wrapper.querySelector('.redline-new')?.textContent || '';
						wrapper.replaceWith(newText);
					} else if (action === 'undo') {
						const originalText = (wrapper as HTMLElement).dataset.original || '';
						wrapper.replaceWith(originalText);
					}
					if (editorRef.current) onChange(editorRef.current.innerHTML);
				}
			}
		}
	};

	return (
		<div className={`flex flex-col w-full bg-panel ${className || ''}`}>
			<div className="sticky top-[-40px] z-20 overflow-hidden bg-card border-b border-border shadow-sm">
				<div className="flex items-center gap-1 p-2 flex-wrap">
					<button onMouseDown={(e) => { e.preventDefault(); exec('formatBlock', 'P'); }} className="p-1.5 text-secondary hover:text-primary hover:bg-card-hover rounded" title="Paragraph"><Pilcrow className="w-4 h-4" /></button>
					<div className="w-px h-4 bg-border mx-1"></div>
					<button onMouseDown={(e) => { e.preventDefault(); exec('bold'); }} className="p-1.5 text-secondary hover:text-primary hover:bg-card-hover rounded" title="Bold"><Bold className="w-4 h-4" /></button>
					<button onMouseDown={(e) => { e.preventDefault(); exec('italic'); }} className="p-1.5 text-secondary hover:text-primary hover:bg-card-hover rounded" title="Italic"><Italic className="w-4 h-4" /></button>
					<button onMouseDown={(e) => { e.preventDefault(); exec('underline'); }} className="p-1.5 text-secondary hover:text-primary hover:bg-card-hover rounded" title="Underline"><Underline className="w-4 h-4" /></button>
					<div className="w-px h-4 bg-border mx-1"></div>
					<button onMouseDown={(e) => { e.preventDefault(); exec('formatBlock', 'H1'); }} className="p-1.5 text-secondary hover:text-primary hover:bg-card-hover rounded" title="Heading 1"><Heading1 className="w-4 h-4" /></button>
					<button onMouseDown={(e) => { e.preventDefault(); exec('formatBlock', 'H2'); }} className="p-1.5 text-secondary hover:text-primary hover:bg-card-hover rounded" title="Heading 2"><Heading2 className="w-4 h-4" /></button>
					<button onMouseDown={(e) => { e.preventDefault(); exec('formatBlock', 'H3'); }} className="p-1.5 text-secondary hover:text-primary hover:bg-card-hover rounded" title="Heading 3"><Heading3 className="w-4 h-4" /></button>
					<button onMouseDown={(e) => { e.preventDefault(); exec('formatBlock', 'H4'); }} className="p-1.5 text-secondary hover:text-primary hover:bg-card-hover rounded" title="Heading 4"><Heading4 className="w-4 h-4" /></button>
					<button onMouseDown={(e) => { e.preventDefault(); exec('formatBlock', 'H5'); }} className="p-1.5 text-secondary hover:text-primary hover:bg-card-hover rounded" title="Heading 5"><Heading5 className="w-4 h-4" /></button>
					<button onMouseDown={(e) => { e.preventDefault(); exec('formatBlock', 'H6'); }} className="p-1.5 text-secondary hover:text-primary hover:bg-card-hover rounded" title="Heading 6"><Heading6 className="w-4 h-4" /></button>
					<div className="w-px h-4 bg-border mx-1"></div>
					<button onMouseDown={(e) => { e.preventDefault(); exec('insertUnorderedList'); }} className="p-1.5 text-secondary hover:text-primary hover:bg-card-hover rounded" title="Bullet List"><List className="w-4 h-4" /></button>
					<button onMouseDown={(e) => { e.preventDefault(); exec('insertOrderedList'); }} className="p-1.5 text-secondary hover:text-primary hover:bg-card-hover rounded" title="Numbered List"><ListOrdered className="w-4 h-4" /></button>
					<div className="w-px h-4 bg-border mx-1"></div>
					<button
						onMouseDown={(e) => { e.preventDefault(); saveSelection(); setShowAiInput(!showAiInput); }}
						className={`p-1.5 rounded transition-all flex items-center gap-2 text-xs font-medium ${showAiInput ? 'text-accent bg-card-hover' : 'text-secondary hover:text-primary hover:bg-card-hover'}`}
						title="AI Assistant"
					>
						<Sparkles className="w-4 h-4" />
						<span className="hidden sm:inline">AI Insert</span>
					</button>
				</div>

				{showAiInput === true &&
					<div className={`transition-all duration-300 ease-in-out overflow-visible border-t border-border ${showAiInput ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}>
						<div className="p-2 flex gap-2">
							<div className="relative shrink-0">
								<select
									value={selectedModel}
									onChange={(e) => setSelectedModel(e.target.value as MultiModel)}
									className="appearance-none bg-input border border-border rounded px-3 py-1.5 pr-8 text-sm text-primary outline-none focus:border-accent transition-colors cursor-pointer w-[140px] truncate"
								>
									{AVAILABLE_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
								</select>
								<ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-secondary pointer-events-none" />
							</div>
							<input
								type="text"
								value={aiPrompt}
								onChange={(e) => setAiPrompt(e.target.value)}
								onKeyDown={(e) => e.key === 'Enter' && handleAiSubmit()}
								placeholder="Describe what you want to add..."
								className="flex-1 bg-input border border-border rounded px-3 py-1.5 text-sm text-primary outline-none focus:border-accent transition-colors"
							/>
							<button
								onClick={handleAiSubmit}
								disabled={isAiLoading || !aiPrompt.trim()}
								className="px-4 py-1.5 bg-accent hover:opacity-90 text-white text-sm rounded font-medium disabled:opacity-50 transition-colors flex items-center justify-center min-w-[80px]"
							>
								{isAiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Generate'}
							</button>
						</div>
					</div>
				}
			</div>

			<div className="relative">
				{!showAiInput && (onMoveUp || onMoveDown || onDelete) && (
					<div className="absolute top-2 right-2 flex flex-col gap-1.5 z-30 bg-panel/90 backdrop-blur-sm p-1.5 border border-border rounded-xl shadow-sm transition-opacity opacity-0 group-hover:opacity-100">
						{onMoveUp && <button onClick={onMoveUp} disabled={isFirst} className="p-1.5 disabled:opacity-20 hover:bg-card-hover rounded-lg"><ArrowUp className="w-4 h-4" /></button>}
						{onMoveDown && <button onClick={onMoveDown} disabled={isLast} className="p-1.5 disabled:opacity-20 hover:bg-card-hover rounded-lg"><ArrowDown className="w-4 h-4" /></button>}
						{(onMoveUp || onMoveDown) && onDelete && <div className="h-px bg-border mx-1 my-0.5"></div>}
						{onDelete && <button onClick={onDelete} className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>}
					</div>
				)}

				{showFloatingButton && floatingMenuPos && (
					<div
						className="absolute z-30 transition-all duration-200"
						style={{ top: `${floatingMenuPos.top}px`, left: `${floatingMenuPos.left}px`, transform: 'translateX(-50%)' }}
					>
						<button
							onClick={() => setShowFloatingMenu(!showFloatingMenu)}
							className="w-8 h-8 flex items-center justify-center bg-accent text-white rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all"
							title="Red-line with AI"
						>
							<Plus className="w-5 h-5" />
						</button>

						{showFloatingMenu && (
							<div
								className={`absolute ${menuDirection === 'up' ? 'bottom-full mb-3' : 'top-full mt-2'} left-1/2 -translate-x-1/2 w-64 bg-card border border-border rounded-xl shadow-2xl p-2 z-40 backdrop-blur-md bg-opacity-90 animate-in fade-in slide-in-from-top-2 duration-200`}
							>
								{isAiLoading && (
									<div className="absolute inset-0 z-50 bg-card/60 rounded-xl flex items-center justify-center backdrop-blur-sm animate-in fade-in duration-200">
										<div className="flex flex-col items-center gap-2">
											<RefreshCw className="w-5 h-5 text-accent animate-spin" />
											<span className="text-[10px] font-bold text-accent uppercase tracking-wider">Thinking...</span>
										</div>
									</div>
								)}
								<div className="grid grid-cols-2 gap-1 mb-2">
									<button disabled={isAiLoading} onClick={() => applyRedlining('Summarize the text')} className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-secondary hover:text-accent hover:bg-accent/10 rounded-lg text-left transition-colors disabled:opacity-30">Summarize</button>
									<button disabled={isAiLoading} onClick={() => applyRedlining('Expand on the text')} className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-secondary hover:text-accent hover:bg-accent/10 rounded-lg text-left transition-colors disabled:opacity-30">Expand</button>
									<button disabled={isAiLoading} onClick={() => applyRedlining('Fix the grammar and spelling')} className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-secondary hover:text-accent hover:bg-accent/10 rounded-lg text-left transition-colors disabled:opacity-30">Fix Grammar</button>
									<button disabled={isAiLoading} onClick={() => applyRedlining('Rewrite the text to be more professional')} className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-secondary hover:text-accent hover:bg-accent/10 rounded-lg text-left transition-colors disabled:opacity-30">Professional</button>
								</div>
								<div className="border-t border-border pt-2">
									<div className="flex gap-1">
										<input
											type="text"
											disabled={isAiLoading}
											value={customInstruction}
											onChange={(e) => setCustomInstruction(e.target.value)}
											onKeyDown={(e) => e.key === 'Enter' && applyRedlining(customInstruction)}
											placeholder="Custom instructions..."
											className="flex-1 bg-input border border-border rounded-lg px-2 py-1 text-xs outline-none focus:border-accent disabled:opacity-30"
										/>
										<button
											onClick={() => applyRedlining(customInstruction)}
											disabled={!customInstruction.trim() || isAiLoading}
											className="p-1 bg-accent text-white rounded-lg disabled:opacity-50"
										>
											<ArrowUp className="w-4 h-4" />
										</button>
									</div>
								</div>
							</div>
						)}
					</div>
				)}

				<div
					ref={editorRef}
					className="p-4 outline-none markdown-body text-content min-h-[150px]"
					contentEditable
					suppressContentEditableWarning
					onInput={(e) => onChange(e.currentTarget.innerHTML)}
					onClick={handleEditorClick}
					onBlur={(e) => {
						setTimeout(saveSelection, 200);
					}}
					onMouseUp={saveSelection}
					onKeyUp={saveSelection}
				/>
			</div>
		</div>
	);
};

export default RichTextEditor;