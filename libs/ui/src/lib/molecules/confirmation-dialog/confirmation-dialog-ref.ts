import { DialogRef } from '@angular/cdk/dialog';
import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

export const CONFIRMATION_DIALOG_DATA = new InjectionToken<any>(
	'ConfirmationDialogData',
);

export class MmcConfirmationDialogRef<T = any, R = any> {
	constructor(private _overlayRef: DialogRef<R>) {}

	close(result?: R): void {
		this._overlayRef.close(result);
	}

	get closed(): Observable<R | undefined> {
		return this._overlayRef.closed;
	}
}
