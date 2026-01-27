import { CdkMenuItemRadio } from '@angular/cdk/menu';
import { computed, Directive, input, output } from '@angular/core';
import { ClassValue } from 'clsx';
import { cn } from '../../../helpers/cn';

@Directive({
	selector: '[mmcMenuItemRadio]',
	hostDirectives: [
		{
			directive: CdkMenuItemRadio,
			inputs: [
				'cdkMenuItemChecked:selected',
				'cdkMenuItemDisabled:disabled',
			],
			outputs: ['cdkMenuItemTriggered:triggered'],
		},
	],
	host: {
		'[class]': 'classNames()',
		'[attr.disabled]': 'disabled() ? "" : null',
		'[attr.aria-checked]': 'selected()',
		'[attr.aria-disabled]': 'disabled()',
	},
})
export class MmcMenuItemRadio {
	readonly additionalClasses = input<ClassValue>('', {
		alias: 'class',
	});
	readonly selected = input<boolean>();
	readonly disabled = input<boolean>();
	readonly triggered = output<void>();

	protected classNames = computed(() =>
		cn(
			'group w-full focus:bg-accent focus:text-accent-foreground relative flex cursor-default gap-2 rounded-md py-1.5 pr-2 pl-8 text-sm outline-hidden select-none',
			'hover:bg-accent hover:text-accent-foreground',
			'disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 items-start [&>span]:pt-1.5',
			this.additionalClasses(),
			{
				'cursor-not-allowed opacity-50': this.disabled(),
			},
		),
	);
}
