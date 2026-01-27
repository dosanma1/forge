import { computed, Directive, input } from '@angular/core';
import { ClassValue } from 'clsx';
import { cn } from '../../../helpers/cn';

@Directive({
	selector: 'input[mmcInput]',
	standalone: true,
	host: {
		'[class]': 'classNames()',
	},
})
export class MmcInput {
	readonly additionalClasses = input<ClassValue>('', {
		alias: 'class',
	});
	readonly inputType = input<ClassValue>('', {
		alias: 'type',
	});

	protected classNames = computed(() =>
		cn(
			'border-input file:text-foreground placeholder:text-muted-foreground/70 flex h-8 w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none',
			'file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
			'focus:ring-0 focus-visible:outline-none focus-visible:ring-inset focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 focus-visible:[&:is(input)]:border-primary',
			'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
			this.inputType() === 'search' &&
				'[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none',
			this.inputType() === 'file' &&
				'text-muted-foreground/70 file:border-input file:text-foreground p-0 pr-3 italic file:me-3 file:h-full file:border-0 file:border-r file:border-solid file:bg-transparent file:px-3 file:text-sm file:font-medium file:not-italic',
			this.additionalClasses(),
		),
	);
}
