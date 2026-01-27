import { CdkMenuGroup } from '@angular/cdk/menu';
import { computed, Directive, input } from '@angular/core';
import { ClassValue } from 'clsx';
import { cn } from '../../../helpers/cn';

@Directive({
	selector: '[mmcMenuGroup]',
	hostDirectives: [
		{
			directive: CdkMenuGroup,
		},
	],
	host: {
		'[class]': 'classNames()',
	},
})
export class MmcMenuGroup {
	readonly additionalClasses = input<ClassValue>('', {
		alias: 'class',
	});

	protected classNames = computed(() => cn('', this.additionalClasses()));
}
