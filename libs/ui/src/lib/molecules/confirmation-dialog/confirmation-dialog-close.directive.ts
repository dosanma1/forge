import { Directive, inject, input } from '@angular/core';
import { MmcConfirmationDialogRef } from './confirmation-dialog-ref';

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
	private confirmationDialogRef = inject(MmcConfirmationDialogRef, {
		optional: true,
	});

	close(): void {
		this.confirmationDialogRef?.close(this.mmcConfirmationDialogClose());
	}
}
