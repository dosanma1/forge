import { Directive, ElementRef, inject } from '@angular/core';

export type TRIGGER_EVENT = 'hover' | 'focus' | 'click';

@Directive({
	selector: '[mmcPopoverOrigin]',
	exportAs: 'mmcPopoverOrigin',
})
export class MmcPopoverOrigin {
	host = inject<ElementRef<HTMLElement>>(ElementRef);
	get el() {
		return this.host.nativeElement;
	}
}
