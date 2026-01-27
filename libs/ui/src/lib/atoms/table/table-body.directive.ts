import { computed, Directive, input } from '@angular/core';
import { ClassValue } from 'clsx';
import { cn } from '../../../helpers/cn';

@Directive({
	selector: 'tbody[mmcTableBody]',
	host: {
		'[class]': 'classNames()',
		'[attr.data-slot]': '"table-body"',
	},
})
export class MmcTableBody {
	readonly additionalClasses = input<ClassValue>('', {
		alias: 'class',
	});

	protected readonly classNames = computed(() =>
		cn('[&_tr:last-child]:border-0', this.additionalClasses()),
	);
}
