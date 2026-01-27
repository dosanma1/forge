import {
	ChangeDetectionStrategy,
	Component,
	input,
	TemplateRef,
} from '@angular/core';

export interface TabContent {
	title?: string;
	description?: string;
}

@Component({
	selector: 'mmc-tab',
	standalone: true,
	template: '<ng-content></ng-content>',
	imports: [],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MmcTab {
	public readonly name = input<string>();
	public readonly icon = input<string>();
	public readonly badge = input<string>();
	public readonly templateRef = input<TemplateRef<any>>();
}
