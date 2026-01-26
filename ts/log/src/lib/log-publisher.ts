import { ErrorHandler } from '@angular/core';
import { LogEntry } from './log-entry.model';
import { ELogLevel } from './log.types';

export abstract class LogPublisher {
	location: string;
	abstract log(record: LogEntry): void;
	abstract clear(): void;
}

export class LogConsole extends LogPublisher implements ErrorHandler {
	log(entry: LogEntry): void {
		const msg = entry.buildLogString();
		const params = entry.optionalParams(false);
		switch (entry.level) {
			case ELogLevel.ERROR:
				console.error(msg, ...params);
				break;
			default:
				console.log(msg, ...params);
		}
	}

	clear(): void {
		console.clear();
	}

	handleError(error: any): void {
		const errors: string[] = [];
		const msg: string[] = [];

		msg.push(`Status: ${error.status}`);
		msg.push(`- Status Text: ${error.statusText}`);
		if (error.json()) {
			msg.push(`- Exception Message: ${error.json().exceptionMessage}`);
		}
		errors.push(msg.join(' '));

		console.error('An error occurred', errors);
	}
}
