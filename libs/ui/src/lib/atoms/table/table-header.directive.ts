import { computed, Directive, input } from '@angular/core';
import { ClassValue } from 'clsx';
import { cn } from '../../../helpers/cn';

@Directive({
	selector: 'thead[mmcTableHeader]',
	host: {
		'[class]': 'classNames()',
		'[attr.data-slot]': '"table-header"',
	},
})
export class MmcTableHeader {
	readonly additionalClasses = input<ClassValue>('', {
		alias: 'class',
	});

	protected readonly classNames = computed(() =>
		cn(this.additionalClasses()),
	);
}
