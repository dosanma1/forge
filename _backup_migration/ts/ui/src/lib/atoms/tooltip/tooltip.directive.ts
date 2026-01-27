import { computed, Directive, input } from '@angular/core';
import { ClassValue } from 'clsx';
import { NgpTooltip } from 'ng-primitives/tooltip';
import { cn } from '../../../helpers/cn';

/**
 * Apply the `ngpTooltip` directive to an element that represents the tooltip. This typically would be a `div` inside an `ng-template`.
 */
@Directive({
	selector: '[mmcTooltip]',
	exportAs: 'mmcTooltip',
	hostDirectives: [NgpTooltip],
	host: {
		'[class]': 'classNames()',
	},
})
export class MmcTooltip {
	readonly additionalClasses = input<ClassValue>('', {
		alias: 'class',
	});

	protected readonly classNames = computed(() =>
		cn(
			'absolute z-50 max-w-[280px] overflow-hidden rounded-lg border border-border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
			this.additionalClasses(),
		),
	);
}

// import { Component, computed, input } from '@angular/core';
// import { ClassValue } from 'clsx';
// import { injectTooltipContext, NgpTooltip } from 'ng-primitives/tooltip';
// import { cn } from '../../../helpers/cn';

// @Component({
// 	selector: 'mmc-tooltip',
// 	hostDirectives: [NgpTooltip],
// 	template: ` {{ content }} `,
// 	host: {
// 		'[class]': 'classNames()',
// 	},
// })
// export class MmcTooltip {
// 	/** Access the tooltip context where the content is stored. */
// 	protected readonly content = injectTooltipContext<string>();

// 	readonly additionalClasses = input<ClassValue>('', {
// 		alias: 'class',
// 	});

// 	protected readonly classNames = computed(() =>
// 		cn(
// 			'relative z-50 max-w-[280px] rounded-lg border border-border bg-popover px-3 py-1.5 text-sm text-popover-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
// 			this.additionalClasses(),
// 		),
// 	);
// }
