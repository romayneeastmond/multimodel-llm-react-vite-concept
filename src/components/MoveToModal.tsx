import React from 'react';
import { FolderPlus, X, Folder as FolderIcon, ChevronRight, Plus } from 'lucide-react';
import { Folder } from '../types/index';

interface MoveToModalProps {
	isOpen: boolean;
	folders: Folder[];
	onMoveToFolder: (folderId: string | undefined) => void;
	newFolderName: string;
	setNewFolderName: (name: string) => void;
	onCreateFolderAndMove: () => void;
	onClose: () => void;
}

const MoveToModal = ({
	isOpen,
	folders,
	onMoveToFolder,
	newFolderName,
	setNewFolderName,
	onCreateFolderAndMove,
	onClose
}: MoveToModalProps) => {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
			<div className="bg-card border border-border rounded-2xl p-7 w-full max-w-md mx-4 shadow-2xl animate-in zoom-in-95 duration-200">
				<h3 className="text-xl font-bold mb-5 flex items-center gap-2.5 tracking-tight">
					<FolderPlus className="w-6 h-6 text-accent" /> Organize Chat
				</h3>
				<div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
					<button
						onClick={() => onMoveToFolder(undefined)}
						className="w-full text-left px-4 py-3 rounded-xl border border-border hover:bg-card-hover transition-colors flex items-center justify-between group/btn"
					>
						<span className="text-sm font-medium">Remove from Folder</span>
						<X className="w-4 h-4 text-secondary opacity-0 group-hover/btn:opacity-100 transition-opacity" />
					</button>
					{folders.map(f => (
						<button
							key={f.id}
							onClick={() => onMoveToFolder(f.id)}
							className="w-full text-left px-4 py-3 rounded-xl border border-border hover:bg-card-hover transition-colors flex items-center justify-between group/btn"
						>
							<div className="flex items-center gap-3 min-w-0">
								<FolderIcon className="w-5 h-5 text-accent shrink-0" />
								<span className="text-sm font-medium truncate">{f.name}</span>
							</div>
							<ChevronRight className="w-4 h-4 text-secondary opacity-40 group-hover/btn:opacity-100 group-hover/btn:translate-x-0.5 transition-all" />
						</button>
					))}
				</div>
				<div className="mt-6 pt-5 border-t border-border">
					<h4 className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-3">Create New Folder</h4>
					<div className="flex gap-2">
						<input
							type="text"
							value={newFolderName}
							onChange={(e) => setNewFolderName(e.target.value)}
							placeholder="New Folder Name..."
							className="flex-1 bg-input border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-accent/20 transition-all"
						/>
						<button
							onClick={onCreateFolderAndMove}
							disabled={!newFolderName.trim()}
							className="px-4 py-2.5 bg-accent text-white rounded-xl text-sm font-bold shadow-lg shadow-accent/20 disabled:opacity-50 hover:opacity-90 active:scale-95 transition-all shrink-0"
						>
							<Plus className="w-5 h-5" />
						</button>
					</div>
				</div>
				<div className="mt-6 flex justify-end">
					<button
						onClick={onClose}
						className="px-5 py-2.5 text-sm font-semibold border border-border rounded-xl hover:bg-card-hover transition-colors"
					>
						Cancel
					</button>
				</div>
			</div>
		</div>
	);
};

export default MoveToModal;
