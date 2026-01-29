import {
	ChangeDetectionStrategy,
	Component,
	input,
	TemplateRef,
	ViewChild,
} from '@angular/core';

export interface TabContent {
	title?: string;
	description?: string;
}

@Component({
	selector: 'mmc-tab',
	standalone: true,
	template: '<ng-template #content><ng-content></ng-content></ng-template>',
	imports: [],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MmcTab {
	public readonly name = input<string>();
	public readonly icon = input<string>();
	public readonly badge = input<string>();

	@ViewChild('content', { static: true }) templateRef!: TemplateRef<unknown>;
}
