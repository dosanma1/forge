import {
	ChangeDetectionStrategy,
	Component,
	computed,
	forwardRef,
	input,
} from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucideLoaderCircle } from '@ng-icons/lucide';
import { type VariantProps, cva } from 'class-variance-authority';
import { ClassValue } from 'clsx';
import { cn } from '../../../helpers/cn';
import { MmcSpinner } from '../spinner/spinner.component';
import { MmcButtonDirective } from './button.directive';

export const buttonVariants = cva(
	`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-base font-medium transition-[color,box-shadow]
	[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none
	focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]
	disabled:opacity-50 disabled:cursor-not-allowed`,
	{
		variants: {
			variant: {
				default:
					'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90',
				secondary:
					'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80',
				destructive:
					'bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40',
				outline:
					'border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground',
				ghost: 'hover:bg-accent hover:text-accent-foreground',
				link: 'text-primary underline-offset-4 hover:underline',
			},
			size: {
				default: 'h-8 px-3 py-2',
				sm: 'h-7 rounded-md px-2 text-sm',
				lg: 'h-9 rounded-md px-7',
				icon: 'size-8',
			},
			disabled: {
				false: '',
				true: 'opacity-50 cursor-not-allowed',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
			disabled: false,
		},
	},
);

type ButtonProps = VariantProps<typeof buttonVariants>;

export type ButtonSize = NonNullable<ButtonProps['size']>;
export type ButtonVariant = NonNullable<ButtonProps['variant']>;

@Component({
	selector: 'button[mmcButton]',
	standalone: true,
	template: `
		@if (loading()) {
			<mmc-spinner></mmc-spinner>
			<span>{{ loadingMsg() }}</span>
		} @else {
			<ng-content></ng-content>
		}
	`,
	providers: [
		{
			provide: MmcButtonDirective,
			useExisting: forwardRef(() => MmcButton),
		},
	],
	imports: [MmcSpinner],
	changeDetection: ChangeDetectionStrategy.OnPush,
	viewProviders: [provideIcons({ lucideLoaderCircle })],
	host: {
		'[class]': 'classNames()',
	},
})
export class MmcButton extends MmcButtonDirective {
	readonly additionalClasses = input<ClassValue>('', {
		alias: 'class',
	});
	readonly variant = input<ButtonVariant>('default');
	readonly size = input<ButtonSize>('default');

	protected classNames = computed(() =>
		cn(
			buttonVariants({
				variant: this.variant(),
				size: this.size(),
				disabled: this.loading() || this.disabled(),
			}),
			this.additionalClasses(),
		),
	);
}
