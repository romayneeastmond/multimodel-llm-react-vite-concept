import { AttachedFile } from '../types/index';

export const attachedFilesToFormData = (files: AttachedFile[]): FormData => {
	const formData = new FormData();
	files.forEach(file => {
		if (file.base64) {
			const blob = base64ToBlob(file.base64, file.type);
			if (blob) {
				formData.append('files', blob, file.name);
			}
		}
	});
	return formData;
};

export const base64ToBlob = (base64: string, type: string): Blob | null => {
	try {
		const byteCharacters = atob(base64.split(',')[1]);
		const byteNumbers = new Array(byteCharacters.length);
		for (let i = 0; i < byteCharacters.length; i++) {
			byteNumbers[i] = byteCharacters.charCodeAt(i);
		}
		const byteArray = new Uint8Array(byteNumbers);
		return new Blob([byteArray], { type });
	} catch (e) {
		console.error('Error converting base64 to blob:', e);
		return null;
	}
};

export const formatFileSize = (bytes: number): string => {
	if (bytes === 0) return '0 Bytes';
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export const getFileExtension = (filename: string): string => {
	const parts = filename.split('.');
	return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
};

export const isImageFile = (file: AttachedFile): boolean => {
	return file.type.startsWith('image/');
};

export const isDocumentFile = (file: AttachedFile): boolean => {
	const documentTypes = [
		'application/pdf',
		'application/msword',
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		'application/vnd.ms-excel',
		'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		'text/plain',
		'text/csv'
	];
	return documentTypes.includes(file.type);
};

export const mapFilesToPayload = (files: AttachedFile[]) => {
	return files.map(file => ({
		fileName: file.name,
		content: file.content || ''
	}));
};