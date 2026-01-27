import { CdkContextMenuTrigger } from '@angular/cdk/menu';
import { Directive } from '@angular/core';

@Directive({
	selector: '[mmcContextMenuTriggerFor]',
	exportAs: 'mmcContextMenuTriggerFor',
	hostDirectives: [
		{
			directive: CdkContextMenuTrigger,
			inputs: ['cdkContextMenuTriggerFor:mmcContextMenuTriggerFor'],
		},
	],
})
export class MmcContextMenuTrigger {}
