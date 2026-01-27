import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
	selector: 'mmc-option-group',
	imports: [],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div class="px-3 py-2.5 text-sm">
			{{ label() }}
			<ng-content select="mmc-option-group-label"> </ng-content>
		</div>
		<ng-content select="mmc-option"></ng-content>
	`,
})
export class OptionGroupComponent {
	label = input<string>();
}
