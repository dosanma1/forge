import { Directive, computed, input } from '@angular/core';
import type { ClassValue } from 'clsx';
import { NgpLabel } from 'ng-primitives/form-field';
import { cn } from '../../../helpers/cn';

@Directive({
	selector: 'label[mmcLabel]',
	exportAs: 'mmcLabel',
	hostDirectives: [NgpLabel],
	host: {
		'[class]': 'classNames()',
	},
})
export class MmcLabel {
	readonly additionalClasses = input<ClassValue>('', {
		alias: 'class',
	});

	protected readonly classNames = computed(() =>
		cn(
			`text-foreground text-sm leading-4 font-medium select-none 
			peer-data-[disabled=true]:pointer-events-none peer-data-[disabled=true]:opacity-50 
			peer-disabled:cursor-not-allowed peer-disabled:opacity-50`,
			this.additionalClasses(),
		),
	);
}
