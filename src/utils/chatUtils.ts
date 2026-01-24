import { LANGUAGE_EXTENSIONS } from '../config/constants';

export const copyToClipboard = async (text: string) => {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch (err) {
		console.error('Failed to copy:', err);
		return false;
	}
};

export const downloadCode = (code: string, language: string) => {
	const extension = LANGUAGE_EXTENSIONS[language.toLowerCase()] || 'txt';
	const blob = new Blob([code], { type: 'text/plain' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = `code_snippet.${extension}`;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
};

export const getCookie = (name: string) => {
	if (typeof document === 'undefined') return null;
	const nameEQ = name + "=";
	const ca = document.cookie.split(';');
	for (let i = 0; i < ca.length; i++) {
		let c = ca[i];
		while (c.charAt(0) === ' ') c = c.substring(1, c.length);
		if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
	}
	return null;
};

export const setCookie = (name: string, value: string, days: number) => {
	const d = new Date();
	d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
	const expires = "expires=" + d.toUTCString();
	document.cookie = name + "=" + value + ";" + expires + ";path=/";
};