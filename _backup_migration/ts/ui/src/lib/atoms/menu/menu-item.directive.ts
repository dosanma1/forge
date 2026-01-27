import { CdkMenuItem } from '@angular/cdk/menu';
import { computed, Directive, input, output } from '@angular/core';
import { cva, VariantProps } from 'class-variance-authority';
import { ClassValue } from 'clsx';
import { cn } from '../../../helpers/cn';

export const menuItemVariants = cva(
	'w-full inline-flex items-center justify-start rounded-md text-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 ring-offset-background',
	{
		variants: {
			variant: {
				default: 'hover:bg-accent hover:text-accent-foreground',
				link: 'text-primary underline-offset-4 hover:underline',
			},
			size: {
				default: 'h-8 px-3 py-2',
				sm: 'h-7 rounded-md px-2 text-sm',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	},
);
export type MenuItemVariants = VariantProps<typeof menuItemVariants>;

@Directive({
	selector: '[mmcMenuItem]',
	hostDirectives: [
		{
			directive: CdkMenuItem,
			inputs: ['cdkMenuItemDisabled:disabled'],
			outputs: ['cdkMenuItemTriggered:triggered'],
		},
	],
	host: {
		'[class]': 'classNames()',
		'[attr.disabled]': 'disabled() ? "" : null',
	},
})
export class MmcMenuItem {
	readonly additionalClasses = input<ClassValue>('', {
		alias: 'class',
	});
	readonly variant = input<MenuItemVariants['variant']>('default');
	readonly size = input<MenuItemVariants['size']>('default');
	readonly loading = input<boolean>(false);
	readonly disabled = input<boolean>();
	readonly triggered = output<void>();

	protected classNames = computed(() =>
		cn(
			menuItemVariants({
				variant: this.variant(),
				size: this.size(),
			}),
			this.additionalClasses(),
			{
				'cursor-not-allowed opacity-50':
					this.loading() || this.disabled(),
			},
		),
	);
}
