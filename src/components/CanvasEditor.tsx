import React from 'react';
import { X, Plus, Bot, FileType } from 'lucide-react';
import { CanvasBlock } from '../types/index';
import { AVAILABLE_MODELS } from '../config/constants';
import RichTextEditor from './RichTextEditor';

interface CanvasEditorProps {
	isOpen: boolean;
	onClose: () => void;
	sessionTitle: string;
	canvasBlocks: CanvasBlock[];
	onAddBlock: (index: number) => void;
	onUpdateBlock: (id: string, newVal: string) => void;
	onMoveBlock: (index: number, direction: 'up' | 'down') => void;
	onRemoveBlock: (id: string) => void;
	activeAiBlockId: string | null;
	setActiveAiBlockId: (id: string | null) => void;
	onExport: () => void;
}

const CanvasEditor: React.FC<CanvasEditorProps> = ({
	isOpen,
	onClose,
	sessionTitle,
	canvasBlocks,
	onAddBlock,
	onUpdateBlock,
	onMoveBlock,
	onRemoveBlock,
	activeAiBlockId,
	setActiveAiBlockId,
	onExport
}) => {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-[60] bg-app flex flex-col animate-in slide-in-from-bottom-4 duration-300">
			<div className="flex items-center justify-between px-6 py-4 border-b border-border bg-panel shadow-sm">
				<h2 className="text-sm font-bold truncate tracking-tight">{sessionTitle || 'Canvas Editor'}</h2>
				<button onClick={onClose} className="p-2 hover:bg-card-hover rounded-xl transition-all hover:rotate-90 hover:scale-110">
					<X className="w-6 h-6" />
				</button>
			</div>
			<div className="flex-1 overflow-y-auto px-4 py-10 bg-app/50">
				<div className="max-w-4xl mx-auto">
					<div className="relative flex items-center justify-center group/add w-full h-10 -mt-6 mb-2">
						<button onClick={() => onAddBlock(-1)} className="relative z-10 p-1.5 bg-app border border-accent/40 text-accent rounded-full opacity-0 group-hover/add:opacity-100 transition-all hover:scale-110 shadow-sm">
							<Plus className="w-4 h-4" />
						</button>
					</div>
					{canvasBlocks.map((block, index) => (
						<React.Fragment key={block.id}>
							<div className="relative group bg-card border border-border rounded-b-2xl shadow-lg transition-shadow hover:shadow-xl mb-4">
								<RichTextEditor
									initialContent={block.content}
									onChange={(newVal) => onUpdateBlock(block.id, newVal)}
									onAiModeChange={(isOpen) => setActiveAiBlockId(isOpen ? block.id : null)}
									onMoveUp={() => onMoveBlock(index, 'up')}
									onMoveDown={() => onMoveBlock(index, 'down')}
									onDelete={() => onRemoveBlock(block.id)}
									isFirst={index === 0}
									isLast={index === canvasBlocks.length - 1}
									className={!block.sourceModel ? "rounded-b-2xl" : ""}
								/>
								{block.sourceModel && (
									<div className="px-5 py-2.5 bg-panel/50 border-t border-border flex items-center gap-2 rounded-b-2xl">
										<div className="p-1 bg-accent/10 rounded overflow-hidden">
											<Bot className="w-3 h-3 text-accent" />
										</div>
										<span className="text-[10px] font-bold text-secondary uppercase tracking-wider">
											{AVAILABLE_MODELS.find(m => m.id === block.sourceModel)?.name || block.sourceModel}
										</span>
									</div>
								)}
							</div>
							<div className="relative flex items-center justify-center group/add w-full h-10 -mt-2 mb-4">
								<button onClick={() => onAddBlock(index)} className="relative z-10 p-1.5 bg-app border border-accent/40 text-accent rounded-full opacity-0 group-hover/add:opacity-100 transition-all hover:scale-110 shadow-sm">
									<Plus className="w-4 h-4" />
								</button>
							</div>
						</React.Fragment>
					))}
				</div>
			</div>
			<div className="p-5 border-t border-border bg-panel flex justify-center shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
				<button onClick={onExport} className="flex items-center gap-2.5 bg-accent text-white px-6 py-3 text-sm rounded-xl font-bold shadow-lg shadow-accent/20 hover:opacity-90 active:scale-95 transition-all">
					<FileType className="w-4 h-4" /> Export to Word
				</button>
			</div>
		</div>
	);
};

export default CanvasEditor;
