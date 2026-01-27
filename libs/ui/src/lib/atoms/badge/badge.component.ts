import {
	ChangeDetectionStrategy,
	Component,
	computed,
	input,
	output,
} from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucideX } from '@ng-icons/lucide';
import { cva, VariantProps } from 'class-variance-authority';
import type { ClassValue } from 'clsx';
import { cn } from '../../../helpers/cn';
import { IconVariants, MmcIcon } from '../icon/icon.component';

export const badgeVariants = cva(
	`inline-flex items-center justify-center rounded-md border px-1.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 gap-1
	[&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] transition-[color,box-shadow] [&>svg]:shrink-0 leading-normal`,
	{
		variants: {
			variant: {
				default:
					'border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
				secondary:
					'border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90',
				destructive:
					'border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40',
				outline:
					'text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
			},
			size: {
				default: 'text-xs',
				sm: 'text-sm',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	},
);

export type BadgeVariants = VariantProps<typeof badgeVariants>;

@Component({
	selector: 'mmc-badge, a[mmcBadge]',
	standalone: true,
	template: `
		<ng-content> </ng-content>
		@if (removable()) {
			<button
				class="focus-visible:border-ring focus-visible:ring-ring/50 opacity-60 hover:opacity-100 -my-px -ms-px -me-1.5 inline-flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-[inherit] p-0 transition-[color,box-shadow] outline-none focus-visible:ring-[3px]"
				(click)="onRemove()"
			>
				<mmc-icon
					[size]="removableIconSize()"
					name="lucideX"
					aria-hidden="true"
					aria-label="Delete"
				/>
			</button>
		}
	`,
	imports: [MmcIcon],
	viewProviders: [provideIcons({ lucideX })],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		'[class]': 'classNames()',
	},
})
export class MmcBadge {
	readonly additionalClasses = input<ClassValue>('', {
		alias: 'class',
	});
	readonly variant = input<BadgeVariants['variant']>('default');
	readonly size = input<BadgeVariants['size']>('default');
	readonly removable = input<boolean>(false);
	readonly remove = output<void>();

	protected classNames = computed(() =>
		cn(
			badgeVariants({
				variant: this.variant(),
				size: this.size(),
			}),
			this.additionalClasses(),
		),
	);

	protected removableIconSize(): IconVariants['size'] {
		switch (this.size()) {
			case 'default': {
				return 'xs';
			}
			case 'sm': {
				return 'sm';
			}
			default:
				throw new Error(
					`Invalid badge removable icon size ${this.size()}`,
				);
		}
	}

	protected onRemove(): void {
		this.remove.emit();
	}
}
