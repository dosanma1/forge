import { ChatTimePipe } from './chat-time.pipe';

describe('ChatTimePipe', () => {
	let pipe: ChatTimePipe;
	let baseDate: Date;

	beforeEach(() => {
		pipe = new ChatTimePipe();

		// Mock the current date to ensure consistent test results
		// Setting base date to April 24, 2025 (Thursday) at 15:30:00
		baseDate = new Date(2025, 3, 24, 15, 30, 0);
		jasmine.clock().mockDate(baseDate);
	});

	afterEach(() => {
		jasmine.clock().uninstall();
	});

	it('should create an instance', () => {
		expect(pipe).toBeTruthy();
	});

	it('should return empty string for null input', () => {
		expect(pipe.transform(null)).toBe('');
	});

	it('should return empty string for undefined input', () => {
		expect(pipe.transform(undefined)).toBe('');
	});

	it('should return time format for messages from today', () => {
		// Same day, earlier time (10:15 AM)
		const todayEarlier = new Date(2025, 3, 24, 10, 15);
		expect(pipe.transform(todayEarlier)).toBe('10:15 AM');

		// Same day, later time but still before now (3:00 PM)
		const todayLater = new Date(2025, 3, 24, 15, 0);
		expect(pipe.transform(todayLater)).toBe('3:00 PM');

		// Just a few hours ago
		const fewHoursAgo = new Date(2025, 3, 24, 12, 30);
		expect(pipe.transform(fewHoursAgo)).toBe('12:30 PM');

		// Edge case: Midnight (12 AM)
		const midnight = new Date(2025, 3, 24, 0, 0);
		expect(pipe.transform(midnight)).toBe('12:00 AM');

		// Edge case: Noon (12 PM)
		const noon = new Date(2025, 3, 24, 12, 0);
		expect(pipe.transform(noon)).toBe('12:00 PM');
	});

	it('should return "Yesterday" for messages from yesterday', () => {
		// Yesterday at various times
		const yesterdayMorning = new Date(2025, 3, 23, 10, 30);
		expect(pipe.transform(yesterdayMorning)).toBe('Yesterday');

		const yesterdayNight = new Date(2025, 3, 23, 23, 59);
		expect(pipe.transform(yesterdayNight)).toBe('Yesterday');

		const yesterdayEarlyMorning = new Date(2025, 3, 23, 0, 1);
		expect(pipe.transform(yesterdayEarlyMorning)).toBe('Yesterday');
	});

	it('should return day name for messages from earlier this week', () => {
		// April 22, 2025 (Tuesday)
		const tuesday = new Date(2025, 3, 22, 14, 20);
		expect(pipe.transform(tuesday)).toBe('Tuesday');

		// April 21, 2025 (Monday)
		const monday = new Date(2025, 3, 21, 9, 45);
		expect(pipe.transform(monday)).toBe('Monday');

		// April 20, 2025 (Sunday)
		const sunday = new Date(2025, 3, 20, 16, 30);
		expect(pipe.transform(sunday)).toBe('Sunday');

		// April 18, 2025 (Friday - still within a week)
		const friday = new Date(2025, 3, 18, 12, 0);
		expect(pipe.transform(friday)).toBe('Friday');
	});

	it('should return formatted date for messages older than a week', () => {
		// April 16, 2025 (Wednesday - more than a week ago)
		const oldDate1 = new Date(2025, 3, 16, 15, 30);
		expect(pipe.transform(oldDate1)).toBe('4/16/2025');

		// March 24, 2025 (a month ago)
		const oldDate2 = new Date(2025, 2, 24, 10, 0);
		expect(pipe.transform(oldDate2)).toBe('3/24/2025');

		// April 24, 2024 (a year ago)
		const oldDate3 = new Date(2024, 3, 24, 8, 30);
		expect(pipe.transform(oldDate3)).toBe('4/24/2024');
	});

	it('should handle future dates by showing time', () => {
		// Later today
		const laterToday = new Date(2025, 3, 24, 18, 45);
		expect(pipe.transform(laterToday)).toBe('6:45 PM');

		// Future dates will likely be formatted as dates, but this tests that they don't crash the pipe
		const futureDate = new Date(2025, 4, 1, 10, 0);
		expect(pipe.transform(futureDate)).toBeTruthy();
	});

	it('should handle different input formats', () => {
		// Test ISO string
		const isoString = '2025-04-23T10:30:00.000Z'; // Yesterday in ISO format
		expect(pipe.transform(isoString)).toBe('Yesterday');

		// Test timestamp in milliseconds
		const timestamp = new Date(2025, 3, 23, 10, 30).getTime(); // Yesterday as timestamp
		expect(pipe.transform(timestamp)).toBe('Yesterday');
	});

	it('should handle edge cases around day boundaries', () => {
		// Set base time to midnight
		jasmine.clock().mockDate(new Date(2025, 3, 24, 0, 5, 0)); // 12:05 AM on April 24

		// 11:59 PM on April 23 (technically yesterday, but just a few minutes ago)
		const lateYesterday = new Date(2025, 3, 23, 23, 59);
		expect(pipe.transform(lateYesterday)).toBe('Yesterday');

		// 11:30 PM on April 17 (exactly a week minus 30 minutes ago)
		const almostWeekAgo = new Date(2025, 3, 17, 23, 30);
		expect(pipe.transform(almostWeekAgo)).toBe('Thursday');

		// 11:30 PM on April 16 (just over a week ago)
		const justOverWeekAgo = new Date(2025, 3, 16, 23, 30);
		expect(pipe.transform(justOverWeekAgo)).toBe('4/16/2025');
	});
});
