import { DialogRef } from '@angular/cdk/dialog';
import { InjectionToken } from '@angular/core';
import { MmcDrawer } from './drawer.component';

export const DRAWER_DATA = new InjectionToken<unknown>('DRAWER_DATA');

export class MmcDrawerRef<T = unknown> {
	private dialogRef: DialogRef<T, MmcDrawer>;

	get closed() {
		return this.dialogRef.closed;
	}

	constructor(dialogRef: DialogRef<T, MmcDrawer>) {
		this.dialogRef = dialogRef;
	}

	close(value?: T) {
		const instance = this.dialogRef.componentInstance as MmcDrawer;
		instance.onExit.subscribe(() => {
			this.dialogRef.close(value);
		});
		instance.exit();
	}
}
