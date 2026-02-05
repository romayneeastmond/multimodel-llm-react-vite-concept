interface ToastOptions {
	title?: string;
	message: string;
	duration?: number;
}

export const showToast = ({ title = 'Success', message, duration = 3000 }: ToastOptions) => {
	const container = document.createElement('div');
	container.className = 'fixed top-[50px] right-6 z-[100] animate-in slide-in-from-right-10 fade-in duration-300';

	container.innerHTML = `
		<div class="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-green-500/20 shadow-2xl rounded-2xl p-4 pr-10 flex items-center gap-4 relative overflow-hidden group">
			<div class="absolute inset-0 bg-gradient-to-r from-green-500/10 via-transparent to-transparent pointer-events-none"></div>
			<div class="bg-green-500/20 text-green-600 dark:text-green-400 p-2.5 rounded-xl shrink-0">
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
				</svg>
			</div>
			<div class="flex flex-col min-w-[180px]">
				<h4 class="font-bold text-sm text-primary">${title}</h4>
				<p class="text-xs text-secondary font-medium">${message}</p>
			</div>
			<button class="toast-close-btn absolute right-2 top-2 p-1.5 text-secondary hover:text-primary rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
				</svg>
			</button>
		</div>
	`;

	document.body.appendChild(container);

	const remove = () => {
		container.classList.add('animate-out', 'fade-out', 'slide-out-to-right-10');
		setTimeout(() => container.remove(), 200);
	};

	const closeBtn = container.querySelector('.toast-close-btn');
	closeBtn?.addEventListener('click', remove);

	const timer = setTimeout(remove, duration);

	return () => {
		clearTimeout(timer);
		remove();
	};
};
