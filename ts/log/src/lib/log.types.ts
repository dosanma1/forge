export enum ELogLevel {
	ALL = 0,
	DEBUG = 1,
	INFO = 2,
	WARN = 3,
	ERROR = 4,
	FATAL = 5,
	OFF = 6,
}

export type LogLevel =
	| 'all'
	| 'debug'
	| 'info'
	| 'warn'
	| 'error'
	| 'fatal'
	| 'off';

export type Logger = {
	enabled: boolean;
	name: 'console';
	location?: string;
};
