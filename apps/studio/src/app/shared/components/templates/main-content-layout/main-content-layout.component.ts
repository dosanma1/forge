import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	selector: 'mmc-main-content-layout',
	standalone: true,
	templateUrl: './main-content-layout.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		class: 'flex w-full h-full min-h-0 min-w-0 flex-auto flex-col',
	},
})
export class MainContentLayoutComponent {}
