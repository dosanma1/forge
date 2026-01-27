import { NumberInput } from '@angular/cdk/coercion';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { computed, Directive, input } from '@angular/core';
import { ClassValue } from 'clsx';
import { cn } from '../../../helpers/cn';

@Directive({
	selector: 'textarea[mmcTextarea]',
	hostDirectives: [
		{
			directive: CdkTextareaAutosize,
			inputs: [
				'cdkTextareaAutosize:autosize',
				'cdkAutosizeMaxRows:maxRows',
			],
		},
	],
	host: {
		'[class]': 'classNames()',
	},
})
export class MmcTextarea {
	readonly additionalClasses = input<ClassValue>('', {
		alias: 'class',
	});
	readonly autosize = input<boolean>();
	readonly maxRows = input<NumberInput>();

	protected classNames = computed(() =>
		cn(
			'border-input file:text-foreground placeholder:text-muted-foreground/70 flex h-8 w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none',
			'file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
			'focus:ring-0 focus-visible:outline-none focus-visible:ring-inset focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 focus-visible:[&:is(input)]:border-primary',
			'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
			this.additionalClasses(),
		),
	);
}
