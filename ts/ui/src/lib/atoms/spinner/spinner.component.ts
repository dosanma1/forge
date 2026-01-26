import { NgClass } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	input,
} from '@angular/core';
import { ClassValue } from 'clsx';
import { cn } from '../../../helpers/cn';

@Component({
	selector: 'mmc-spinner',
	standalone: true,
	template: `
		<div role="status">
			<svg
				[ngClass]="classNames()"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
			>
				<circle
					class="opacity-25"
					cx="12"
					cy="12"
					r="10"
					stroke="currentColor"
					stroke-width="4"
				></circle>
				<path
					class="opacity-75"
					fill="currentColor"
					d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
				></path>
			</svg>
			<span class="sr-only">Loading...</span>
		</div>
	`,
	imports: [NgClass],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MmcSpinner {
	readonly additionalClasses = input<ClassValue>('', {
		alias: 'class',
	});

	protected classNames = computed(() =>
		cn('animate-spin size-5 text-inherit', this.additionalClasses()),
	);
}
