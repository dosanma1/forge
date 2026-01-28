import { DialogRef } from '@angular/cdk/dialog';
import { Directive, inject, input } from '@angular/core';

@Directive({
	selector: '[mmcConfirmationDialogClose]',
	host: {
		'(click)': 'close()',
		'[attr.aria-label]': 'ariaLabel',
		type: 'button',
	},
})
export class MmcConfirmationDialogClose<T = any> {
	public mmcConfirmationDialogClose = input<T>();
	public ariaLabel = input<string>('Close dialog');
	private dialogRef = inject(DialogRef, { optional: true });

	close(): void {
		this.dialogRef?.close(this.mmcConfirmationDialogClose());
	}
}
