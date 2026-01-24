import React, { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';

interface ToastNotificationProps {
	isVisible: boolean;
	onClose: () => void;
	title?: string;
	message?: string;
	duration?: number;
}

const ToastNotification = ({
	isVisible,
	onClose,
	title = "Success",
	message = "Action completed successfully",
	duration = 3000
}: ToastNotificationProps) => {
	useEffect(() => {
		if (isVisible) {
			const timer = setTimeout(() => {
				onClose();
			}, duration);
			return () => clearTimeout(timer);
		}
	}, [isVisible, duration, onClose]);

	if (!isVisible) return null;

	return (
		<div className="fixed top-[50px] right-6 z-[100] animate-in slide-in-from-right-10 fade-in duration-300">
			<div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-green-500/20 shadow-2xl rounded-2xl p-4 pr-10 flex items-center gap-4 relative overflow-hidden group">
				<div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-transparent to-transparent pointer-events-none" />
				<div className="bg-green-500/20 text-green-600 dark:text-green-400 p-2.5 rounded-xl shrink-0">
					<Check className="w-5 h-5" />
				</div>
				<div className="flex flex-col min-w-[180px]">
					<h4 className="font-bold text-sm text-primary">{title}</h4>
					<p className="text-xs text-secondary font-medium">{message}</p>
				</div>
				<button
					onClick={onClose}
					className="absolute right-2 top-2 p-1.5 text-secondary hover:text-primary rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
				>
					<X className="w-4 h-4" />
				</button>
			</div>
		</div>
	);
};

export default ToastNotification;
