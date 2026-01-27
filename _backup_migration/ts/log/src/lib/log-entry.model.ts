import { ELogLevel } from './log.types';

export type LogMessage = {
	message: string;
	params?: any[];
};

export class LogEntry {
	private _appName: string;
	private _message: string | any;
	private _logWithDate: boolean;
	private _entryDate: Date = new Date();
	private _level: ELogLevel = ELogLevel.DEBUG;
	private _extraInfo: any[] = [];

	buildLogString(): string {
		let str: string[] = [];

		if (this._appName) {
			str.push(`[${this._appName}]`);
		}

		if (this._logWithDate) {
			str.push(this._entryDate.toISOString());
		}

		str.push(`${ELogLevel[this._level]} ${this.message}`);

		return str.join(' ');
	}

	optionalParams(formatted: boolean = true): any[] | string {
		if (formatted) {
			if (this._extraInfo.some((p) => typeof p == 'object')) {
				const items = [];

				for (const item of this._extraInfo) {
					items.push(`${JSON.stringify(item, null, 2)}`);
				}

				this._extraInfo = items;
			}
		}

		return this._extraInfo;
	}

	set appName(name: string) {
		this._appName = name;
	}

	set message(msg: string) {
		this._message = msg;
	}

	get message(): string {
		switch (typeof this._message) {
			case 'object':
				return JSON.stringify(this._message);
			default:
				return this._message;
		}
	}

	set logWithDate(value: boolean) {
		this._logWithDate = value;
	}

	set entryDate(date: Date) {
		this._entryDate = date;
	}

	set level(level: ELogLevel) {
		this._level = level;
	}

	get level(): ELogLevel {
		return this._level;
	}

	set extraInfo(extraInfo: any[]) {
		this._extraInfo = extraInfo;
	}
}
