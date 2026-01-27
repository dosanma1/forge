import {
	ChangeDetectionStrategy,
	Component,
	computed,
	input,
} from '@angular/core';
import { ClassValue } from 'clsx';
import { NgpAvatarFallback } from 'ng-primitives/avatar';
import { cn } from '../../../helpers/cn';

@Component({
	selector: 'mmc-avatar-fallback',
	changeDetection: ChangeDetectionStrategy.OnPush,
	hostDirectives: [NgpAvatarFallback],
	host: {
		'[class]': 'classNames()',
	},
	template: ` <ng-content></ng-content> `,
})
export class MmcAvatarFallback {
	readonly additionalClasses = input<ClassValue>('', {
		alias: 'class',
	});

	protected readonly classNames = computed(() =>
		cn(
			'bg-secondary flex size-full items-center justify-center rounded-[inherit] text-xs',
			this.additionalClasses(),
		),
	);
}
