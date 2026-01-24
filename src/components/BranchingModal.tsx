import React, { useEffect, useRef } from 'react';
import { GitFork } from 'lucide-react';

interface BranchingModalProps {
	isOpen: boolean;
	branchTitle: string;
	onBranchTitleChange: (title: string) => void;
	onCancel: () => void;
	onConfirm: () => void;
}

const BranchingModal = ({
	isOpen,
	branchTitle,
	onBranchTitleChange,
	onCancel,
	onConfirm
}: BranchingModalProps) => {
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (isOpen && inputRef.current) {
			inputRef.current.focus();
		}
	}, [isOpen]);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
			<div className="bg-card border border-border rounded-2xl p-7 w-full max-w-md mx-4 shadow-2xl animate-in zoom-in-95 duration-200">
				<h3 className="text-xl font-bold mb-3 tracking-tight flex items-center gap-2.5">
					<GitFork className="w-6 h-6 text-accent" /> Branch Conversation
				</h3>
				<p className="text-sm text-secondary mb-5 leading-relaxed">
					A new chat will be created starting from this message. Enter a title for the new branch below:
				</p>
				<input
					ref={inputRef}
					type="text"
					value={branchTitle}
					onChange={(e) => onBranchTitleChange(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === 'Enter') onConfirm();
						if (e.key === 'Escape') onCancel();
					}}
					placeholder="New Branch Title"
					className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 ring-accent/20 mb-6"
				/>
				<div className="flex justify-end gap-3">
					<button
						onClick={onCancel}
						className="px-5 py-2.5 text-sm font-semibold border border-border rounded-xl hover:bg-card-hover transition-colors"
					>
						Cancel
					</button>
					<button
						onClick={onConfirm}
						className="px-5 py-2.5 text-sm font-bold bg-accent text-white rounded-xl shadow-lg shadow-accent/20 active:scale-95 transition-all"
					>
						Create Branch
					</button>
				</div>
			</div>
		</div>
	);
};

export default BranchingModal;
