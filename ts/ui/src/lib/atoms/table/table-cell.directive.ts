import { computed, Directive, input } from '@angular/core';
import { ClassValue } from 'clsx';
import { cn } from '../../../helpers/cn';
@Directive({
	selector: 'td[mmcTableCell]',
	host: {
		'[class]': 'classNames()',
		'[attr.data-slot]': '"table-cell"',
	},
})
export class MmcTableCell {
	readonly additionalClasses = input<ClassValue>('', {
		alias: 'class',
	});

	protected readonly classNames = computed(() =>
		cn(
			'p-3 align-middle [&:has([role=checkbox])]:pr-0',
			this.additionalClasses(),
		),
	);
}
