import React from 'react';

interface DeleteConfirmModalProps {
	isOpen: boolean;
	title: string;
	message: React.ReactNode;
	onCancel: () => void;
	onConfirm: () => void;
	cancelText?: string;
	confirmText?: string;
}

const DeleteConfirmModal = ({
	isOpen,
	title,
	message,
	onCancel,
	onConfirm,
	cancelText = 'Cancel',
	confirmText = 'Delete'
}: DeleteConfirmModalProps) => {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
			<div className="bg-card border border-border rounded-2xl p-7 w-full max-w-sm mx-4 shadow-2xl animate-in zoom-in-95 duration-200">
				<h3 className="text-xl font-bold mb-2 tracking-tight">{title}</h3>
				<div className="text-sm text-secondary mb-7 leading-relaxed">{message}</div>
				<div className="flex justify-end gap-3">
					<button
						onClick={onCancel}
						className="px-5 py-2.5 text-sm font-semibold border border-border rounded-xl hover:bg-card-hover transition-colors"
					>
						{cancelText}
					</button>
					<button
						onClick={onConfirm}
						className="px-5 py-2.5 text-sm font-bold bg-red-500 text-white rounded-xl shadow-lg shadow-red-500/20 active:scale-95 transition-all"
					>
						{confirmText}
					</button>
				</div>
			</div>
		</div>
	);
};

export default DeleteConfirmModal;
