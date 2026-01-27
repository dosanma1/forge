import { computed, Directive, input } from '@angular/core';
import { ClassValue } from 'clsx';
import { cn } from '../../../helpers/cn';

@Directive({
	selector: 'caption[mmcTableCaption]',
	host: {
		'[class]': 'classNames()',
		'[attr.data-slot]': '"table-caption"',
	},
})
export class MmcTableCaption {
	readonly additionalClasses = input<ClassValue>('', {
		alias: 'class',
	});

	protected readonly classNames = computed(() =>
		cn('text-muted-foreground mt-4 text-sm', this.additionalClasses()),
	);
}
