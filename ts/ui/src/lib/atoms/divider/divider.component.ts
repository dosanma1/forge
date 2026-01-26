import {
	ChangeDetectionStrategy,
	Component,
	computed,
	input,
} from '@angular/core';
import { ClassValue } from 'clsx';
import { cn } from '../../../helpers/cn';

export type DividerOrientation = 'horizontal' | 'vertical';

@Component({
	selector: 'mmc-divider',
	imports: [],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: ``,
	host: {
		role: 'separator',
		'[class]': 'classNames()',
		'[attr.aria-orientation]': 'orientation()',
		'[attr.data-orientation]': 'orientation()',
	},
})
export class MmcDivider {
	readonly additionalClasses = input<ClassValue>('', {
		alias: 'class',
	});
	readonly orientation = input<DividerOrientation>('horizontal');

	protected classNames = computed(() =>
		cn(
			'inline-flex shrink-0 bg-border',
			this.orientation() === 'horizontal'
				? 'w-full border-t'
				: 'h-full border-r',
			this.additionalClasses(),
		),
	);
}
