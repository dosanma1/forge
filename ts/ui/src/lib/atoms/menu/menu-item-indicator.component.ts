import { Component, computed, input } from '@angular/core';
import { ClassValue } from 'clsx';
import { cn } from '../../../helpers/cn';

@Component({
	selector: '[mmcMenuItemIndicator]',
	template: `
		@if (show()) {
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="size-2 fill-current"
			>
				<circle cx="12" cy="12" r="10"></circle>
			</svg>
		}
	`,
	host: {
		'[class]': 'classNames()',
	},
})
export class MmcMenuItemIndicator {
	readonly additionalClasses = input<ClassValue>('', {
		alias: 'class',
	});
	readonly show = input<boolean>();

	protected classNames = computed(() =>
		cn(
			'pointer-events-none absolute left-2 flex size-3.5 items-center justify-center',
			this.additionalClasses(),
		),
	);
}
