import { CdkMenuTrigger } from '@angular/cdk/menu';
import { ConnectedPosition } from '@angular/cdk/overlay';
import { Directive, input } from '@angular/core';

@Directive({
	selector: '[mmcMenuTriggerFor]',
	exportAs: 'mmcMenuTriggerFor',
	hostDirectives: [
		{
			directive: CdkMenuTrigger,
			inputs: [
				'cdkMenuTriggerFor:mmcMenuTriggerFor',
				'cdkMenuPosition:menuPosition',
			],
		},
	],
})
export class MmcMenuTrigger {
	readonly menuPosition = input<ConnectedPosition[]>();
}
