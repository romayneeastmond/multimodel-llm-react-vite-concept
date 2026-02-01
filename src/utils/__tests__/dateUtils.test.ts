import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatTime, formatSessionDate, getTime, getRelativeTime } from '../dateUtils';

describe('dateUtils', () => {
	describe('formatTime', () => {
		it('should format timestamp to HH:MM', () => {
			const timestamp = '1609459200000'; // 2021-01-01 00:00:00 UTC
			const formatted = formatTime(timestamp);

			// Should match HH:MM format with optional AM/PM (with or without periods)
			expect(formatted).toMatch(/^\d{1,2}:\d{2}(?:\s?[AP]\.?M\.?)?$/i);
		});

		it('should handle different timestamps', () => {
			const morning = '1609491600000'; // 2021-01-01 09:00:00 UTC
			const evening = '1609534800000'; // 2021-01-01 21:00:00 UTC

			const morningFormatted = formatTime(morning);
			const eveningFormatted = formatTime(evening);

			expect(morningFormatted).toMatch(/\d{1,2}:\d{2}/);
			expect(eveningFormatted).toMatch(/\d{1,2}:\d{2}/);
		});

		it('should handle current timestamp', () => {
			const now = Date.now().toString();
			const formatted = formatTime(now);
			expect(formatted).toMatch(/\d{1,2}:\d{2}/);
		});
	});

	describe('formatSessionDate', () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it('should return time for today', () => {
			const now = new Date('2024-01-15T14:30:00');
			vi.setSystemTime(now);

			const today = new Date('2024-01-15T10:00:00').getTime();
			const result = formatSessionDate(today);

			// Should return time format for same day
			expect(result).toMatch(/\d{1,2}:\d{2}/);
		});

		it('should return "Yesterday" for yesterday', () => {
			const now = new Date('2024-01-15T14:30:00');
			vi.setSystemTime(now);

			const yesterday = new Date('2024-01-14T10:00:00').getTime();
			const result = formatSessionDate(yesterday);

			expect(result).toBe('Yesterday');
		});

		it('should return weekday for dates within past week', () => {
			const now = new Date('2024-01-15T14:30:00'); // Monday
			vi.setSystemTime(now);

			const threeDaysAgo = new Date('2024-01-12T10:00:00').getTime(); // Friday
			const result = formatSessionDate(threeDaysAgo);

			expect(result).toBe('Friday');
		});

		it('should return full date for dates older than a week', () => {
			const now = new Date('2024-01-15T14:30:00');
			vi.setSystemTime(now);

			const tenDaysAgo = new Date('2024-01-05T10:00:00').getTime();
			const result = formatSessionDate(tenDaysAgo);

			// Should include month and day
			expect(result).toMatch(/\w+\s+\d+/);
		});

		it('should include year for dates from previous year', () => {
			const now = new Date('2024-01-15T14:30:00');
			vi.setSystemTime(now);

			const lastYear = new Date('2023-12-01T10:00:00').getTime();
			const result = formatSessionDate(lastYear);

			// Should include year
			expect(result).toMatch(/2023/);
		});
	});

	describe('getTime', () => {
		it('should return timestamp from hours ago', () => {
			const before = Date.now();
			const timestamp = parseInt(getTime(2));
			const after = Date.now();

			const twoHoursMs = 2 * 60 * 60 * 1000;
			const expectedMin = before - twoHoursMs - 100; // Allow 100ms tolerance
			const expectedMax = after - twoHoursMs + 100;

			expect(timestamp).toBeGreaterThanOrEqual(expectedMin);
			expect(timestamp).toBeLessThanOrEqual(expectedMax);
		});

		it('should handle zero hours', () => {
			const before = Date.now();
			const timestamp = parseInt(getTime(0));
			const after = Date.now();

			expect(timestamp).toBeGreaterThanOrEqual(before - 100);
			expect(timestamp).toBeLessThanOrEqual(after + 100);
		});

		it('should handle large hour values', () => {
			const timestamp = parseInt(getTime(24));
			const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);

			expect(timestamp).toBeGreaterThanOrEqual(oneDayAgo - 1000);
			expect(timestamp).toBeLessThanOrEqual(oneDayAgo + 1000);
		});
	});

	describe('getRelativeTime', () => {
		it('should return "just now" for very recent timestamps', () => {
			const now = Date.now();
			expect(getRelativeTime(now - 30000)).toBe('just now'); // 30 seconds ago
			expect(getRelativeTime(now - 10000)).toBe('just now'); // 10 seconds ago
		});

		it('should return minutes ago for timestamps within an hour', () => {
			const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
			const result = getRelativeTime(fiveMinutesAgo);
			expect(result).toMatch(/\d+ minute(s?) ago/);
			expect(result).toBe('5 minutes ago');
		});

		it('should return "1 minute ago" singular form', () => {
			const oneMinuteAgo = Date.now() - (1 * 60 * 1000);
			expect(getRelativeTime(oneMinuteAgo)).toBe('1 minute ago');
		});

		it('should return hours ago for timestamps within a day', () => {
			const threeHoursAgo = Date.now() - (3 * 60 * 60 * 1000);
			const result = getRelativeTime(threeHoursAgo);
			expect(result).toMatch(/\d+ hour(s?) ago/);
			expect(result).toBe('3 hours ago');
		});

		it('should return "1 hour ago" singular form', () => {
			const oneHourAgo = Date.now() - (1 * 60 * 60 * 1000);
			expect(getRelativeTime(oneHourAgo)).toBe('1 hour ago');
		});

		it('should return days ago for timestamps within a month', () => {
			const twoDaysAgo = Date.now() - (2 * 24 * 60 * 60 * 1000);
			const result = getRelativeTime(twoDaysAgo);
			expect(result).toMatch(/\d+ day(s?) ago/);
			expect(result).toBe('2 days ago');
		});

		it('should return formatted date for older timestamps', () => {
			const twoMonthsAgo = Date.now() - (60 * 24 * 60 * 60 * 1000); // ~2 months
			const result = getRelativeTime(twoMonthsAgo);
			// Should return formatted date like "Dec 3" or "Dec 3, 2025"
			expect(result).toMatch(/\w+\s+\d+/);
		});

		it('should handle future timestamps gracefully', () => {
			const future = Date.now() + (60 * 1000);
			const result = getRelativeTime(future);
			expect(result).toBe('just now');
		});
	});
});
