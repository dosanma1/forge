import { CdkMenuItemCheckbox } from '@angular/cdk/menu';
import { computed, Directive, inject, input, OnInit } from '@angular/core';
import { cva, VariantProps } from 'class-variance-authority';
import { ClassValue } from 'clsx';
import { cn } from '../../../helpers/cn';

export const menuItemCheckboxVariants = cva(
	'w-full inline-flex items-center justify-start rounded-md text-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 ring-offset-background cursor-pointer',
	{
		variants: {
			variant: {
				default: 'hover:bg-accent hover:text-accent-foreground',
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
export type MenuItemCheckboxVariants = VariantProps<
	typeof menuItemCheckboxVariants
>;

@Directive({
	selector: '[mmcMenuItemCheckbox]',
	hostDirectives: [
		{
			directive: CdkMenuItemCheckbox,
			inputs: ['cdkMenuItemChecked:checked', 'cdkMenuItemDisabled:disabled'],
		},
	],
	host: {
		'[class]': 'classNames()',
		'[attr.disabled]': 'disabled() ? "" : null',
	},
})
export class MmcMenuItemCheckbox implements OnInit {
	readonly additionalClasses = input<ClassValue>('', {
		alias: 'class',
	});
	readonly variant = input<MenuItemCheckboxVariants['variant']>('default');
	readonly size = input<MenuItemCheckboxVariants['size']>('default');
	readonly disabled = input<boolean>();

	private cdkMenuItemCheckbox = inject(CdkMenuItemCheckbox, { self: true });

	protected classNames = computed(() =>
		cn(
			menuItemCheckboxVariants({
				variant: this.variant(),
				size: this.size(),
			}),
			this.additionalClasses(),
			{
				'cursor-not-allowed opacity-50': this.disabled(),
			},
		),
	);

	ngOnInit(): void {
		// Override the trigger method to always keep the menu open
		const originalTrigger = this.cdkMenuItemCheckbox.trigger.bind(
			this.cdkMenuItemCheckbox,
		);
		this.cdkMenuItemCheckbox.trigger = (options) => {
			originalTrigger({ ...options, keepOpen: true });
		};
	}
}
