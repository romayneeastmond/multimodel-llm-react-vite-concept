export const formatFullDateTime = (timestamp: number): string => {
	return new Date(timestamp).toLocaleString();
};

export const formatSessionDate = (timestamp: number): string => {
	const date = new Date(timestamp);
	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
	const sessionDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

	const diffTime = today - sessionDate;
	const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

	if (diffDays === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	if (diffDays === 1) return 'Yesterday';
	if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'long' });

	const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
	if (date.getFullYear() !== now.getFullYear()) {
		options.year = 'numeric';
	}
	return date.toLocaleDateString([], options);
};

export const formatTime = (timestamp: string): string => {
	return new Date(parseInt(timestamp)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const getTime = (hoursAgo: number) => {
	return (Date.now() - 1000 * 60 * 60 * hoursAgo).toString();
};

export const getRelativeTime = (timestamp: number): string => {
	const now = Date.now();
	const diff = now - timestamp;
	const seconds = Math.floor(diff / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (seconds < 60) return 'just now';
	if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
	if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
	if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;

	return formatSessionDate(timestamp);
};
