import moment from 'moment';
import { Transformer } from '@forge/ts-jsonapi';

export enum TimeFmt {
	timestamp = 'YYYY-MM-DDThh:mm:ss.SSSZ',
	timeOnly = 'hh:mm:ss',
	dateOnly = 'YYYY-MM-DD'
}

export class DateTransformer implements Transformer {
	private _fmt: TimeFmt;
	private constructor(fmt: TimeFmt) {
		this._fmt = fmt;
	}

	/* eslint-disable @typescript-eslint/no-misused-new */
	static new(fmt: TimeFmt): DateTransformer {
		return new DateTransformer(fmt);
	}
	/* eslint-enable @typescript-eslint/no-misused-new */

	serialize(value: any): string {
		return moment(value).format(this._fmt);
	}

	deserialize(value: any): Date {
		let date: Date;
		switch (this._fmt) {
			case TimeFmt.timeOnly: {
				date = new Date();
				const valueSplitted: string[] = value.split(':');

				if (valueSplitted.length !== 3) throw Error('DateTransformer(): date is not time only');

				date.setHours(parseInt(valueSplitted[0]), parseInt(valueSplitted[1]), parseInt(valueSplitted[2]), 0);
				break;
			}
			default:
				date = new Date(value);
		}
		return date;
	}
}
