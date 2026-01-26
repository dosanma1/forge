import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'chatTime',
})
export class ChatTimePipe implements PipeTransform {
	transform(value: Date | string | number): string {
		if (!value) return '';

		const date = new Date(value);
		const now = new Date();

		// Time difference in milliseconds
		const diff = now.getTime() - date.getTime();

		// Time differences in hours, days
		const hours = Math.floor(diff / (1000 * 60 * 60));
		const days = Math.floor(hours / 24);

		// Yesterday check
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		const isYesterday =
			date.getDate() === yesterday.getDate() &&
			date.getMonth() === yesterday.getMonth() &&
			date.getFullYear() === yesterday.getFullYear();

		// This week check (within 7 days but not yesterday or today)
		const isThisWeek = days < 7 && !isYesterday && days > 0;

		// Format the time
		const formatTime = () => {
			let hours = date.getHours();
			const minutes = date.getMinutes();
			const ampm = hours >= 12 ? 'PM' : 'AM';
			hours = hours % 12;
			hours = hours ? hours : 12; // the hour '0' should be '12'
			const minutesStr = minutes < 10 ? '0' + minutes : minutes;
			return `${hours}:${minutesStr} ${ampm}`;
		};

		// Format the day name
		const getDayName = () => {
			const days = [
				'Sunday',
				'Monday',
				'Tuesday',
				'Wednesday',
				'Thursday',
				'Friday',
				'Saturday',
			];
			return days[date.getDay()];
		};

		// Format the date for older messages
		const formatDate = () => {
			const day = date.getDate();
			const month = date.getMonth() + 1;
			const year = date.getFullYear();
			return `${month}/${day}/${year}`;
		};

		// Formatting based on criteria
		if (isYesterday) {
			return 'Yesterday';
		} else if (days < 1) {
			// Today (less than 24 hours and same day)
			return formatTime();
		} else if (isThisWeek) {
			return getDayName();
		} else {
			return formatDate();
		}
	}
}
