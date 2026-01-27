import { Directive, inject, input } from '@angular/core';
import { MmcDrawerRef } from './drawer-ref';

@Directive({
	selector: '[mmcDrawerClose]',
	host: {
		'(click)': 'close()',
	},
})
export class MmcDrawerClose {
	private readonly drawerRef = inject(MmcDrawerRef);
	value = input<unknown>(undefined, { alias: 'mmcDrawerClose' });

	close() {
		const value = this.value();
		this.drawerRef.close(value);
	}
}
