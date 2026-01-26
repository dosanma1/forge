import { Component, computed, input } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucideCheck } from '@ng-icons/lucide';
import { ClassValue } from 'clsx';
import { NgpListboxOption } from 'ng-primitives/listbox';
import { cn } from '../../../helpers/cn';
import { MmcIcon } from '../../atoms/icon/icon.component';

@Component({
	selector: 'mmc-listbox-option',
	hostDirectives: [
		{
			directive: NgpListboxOption,
			inputs: [
				'id',
				'ngpListboxOptionValue:value',
				'ngpListboxOptionDisabled:disabled',
			],
		},
	],
	imports: [MmcIcon],
	providers: [provideIcons({ lucideCheck })],
	template: `
		<div class="flex items-center w-full">
			<ng-content />
		</div>
		<mmc-icon name="lucideCheck" size="sm"></mmc-icon>
	`,
	styles: `
		:host[data-hover] {
			/* bg-accent */
			--tw-bg-opacity: 1;
			background-color: oklch(var(--accent) / var(--tw-bg-opacity, 1));

			/* text-accent-foreground */
			--tw-text-opacity: 1;
			color: oklch(var(--accent-foreground) / var(--tw-text-opacity, 1));
		}

		:host mmc-icon {
			visibility: hidden;
		}

		:host[data-selected] mmc-icon {
			visibility: visible;
		}
	`,
	host: {
		'[class]': 'classNames()',
	},
})
export class MmcListboxOption {
	readonly additionalClasses = input<ClassValue>('', {
		alias: 'class',
	});

	protected classNames = computed(() =>
		cn(
			'relative flex w-full cursor-default items-center justify-between rounded p-[6px] text-sm outline-hidden select-none',
			'focus:bg-accent focus:text-accent-foreground data-[hover]:bg-accent hover:text-accent-foreground',
			'disabled:pointer-events-none disabled:opacity-50 disabled:text-muted-foreground',
			this.additionalClasses(),
		),
	);
}
