import {
	ChangeDetectionStrategy,
	Component,
	computed,
	input,
} from '@angular/core';
import { type IconType, NgIconComponent } from '@ng-icons/core';
import { type VariantProps, cva } from 'class-variance-authority';
import type { ClassValue } from 'clsx';
import { cn } from '../../../helpers/cn';

export const iconVariants = cva('inline-flex', {
	variants: {
		size: {
			xs: 'size-3',
			sm: 'size-4',
			md: 'size-5',
			default: 'size-6',
			lg: 'size-8',
			xl: 'size-12',
			none: '',
		},
	},
	defaultVariants: {
		size: 'default',
	},
});

export type IconVariants = VariantProps<typeof iconVariants>;

@Component({
	selector: 'mmc-icon',
	standalone: true,
	imports: [NgIconComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		@if (svg()) {
			<ng-icon
				size="100%"
				[class]="ngIconClass()"
				[svg]="svg()"
				[color]="color()"
				[strokeWidth]="strokeWidth()"
			/>
		} @else {
			<ng-icon
				size="100%"
				[class]="ngIconClass()"
				[name]="name()"
				[color]="color()"
				[strokeWidth]="strokeWidth()"
			/>
		}
	`,
	host: {
		'[class]': 'classNames()',
	},
})
export class MmcIcon {
	readonly additionalClasses = input<ClassValue>('', {
		alias: 'class',
	});
	readonly size = input<IconVariants['size']>('default');
	readonly name = input<IconType>('');
	readonly svg = input<string>('');
	readonly color = input<string | undefined>(undefined);
	readonly strokeWidth = input<string | number | undefined>(undefined);
	readonly ngIconClass = input<ClassValue>('');

	protected readonly classNames = computed(() => {
		return cn(
			iconVariants({ size: this.size() }),
			this.additionalClasses(),
		);
	});
}
