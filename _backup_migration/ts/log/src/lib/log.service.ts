import { LogEntry } from './log-entry.model';
import { LogConsole, LogPublisher } from './log-publisher';
import { ELogLevel, Logger } from './log.types';

export type LogServiceOptions = {
	name?: string;
	logLevel: 'all' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'off';
	withDate?: boolean;
	loggers: Logger[];
};

const defaultLogServiceOptions: LogServiceOptions = {
	name: 'app',
	logLevel: 'debug',
	withDate: true,
	loggers: [
		{
			enabled: true,
			name: 'console',
		},
	],
};

export class LogService {
	private _level: ELogLevel;
	private _logWithDate: boolean;
	private _publishers: LogPublisher[] = [];
	private _appName: string;

	constructor(options: LogServiceOptions = defaultLogServiceOptions) {
		this._appName = options.name;
		this._logWithDate = options.withDate;

		this.initLogPublishers(options.loggers);
		this.initLogLevel(options.logLevel);
	}

	debug(msg: string, ...optionalParams: any[]) {
		this.writeToLog(msg, ELogLevel.DEBUG, optionalParams);
	}

	info(msg: string, ...optionalParams: any[]) {
		this.writeToLog(msg, ELogLevel.INFO, optionalParams);
	}

	warn(msg: string, ...optionalParams: any[]) {
		this.writeToLog(msg, ELogLevel.WARN, optionalParams);
	}

	error(msg: string, ...optionalParams: any[]) {
		this.writeToLog(msg, ELogLevel.ERROR, optionalParams);
	}

	fatal(msg: string, ...optionalParams: any[]) {
		this.writeToLog(msg, ELogLevel.FATAL, optionalParams);
	}

	log(msg: string, ...optionalParams: any[]) {
		this.writeToLog(msg, ELogLevel.ALL, optionalParams);
	}

	private writeToLog(msg: string, level: ELogLevel, params: any[] = []) {
		if (this.shouldLog(level)) {
			const entry: LogEntry = new LogEntry();
			if (this._appName) {
				entry.appName = this._appName;
			}
			entry.message = msg;
			entry.logWithDate = this._logWithDate;
			entry.level = level;
			entry.extraInfo = params;
			for (const logger of this._publishers) {
				logger.log(entry);
			}
		}
	}

	private shouldLog(level: ELogLevel): boolean {
		let ret: boolean = false;
		if (
			(level >= this._level && level !== ELogLevel.OFF) ||
			this._level === ELogLevel.ALL
		) {
			ret = true;
		}
		return ret;
	}

	private initLogPublishers(loggers: Logger[]) {
		if (!loggers || !Array.isArray(loggers)) {
			throw new Error('Invalid loggers configuration');
		}

		for (const logger of loggers) {
			if (!logger.enabled) {
				continue;
			}

			let logPub: LogPublisher;

			const name = logger.name.toLowerCase();
			switch (name) {
				case 'console':
					logPub = new LogConsole();
					break;
				default:
					throw new Error(`Logger "${name}" not found`);
			}

			this._publishers.push(logPub);
		}
	}

	private initLogLevel(logLevel: string) {
		switch (logLevel.toLowerCase()) {
			case 'all':
				this._level = ELogLevel.ALL;
				break;
			case 'debug':
				this._level = ELogLevel.DEBUG;
				break;
			case 'info':
				this._level = ELogLevel.INFO;
				break;
			case 'warn':
				this._level = ELogLevel.WARN;
				break;
			case 'error':
				this._level = ELogLevel.ERROR;
				break;
			case 'fatal':
				this._level = ELogLevel.FATAL;
				break;
			case 'off':
				this._level = ELogLevel.OFF;
				break;
			default:
				throw new Error(
					`Invalid log level "${logLevel.toLowerCase()}"`,
				);
				break;
		}
	}
}
