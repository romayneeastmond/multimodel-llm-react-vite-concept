import { describe, it, expect } from 'vitest';
import {
	base64ToBlob,
	attachedFilesToFormData,
	formatFileSize,
	getFileExtension,
	isImageFile,
	isDocumentFile,
	mapFilesToPayload,
} from '../fileUtils';
import type { AttachedFile } from '../../types/index';

describe('fileUtils', () => {
	describe('base64ToBlob', () => {
		it('should convert valid base64 to Blob', () => {
			// "Hello World" in base64
			const base64 = 'data:text/plain;base64,SGVsbG8gV29ybGQ=';
			const blob = base64ToBlob(base64, 'text/plain');

			expect(blob).toBeInstanceOf(Blob);
			expect(blob?.type).toBe('text/plain');
			expect(blob?.size).toBeGreaterThan(0);
		});

		it('should handle different MIME types', () => {
			const base64 = 'data:application/json;base64,eyJ0ZXN0IjogdHJ1ZX0=';
			const blob = base64ToBlob(base64, 'application/json');

			expect(blob).toBeInstanceOf(Blob);
			expect(blob?.type).toBe('application/json');
		});

		it('should return null for invalid base64', () => {
			const blob = base64ToBlob('invalid-base64', 'text/plain');
			expect(blob).toBeNull();
		});

		it('should return null for malformed base64', () => {
			const blob = base64ToBlob('data:text/plain;base64,!!!invalid!!!', 'text/plain');
			expect(blob).toBeNull();
		});

		it('should handle empty base64 content', () => {
			const base64 = 'data:text/plain;base64,';
			const blob = base64ToBlob(base64, 'text/plain');
			// Empty base64 creates empty blob, not null
			expect(blob).toBeInstanceOf(Blob);
			expect(blob?.size).toBe(0);
		});
	});

	describe('attachedFilesToFormData', () => {
		it('should convert files with base64 to FormData', () => {
			const files: AttachedFile[] = [
				{
					id: '1',
					name: 'test1.txt',
					type: 'text/plain',
					base64: 'data:text/plain;base64,SGVsbG8=',
				},
				{
					id: '2',
					name: 'test2.txt',
					type: 'text/plain',
					base64: 'data:text/plain;base64,V29ybGQ=',
				},
			];

			const formData = attachedFilesToFormData(files);

			expect(formData).toBeInstanceOf(FormData);
			expect(formData.has('files')).toBe(true);
		});

		it('should skip files without base64', () => {
			const files: AttachedFile[] = [
				{
					id: '1',
					name: 'test.txt',
					type: 'text/plain',
					// No base64
				},
			];

			const formData = attachedFilesToFormData(files);
			expect(formData.has('files')).toBe(false);
		});

		it('should handle empty file array', () => {
			const formData = attachedFilesToFormData([]);
			expect(formData).toBeInstanceOf(FormData);
		});

		it('should skip files with invalid base64', () => {
			const files: AttachedFile[] = [
				{
					id: '1',
					name: 'test.txt',
					type: 'text/plain',
					base64: 'invalid',
				},
			];

			const formData = attachedFilesToFormData(files);
			// Should not throw, but won't add the file
			expect(formData).toBeInstanceOf(FormData);
		});
	});

	describe('formatFileSize', () => {
		it('should format bytes correctly', () => {
			expect(formatFileSize(0)).toBe('0 Bytes');
			expect(formatFileSize(100)).toBe('100 Bytes');
			expect(formatFileSize(1024)).toBe('1 KB');
			expect(formatFileSize(1048576)).toBe('1 MB');
			expect(formatFileSize(1073741824)).toBe('1 GB');
		});

		it('should handle decimal values', () => {
			expect(formatFileSize(1536)).toBe('1.5 KB');
			expect(formatFileSize(2621440)).toBe('2.5 MB');
		});

		it('should round to 2 decimal places', () => {
			expect(formatFileSize(1234567)).toMatch(/^\d+\.\d{1,2} MB$/);
		});

		it('should handle very large files', () => {
			const terabyte = 1099511627776;
			expect(formatFileSize(terabyte)).toBe('1 TB');
		});

		it('should handle very small non-zero sizes', () => {
			expect(formatFileSize(1)).toBe('1 Bytes');
			expect(formatFileSize(512)).toBe('512 Bytes');
		});
	});

	describe('getFileExtension', () => {
		it('should extract file extension', () => {
			expect(getFileExtension('document.pdf')).toBe('pdf');
			expect(getFileExtension('image.jpg')).toBe('jpg');
			expect(getFileExtension('file.name.txt')).toBe('txt');
		});

		it('should handle uppercase extensions', () => {
			expect(getFileExtension('IMAGE.PNG')).toBe('png');
			expect(getFileExtension('Document.PDF')).toBe('pdf');
		});

		it('should return empty string for no extension', () => {
			expect(getFileExtension('noextension')).toBe('');
			expect(getFileExtension('README')).toBe('');
		});

		it('should handle files starting with dot', () => {
			expect(getFileExtension('.gitignore')).toBe('gitignore');
			expect(getFileExtension('.env.local')).toBe('local');
		});

		it('should handle multiple dots', () => {
			expect(getFileExtension('file.tar.gz')).toBe('gz');
			expect(getFileExtension('backup.2024.01.15.zip')).toBe('zip');
		});
	});

	describe('isImageFile', () => {
		it('should identify image files', () => {
			const jpegFile: AttachedFile = {
				id: '1',
				name: 'photo.jpg',
				type: 'image/jpeg',
			};
			expect(isImageFile(jpegFile)).toBe(true);

			const pngFile: AttachedFile = {
				id: '2',
				name: 'icon.png',
				type: 'image/png',
			};
			expect(isImageFile(pngFile)).toBe(true);

			const gifFile: AttachedFile = {
				id: '3',
				name: 'animation.gif',
				type: 'image/gif',
			};
			expect(isImageFile(gifFile)).toBe(true);
		});

		it('should reject non-image files', () => {
			const pdfFile: AttachedFile = {
				id: '1',
				name: 'document.pdf',
				type: 'application/pdf',
			};
			expect(isImageFile(pdfFile)).toBe(false);

			const textFile: AttachedFile = {
				id: '2',
				name: 'text.txt',
				type: 'text/plain',
			};
			expect(isImageFile(textFile)).toBe(false);
		});
	});

	describe('isDocumentFile', () => {
		it('should identify PDF documents', () => {
			const file: AttachedFile = {
				id: '1',
				name: 'doc.pdf',
				type: 'application/pdf',
			};
			expect(isDocumentFile(file)).toBe(true);
		});

		it('should identify Word documents', () => {
			const docxFile: AttachedFile = {
				id: '1',
				name: 'doc.docx',
				type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			};
			expect(isDocumentFile(docxFile)).toBe(true);

			const docFile: AttachedFile = {
				id: '2',
				name: 'old.doc',
				type: 'application/msword',
			};
			expect(isDocumentFile(docFile)).toBe(true);
		});

		it('should identify Excel documents', () => {
			const xlsxFile: AttachedFile = {
				id: '1',
				name: 'spreadsheet.xlsx',
				type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			};
			expect(isDocumentFile(xlsxFile)).toBe(true);
		});

		it('should identify PowerPoint documents', () => {
			const pptxFile: AttachedFile = {
				id: '1',
				name: 'presentation.pptx',
				type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
			};
			expect(isDocumentFile(pptxFile)).toBe(true);
		});

		it('should identify text files', () => {
			const txtFile: AttachedFile = {
				id: '1',
				name: 'readme.txt',
				type: 'text/plain',
			};
			expect(isDocumentFile(txtFile)).toBe(true);
		});

		it('should reject non-document files', () => {
			const imageFile: AttachedFile = {
				id: '1',
				name: 'photo.jpg',
				type: 'image/jpeg',
			};
			expect(isDocumentFile(imageFile)).toBe(false);

			const videoFile: AttachedFile = {
				id: '2',
				name: 'video.mp4',
				type: 'video/mp4',
			};
			expect(isDocumentFile(videoFile)).toBe(false);
		});
	});

	describe('mapFilesToPayload', () => {
		it('should map files to payload format', () => {
			const files: AttachedFile[] = [
				{
					id: '1',
					name: 'file1.txt',
					type: 'text/plain',
					content: 'Hello World',
				},
				{
					id: '2',
					name: 'file2.txt',
					type: 'text/plain',
					content: 'Test Content',
				},
			];

			const payload = mapFilesToPayload(files);

			expect(payload).toEqual([
				{ fileName: 'file1.txt', content: 'Hello World' },
				{ fileName: 'file2.txt', content: 'Test Content' },
			]);
		});

		it('should use empty string for missing content', () => {
			const files: AttachedFile[] = [
				{
					id: '1',
					name: 'file.txt',
					type: 'text/plain',
					// No content
				},
			];

			const payload = mapFilesToPayload(files);
			expect(payload[0].content).toBe('');
		});

		it('should handle empty file array', () => {
			const payload = mapFilesToPayload([]);
			expect(payload).toEqual([]);
		});

		it('should preserve file names exactly', () => {
			const files: AttachedFile[] = [
				{
					id: '1',
					name: 'Document (1).pdf',
					type: 'application/pdf',
					content: 'PDF content',
				},
			];

			const payload = mapFilesToPayload(files);
			expect(payload[0].fileName).toBe('Document (1).pdf');
		});

		it('should handle files with special characters in names', () => {
			const files: AttachedFile[] = [
				{
					id: '1',
					name: 'file@#$%.txt',
					type: 'text/plain',
					content: 'Test',
				},
			];

			const payload = mapFilesToPayload(files);
			expect(payload[0].fileName).toBe('file@#$%.txt');
		});
	});
});
