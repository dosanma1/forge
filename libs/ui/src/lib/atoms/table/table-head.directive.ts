import { computed, Directive, input } from '@angular/core';
import { ClassValue } from 'clsx';
import { cn } from '../../../helpers/cn';

@Directive({
	selector: 'th[mmcTableHead]',
	host: {
		'[class]': 'classNames()',
		'[attr.data-slot]': '"table-head"',
	},
})
export class MmcTableHead {
	readonly additionalClasses = input<ClassValue>('', {
		alias: 'class',
	});

	protected readonly classNames = computed(() =>
		cn(
			'text-muted-foreground h-12 px-3 text-left align-middle font-medium has-[role=checkbox]:w-px [&:has([role=checkbox])]:pr-0',
			this.additionalClasses(),
		),
	);
}
