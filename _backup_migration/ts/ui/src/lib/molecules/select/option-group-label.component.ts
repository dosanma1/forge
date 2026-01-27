import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	selector: 'mmc-option-group-label',
	template: '<ng-content></ng-content>',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionGroupLabelComponent {}
