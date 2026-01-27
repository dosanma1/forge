import {
	ChangeDetectionStrategy,
	Component,
	ViewEncapsulation,
} from '@angular/core';

@Component({
	selector: 'mmc-button-group',
	template: `
		<div
			role="group"
			class="divide-primary-foreground/30 inline-flex divide-x rounded-md shadow-xs rtl:space-x-reverse first:rounded-l-md last:rounded-r-md"
		>
			<ng-content selector="button"></ng-content>
			<ng-content></ng-content>
		</div>
	`,
	styleUrl: './button-group.component.scss',
	imports: [],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MmcButtonGroup {}
