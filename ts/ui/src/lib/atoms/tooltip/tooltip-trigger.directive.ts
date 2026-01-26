import { Directive } from '@angular/core';
import { NgpTooltipTrigger } from 'ng-primitives/tooltip';

@Directive({
	selector: '[mmcTooltipTrigger]',
	hostDirectives: [
		{
			directive: NgpTooltipTrigger,
			inputs: [
				'ngpTooltipTrigger:mmcTooltipTrigger',
				'ngpTooltipTriggerPlacement:placement',
				'ngpTooltipTriggerDisabled:disabled',
				'ngpTooltipTriggerOffset:offset',
				'ngpTooltipTriggerShowDelay:showDelay',
				'ngpTooltipTriggerHideDelay:hideDelay',
			],
		},
	],
})
export class MmcTooltipTrigger { }
