import { computed, Directive, input } from '@angular/core';
import { ClassValue } from 'clsx';
import { cn } from '../../../helpers/cn';

@Directive({
	selector: 'table[mmcTable]',
	host: {
		'[class]': 'classNames()',
	},
})
export class MmcTable {
	readonly additionalClasses = input<ClassValue>('', {
		alias: 'class',
	});

	protected readonly classNames = computed(() =>
		cn('w-full caption-bottom text-sm', this.additionalClasses()),
	);
}
