import { computed, Directive, input } from '@angular/core';
import { ClassValue } from 'clsx';
import { cn } from '../../../helpers/cn';

@Directive({
	selector: 'tr[mmcTableRow]',
	host: {
		'[class]': 'classNames()',
		'[attr.data-slot]': '"table-row"',
	},
})
export class MmcTableRow {
	readonly additionalClasses = input<ClassValue>('', {
		alias: 'class',
	});

	protected readonly classNames = computed(() =>
		cn(
			'hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors',
			this.additionalClasses(),
		),
	);
}
