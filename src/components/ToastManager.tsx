interface ToastOptions {
	title?: string;
	message: string;
	duration?: number;
	type?: 'success' | 'info' | 'warning' | 'error';
}

export const showToast = ({ title, message, duration = 3000, type = 'success' }: ToastOptions) => {
	// Set default title based on type if not provided
	if (!title) {
		title = type.charAt(0).toUpperCase() + type.slice(1);
	}

	const configs = {
		success: {
			borderColor: 'border-green-500/20',
			iconBg: 'bg-green-500/20',
			iconColor: 'text-green-600 dark:text-green-400',
			gradient: 'from-green-500/10',
			iconPath: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>'
		},
		info: {
			borderColor: 'border-blue-500/20',
			iconBg: 'bg-blue-500/20',
			iconColor: 'text-blue-600 dark:text-blue-400',
			gradient: 'from-blue-500/10',
			iconPath: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>'
		},
		warning: {
			borderColor: 'border-yellow-500/20',
			iconBg: 'bg-yellow-500/20',
			iconColor: 'text-yellow-600 dark:text-yellow-400',
			gradient: 'from-yellow-500/10',
			iconPath: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>'
		},
		error: {
			borderColor: 'border-red-500/20',
			iconBg: 'bg-red-500/20',
			iconColor: 'text-red-600 dark:text-red-400',
			gradient: 'from-red-500/10',
			iconPath: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>'
		}
	};

	const config = configs[type] || configs.success;

	const container = document.createElement('div');
	container.className = 'fixed top-[50px] right-6 z-[100] animate-in slide-in-from-right-10 fade-in duration-300';

	container.innerHTML = `
		<div class="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border ${config.borderColor} shadow-2xl rounded-2xl p-4 pr-10 flex items-start gap-4 relative overflow-hidden group max-w-md w-auto">
			<div class="absolute inset-0 bg-gradient-to-r ${config.gradient} via-transparent to-transparent pointer-events-none"></div>
			<div class="${config.iconBg} ${config.iconColor} p-2.5 rounded-xl shrink-0">
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					${config.iconPath}
				</svg>
			</div>
			<div class="flex flex-col min-w-[180px]">
				<h4 class="font-bold text-sm text-primary mb-1">${title}</h4>
				<p class="text-xs text-secondary font-medium break-words leading-relaxed">${message}</p>
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
		setTimeout(() => container.remove(), 600);
	};

	const closeBtn = container.querySelector('.toast-close-btn');
	closeBtn?.addEventListener('click', remove);

	const timer = setTimeout(remove, duration);

	return () => {
		clearTimeout(timer);
		remove();
	};
};
