import {
	ChangeDetectionStrategy,
	Component,
	computed,
	input,
} from '@angular/core';
import { ClassValue } from 'clsx';
import { NgpAvatar } from 'ng-primitives/avatar';
import { cn } from '../../../helpers/cn';

@Component({
	selector: 'mmc-avatar',
	changeDetection: ChangeDetectionStrategy.OnPush,
	hostDirectives: [NgpAvatar],
	host: {
		'[class]': 'classNames()',
	},
	template: ` <ng-content></ng-content> `,
})
export class MmcAvatar {
	readonly additionalClasses = input<ClassValue>('', {
		alias: 'class',
	});

	protected readonly classNames = computed(() =>
		cn(
			'relative flex size-8 shrink-0 overflow-hidden rounded-full',
			this.additionalClasses(),
		),
	);
}
