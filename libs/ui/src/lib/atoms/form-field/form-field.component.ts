import { Component, computed, input } from '@angular/core';
import { ClassValue } from 'clsx';
import { NgpFormField } from 'ng-primitives/form-field';
import { cn } from '../../../helpers/cn';

@Component({
	selector: 'mmc-form-field',
	hostDirectives: [NgpFormField],
	template: ` <ng-content /> `,
	imports: [],
	host: {
		'[class]': 'classNames()',
	},
})
export class MmcFormField {
	readonly additionalClasses = input<ClassValue>('', {
		alias: 'class',
	});

	protected classNames = computed(() =>
		cn('flex flex-col gap-[6px] w-[90%]', this.additionalClasses()),
	);
}
