import {
	ChangeDetectionStrategy,
	Component,
	computed,
	input,
} from '@angular/core';
import { ClassValue } from 'clsx';
import { NgpAvatarImage } from 'ng-primitives/avatar';
import { cn } from '../../../helpers/cn';

@Component({
	selector: 'mmc-avatar-image',
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgpAvatarImage],
	template: `
		<img
			[src]="src()"
			[alt]="imgAlt()"
			[class]="classNames()"
			ngpAvatarImage
		/>
	`,
})
export class MmcAvatarImage {
	readonly src = input.required<string>();
	readonly imgAlt = input<string>();
	readonly additionalClasses = input<ClassValue>('', {
		alias: 'class',
	});

	protected readonly classNames = computed(() =>
		cn('aspect-square size-full', this.additionalClasses()),
	);
}
