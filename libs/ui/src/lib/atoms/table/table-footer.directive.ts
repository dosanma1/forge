import { computed, Directive, input } from '@angular/core';
import { ClassValue } from 'clsx';
import { cn } from '../../../helpers/cn';

@Directive({
	selector: 'tfoot[mmcTableFooter]',
	host: {
		'[class]': 'classNames()',
		'[attr.data-slot]': '"table-footer"',
	},
})
export class MmcTableFooter {
	readonly additionalClasses = input<ClassValue>('', {
		alias: 'class',
	});

	protected readonly classNames = computed(() =>
		cn(
			'bg-muted/50 border-t font-medium [&>tr]:last:border-b-0',
			this.additionalClasses(),
		),
	);
}
